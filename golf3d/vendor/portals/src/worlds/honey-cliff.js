// THE HONEY CLIFF: you are a Himalayan giant honeybee flying home. Out of a scarlet rhododendron
// bough and in on the torn sixth comb, close enough to see its curtain crawl and its honey ropes fall;
// north along the upper tier, sinking, with both tiers of dripping gold combs receding to the horn while
// pale defence waves run along the curtains; out over the gorge to the north-east, where the honey buzzard
// that has been raking the combs wheels across our bow with its barred underside turned to us; past a swarm
// milling in the air before the snow wall; a turn 150 m off the north horn, and the whole honey-hung face
// stands three-quarters on above the cloud, the swarm before it, the tree we left far beyond its south end;
// then the dive back in, climbing, at the face of comb one, past the honey hunters' rope ladder
// (three-strand ropes over the lip of the roof) and their smouldering leaf torch,
// then south 8 m off the living curtains, behind the fourth comb (the amber window), out round the
// rim of comb five behind two hawking hornets that fall back broadside before us, through the tear in the sixth comb and down a wax-flanged cleft of banded, water-worn
// rock to the portal.
//
// Everything is 40 times life size (a bee is 1.2 m). World space == the hero's local space: the
// cliff faces +Z (east), north is +X, the sun stands in the east-south-east.
// The camera is the bee: the furred top of its thorax, its two antennae and its wing blur are built here and follow
// the camera (legs tucked); they are lit in the camera's own space.
// Looks by seed: clear April morning, rose dawn, cloud sea in the gorge, just after rain, autumn
// harvest (pink cherry bough, gold forest). Cast by seed: hornets or a second buzzard, a honeyguide
// by the cleft. Rare: the colony on comb three absconds as we pass, and its river takes our own road
// behind comb four and out through the gap, then climbs away over the gorge while we watch it go.
//
// Built here and checked at build time: every world mesh that could be near the route (massif, fin,
// spur, bough, ladder) is measured against the path (scene.userData.clearance; a warning under 5.5 m).
// Cost: things that are behind us for good are no longer drawn (the fin under the way in and its plants, the ladder,
// the north end's ferns, part of the bells, the east ridge's scrub, the swarm), and the river's bees are not drawn until the colony
// lets go; all by u in update().
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, hashSeed } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig } from '../kit/sky.js';
import { makeParticles, makeSmokeColumn, makeGlow, makeGodRays } from '../kit/fx.js';
import { buildHero } from '../parts/honey-cliff.js';

const TREE_CROWN = [[-150, 10, 70, 64], [-205, -50, 40, 58], [-120, 62, 112, 50], [-220, 40, 104, 62], [-178, -14, 150, 54], [-268, -8, 62, 50]];   // back along the entry axis, right, up, radius
const PAL = ['#D01F2B', '#2E5C8A', '#C08A4A', '#F2A51E', '#1E1712', '#EADBA8', '#DCE8F2'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const col = (h) => new THREE.Color(h);
const DEG = Math.PI / 180;

// ---------- shared GLSL ----------
const GL_LIT = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounceCol, uHazeCol;
uniform float uTime;
uniform vec4 uAir;     // height-haze density, wind strength, wetness, drawing-buffer height
uniform vec4 uSea;     // the colour of the cloud sea, and how far whatever stands in it is lost in it (0 = no sea)
float h11(float n){ return fract(sin(n*12.9898)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); float n = dot(i, vec3(1., 57., 113.));
  return mix(mix(mix(h11(n), h11(n + 1.), f.x), mix(h11(n + 57.), h11(n + 58.), f.x), f.y),
             mix(mix(h11(n + 113.), h11(n + 114.), f.x), mix(h11(n + 170.), h11(n + 171.), f.x), f.y), f.z); }
float fb2(vec2 p){ return 0.5*vn2(p) + 0.25*vn2(p*2.03 + 3.1) + 0.125*vn2(p*4.1 + 7.7) + 0.0625*vn2(p*8.3 + 1.3); }
vec3 sunLit(vec3 alb, vec3 N, vec3 V, float sh, float gloss, float spec){
  float ndl = max(dot(N, uSunDir), 0.);
  vec3 amb = mix(uBounceCol, uSkyCol, N.y*0.5 + 0.5);
  vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
  return alb*(uSunCol*ndl*sh + amb) + uSunCol*spec*pow(max(dot(N, H), 0.), gloss)*sh*step(0.001, ndl);
}
vec3 airHaze(vec3 c, vec3 wp){
  float hd = max(cameraPosition.y - wp.y, 0.), d = distance(cameraPosition, wp);
  c = mix(c, uHazeCol, (1. - exp(-hd*uAir.x))*smoothstep(100., 700., d));
  return mix(c, uSea.rgb, uSea.w*(1. - smoothstep(10., 115., wp.y)));
}
vec3 farHaze(vec3 c, vec3 wp){
  return mix(c, uHazeCol*0.94, 1. - exp(-max(distance(cameraPosition, wp) - 150., 0.)*uAir.x*1.1));
}
float spurHaze(vec3 wp){ return 1. - exp(-max(distance(cameraPosition, wp) - 120., 0.)*uAir.x*1.3); }   // the east spur and its scrub: one air over both
`;
const VS_PARS = /* glsl */`varying vec3 vWorld, vN;
#include <fog_pars_vertex>
`;
// expects: vec3 wpos, wn
const VS_END = /* glsl */`
  vWorld = wpos; vN = wn;
  vec4 mvPosition = viewMatrix*vec4(wpos, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
`;
const FS_PARS = /* glsl */`varying vec3 vWorld, vN;
#include <fog_pars_fragment>
`;
const FS_NV = /* glsl */`
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.));
`;

// ---- the far land: canopy of giant crowns, rock, the river thread ----
const LAND_VS = /* glsl */`
attribute float aRiver; varying float vRiver;
${VS_PARS}
void main(){
  vRiver = aRiver;
  vec3 wpos = (modelMatrix*vec4(position, 1.)).xyz, wn = normal;
  ${VS_END}
}`;
const GL_CANOPY = /* glsl */`
uniform vec3 uLeafA, uLeafB, uFleckCol, uRock; uniform vec3 uFleck;   // threshold, amount, cloud shadow
uniform float uSpur;                     // 1 on the east spur and its scrub: the aerial haze of the middle distance, the shaded flank filled from the sky
float cloudSh(vec2 q){ return 1. - uFleck.z*smoothstep(0.42, 0.62, fb2((q + vec2(uTime*16., uTime*6.))/1500.)); }
`;
const LAND_FS = /* glsl */`
${GL_LIT}
${GL_CANOPY}
varying float vRiver;
${FS_PARS}
void main(){
  ${FS_NV}
  vec2 q = vWorld.xz;
  float d = distance(cameraPosition, vWorld), lod = 1. - smoothstep(350., 1500., d);
  float big = fb2(q/560.), crown = vn2(q/150. + big*2.), leaf = vn2(q/41.), fine = vn2(q/9.);
  float cell = crown*0.6 + leaf*0.3 + (fine - 0.5)*0.3*lod;
  vec3 alb = mix(uLeafA, uLeafB, smoothstep(0.25, 0.75, cell))*(0.5 + 0.8*smoothstep(0.1, 0.8, crown));
  float fl = smoothstep(uFleck.x, uFleck.x + 0.1, vn2(q/26. + 9.)*0.5 + vn2(q/8.)*0.5)*smoothstep(0.3, 0.6, vn2(q/260. + 3.));
  alb = mix(alb, uFleckCol, fl*uFleck.y);
  float steep = 1. - smoothstep(0.3, 0.55, N.y);
  vec3 rock = uRock*(0.3 + 0.5*vn2(vec2(q.x/45., vWorld.y/16.)));
  alb = mix(alb, rock, steep*smoothstep(0.35, 0.6, vn2(q/230. + 4.)));
  float rw = abs(vRiver) + 30.*(vn2(q/170.) - 0.5);
  float water = 1. - smoothstep(48., 70., rw), bar = (1. - smoothstep(70., 140., rw))*(1. - water);
  alb = mix(alb, vec3(0.4, 0.38, 0.34), bar);
  alb *= 1. + 0.9*uSpur;
  vec3 c = sunLit(alb, N, V, cloudSh(q), 20., 0.02);
  float gl = vn2(vec2(q.x/34. + uTime*0.8, q.y/70.))*vn2(vec2(q.x/12. + uTime*2.1, q.y/26.));
  c = mix(c, uSkyCol*1.7 + uSunCol*smoothstep(0.3, 0.55, gl)*0.7, water);
  c += alb*(uSkyCol*1.5 + uSunCol*0.07)*uSpur;                                      // the spur's shaded flank: open sky and the lit cliff across the gorge
  c = mix(c, uHazeCol*0.94, spurHaze(vWorld)*uSpur);
  gl_FragColor = vec4(max(airHaze(c, vWorld), 0.), 1.);
  #include <fog_fragment>
}`;
// ---- the far range: a wall of snow peaks standing out of layered haze (own mesh, own haze, no scene fog) ----
const RANGE_VS = /* glsl */`
attribute float aL; varying float vL; varying vec3 vWorld, vN;
void main(){
  vL = aL; vWorld = position; vN = normal;
  gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.);
}`;
const RANGE_FS = /* glsl */`
${GL_LIT}
uniform vec3 uRangeHaze; uniform vec4 uRange;          // haze at the foot, haze at the summits (nearest ridge), added per ridge, snow line
varying float vL; varying vec3 vWorld, vN;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 P = vWorld;
  // break the smooth faces up: couloirs, ribs and cornices, finer than the mesh
  vec3 q = P*vec3(0.0021, 0.0034, 0.0021);
  vec3 dn = vec3(vn3(q + 3.), vn3(q*1.3 + 17.), vn3(q + 31.)) - 0.5 + 0.5*(vec3(vn3(q*3.1 + 5.), vn3(q*3.7 + 11.), vn3(q*3.1 + 23.)) - 0.5);
  N = normalize(N + dn*0.75 + vec3(0., 1e-5, 0.));
  float rib = vn3(vec3(P.x*0.004, P.y*0.0012, P.z*0.004) + 7.);
  float line = uRange.w + 240.*vL + 320.*(vn3(q*0.6 + 9.) - 0.5);
  float snow = smoothstep(line - 160., line + 220., P.y)*smoothstep(0.16, 0.42, N.y + 0.35*(rib - 0.5) + 0.25*smoothstep(line + 300., line + 900., P.y));
  vec3 rock = mix(vec3(0.085, 0.095, 0.125), vec3(0.17, 0.155, 0.15), rib)*(0.7 + 0.6*vn3(q*5.3));
  vec3 wood = mix(vec3(0.03, 0.06, 0.05), vec3(0.07, 0.1, 0.06), vn3(q*2.2 + 40.));
  rock = mix(wood, rock, smoothstep(line - 900., line - 250., P.y + 300.*(rib - 0.5)));
  vec3 alb = mix(rock, vec3(0.8, 0.82, 0.86), snow);
  float ndl = max(dot(N, uSunDir), 0.);
  float sh = smoothstep(-0.05, 0.3, dot(normalize(vN + vec3(0., 1e-5, 0.)), uSunDir));          // the big faces turned from the sun are in their own shadow
  vec3 c = alb*(uSunCol*0.6*ndl*sh + uSkyCol*vec3(0.56, 0.76, 1.25)*(0.5 + 0.4*N.y));
  c += snow*uSunCol*0.05*pow(max(dot(reflect(-uSunDir, N), normalize(cameraPosition - P)), 0.), 6.)*sh;
  float hz = mix(uRange.x, uRange.y + uRange.z*vL, smoothstep(-150. + 250.*vL, 1150. + 450.*vL, P.y));
  gl_FragColor = vec4(max(mix(c, uRangeHaze, clamp(hz, 0., 0.97)), 0.), 1.);
}`;
const BLOB_VS = /* glsl */`
${GL_LIT}
attribute float iSeed; varying vec3 vObj; varying float vSeed, vGround;
${VS_PARS}
void main(){
  vGround = dot(normalize(instanceMatrix[1].xyz + vec3(0., 1e-5, 0.)), uSunDir);        // (a bush stands square to its slope: how that slope faces the sun)
  vec3 p = position;
  p *= 0.62 + 0.8*vn3(p*1.9 + iSeed*37.);
  p.x += 0.012*sin(uTime*0.7 + iSeed*30. + p.y*3.)*uAir.y;
  vObj = p; vSeed = iSeed;
  vec3 wpos = (modelMatrix*instanceMatrix*vec4(p, 1.)).xyz;
  vec3 wn = normalize(mat3(instanceMatrix)*normal + vec3(0., 1e-4, 0.));
  ${VS_END}
}`;
const BLOB_FS = /* glsl */`
${GL_LIT}
${GL_CANOPY}
uniform vec4 uOwn;                        // noise frequency, translucency, aerial haze, albedo gain (the near tree is finer and brighter)
uniform float uSlope;                     // 1: bushes on a slope turned from the sun stand in its shadow (the spur's scrub)
varying vec3 vObj; varying float vSeed, vGround;
${FS_PARS}
void main(){
  ${FS_NV}
  vec3 W = vWorld*uOwn.x;
  float clump = vn3(W/46. + vSeed*9.), leaf = vn3(W/15.);
  // the tree we left: every mass is ragged at its edge (sky and the masses behind show between the leaf sprays) and
  // broken into sprays of leaves with shade between them
  float spray = 0.55*vn3(W/19. + vSeed*5.) + 0.45*vn3(W/7.5 + 3.);
  float nv0 = max(dot(N, V), 0.);
  if (uOwn.z > 0.5 && nv0 < 0.62*smoothstep(0.2, 0.75, spray) + 0.08) discard;
  N = normalize(N + (vec3(vn3(W/38. + 3.), vn3(W/38. + 17.), vn3(W/38. + 31.)) - 0.5)*1.1);
  vec3 alb = mix(uLeafA, uLeafB, smoothstep(0.2, 0.8, clump*0.6 + leaf*0.4 + (vSeed - 0.5)*0.3))*uOwn.w;
  alb *= (0.4 + 0.9*smoothstep(0.15, 0.75, clump))*(0.45 + 0.75*smoothstep(-0.7, 0.6, vObj.y));
  alb *= mix(1., mix(0.3, 0.62, uSlope) + mix(1.15, 0.6, uSlope)*smoothstep(0.3, 0.62, 0.5*vn3(W/11. + 20.) + 0.5*vn3(W/4.6)), uOwn.z);
  float fl = smoothstep(uFleck.x, uFleck.x + 0.1, vn3(W/24. + 9.)*0.5 + vn3(W/8.)*0.5 + (fract(vSeed*7.3) - 0.6)*0.3);
  alb = mix(alb, uFleckCol, fl*uFleck.y);
  float gs = mix(1., smoothstep(-0.08, 0.28, vGround), uSlope);
  vec3 c = sunLit(alb, N, V, cloudSh(vWorld.xz)*gs, 16., 0.03);
  c += alb*uSunCol*vec3(0.9, 1., 0.4)*0.42*uOwn.y*max(-dot(N, uSunDir), 0.)*gs;    // light through the leaves
  float halo = pow(1. - max(dot(N, V), 0.), 2.)*(0.5 - 0.5*dot(V, uSunDir));
  c += alb*uSunCol*halo*0.9*(uOwn.y - 1.)*gs;                                      // a back-lit crown glows at its edges
  c += alb*(uSkyCol*1.1 + uSunCol*0.05)*uSlope;                                    // (the same fill as the slope under them)
  c = mix(c, farHaze(c, vWorld), uOwn.z*(1. - uSlope));
  c = mix(c, uHazeCol*0.94, spurHaze(vWorld)*uSlope);
  gl_FragColor = vec4(max(airHaze(c, vWorld), 0.), 1.);
  #include <fog_fragment>
}`;

// ---- plants: leaves, bells, fronds, lichen, primulas, moss (instanced; one material) ----
// aK = (bend weight 0..1, kind, gloss): 0 plain, 1 leaf, 2 petal, 3 frond, 4 lichen, 5 floret globe, 6 moss
const PLANT_VS = /* glsl */`
${GL_LIT}
attribute vec3 aCol, aK; attribute vec2 aUv; attribute float iSeed;
varying vec3 vCol, vK; varying vec2 vUv; varying float vSeed;
${VS_PARS}
void main(){
  vCol = aCol; vK = aK; vUv = aUv; vSeed = iSeed;
  vec4 wp = modelMatrix*instanceMatrix*vec4(position, 1.);
  float sc = length(instanceMatrix[1].xyz);
  float w = aK.x*aK.x*sc*uAir.y;
  float t = uTime*1.3 + iSeed*40.;
  vec3 gust = vec3(sin(t) + 0.5*sin(t*2.3 + wp.x*0.11), 0.35*sin(t*1.7 + 1.), cos(t*0.8) + 0.5*sin(t*1.9 + wp.z*0.13));
  wp.xyz += gust*w*(0.22 + 0.2*vn2(wp.xz*0.05 + uTime*0.25));
  vec3 wpos = wp.xyz, wn = normalize(mat3(instanceMatrix)*normal + vec3(0., 1e-4, 0.));
  ${VS_END}
}`;
const PLANT_FS = /* glsl */`
${GL_LIT}
uniform vec3 uSilver, uSpot;
varying vec3 vCol, vK; varying vec2 vUv; varying float vSeed;
${FS_PARS}
void main(){
  float kind = vK.y;
  float fw = fwidth(vUv.x) + fwidth(vUv.y) + 1e-4;
  // cut-outs: fern pinnae, lichen fringe
  if (kind > 2.5 && kind < 3.5){
    float pin = abs(fract(vUv.y*11.) - 0.5)*2., reach = (1. - vUv.y*vUv.y)*(0.3 + 0.7*smoothstep(0., 0.12, vUv.y));
    if (abs(vUv.x) > max(0.07, reach*(1. - 0.75*pin)) && fw < 0.6) discard;
  }
  if (kind > 3.5 && kind < 4.5){
    float fr = vn2(vec2(vUv.y*9. + vSeed*30., vSeed*7.));
    if (abs(vUv.x) > (0.25 + 0.75*fr)*(1. - vUv.y*0.7) && fw < 0.6) discard;
  }
  ${FS_NV}
  vec3 alb = vCol; float gloss = 12. + vK.z*70., spec = 0.03 + vK.z*0.5, thru = 0.25;
  float n1 = vn3(vWorld*1.9), n2 = vn3(vWorld*6.3);
  if (kind > 0.5 && kind < 1.5){            // leathery leaf: dark above, silver felt below, pale midrib and veins
    float rib = 1. - smoothstep(0.03, 0.09, abs(vUv.x));
    float vein = (1. - smoothstep(0.1, 0.3, abs(fract(vUv.y*7. - abs(vUv.x)*1.6) - 0.5)))*0.35*(1. - smoothstep(0.1, 0.5, fw));
    alb = gl_FrontFacing ? mix(alb*(0.8 + 0.4*n1), alb*1.9 + 0.03, max(rib*0.7, vein)) : mix(uSilver*(0.75 + 0.35*n2), alb*1.2, rib*0.6);
    spec *= gl_FrontFacing ? 1. : 0.1; thru = 0.14;
  } else if (kind > 1.5 && kind < 2.5){     // corolla: darker throat, nectar spots on the upper lobes, sun through the petals
    float spots = step(0.62, vn2(vUv*vec2(26., 9.) + vSeed*20.))*smoothstep(0.35, 0.6, vUv.y)*(1. - smoothstep(0.8, 0.95, vUv.y))*step(abs(vUv.x - 0.5), 0.22);
    alb *= 0.55 + 0.55*smoothstep(0.05, 0.9, vUv.y) + 0.12*sin(vUv.x*31.4);
    alb = mix(alb, uSpot, spots*(gl_FrontFacing ? 0.25 : 0.85));
    if (!gl_FrontFacing) alb *= 0.6;
    thru = 0.75;
  } else if (kind > 4.5 && kind < 5.5){     // drumstick head: a ball of florets, each with a yellow eye
    vec2 g = vUv*vec2(22., 11.); vec2 gi = floor(g), gf = fract(g) - 0.5; gf.x += (h21(gi) - 0.5)*0.3;
    float r = length(gf), sel = h21(gi + 3.);
    alb = mix(alb*(0.55 + 0.6*sel), alb*1.5 + 0.08, smoothstep(0.5, 0.2, r));
    alb = mix(alb, vec3(0.85, 0.62, 0.1), smoothstep(0.16, 0.08, r)*(1. - smoothstep(0.2, 0.7, fw)));
  } else if (kind > 5.5){                   // moss: fuzzy, sparkling with dew (a ragged edge where it is a cap on rock)
    if (abs(vUv.x) + 0.55*vn2(vWorld.xz*0.23) > 1.08) discard;
    alb *= 0.35 + 1.5*n2*n1 + 0.45*step(0.85, vn3(vWorld*14.)) + 0.5*vn3(vWorld*0.6);
    thru = 0.45;
  } else {
    alb *= 0.75 + 0.5*n1;
  }
  alb *= mix(1., 0.62, uAir.z);
  vec3 c = sunLit(alb, N, V, 1., gloss, spec*(1. + 2.*uAir.z));
  c += uSunCol*alb*max(dot(-N, uSunDir), 0.)*thru;                   // translucency
  c += uSkyCol*pow(1. - max(dot(N, V), 0.), 3.)*0.25*(0.3 + vK.z);
  gl_FragColor = vec4(max(farHaze(c, vWorld), 0.), 1.);
  #include <fog_fragment>
}`;

// ---- trunks, ropes, rungs, the torch: aK = (sway weight, kind, heat): 0 bark, 1 three-strand rope, 2 wood, 3 leaf bundle ----
const TRUNK_VS = /* glsl */`
${GL_LIT}
attribute vec3 aCol, aK; attribute vec2 aUv;
varying vec3 vCol, vK, vObj; varying vec2 vUv;
${VS_PARS}
void main(){
  vCol = aCol; vK = aK; vUv = aUv; vObj = position;
  vec3 p = position;
  float sw = aK.x;
  p.x += sw*0.9*sin(uTime*0.7 + p.y*0.03)*uAir.y; p.z += sw*0.6*sin(uTime*0.9 + 1.3 + p.y*0.04)*uAir.y;
  vec3 wpos = (modelMatrix*vec4(p, 1.)).xyz, wn = normalize(mat3(modelMatrix)*normal + vec3(0., 1e-4, 0.));
  ${VS_END}
}`;
const TRUNK_FS = /* glsl */`
${GL_LIT}
uniform vec3 uMoss; uniform float uCherry;
varying vec3 vCol, vK, vObj; varying vec2 vUv;
${FS_PARS}
void main(){
  ${FS_NV}
  float kind = vK.y; vec3 alb = vCol; float gloss = 14., spec = 0.04, h = 0.;
  vec3 P = vObj; vec3 emis = vec3(0.);
  if (kind < 0.5){                          // bark: flaking cinnamon plates, moss on top, lichen blotches
    vec2 b = vec2(vUv.x*0.33, vUv.y*0.085) + 0.6*vec2(vn3(P*0.11), vn3(P*0.11 + 9.));
    vec2 bi = floor(b), bf = fract(b);
    float edge = min(min(bf.x, 1. - bf.x), min(bf.y, 1. - bf.y)), id = h21(bi);
    float plate = smoothstep(0.02, 0.1, edge), curl = smoothstep(0.1, 0.42, edge)*(0.4 + 0.6*id);
    float lod = 1. - smoothstep(40., 200., length(vWorld - cameraPosition));
    float grain = vn3(P*vec3(2.1, 2.1, 2.1)), fine = mix(0.5, vn3(P*7.), lod);
    h = plate*0.6 + curl*0.5 + grain*0.25 + fine*0.1;
    alb = vCol*(0.5 + 0.42*id + 0.3*grain)*(0.5 + 0.5*plate);
    alb = mix(alb, vCol*vec3(1.5, 1.05, 0.8), (1. - plate)*0.5*id);
    float hor = smoothstep(0.6, 0.9, sin(vUv.y*5.2 + fine*2.))*uCherry;              // cherry: satin bark with lenticel bands
    alb = mix(alb, vCol*mix(0.55, 1.5, hor), uCherry*0.8); spec += 0.25*uCherry; gloss += 30.*uCherry;
    float lich = smoothstep(0.62, 0.72, vn3(P*0.23 + 5.))*smoothstep(0.4, 0.6, fine + grain*0.3);
    alb = mix(alb, vec3(0.42, 0.47, 0.38), lich*0.6*lod);
    float mossy = smoothstep(0.25, 0.75, N.y + 0.6*(vn3(P*0.3) - 0.5))*smoothstep(0.3, 0.55, vn3(P*0.9) + 0.25*N.y);
    alb = mix(alb, uMoss*(0.5 + 0.9*fine*grain + 0.4*lod*smoothstep(0.72, 0.86, vn3(P*11.))), mossy);
  } else if (kind < 1.5){                   // twisted bamboo rope: three strands laid one turn in 7 m, each of yarns twisted the other way
    float lodR = 1. - smoothstep(25., 110., length(vWorld - cameraPosition));
    float st = fract(vUv.x*3. - vUv.y*0.42 + 0.5), sc = abs(st - 0.5)*2.;
    float groove = 1. - sc*sc*sc;
    float yq = st*4. + vUv.y*1.5;
    float yarn = mix(0.5, 0.5 + 0.5*cos(6.2832*yq), lodR), fib = vn2(vec2(yq*9., vUv.y*0.9 - st*3.));
    h = groove*0.9 + yarn*0.22*(1. - sc) + fib*0.15;
    alb = vCol*(0.2 + 0.85*groove)*(0.66 + 0.3*yarn + 0.42*fib);
  } else if (kind < 2.5){                   // wooden rung: grain, knots, worn pale in the middle
    float g = vn2(vec2(vUv.x*14., vUv.y*0.35)) , k = vn2(vUv*vec2(2., 0.9) + 3.);
    h = g*0.4; alb = vCol*(0.5 + 0.6*g)*(0.8 + 0.4*k);
  } else if (kind < 3.5){                   // a dry leaf blade of the torch: midrib, parallel veins, curled dark edges; charred and glowing at the foot
    float ax = abs(vUv.x - 0.5)*2.;
    float rib = 1. - smoothstep(0.04, 0.16, ax), vein = 0.5 + 0.5*cos(vUv.x*44. + 2.*vn2(vec2(vUv.x*6., vUv.y*0.3)));
    float blot = vn2(vec2(vUv.x*3. + vCol.r*40., vUv.y*0.45));
    h = rib*0.6 + vein*0.25 + (1. - ax*ax)*0.5;
    alb = vCol*(0.5 + 0.35*vein + 0.55*blot)*(1. - 0.5*smoothstep(0.62, 1., ax));
    alb = mix(alb, vCol*vec3(1.4, 1.2, 0.72), rib*0.6);
    float heat = vK.z*smoothstep(0.35, 0.75, vn3(P*0.9 + vec3(0., uTime*0.35, 0.)) + vK.z*0.35);
    alb = mix(alb, vec3(0.02), vK.z*0.8);
    emis = vec3(1., 0.32, 0.05)*heat*(2.2 + 1.2*sin(uTime*3.1 + P.y*2.));
  } else {                                  // a loose fibre of the rope, pale and dry
    alb = vCol*(0.85 + 0.3*vn3(P*3.)); spec = 0.08;
  }
  vec3 dpx = dFdx(vWorld), dpy = dFdy(vWorld); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 g = (hx*r1 + hy*r2)/(abs(det) + 1e-5)*sign(det + 1e-9);
  N = normalize(N - clamp(g*0.9, -1., 1.) + vec3(0., 1e-5, 0.));
  alb *= mix(1., 0.6, uAir.z);
  vec3 c = sunLit(alb, N, V, 1., gloss, spec*(1. + 3.*uAir.z)) + emis;
  c += uSkyCol*alb*pow(1. - max(dot(N, V), 0.), 3.)*0.6;
  gl_FragColor = vec4(max(farHaze(c, vWorld), 0.), 1.);
  #include <fog_fragment>
}`;

// ---- creatures posed on the CPU (companions, our own body, hornets, buzzards, the honeyguide) ----
// aB = (span or length coordinate, band or chord coordinate, kind, side): 0 plain, 1 banded abdomen, 2 fur, 3 flight feathers, 4 eye, 5 feathered body
const CREA_VS = /* glsl */`
${GL_LIT}
attribute vec3 aCol; attribute vec4 aB;
uniform vec4 uFlap;                      // phase, amplitude, shoulder x, shoulder y
varying vec3 vCol, vObj; varying vec4 vB;
${VS_PARS}
void main(){
  #ifdef USE_INSTANCING
    mat4 im = instanceMatrix;
  #else
    mat4 im = mat4(1.);
  #endif
  vec3 p = position, n = normal;
  if (aB.z > 2.5 && aB.z < 3.5){
    float s = aB.x, ph = uFlap.x + im[3].x*0.021;
    float ang = uFlap.y*(0.45*s + 0.55*s*s)*sin(ph - 1.2*s) + 0.1*s;
    float ca = cos(ang), sa = sin(ang);
    vec2 q = vec2((p.x - uFlap.z*aB.w)*aB.w, p.y - uFlap.w);
    p.x = uFlap.z*aB.w + (ca*q.x - sa*q.y)*aB.w; p.y = uFlap.w + sa*q.x + ca*q.y;
    vec2 nq = vec2(n.x*aB.w, n.y); n.x = (ca*nq.x - sa*nq.y)*aB.w; n.y = sa*nq.x + ca*nq.y;
  }
  vCol = aCol; vB = aB; vObj = position;
  vec3 wpos = (modelMatrix*im*vec4(p, 1.)).xyz, wn = normalize(mat3(modelMatrix)*mat3(im)*n + vec3(0., 1e-4, 0.));
  ${VS_END}
}`;
const CREA_FS = /* glsl */`
${GL_LIT}
uniform vec3 uPale;
varying vec3 vCol, vObj; varying vec4 vB;
${FS_PARS}
void main(){
  ${FS_NV}
  float kind = vB.z; vec3 alb = vCol; float gloss = 30., spec = 0.12, rimK = 0.5, thru = 0., belly = 0.;
  if (kind > 0.5 && kind < 1.5){            // abdomen: dark with thin pale bands
    float bp = fract(vB.y*5.2 + 0.1), band = smoothstep(0.74, 0.84, bp)*(1. - smoothstep(0.93, 1., bp));
    alb = mix(alb, uPale*0.5, band*0.9*vB.w); spec = 0.3; gloss = 50.;
  } else if (kind > 1.5 && kind < 2.5){     // fur
    float f = vn3(vObj*38.)*vn3(vObj*17. + 4.);
    alb *= 0.55 + 1.5*f; spec = 0.02; rimK = 1.6;
  } else if (kind > 2.5 && kind < 3.5){     // flight feathers: barred below, scalloped above
    float s = vB.x, c = vB.y;
    float shaft = 1. - 0.3*smoothstep(0.3, 0.5, abs(fract(s*17.) - 0.5));
    if (gl_FrontFacing){
      alb *= (0.7 + 0.5*smoothstep(0.2, 0.9, fract(c*3.2 - s*0.4)))*shaft;
    } else {
      float bars = smoothstep(0.1, 0.24, abs(fract(c*4.4 + 0.2*sin(s*9.)) - 0.5))*smoothstep(0.3, 0.42, c);
      float mott = step(0.55, vn2(vec2(s*30., c*14.)))*(1. - smoothstep(0.3, 0.42, c));
      alb = uPale*vec3(0.66, 0.6, 0.52)*mix(1., 0.36, max(max(1. - bars, 0.)*smoothstep(0.3, 0.42, c), mott*0.75))*shaft;
      alb = mix(alb, vCol*0.5, max(smoothstep(0.9, 0.97, c), smoothstep(0.86, 0.97, s)));          // dark trailing edge and fingertips
      alb = mix(alb, vCol*0.45, (1. - smoothstep(0.06, 0.16, distance(vec2(s, c), vec2(0.56, 0.2)))));   // carpal patch
      thru = 0.55;
    }
    spec = 0.05;
  } else if (kind > 4.5 && kind < 5.5){     // a raptor's body: scalloped feathers above, the pale underside barred
    vec2 g = vec2(vObj.x*0.7 + vObj.y*0.45, vObj.z*0.75); g.x += 0.5*mod(floor(g.y), 2.);
    vec2 gf = fract(g) - 0.5;
    float sc = smoothstep(0.55, 0.1, length(gf*vec2(1., 1.25) + vec2(0., 0.18)));
    float bars = mix(0.8, smoothstep(-0.25, 0.25, sin(vObj.z*2.3 + 0.8*sin(vObj.x*1.4))), smoothstep(-2.5, 1., vObj.z));   // the rump is plain
    float under = smoothstep(0.2, 0.4, dot(alb, vec3(0.333)))*(1. - smoothstep(7.4, 8.5, vObj.z));      // (the head is plain)
    alb *= mix(vec3(0.6 + 0.65*sc), mix(vec3(0.5, 0.36, 0.25), vec3(1.05), bars)*(0.85 + 0.25*sc), under);
    spec = 0.04; rimK = 0.9; belly = 1.;
  } else if (kind > 5.5){ belly = 1.; spec = 0.2;        // (bare skin: the feet)
  } else if (kind > 3.5){ spec = 1.2; gloss = 90.; rimK = 0.2; }
  alb *= mix(1., 0.7, uAir.z);
  vec3 c = sunLit(alb, N, V, 1., gloss, spec);
  c += uSunCol*alb*max(dot(-N, uSunDir), 0.)*thru;
  // a bird's breast and belly are lit from below: the sunlit haze of the gorge and the pale cliff under it
  c += alb*(uSkyCol*0.55 + uBounceCol*0.5 + uSunCol*0.24)*(1. - smoothstep(-0.6, 0.35, N.y))*belly;
  float rim = pow(1. - max(dot(N, V), 0.), 3.);
  c += (uSunCol*vec3(0.5, 0.38, 0.22)*(0.3 + 0.7*max(dot(N, uSunDir), 0.)) + uSkyCol*0.5)*rim*rimK*0.45;
  gl_FragColor = vec4(max(c, 0.), 1.);
  #include <fog_fragment>
}`;
// wing blur: a steady translucent fan (aUv = radius 0..1, stroke -1..1)
const FAN_VS = /* glsl */`
attribute vec2 aUv; varying vec2 vUv;
${VS_PARS}
void main(){
  #ifdef USE_INSTANCING
    mat4 im = instanceMatrix;
  #else
    mat4 im = mat4(1.);
  #endif
  vUv = aUv;
  vec3 wpos = (modelMatrix*im*vec4(position, 1.)).xyz, wn = normalize(mat3(modelMatrix)*mat3(im)*normal + vec3(0., 1e-4, 0.));
  ${VS_END}
}`;
const FAN_FS = /* glsl */`
${GL_LIT}
uniform vec4 uFan;                       // rgb tint, alpha
uniform vec3 uClA, uClB;
varying vec2 vUv;
${FS_PARS}
void main(){
  ${FS_NV}
  float a = uFan.a*(0.3 + 0.7*(1. - vUv.y*vUv.y))*smoothstep(0., 0.12, vUv.x)*(1. - smoothstep(0.7, 1., vUv.x));
  a *= 0.82 + 0.18*sin(vUv.y*7. + uTime*23.)*sin(uTime*9. + vUv.x*5.);
  float gl = pow(max(dot(reflect(-V, N), uSunDir), 0.), 12.);
  vec3 ab = uClB - uClA; float tt = clamp(dot(vWorld - uClA, ab)/max(dot(ab, ab), 1e-4), 0., 1.);
  float open = smoothstep(9., 20., length(vWorld - uClA - ab*tt));
  vec3 c = (uFan.rgb*(uSkyCol*1.2 + uSunCol*0.25) + uSunCol*gl*0.5)*mix(0.22, 1., open);
  gl_FragColor = vec4(max(c, 0.), a*mix(0.6, 1., open));
  #include <fog_fragment>
}`;
// Our own body, carried with the camera and lit in the camera's own space (a key from over our left shoulder, the sky
// as fill), so that it is never a black outline whichever way we fly: aB = (along 0..1, around, kind, tone); kind 0 = an
// antenna (ringed segments), 1 = the fur of the thorax, 2 = a hair of its fringe (a soft-edged card, blended: uSoft 1).
const BODY_VS = /* glsl */`
attribute vec3 aCol; attribute vec4 aB;
varying vec3 vCol, vObj, vNv; varying vec4 vB;
void main(){
  vCol = aCol; vB = aB; vObj = position;
  vNv = normalMatrix*normal;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.);
}`;
const BODY_FS = /* glsl */`
uniform vec3 uKey, uFill, uGlow;       // the sun over our shoulder, the sky, the portal's light ahead of us in the cleft
uniform float uDim;                    // 0 in the open, 1 down the cleft
uniform float uSoft;                   // 1 on the blended fringe
varying vec3 vCol, vObj, vNv; varying vec4 vB;
float bh(float n){ return fract(sin(n*12.9898)*43758.5453); }
float bn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); float n = dot(i, vec3(1., 57., 113.));
  return mix(mix(mix(bh(n), bh(n + 1.), f.x), mix(bh(n + 57.), bh(n + 58.), f.x), f.y),
             mix(mix(bh(n + 113.), bh(n + 114.), f.x), mix(bh(n + 170.), bh(n + 171.), f.x), f.y), f.z); }
void main(){
  vec3 N = normalize(vNv + vec3(0., 1e-5, 0.));
  if (N.z < 0.) N = -N;                                       // (camera space: whatever we see faces us)
  vec3 alb = vCol; float rimK = 0.5, spec = 0., alpha = 1., glow = 0.;
  if (vB.z < 0.5){                                            // antenna: a ringed flagellum, each segment a soft barrel with a pale joint
    float sg = fract(vB.x*13.);
    alb *= 0.75 + 0.45*sin(sg*3.14159);
    alb = mix(alb, vec3(0.62, 0.44, 0.2), (1. - smoothstep(0.03, 0.12, min(sg, 1. - sg)))*0.55*step(0.2, vB.x));
    alb *= 0.85 + 0.3*bn(vObj*60.);
    rimK = 1.6; spec = 0.3;
  } else if (vB.z < 1.5){                                     // thorax: amber fur in tufts combed back over a dark under-fur, a darker saddle across it
    float st = bn(vec3(vObj.x*105., vObj.y*40., vObj.z*24.)), cl = bn(vObj*vec3(13., 13., 9.) + 3.);
    float tuft = smoothstep(0.22, 0.8, st*0.55 + cl*0.6);
    alb = vCol*mix(0.56, 1.15, tuft);
    alb = mix(alb, vec3(0.085, 0.05, 0.026)*(0.55 + 0.9*tuft), vB.w);
    rimK = 1.1;
  } else {                                                    // a hair of the fringe: deep amber at the root, pale gold and half clear at the tip
    float t = vB.x, e = abs(vB.y*2. - 1.);
    alb = mix(alb*0.6, alb*1.35 + vec3(0.07, 0.05, 0.015), t);
    N = normalize(mix(N, vec3(0., 0.8, 0.6), 0.6));
    rimK = 0.; glow = 0.3*t;
    alpha = mix(1., (1. - smoothstep(0.15, 1., e))*(1. - smoothstep(0.45, 1., t))*0.85, uSoft);
  }
  vec3 L = normalize(vec3(-0.42, 0.74, 0.52));
  float wrap = clamp(dot(N, L)*0.62 + 0.38, 0., 1.);
  vec3 day = alb*(uKey*(wrap + glow) + uFill*(0.55 + 0.45*N.y)) + uKey*spec*pow(max(dot(N, normalize(L + vec3(0., 0., 1.))), 0.), 24.);
  float rim = pow(1. - abs(N.z), 2.5);
  day += alb*uKey*rim*rimK*(0.35 + 0.65*smoothstep(-0.3, 0.6, N.y));
  vec3 deep = alb*uGlow*(0.3 + 0.7*rim + 0.5*max(N.y, 0.) + glow);
  gl_FragColor = vec4(max(mix(day, deep, uDim), 0.), alpha);
}`;
// flying bees on lanes: each instance flies a quadratic Bezier A -> B bowed by C, looping on world
// time or once on the story clock (u x duration). aP = part: 0 abdomen, 1 thorax, 2 wing blur, 3 pollen load, 4 head and legs.
// Bodies are near-black with a tawny thorax; the wings are a stippled blur with only a faint glint.
const FLY_VS = /* glsl */`
${GL_LIT}
attribute float aP; attribute vec3 iA, iB, iC; attribute vec4 iT; attribute vec2 iS;
uniform float uStory; uniform vec4 uNear;                                  // lens push, fade from, fade to, least size in pixels
uniform vec3 uSpine[21];                                                   // the river of the absconding colony: the knots of its course (ends doubled)
varying float vP, vBand; varying vec3 vS;
${VS_PARS}
void main(){
  float clock = mix(uTime, uStory, step(0.5, iT.z));
  float s = iT.z < 0.5 ? fract(clock/max(iT.y, 0.01) + iT.x) : clamp((clock - iT.x)/max(iT.y, 0.01), 0., 1.);
  vec3 ctrl = (iA + iB)*0.5 + iC;
  vec3 p0 = mix(mix(iA, ctrl, s), mix(ctrl, iB, s), s);
  vec3 tg = normalize(mix(ctrl - iA, iB - ctrl, s) + vec3(1e-4, 0., 0.));
  float rv = 1.;
  if (iT.z > 1.5){
    // a bee of the river: off the comb, into the stream and along it. iT = (when it lets go, metres a second, 2, size),
    // iC = (distance from the axis, angle, swirl). The first eleven knots are 17.5 m apart; beyond them each gap is 1.3 times the last.
    float sl = max(clock - iT.x, 0.)*iT.y;
    float f = min(min(sl/17.5, 11.) + log(1. + max(sl - 192.5, 0.)*0.014992)/0.26236, 17.999);
    float fi = floor(f), t = f - fi; int k = int(fi);
    vec3 q0 = uSpine[k], q1 = uSpine[k + 1], q2 = uSpine[k + 2], q3 = uSpine[k + 3];
    vec3 cb = q2 - q0, cc = 2.*q0 - 5.*q1 + 4.*q2 - q3, cd = -q0 + 3.*q1 - 3.*q2 + q3;
    vec3 sp = 0.5*(2.*q1 + cb*t + cc*t*t + cd*t*t*t);
    vec3 st = normalize(0.5*(cb + 2.*cc*t + 3.*cd*t*t) + vec3(1e-4, 0., 0.));
    vec3 ss = normalize(cross(st, vec3(0., 1., 0.)) + vec3(0., 0., 1e-4)), su = cross(ss, st);
    // tight where it runs behind comb four, opening out in the air beyond the gap, a little wider still far away
    float ang = iC.y + (clock - iT.x)*iC.z, wide = mix(0.48, 1., smoothstep(5.5, 8.5, f))*(1. + 0.8*smoothstep(11., 18., f));
    vec3 pr = sp + (ss*cos(ang) + su*sin(ang)*0.75)*iC.x*wide;
    float join = smoothstep(0., 1.3, f);
    p0 = mix(iA, pr, join);
    tg = normalize(mix(pr - iA, st*30., join) + vec3(1e-4, 0., 0.));
    rv = step(1e-3, clock - iT.x)*smoothstep(0., 0.2, f)*(1. - smoothstep(16.6, 17.9, f));
  }
  vec3 sd = normalize(cross(tg, vec3(0., 1., 0.)) + vec3(0., 0., 1e-4)), up = cross(sd, tg);
  float sz = iT.w, seed = iS.x;
  float wv = sin(uTime*1.7 + seed*40.), wu = sin(uTime*2.3 + seed*70.);
  p0 += (sd*wv + up*wu)*0.7*sz;
  float roll = 0.5*cos(uTime*1.7 + seed*40.);                              // banks into its own weave
  vec3 sd2 = sd*cos(roll) + up*sin(roll), up2 = up*cos(roll) - sd*sin(roll);
  float vis = iT.z > 1.5 ? rv : smoothstep(0., 0.035, s)*(1. - smoothstep(0.965, 1., s));
  vec3 dc = p0 - cameraPosition; float dl = length(dc) + 1e-3;
  p0 += dc/dl*max(0., uNear.x - dl);                                       // never through the lens
  vis *= smoothstep(uNear.y, uNear.z, dl);
  dl = max(dl, uNear.x);
  sz *= max(1., dl*uNear.w/max(uAir.w, 100.));                             // a far bee stays a dark speck, not a point
  vec3 q = position;
  if (aP > 2.5 && aP < 3.5) q *= iS.y;
  vec3 wpos = p0 + (sd2*q.x + up2*q.y + tg*q.z)*sz*vis;
  vec3 wn = normalize(sd2*normal.x + up2*normal.y + tg*normal.z + vec3(0., 1e-4, 0.));
  vP = aP; vBand = position.z; vS = vec3(iS, dl);
  ${VS_END}
}`;
const FLY_FS = /* glsl */`
${GL_LIT}
uniform vec3 uPale, uBeeDark, uClA, uClB, uPortalPos, uPortalCol;
uniform vec4 uShade;                     // the colours of the body hold out to (from, to) metres; gain of the tawny fur; lift of the dark abdomen
uniform vec4 uWing;                      // the wing blur: its own light, its glint toward the sun, how opaque, the range at which it is lost
uniform float uFace;                     // 1 (the swarm): shade every bee by the side it turns to us, the sun wrapped round its fur
varying float vP, vBand; varying vec3 vS;
${FS_PARS}
void main(){
  bool wing = vP > 1.5 && vP < 2.5;
  ${FS_NV}
  // (a flyer's frame is a mirror image, so the winding of its faces is reversed and the test above turns the normal of
  // every face we see inward: the swarm, seen from all round and near, takes the side that faces us)
  if (uFace > 0.5 && dot(N, V) < 0.) N = -N;
  vec3 dark = uBeeDark*0.36 + vec3(0.03, 0.017, 0.008)*uShade.w, tawny = vec3(0.06, 0.035, 0.011)*uShade.z;
  vec3 alb = dark; float furry = 0., nearK = 1. - smoothstep(uShade.x, uShade.y, vS.z);   // past that a bee is a dark speck
  // the body is told apart along its length: a near-black abdomen with thin pale bands, a tawny thorax, a dark head
  if (vP < 1.5 && vBand < 0.04){
    float bp = fract(vBand*5.6 + 0.3), band = smoothstep(0.66, 0.76, bp)*(1. - smoothstep(0.9, 1., bp));
    alb = mix(dark, uPale*0.3*(1. + 0.25*uShade.w), band*0.8*nearK*smoothstep(-0.62, -0.5, vBand));
    alb = mix(alb, tawny*0.83, smoothstep(-0.1, 0.02, vBand)*0.8*nearK);     // the first segment is tawny too
  } else if (vP < 1.5 && vBand < 0.37){ alb = mix(uBeeDark*0.5, tawny*(0.8 + 0.4*fract(vS.x*7.)), 0.25 + 0.75*nearK); furry = 1.; }
  else if (vP < 1.5) alb = uBeeDark*0.42 + vec3(0.02, 0.012, 0.006)*uShade.w;
  else if (vP < 2.5) alb = vec3(0.05, 0.047, 0.045);
  else if (vP < 3.5) alb = uPale*0.6;
  vec3 ab = uClB - uClA; float tt = clamp(dot(vWorld - uClA, ab)/max(dot(ab, ab), 1e-4), 0., 1.);
  float open = smoothstep(9., 20., length(vWorld - uClA - ab*tt));          // 0 inside the cleft: no sun there, only the glow from the far end
  vec3 c = sunLit(alb, N, V, open, 34., wing ? 0.02 : 0.03 + 0.05*(1. - furry))*mix(0.5, 1., open);
  float fwd = max(dot(-V, uSunDir), 0.), ndl0 = dot(N, uSunDir);
  if (!wing) c += alb*uSunCol*(clamp(ndl0*0.6 + 0.4, 0., 1.) - max(ndl0, 0.))*open*uFace;        // the sun wrapped round a furred body
  // the wings: a pale blur that catches the sun (brightest toward the sun and where the fan turns its face to it)
  float wk = 1. - smoothstep(uWing.w*0.6, uWing.w, vS.z);
  if (wing) c += open*uSunCol*vec3(0.9, 0.84, 0.72)*(uWing.x + uWing.y*(fwd*fwd*fwd + 0.6*pow(max(dot(reflect(-V, N), uSunDir), 0.), 6.)));
  // light catches only the fur of the thorax and the very edge of the body
  float rim = pow(1. - max(dot(N, V), 0.), 5.)*(wing ? 0.15 : mix(0.3, 1.4, furry))*(0.25 + 0.75*nearK);
  c += mix(vec3(0.6, 0.34, 0.1)*0.14, uSunCol*vec3(0.5, 0.38, 0.22)*0.05, open)*rim;
  // down the cleft the portal lights them: gold on the side turned to it, a gold rim, the bands and the fur readable
  vec3 Lp = uPortalPos - vWorld; float dp = length(Lp) + 1e-3; Lp /= dp;
  float pl = (1. - open)*(0.3 + 0.7*clamp(1. - dp/110., 0., 1.)), nlp = dot(N, Lp);
  c += uPortalCol*pl*(alb*3.6*(0.22 + 0.78*max(nlp, 0.)) + vec3(1., 0.7, 0.34)*0.2*pow(max(1. - max(dot(N, V), 0.), 0.), 3.)*(0.4 + 0.6*smoothstep(-0.4, 0.5, nlp))*(wing ? 0.3 : mix(0.6, 1.3, furry)));
  // (the wings are a blur: drawn in their own pass over the picture, a third opaque)
  gl_FragColor = vec4(max(c, 0.), wing ? uWing.z*wk : 1.);
  #include <fog_fragment>
}`;
// ---- the bee-line (an added thing: nothing above or below it is changed by it) ----
// A river of bees along one line in the world, from the bells of the bough we leave to the combs at the north horn.
// Each instance keeps a lane of its own beside that line for ever: iC = (metres off the line, or off the middle of the core;
// bearing; turn of that bearing per knot, plus 10 for a lane of the core), iA = the bell it works, iB = its place on a comb,
// iT = (phase, seconds from end to end, 0 homeward or 2 outbound plus where it turns for its comb, size), iS = (seed, pollen).
// It moves on world time alone: quick and strung out at the forest end, slower and
// closer together toward the combs. It asks where the eye is only to hand its fragment shader the distance the flyers'
// colours fade by (as FLY_VS does for FLY_FS); nothing here is pushed, hidden, sized or timed for the eye.
const BEE_LINE = { NK: 54, RMIN: 3.9, FA: 5, BEND: 2.4, SPREAD: 0.8 };     // knots of the line; the nearest lane (m); knots over which a bee leaves its bell; how hard the inside of a bend is held off its centre; how far the river opens toward the forest
const BEELINE_VS = /* glsl */`
${GL_LIT}
attribute float aP; attribute vec3 iA, iB, iC; attribute vec4 iT; attribute vec2 iS;
uniform vec4 uLine[${BEE_LINE.NK + 2}];     // the knots (the ends doubled outward): place, and the bend of the line there (1/m, + to the right)
uniform vec4 uLay;                          // last knot; the knot where the line meets our road; the knot at the end of the far turn; the knot where the road swings out from the tiers
uniform vec4 uRope;                         // the core: metres from the line to its middle; its bearing round the line beside the tiers; how far that bearing turns between there and the vista; the knot of the vista
const float RMIN = ${BEE_LINE.RMIN.toFixed(2)}, FA = ${BEE_LINE.FA.toFixed(2)}, BEND = ${BEE_LINE.BEND.toFixed(2)}, SPREAD = ${BEE_LINE.SPREAD.toFixed(2)};
varying float vP, vBand; varying vec3 vS;
${VS_PARS}
// where the lane is at knot f (the same sum is done in build(), to measure every lane against the road's line)
vec3 laneAt(float f){
  float fc = clamp(f, 0., uLay.x - 1e-3), fi = floor(fc), t = fc - fi; int k = int(fi);
  vec4 q0 = uLine[k], q1 = uLine[k + 1], q2 = uLine[k + 2], q3 = uLine[k + 3];
  vec3 cb = q2.xyz - q0.xyz, cc = 2.*q0.xyz - 5.*q1.xyz + 4.*q2.xyz - q3.xyz, cd = -q0.xyz + 3.*q1.xyz - 3.*q2.xyz + q3.xyz;
  vec3 sp = 0.5*(2.*q1.xyz + cb*t + cc*t*t + cd*t*t*t);
  vec3 st = normalize(0.5*(cb + 2.*cc*t + 3.*cd*t*t) + vec3(1e-4, 0., 0.));
  vec3 ss = normalize(cross(st, vec3(0., 1., 0.)) + vec3(0., 0., 1e-4)), su = cross(ss, st);
  // a lane of the core lies in a rope whose middle runs beside the line and winds slowly round it; a lane of the sheath
  // lies about the line itself. Each turns a little of its own, and the whole is wider toward the forest
  float core = step(5., iC.z), rope = uRope.y + uRope.z*smoothstep(uLay.w, uRope.w, fc), ang = iC.y + (iC.z - 10.*core)*fc + core*rope;
  vec2 off = (iC.x*vec2(cos(ang), sin(ang)) + core*uRope.x*vec2(cos(rope), sin(rope)))*(1. + SPREAD*(1. - smoothstep(0., uLay.y, fc)));
  float x = off.x, kap = mix(q1.w, q2.w, t), ax = abs(x) - RMIN;
  if (kap*x > 0. && ax > 0.) x = sign(x)*(RMIN + ax/(1. + BEND*abs(kap)*ax));       // the inside of a bend: held off its centre
  vec3 p = mix(iA, sp + ss*x + su*off.y, smoothstep(0., FA, fc));                    // out of its bell
  float away = step(1., iT.z), peel = iT.z - 2.*away;                                // (where it turns for its comb: from the vista, 0, to the far turn, 1)
  return mix(p, iB, smoothstep(mix(uRope.w, uLay.z, peel), uLay.x, fc));             // in to its comb
}
void main(){
  float s = fract(uTime/max(iT.y, 1.) + iT.x), away = step(1., iT.z), sg = mix(s, 1. - s, away);
  // the fifth of its time nearest the forest it flies fast (3.5 times as fast at the bell, easing down), the rest at one speed
  float x1 = min(sg/0.2, 1.);
  float f = uLay.x*(0.8*sg + 2.*(sg - 0.2*(x1*x1*x1 - 0.5*x1*x1*x1*x1) - max(sg - 0.2, 0.)));
  vec3 pa = laneAt(f - 0.03), pb = laneAt(f + 0.03), p0 = 0.5*(pa + pb);
  vec3 tg = normalize((pb - pa)*(1. - 2.*away) + vec3(1e-5, 0., 0.));
  vec3 sd = normalize(cross(tg, vec3(0., 1., 0.)) + vec3(0., 0., 1e-4)), up = cross(sd, tg);
  float sz = iT.w, seed = iS.x;
  // its own weave about its lane: a slow wander to the side and up and down, a quicker small one over it, and it banks into both
  float ends = smoothstep(0., 1.5, f)*(1. - smoothstep(uLay.x - 1.5, uLay.x, f));
  float a1 = uTime*(0.5 + 0.5*fract(seed*13.7)) + seed*40., a2 = uTime*(0.4 + 0.5*fract(seed*29.3)) + seed*70.;
  float a3 = uTime*1.9 + seed*91., a4 = uTime*2.3 + seed*57.;
  p0 += (sd*(sin(a1) + 0.3*sin(a3)) + up*(0.7*sin(a2) + 0.25*sin(a4)))*ends;
  float roll = (0.45*cos(a1) + 0.2*cos(a3))*ends;
  vec3 sd2 = sd*cos(roll) + up*sin(roll), up2 = up*cos(roll) - sd*sin(roll);
  float vis = smoothstep(0., 0.3, f)*(1. - smoothstep(uLay.x - 0.3, uLay.x, f));     // (it goes into its bell, and into the curtain)
  vec3 q = position;
  if (aP > 2.5 && aP < 3.5) q *= iS.y;
  vec3 wpos = p0 + (sd2*q.x + up2*q.y + tg*q.z)*sz*vis;
  vec3 wn = normalize(sd2*normal.x + up2*normal.y + tg*normal.z + vec3(0., 1e-4, 0.));
  vP = aP; vBand = position.z; vS = vec3(iS, length(p0 - cameraPosition) + 1e-3);
  ${VS_END}
}`;
// its fragment shader: the flyers' own (FLY_FS) with the swarm's way of shading every bee by the side it turns to us, less the
// cleft and the portal's light (no lane goes there), and with two things of the sun added: the wing blur takes the sun as
// gold (uGold), and the fur of the thorax has a gold edge, strongest against the light. Whatever comes from the vertex stage
// is held in its range before a power is taken.
const BEELINE_FS = /* glsl */`
${GL_LIT}
uniform vec3 uPale, uBeeDark, uGold;
uniform vec4 uShade, uWing;              // as in FLY_FS
varying float vP, vBand; varying vec3 vS;
${FS_PARS}
void main(){
  bool wing = vP > 1.5 && vP < 2.5;
  ${FS_NV}
  if (dot(N, V) < 0.) N = -N;
  vec3 dark = uBeeDark*0.36 + vec3(0.03, 0.017, 0.008)*uShade.w, tawny = vec3(0.06, 0.035, 0.011)*uShade.z;
  vec3 alb = dark; float furry = 0., nearK = 1. - smoothstep(uShade.x, uShade.y, vS.z);
  if (vP < 1.5 && vBand < 0.04){
    float bp = fract(vBand*5.6 + 0.3), band = smoothstep(0.66, 0.76, bp)*(1. - smoothstep(0.9, 1., bp));
    alb = mix(dark, uPale*0.3*(1. + 0.25*uShade.w), band*0.8*nearK*smoothstep(-0.62, -0.5, vBand));
    alb = mix(alb, tawny*0.83, smoothstep(-0.1, 0.02, vBand)*0.8*nearK);
  } else if (vP < 1.5 && vBand < 0.37){ alb = mix(uBeeDark*0.5, tawny*(0.8 + 0.4*fract(vS.x*7.)), 0.25 + 0.75*nearK); furry = 1.; }
  else if (vP < 1.5) alb = uBeeDark*0.42 + vec3(0.02, 0.012, 0.006)*uShade.w;
  else if (vP < 2.5) alb = vec3(0.05, 0.047, 0.045);
  else if (vP < 3.5) alb = uPale*0.6;
  vec3 c = sunLit(alb, N, V, 1., 34., wing ? 0.02 : 0.03 + 0.05*(1. - furry));
  float fwd = clamp(dot(-V, uSunDir), 0., 1.), ndl0 = dot(N, uSunDir), nv = clamp(dot(N, V), 0., 1.);
  if (!wing) c += alb*uSunCol*(clamp(ndl0*0.6 + 0.4, 0., 1.) - max(ndl0, 0.));                // the sun wrapped round a furred body
  // the wing blur: lost with distance as the flyers' is, and thinner close to (a blur seen near is mostly air)
  float wk = (1. - smoothstep(uWing.w*0.6, uWing.w, vS.z))*mix(0.3, 1., smoothstep(6., 30., vS.z));
  if (wing) c += uSunCol*uGold*(uWing.x + uWing.y*(fwd*fwd*fwd + 0.6*pow(clamp(dot(reflect(-V, N), uSunDir), 0., 1.), 6.)));
  float rim = pow(1. - nv, 5.)*(wing ? 0.15 : mix(0.3, 1.4, furry))*(0.25 + 0.75*nearK);
  c += uSunCol*vec3(0.5, 0.38, 0.22)*0.05*rim;
  if (!wing) c += uSunCol*uGold*tawny*furry*(1. - nv)*(1. - nv)*(0.6 + 1.4*fwd);              // the sun in the fur
  c = farHaze(c, vWorld);                                                                       // the air of the place, as on its plants
  gl_FragColor = vec4(clamp(c, 0., 8.), wing ? uWing.z*wk : 1.);
  #include <fog_fragment>
}`;

// ---------- geometry helpers ----------
function GB(spec = {}) {
  const pos = [], idx = [], att = {};
  for (const k in spec) att[k] = [];
  return {
    pos, idx, att,
    count() { return pos.length / 3; },
    v(x, y, z, a) { pos.push(x, y, z); for (const k in spec) { const s = a && a[k], n = spec[k]; for (let i = 0; i < n; i++) att[k].push(s ? (s[i] ?? 0) : 0); } return pos.length / 3 - 1; },
    tri(a, b, c) { idx.push(a, b, c); },
    quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      for (const k in spec) g.setAttribute(k, new THREE.Float32BufferAttribute(att[k], spec[k]));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    },
  };
}
// a tube along pts; radius(t, angle, len) -> r; attr(t, around 0..1, len) -> attributes
function tube(B, pts, radius, sides, attr, twist = 0) {
  const n = pts.length, T = V3(0, 0, 1), N = V3(0, 1, 0), Bn = V3(1, 0, 0), q = V3(0, 0, 0), rings = [];
  T.subVectors(pts[1], pts[0]).normalize();
  if (Math.abs(T.y) > 0.9) N.set(1, 0, 0);
  let len = 0;
  for (let i = 0; i < n; i++) {
    if (i > 0) len += pts[i].distanceTo(pts[i - 1]);
    T.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    N.addScaledVector(T, -N.dot(T)).normalize(); Bn.crossVectors(T, N);
    const t = i / (n - 1); rings.push(B.count());
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2 + twist * len, r = radius(t, a, len);
      q.copy(pts[i]).addScaledVector(N, Math.cos(a) * r).addScaledVector(Bn, Math.sin(a) * r);
      B.v(q.x, q.y, q.z, attr(t, j / sides, len));
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) { const a = rings[i] + j, b = rings[i + 1] + j; B.quad(a, a + 1, b + 1, b); }
}
// body of revolution along +Z: rings [{ z, rx, ry, yc, a: attributes }]
function loftZ(B, rings, sides, capFront = true, capBack = true) {
  const st = [];
  for (const r of rings) {
    st.push(B.count());
    for (let j = 0; j < sides; j++) { const a = (j / sides) * Math.PI * 2; B.v((r.xc || 0) + Math.sin(a) * r.rx, (r.yc || 0) + Math.cos(a) * (r.ry ?? r.rx), r.z, r.a); }
  }
  for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < sides; j++) {
    const a = st[k] + j, b = st[k] + (j + 1) % sides, c = st[k + 1] + (j + 1) % sides, d = st[k + 1] + j;
    B.quad(a, d, c, b);
  }
  const cap = (k, flip) => { const r = rings[k], c = B.v(r.xc || 0, r.yc || 0, r.z, r.a); for (let j = 0; j < sides; j++) { const a = st[k] + j, b = st[k] + (j + 1) % sides; if (flip) B.tri(c, b, a); else B.tri(c, a, b); } };
  if (capBack) cap(0, false); if (capFront) cap(rings.length - 1, true);
}
const PSPEC = { aCol: 3, aK: 3, aUv: 2 };
const rgb = (c, k = 1) => [c.r * k, c.g * k, c.b * k];

// a rhododendron bell (or, opened flat, a cherry blossom) hanging from a pedicel: hub at the origin, +Y outward
function bellGeo(petal, deep, green, cherry) {
  const B = GB(PSPEC), SIDES = 10, ped = cherry ? 2.6 : 2.2;
  const prof = cherry ? [[0, 0.1], [0.2, 0.22], [0.45, 0.5], [0.62, 0.95], [0.72, 1.3]] : [[0, 0.13], [0.28, 0.3], [0.8, 0.42], [1.35, 0.52], [1.72, 0.7], [1.95, 1.0]];
  // pedicel (three-sided) and calyx
  const pr = [];
  for (let k = 0; k <= 2; k++) { const row = []; for (let j = 0; j < 3; j++) { const a = j * 2.094; row.push(B.v(Math.cos(a) * 0.09, ped * k / 2, Math.sin(a) * 0.09, { aCol: rgb(green, 0.8), aK: [k / 2 * 0.5, 0, 0.1], aUv: [0, 0] })); } pr.push(row); }
  for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) B.quad(pr[k][j], pr[k][(j + 1) % 3], pr[k + 1][(j + 1) % 3], pr[k + 1][j]);
  const rows = [];
  prof.forEach(([y, r], k) => {
    const row = [], t = k / (prof.length - 1), last = k === prof.length - 1;
    for (let j = 0; j <= SIDES; j++) {
      const a = (j / SIDES) * Math.PI * 2, lobe = Math.cos(5 * a);
      const rr = r * (last ? 1 + 0.2 * lobe : 1 + 0.05 * lobe * t), yy = ped + y - (last ? (cherry ? 0.05 : 0.16) * (1 - lobe) : 0);
      const c = t < 0.12 ? rgb(green) : rgb(deep.clone().lerp(petal, Math.min(1, t * 1.3)));
      row.push(B.v(Math.cos(a) * rr, yy, Math.sin(a) * rr, { aCol: c, aK: [0.5 + 0.5 * t, 2, 0.25], aUv: [j / SIDES, t] }));
    }
    rows.push(row);
  });
  for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < SIDES; j++) B.quad(rows[k][j], rows[k + 1][j], rows[k + 1][j + 1], rows[k][j + 1]);
  // stamens: five curved ribbons with dark anthers
  const top = prof[prof.length - 1][0];
  for (let s = 0; s < 5; s++) {
    const a = s * 1.2566 + 0.4, ca = Math.cos(a), sa = Math.sin(a), w = 0.045, prev = [];
    for (let k = 0; k <= 3; k++) {
      const t = k / 3, y = ped + 0.15 + t * (top + (cherry ? 0.5 : 0.25)), r = (cherry ? 0.55 : 0.2) * t + 0.12 * t * t;
      const cc = k === 3 ? (cherry ? [0.8, 0.6, 0.1] : [0.12, 0.04, 0.03]) : rgb(petal, 1.25), ww = k === 3 ? w * 2.4 : w;
      const i0 = B.v(ca * r - sa * ww, y, sa * r + ca * ww, { aCol: cc, aK: [1, 0, 0.2], aUv: [0, 0] });
      const i1 = B.v(ca * r + sa * ww, y, sa * r - ca * ww, { aCol: cc, aK: [1, 0, 0.2], aUv: [0, 0] });
      if (k > 0) B.quad(prev[0], prev[1], i1, i0);
      prev[0] = i0; prev[1] = i1;
    }
  }
  return B.geometry();
}
// a leathery leaf 5 m long: base at the origin, +Y along the blade, +Z is the upper face
function leafGeo(green, len = 5, wid = 0.8) {
  const B = GB(PSPEC), NL = 5, rows = [];
  for (let k = 0; k <= NL + 1; k++) {
    const t = Math.max(0, (k - 1) / NL), pet = k === 0;
    const y = pet ? -0.7 : t * len, hw = pet ? 0.07 : Math.max(0.05, wid * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.75) + 0.05);
    const droop = -0.9 * t * t - (pet ? 0 : 0.05), row = [];
    for (const e of [-1, 0, 1]) row.push(B.v(e * hw, y, droop - Math.abs(e) * hw * 0.42 + (e === 0 ? 0.06 : 0), { aCol: rgb(green, pet ? 1.3 : 1), aK: [pet ? 0 : 0.25 + 0.75 * t, pet ? 0 : 1, 0.55], aUv: [e, t] }));
    rows.push(row);
  }
  for (let k = 0; k <= NL; k++) for (let e = 0; e < 2; e++) B.quad(rows[k][e], rows[k][e + 1], rows[k + 1][e + 1], rows[k + 1][e]);
  return B.geometry();
}
// a strip for fern fronds (kind 3) and lichen ribbons (kind 4): base at the origin, +Y along
function stripGeo(kind, len, wid, arch, c0, c1) {
  const B = GB(PSPEC), NL = kind === 3 ? 6 : 8, rows = [];
  for (let k = 0; k <= NL; k++) {
    const t = k / NL, row = [];
    const y = kind === 3 ? len * (t - 0.35 * arch * t * t) : -len * t, z = kind === 3 ? -len * arch * 0.8 * t * t : 0.25 * Math.sin(t * 5);
    for (const e of [-1, 1]) row.push(B.v(e * wid * 0.5, y, z + (kind === 3 ? Math.abs(e) * 0.12 : 0), { aCol: rgb(c0.clone().lerp(c1, t)), aK: [kind === 3 ? t : 0.35 + 0.65 * t, kind, 0.15], aUv: [e, t] }));
    rows.push(row);
  }
  for (let k = 0; k < NL; k++) B.quad(rows[k][0], rows[k][1], rows[k + 1][1], rows[k + 1][0]);
  return B.geometry();
}
// a drumstick primula: basal rosette, an 6.6 m scape and a globe of florets 2 m across
function primulaGeo(mauve, green) {
  const B = GB(PSPEC), pts = [];
  for (let k = 0; k <= 4; k++) { const t = k / 4; pts.push(V3(0.35 * t * t, 6.6 * t, 0.2 * Math.sin(t * 2.2))); }
  tube(B, pts, (t) => 0.2 - 0.07 * t, 5, (t) => ({ aCol: rgb(green.clone().lerp(col('#c9cf9a'), 0.5), 0.9), aK: [t, 0, 0.1], aUv: [0, 0] }));
  const C = pts[4], R = 1.0, NA = 10, NB = 4, rows = [];
  for (let b = 0; b <= NB; b++) {
    const ph = (b / NB) * Math.PI, row = [];
    for (let a = 0; a <= NA; a++) {
      const th = (a / NA) * Math.PI * 2, bump = 1 + 0.07 * Math.sin(a * 2.5 + b * 1.9);
      row.push(B.v(C.x + Math.sin(ph) * Math.cos(th) * R * bump, C.y + 0.7 - Math.cos(ph) * R * 0.92 * bump, C.z + Math.sin(ph) * Math.sin(th) * R * bump, { aCol: rgb(mauve, 0.8 + 0.2 * (b / NB)), aK: [1, 5, 0.1], aUv: [a / NA, b / NB] }));
    }
    rows.push(row);
  }
  for (let b = 0; b < NB; b++) for (let a = 0; a < NA; a++) B.quad(rows[b][a], rows[b + 1][a], rows[b + 1][a + 1], rows[b][a + 1]);
  for (let l = 0; l < 8; l++) {
    const a = l * 0.785 + 0.3, ca = Math.cos(a), sa = Math.sin(a), L = 2.3 + 0.5 * Math.sin(l * 2.1), prev = [];
    for (let k = 0; k <= 2; k++) {
      const t = k / 2, r = 0.2 + L * t, hw = k === 0 ? 0.15 : k === 1 ? 0.55 : 0.12, y = 0.15 + 0.55 * Math.sin(t * 2.2);
      const c = rgb(green, 0.8 + 0.5 * t);
      const i0 = B.v(ca * r - sa * hw, y, sa * r + ca * hw, { aCol: c, aK: [0.1 * t, 1, 0.2], aUv: [-1, t] }), i1 = B.v(ca * r + sa * hw, y, sa * r - ca * hw, { aCol: c, aK: [0.1 * t, 1, 0.2], aUv: [1, t] });
      if (k > 0) B.quad(prev[0], prev[1], i1, i0);
      prev[0] = i0; prev[1] = i1;
    }
  }
  return B.geometry();
}
// a moss cushion: a lumpy low dome
function cushionGeo(green) {
  const B = GB(PSPEC), NA = 8, NB = 2, rows = [];
  for (let b = 0; b <= NB; b++) {
    const ph = (b / NB) * Math.PI * 0.5, row = [];
    for (let a = 0; a <= NA; a++) { const th = (a / NA) * Math.PI * 2, r = 1 + 0.16 * Math.sin(a * 2 + b); row.push(B.v(Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * 0.55 - 0.08, Math.sin(ph) * Math.sin(th) * r, { aCol: rgb(green, 0.8 + 0.3 * Math.cos(ph)), aK: [0, 6, 0], aUv: [0, 0] })); }
    rows.push(row);
  }
  for (let b = 0; b < NB; b++) for (let a = 0; a < NA; a++) B.quad(rows[b][a], rows[b + 1][a], rows[b + 1][a + 1], rows[b][a + 1]);
  return B.geometry();
}

// ---------- creatures ----------
const CSPEC = { aCol: 3, aB: 4 };
// a giant honeybee or a giant hornet in flight: forward +Z, up +Y, legs tucked; wings are a separate blur fan
function insectGeo(o) {
  const B = GB(CSPEC), S = o.sides || 10;
  const ring = (z, r, c, kind, t, w = 1, yc = 0, ry) => ({ z, rx: r, ry: ry ?? r * 0.94, yc, a: { aCol: c, aB: [t, t, kind, w] } });
  const ab = o.abdomen.map(([z, r, c], i) => ring(z, r, c, 1, i / (o.abdomen.length - 1), o.bands, -0.02 - 0.09 * (i / (o.abdomen.length - 1))));
  loftZ(B, ab, S);
  loftZ(B, o.thorax.map(([z, r]) => ring(z, r, o.fur, 2, 0, 0, 0.03)), S);
  loftZ(B, o.head.map(([z, r, ry]) => ring(z, r, o.headCol, 0, 0, 0, -0.02, ry)), 8);
  const hz = o.head[1][0], hr = o.head[1][1];
  for (const sx of [-1, 1]) {
    loftZ(B, [[hz - 0.05, 0.03], [hz, 0.07], [hz + 0.06, 0.06], [hz + 0.1, 0.02]].map(([z, r]) => ({ z, rx: r * 0.7, ry: r * 1.25, xc: sx * hr * 0.82, yc: 0.02, a: { aCol: o.eye, aB: [0, 0, 4, 0] } })), 6);
    // antenna
    tube(B, [V3(sx * 0.05, 0.05, hz + 0.08), V3(sx * 0.11, 0.13, hz + 0.2), V3(sx * 0.18, 0.05, hz + 0.4)], () => 0.02, 3, () => ({ aCol: o.legs, aB: [0, 0, 0, 0] }));
    // legs: tucked and trailing
    o.legZ.forEach((z, l) => {
      const L = o.legLen * (1 + 0.25 * l), dr = o.dangle;
      tube(B, [V3(sx * 0.09, -0.12, z), V3(sx * (0.2 + 0.03 * l), -0.25 - dr * 0.3, z - 0.08 * L), V3(sx * (0.17 + 0.03 * l), -0.3 - dr, z - 0.42 * L), V3(sx * 0.15, -0.27 - dr * 1.25, z - 0.72 * L)],
        (t) => 0.034 - 0.014 * t, 3, () => ({ aCol: o.legs, aB: [0, 0, 0, 0] }));
      if (o.pollen && l === 2) loftZ(B, [[-0.07, 0.02], [-0.03, 0.065], [0.03, 0.065], [0.07, 0.02]].map(([dz, r]) => ({ z: z - 0.42 * L + dz, rx: r, ry: r * 1.2, xc: sx * 0.235, yc: -0.3 - dr, a: { aCol: o.pollen, aB: [0, 0, 2, 0] } })), 6);
    });
  }
  return B.geometry();
}
// flying bees: forward +Z, up +Y. The near model has a round six-sided abdomen, thorax and head, six trailing legs as thin
// ribbons, pollen loads and a slip of wing blur; the far one is a rounded five-sided body with no wings at all (a dark speck).
// (The swarm off the north horn has a model of its own, beeMidGeo, and its own shading: FLY_FS uShade, uWing, uFace.)
function beeHiGeo() {
  const B = GB({ aP: 1 });
  const body = (rings, part, sides, tail, nose) => {
    const st = [];
    for (const [z, r, yc] of rings) { st.push(B.count()); for (let j = 0; j < sides; j++) { const a = j * 2 * Math.PI / sides + 0.3; B.v(Math.sin(a) * r, yc + Math.cos(a) * r * 0.92, z, { aP: [part] }); } }
    for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < sides; j++) B.quad(st[k] + j, st[k + 1] + j, st[k + 1] + (j + 1) % sides, st[k] + (j + 1) % sides);
    if (tail !== undefined) { const t = B.v(0, rings[0][2] - 0.02, tail, { aP: [part] }); for (let j = 0; j < sides; j++) B.tri(st[0] + (j + 1) % sides, st[0] + j, t); }
    if (nose !== undefined) { const L = rings.length - 1, t = B.v(0, rings[L][2] - 0.02, nose, { aP: [part] }); for (let j = 0; j < sides; j++) B.tri(st[L] + j, st[L] + (j + 1) % sides, t); }
  };
  body([[-0.63, 0.075, -0.1], [-0.55, 0.14, -0.091], [-0.44, 0.195, -0.077], [-0.3, 0.22, -0.057], [-0.14, 0.2, -0.035], [0.02, 0.1, -0.005]], 0, 10, -0.7);
  body([[0.05, 0.11, 0.02], [0.12, 0.19, 0.027], [0.24, 0.215, 0.03], [0.36, 0.125, 0.02]], 1, 8);
  body([[0.375, 0.1, 0], [0.43, 0.15, -0.008], [0.5, 0.135, -0.012]], 1, 6, undefined, 0.57);
  const ribbon = (pts, sx, w) => {
    let prev = null;
    pts.forEach((q, k) => {
      const ww = w * (1 - 0.4 * k / (pts.length - 1)), a = B.v(sx * (q[0] - ww), q[1] - ww * 0.7, q[2], { aP: [4] }), b = B.v(sx * (q[0] + ww), q[1] + ww * 0.7, q[2], { aP: [4] });
      if (prev) B.quad(prev[0], prev[1], b, a);
      prev = [a, b];
    });
  };
  for (const sx of [-1, 1]) {
    ribbon([[0.1, -0.14, 0.14], [0.2, -0.3, -0.02], [0.175, -0.41, -0.3], [0.14, -0.4, -0.55]], sx, 0.026);     // hind leg, trailing
    ribbon([[0.11, -0.15, 0.22], [0.22, -0.29, 0.1], [0.2, -0.37, -0.12]], sx, 0.022);
    const w = [[0.07, 0.17, 0.22], [0.44, 0.36, 0.2], [0.48, 0.2, -0.05], [0.3, 0.07, -0.2]].map((q) => B.v(q[0] * sx, q[1], q[2], { aP: [2] }));
    B.tri(w[0], w[1], w[2]); B.tri(w[0], w[2], w[3]);
    // the pollen load on the hind leg: a small lozenge (scaled away where a bee carries none)
    const pc = [0.185 * sx, -0.38, -0.17], pr = 0.07, top = B.v(pc[0], pc[1] + pr * 1.3, pc[2], { aP: [3] }), bot = B.v(pc[0], pc[1] - pr * 1.3, pc[2], { aP: [3] }), eq = [];
    for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2 + 0.6; eq.push(B.v(pc[0] + Math.cos(a) * pr, pc[1], pc[2] + Math.sin(a) * pr * 1.4, { aP: [3] })); }
    for (let j = 0; j < 4; j++) { B.tri(top, eq[j], eq[(j + 1) % 4]); B.tri(bot, eq[(j + 1) % 4], eq[j]); }
  }
  return B.geometry();
}
function beeLoGeo(speck) {
  const B = GB({ aP: 1 }), rings = speck ? [[-0.46, 0.17, -0.08, 0], [-0.06, 0.215, -0.03, 0], [0.38, 0.15, 0.01, 1]] : [[-0.5, 0.15, -0.085, 0], [-0.28, 0.22, -0.055, 0], [-0.03, 0.1, -0.01, 0], [0.2, 0.215, 0.03, 1], [0.4, 0.125, 0.01, 1]], st = [], SD = speck ? 4 : 5;
  for (const [z, r, yc, part] of rings) { st.push(B.count()); for (let j = 0; j < SD; j++) { const a = j * 2 * Math.PI / SD + 0.3; B.v(Math.sin(a) * r, yc + Math.cos(a) * r * 0.92, z, { aP: [part] }); } }
  for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < SD; j++) B.quad(st[k] + j, st[k + 1] + j, st[k + 1] + (j + 1) % SD, st[k] + (j + 1) % SD);
  const tail = B.v(0, -0.11, -0.69, { aP: [0] }), nose = B.v(0, -0.01, 0.57, { aP: [1] }), L = rings.length - 1;
  for (let j = 0; j < SD; j++) { B.tri(st[0] + (j + 1) % SD, st[0] + j, tail); B.tri(st[L] + j, st[L] + (j + 1) % SD, nose); }
  return B.geometry();
}
// the swarm's bee, seen from 20 m to 300 m: rounder than the speck (a six-sided abdomen, thorax and head, so the bands and
// the tawny fur have a surface to lie on) and winged: a broad blur each side, raised and swept, to catch the sun
function beeMidGeo() {
  const B = GB({ aP: 1 }), SD = 6;
  const body = (rings, part, tail, nose) => {
    const st = [];
    for (const [z, r, yc] of rings) { st.push(B.count()); for (let j = 0; j < SD; j++) { const a = j * 2 * Math.PI / SD + 0.3; B.v(Math.sin(a) * r, yc + Math.cos(a) * r * 0.92, z, { aP: [part] }); } }
    for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < SD; j++) B.quad(st[k] + j, st[k + 1] + j, st[k + 1] + (j + 1) % SD, st[k] + (j + 1) % SD);
    if (tail !== undefined) { const t = B.v(0, rings[0][2] - 0.02, tail, { aP: [part] }); for (let j = 0; j < SD; j++) B.tri(st[0] + (j + 1) % SD, st[0] + j, t); }
    if (nose !== undefined) { const L = rings.length - 1, t = B.v(0, rings[L][2] - 0.02, nose, { aP: [part] }); for (let j = 0; j < SD; j++) B.tri(st[L] + j, st[L] + (j + 1) % SD, t); }
  };
  body([[-0.56, 0.12, -0.09], [-0.36, 0.225, -0.065], [-0.13, 0.2, -0.032], [0.02, 0.1, -0.005]], 0, -0.7);
  body([[0.05, 0.12, 0.02], [0.2, 0.22, 0.03], [0.36, 0.13, 0.02]], 1);
  body([[0.385, 0.11, 0], [0.46, 0.15, -0.008]], 1, undefined, 0.56);
  for (const sx of [-1, 1]) {
    const w = [[0.05, 0.15, 0.22], [0.5, 0.4, 0.27], [0.7, 0.33, 0.08], [0.62, 0.2, -0.2], [0.26, 0.09, -0.26]].map((q) => B.v(q[0] * sx, q[1], q[2], { aP: [2] }));
    for (let k = 1; k < 4; k++) B.tri(w[0], w[k], w[k + 1]);
  }
  return B.geometry();
}
// the bee-line's far bee (added): the swarm's bee as beeMidGeo makes it, with a cream pollen load under each flank (part 3,
// scaled away on a bee that carries none): two small four-sided lozenges
function beeLineGeo() {
  const g0 = beeMidGeo(), pos = Array.from(g0.attributes.position.array), ap = Array.from(g0.attributes.aP.array), ix = Array.from(g0.index.array);
  for (const sx of [-1, 1]) {
    const n = pos.length / 3, cx = 0.175 * sx, cy = -0.26, cz = -0.16, r = 0.085;
    pos.push(cx, cy + r * 1.25, cz + r * 0.3, cx + r * sx, cy - r * 0.8, cz + r * 1.2, cx - r * 0.9 * sx, cy - r * 0.8, cz + r * 0.2, cx + r * 0.2 * sx, cy - r * 0.6, cz - r * 1.5);
    ap.push(3, 3, 3, 3);
    ix.push(n, n + 1, n + 2, n, n + 2, n + 3, n, n + 3, n + 1, n + 1, n + 3, n + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(ap, 1));
  g.setIndex(ix); g.computeVertexNormals();
  return g;
}
// wing blur: two sectors per side about the body axis; root at (0, y0, z0), reach L
function fanGeo(L, y0, z0, a0 = -30, a1 = 68) {
  const B = GB({ aUv: 2 }), NS = 7;
  for (const sx of [-1, 1]) for (const back of [0, 0.5]) {
    const c = B.v(sx * 0.05, y0, z0, { aUv: [0, 0] }), rim = [];
    for (let k = 0; k <= NS; k++) {
      const t = k / NS, a = (a0 + (a1 - a0) * t) * DEG;
      rim.push(B.v(sx * (0.05 + Math.cos(a) * L), y0 + Math.sin(a) * L, z0 - back * L * (0.5 + 0.3 * Math.sin(a)), { aUv: [1, t * 2 - 1] }));
    }
    for (let k = 0; k < NS; k++) B.tri(c, rim[k], rim[k + 1]);
  }
  return B.geometry();
}
// the oriental honey buzzard: 56 m span, 26 m long; forward +Z, up +Y. Wings flap in the shader (kind 3).
function buzzardGeo(C) {
  const B = GB(CSPEC);
  const bodyRing = (z, rx, ry, yc, c) => ({ z, rx, ry, yc, a: { aCol: c, aB: [0, 0, 5, 0] } });
  const st0 = B.count();
  loftZ(B, [bodyRing(-9.6, 0.3, 0.2, 0.42, C.top), bodyRing(-7.4, 0.95, 0.6, 0.36, C.top), bodyRing(-4.6, 1.6, 1.2, 0.2, C.top), bodyRing(-1.5, 2.3, 1.9, 0, C.top), bodyRing(2.5, 3.1, 2.7, -0.2, C.top), bodyRing(6, 2.5, 2.3, 0, C.top), bodyRing(8.4, 1.45, 1.35, 0.4, C.head),
    bodyRing(9.6, 1.55, 1.45, 0.62, C.head), bodyRing(10.8, 1.72, 1.6, 0.85, C.head), bodyRing(11.9, 1.3, 1.25, 0.8, C.head), bodyRing(12.7, 0.7, 0.72, 0.55, C.cere), bodyRing(13.3, 0.4, 0.5, 0.25, C.beak), bodyRing(13.95, 0.07, 0.12, -0.5, C.beak)], 10);
  // pale, barred belly: recolour the lower vertices
  for (let i = st0; i < B.count(); i++) { const y = B.pos[i * 3 + 1], z = B.pos[i * 3 + 2]; if (y < 0.35 && z < 8) { const bar = 1; B.att.aCol[i * 3] = C.pale[0] * bar; B.att.aCol[i * 3 + 1] = C.pale[1] * bar; B.att.aCol[i * 3 + 2] = C.pale[2] * bar; } }
  for (const sx of [-1, 1]) {
    loftZ(B, [[10.75, 0.06], [11.1, 0.3], [11.45, 0.06]].map(([z, r]) => ({ z, rx: r * 0.5, ry: r, xc: sx * 1.58, yc: 1.05, a: { aCol: [0.9, 0.62, 0.05], aB: [0, 0, 4, 0] } })), 6);
    // the feet, drawn up under the tail
    loftZ(B, [[-6.6, 0.1], [-5.9, 0.38], [-4.6, 0.42], [-3.6, 0.2]].map(([z, r]) => ({ z, rx: r, ry: r * 0.8, xc: sx * 0.75, yc: -1.05 + 0.1 * (z + 5), a: { aCol: [0.8, 0.56, 0.08], aB: [0, 0, 6, 0] } })), 6);
  }
  // the tail: eleven barred feathers fanned from under the rump. The fan is arched (its outer feathers hang lower than the
  // middle ones) and carried a little depressed, so from dead astern it shows as a barred arc with fingered tips, never edge-on.
  for (let j = 0; j < 11; j++) {
    const e = j / 5 - 1, phi = e * 0.7, L = 14.5 * (1 - 0.13 * e * e), sp = Math.sin(phi), cp = Math.cos(phi), prev = [];
    for (let k = 0; k <= 3; k++) {
      const t = k / 3, hw = (k === 0 ? 0.3 : k === 3 ? 0.8 : 1.15) * (1 - 0.15 * Math.abs(e));
      const cx = sp * L * t, cz = -5.6 - cp * L * t, cy = 0.5 - 0.5 * t - 1.9 * t * t - 1.7 * e * e * t + 0.07 * (j & 1);
      // each vane is tilted a little about its own shaft, like slats, so the fan has thickness to the eye
      const a = B.v(cx - cp * hw, cy + 0.16 * hw, cz - sp * hw, { aCol: C.top, aB: [0, 0.16 + 0.8 * t, 3, 1] }), b = B.v(cx + cp * hw, cy - 0.16 * hw, cz + sp * hw, { aCol: C.top, aB: [0, 0.16 + 0.8 * t, 3, 1] });
      if (k > 0) B.quad(prev[0], prev[1], b, a);
      prev[0] = a; prev[1] = b;
    }
  }
  // wings
  const SPAN = 25.6, SH = 2.4, NSP = 12, NCH = 4, S_HAND = 0.7;
  const le = (s) => 5.2 + 2.2 * Math.sin(s * 2.3) - 2.6 * s * s, chord = (s) => 10.2 - 1.6 * s - 1.2 * s * s;
  for (const sx of [-1, 1]) {
    const q = (a, b, c, d) => { if (sx > 0) B.quad(a, d, c, b); else B.quad(a, b, c, d); };
    const rows = [];
    for (let i = 0; i <= NSP; i++) {
      const s = (i / NSP) * S_HAND, row = [];
      for (let j = 0; j <= NCH; j++) { const c = j / NCH; row.push(B.v(sx * (SH + s * SPAN), 0.7 + 0.5 * Math.sin(c * 3.1) * (1 - s), le(s) - chord(s) * c, { aCol: C.top, aB: [s, c, 3, sx] })); }
      rows.push(row);
    }
    for (let i = 0; i < NSP; i++) for (let j = 0; j < NCH; j++) q(rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]);
    // six fingered primaries, then the inner primaries as one blade
    for (let f = 0; f < 6; f++) {
      const c0 = f / 6 * 0.62, c1 = c0 + 0.085, splay = (0.5 - f * 0.26), L = SPAN * (0.3 - 0.012 * f * f), prev = [];
      for (let k = 0; k <= 4; k++) {
        const t = k / 4, s = S_HAND + (1 - S_HAND) * t, w = (c1 - c0) * chord(S_HAND) * (1 - 0.55 * t * t);
        const zc = le(S_HAND) - chord(S_HAND) * (c0 + c1) / 2 + Math.sin(splay) * L * t * 0.75, x = SH + S_HAND * SPAN + Math.cos(splay * 0.6) * L * t;
        const a = B.v(sx * x, 0.7 + 0.35 * t, zc + w / 2, { aCol: C.top, aB: [s, c0, 3, sx] }), b = B.v(sx * x, 0.7 + 0.35 * t, zc - w / 2, { aCol: C.top, aB: [s, c1 + 0.1, 3, sx] });
        if (k > 0) q(prev[0], prev[1], b, a);
        prev[0] = a; prev[1] = b;
      }
    }
    const prev = [];
    for (let k = 0; k <= 3; k++) {
      const t = k / 3, s = S_HAND + 0.2 * t, x = SH + s * SPAN, z0 = le(S_HAND) - chord(S_HAND) * (0.62 + 0.06 * t), z1 = le(S_HAND) - chord(S_HAND) * (1 - 0.3 * t * t);
      const a = B.v(sx * x, 0.7, z0 + 0.6 * t, { aCol: C.top, aB: [s, 0.62, 3, sx] }), b = B.v(sx * x, 0.7, z1 + 2.2 * t, { aCol: C.top, aB: [s, 1, 3, sx] });
      if (k > 0) q(prev[0], prev[1], b, a);
      prev[0] = a; prev[1] = b;
    }
  }
  return B.geometry();
}
// a yellow-rumped honeyguide, perched: forward +Z, feet at the origin, 6 m long
function honeyguideGeo() {
  const B = GB(CSPEC), olive = [0.2, 0.19, 0.12], paleB = [0.5, 0.48, 0.4], yel = [0.85, 0.6, 0.06];
  const r = (z, rx, ry, yc, c) => ({ z, rx, ry, yc, a: { aCol: c, aB: [0, 0, 2, 0] } });
  loftZ(B, [r(-2.6, 0.25, 0.2, 1.3, olive), r(-1.6, 0.8, 0.75, 1.6, yel), r(-0.3, 1.25, 1.2, 2.0, olive), r(1.0, 1.15, 1.1, 2.4, olive), r(1.9, 0.75, 0.8, 3.0, olive), r(2.5, 0.72, 0.72, 3.3, olive), r(3.0, 0.4, 0.4, 3.25, yel), r(3.6, 0.05, 0.07, 3.1, [0.08, 0.07, 0.06])], 8);
  for (let i = 0; i < B.count(); i++) { const y = B.pos[i * 3 + 1], z = B.pos[i * 3 + 2]; if (y < 1.5 + 0.35 * z && z > -1.2 && z < 2.6) { B.att.aCol[i * 3] = paleB[0]; B.att.aCol[i * 3 + 1] = paleB[1]; B.att.aCol[i * 3 + 2] = paleB[2]; } }
  // tail and folded wings as flat blades
  const blade = (p0, p1, w0, w1, nx, c) => { const a = B.v(p0.x - nx * w0, p0.y, p0.z, { aCol: c, aB: [0, 0, 0, 0] }), b = B.v(p0.x + nx * w0, p0.y, p0.z, { aCol: c, aB: [0, 0, 0, 0] }), d = B.v(p1.x - nx * w1, p1.y, p1.z, { aCol: c, aB: [0, 0, 0, 0] }), e = B.v(p1.x + nx * w1, p1.y, p1.z, { aCol: c, aB: [0, 0, 0, 0] }); B.quad(a, b, e, d); };
  blade(V3(0, 1.45, -2.2), V3(0, 0.75, -5.2), 0.5, 0.75, 1, [0.12, 0.11, 0.08]);
  for (const sx of [-1, 1]) {
    blade(V3(sx * 1.2, 2.3, 0.6), V3(sx * 0.8, 1.5, -3.2), 0.0, 0.0, 1, olive);
    const a = B.v(sx * 1.22, 2.9, 0.9, { aCol: olive, aB: [0, 0, 0, 0] }), b = B.v(sx * 1.3, 1.5, 0.4, { aCol: [0.1, 0.1, 0.08], aB: [0, 0, 0, 0] }), c = B.v(sx * 0.7, 1.35, -3.4, { aCol: [0.1, 0.1, 0.08], aB: [0, 0, 0, 0] }), d = B.v(sx * 0.95, 2.5, -1.6, { aCol: olive, aB: [0, 0, 0, 0] });
    B.quad(a, b, c, d);
    loftZ(B, [[2.35, 0.03], [2.5, 0.13], [2.65, 0.03]].map(([z, rr]) => ({ z, rx: rr * 0.5, ry: rr, xc: sx * 0.66, yc: 3.45, a: { aCol: [0.02, 0.02, 0.02], aB: [0, 0, 4, 0] } })), 5);
    tube(B, [V3(sx * 0.4, 1.0, 0.2), V3(sx * 0.45, 0.3, 0.4), V3(sx * 0.45, 0, 0.9)], () => 0.09, 3, () => ({ aCol: [0.1, 0.09, 0.08], aB: [0, 0, 0, 0] }));
  }
  return B.geometry();
}
// our own right antenna in the camera's space, base at the origin: a short scape up and forward, an elbow, then a ringed
// flagellum curving out to the side and drooping a little at its tip (the left one is its mirror image)
function antennaGeo() {
  // elbowed like a bee's: a short dark scape up and out of the fur, then the ringed flagellum forward and outward, drooping at its tip
  const B = GB(CSPEC), K = [[0, 0, 0], [0.03, 0.045, -0.07], [0.063, 0.082, -0.14], [0.128, 0.11, -0.2], [0.2, 0.121, -0.25], [0.27, 0.12, -0.3], [0.335, 0.106, -0.34], [0.385, 0.08, -0.365]].map((q) => V3(q[0], q[1], q[2]));
  const cv = new THREE.CatmullRomCurve3(K, false, 'centripetal'), pts = cv.getPoints(44);
  tube(B, pts, (t) => 1.25 * (t < 0.24 ? 0.0115 : 0.0098 - 0.0036 * t) * (1 + 0.1 * Math.sin(Math.max(0, t - 0.24) * 14 * 6.2832 + 1.57) * (t < 0.24 ? 0 : 1)), 8,
    (t, ar) => ({ aCol: t < 0.24 ? [0.15, 0.088, 0.04] : [0.25 - 0.05 * t, 0.15 - 0.035 * t, 0.063 - 0.014 * t], aB: [t, ar, 0, 0] }));
  const c = B.v(pts[44].x, pts[44].y, pts[44].z, { aCol: [0.17, 0.1, 0.045], aB: [1, 0, 0, 0] }), r0 = B.count() - 1 - 9;      // close the tip
  for (let j = 0; j < 8; j++) B.tri(c, r0 + j, r0 + j + 1);
  return B.geometry();
}
// The top of our own thorax, centred on the origin (camera space: x to the right, y up, z toward us), as two geometries:
// the skin, a low dome of amber fur with a darker saddle across it, and the fringe, some 3,600 hairs standing up and
// combed back out of it, each a tapered card turned to the eye and drawn soft-edged (blended), so that the edge of the
// body against the picture is a lit golden fuzz and never a row of dark spikes.
const THX = { RX: 0.47, RY: 0.25, RZ: 0.3 };
async function thoraxGeo(ctx, r) {
  const { RX, RY, RZ } = THX, NA = 36, NB = 10, eye = V3(0, 0.83, 1.0), n = V3(0, 0, 0), d = V3(0, 0, 0), w = V3(0, 0, 0), p = V3(0, 0, 0), q = V3(0, 0, 0);
  const amber = [0.46, 0.245, 0.045];
  const saddle = (x, z) => { const b = clamp(1 - Math.abs(z) / 0.075, 0, 1) * clamp(1.15 - Math.pow(Math.abs(x) / 0.36, 2), 0, 1); return b * b * (3 - 2 * b); };
  const Sk = GB(CSPEC);
  for (let j = 0; j <= NB; j++) for (let i = 0; i <= NA; i++) {
    const el = (0.06 + 0.94 * j / NB) * Math.PI / 2, az = i / NA * Math.PI * 2, x = Math.cos(el) * Math.cos(az), z = Math.cos(el) * Math.sin(az), y = Math.sin(el);
    Sk.v(x * RX, y * RY, z * RZ, { aCol: amber, aB: [j / NB, i / NA, 1, 0.8 * saddle(x * RX, z * RZ)] });
  }
  for (let j = 0; j < NB; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + NA + 1; Sk.quad(a, a + 1, b + 1, b); }
  const Fu = GB(CSPEC);
  for (let k = 0; k < 5200; k++) {
    const el = Math.asin(r.range(0.3, 1)), az = r.range(0, 6.2832), x = Math.cos(el) * Math.cos(az), z = Math.cos(el) * Math.sin(az), y = Math.sin(el);
    if (z * RZ > 0.12) continue;                        // (the near side is under the bottom edge of every frame)
    p.set(x * RX, y * RY, z * RZ); n.set(x / RX, y / RY, z / RZ).normalize();
    const len = r.range(0.026, 0.052), tone = r.range(0.8, 1.2), sd = saddle(p.x, p.z), u1 = r(), u2 = r();
    const dark = u1 < 0.8 * sd ? 0.3 : u2 < 0.1 ? 0.62 : 1;
    d.copy(n).multiplyScalar(0.75).add(q.set(r.range(-0.25, 0.25), 0.3, 0.42 + r.range(-0.15, 0.15))).normalize();
    w.subVectors(eye, p).cross(d).normalize().multiplyScalar(r.range(0.005, 0.008));
    const col = [amber[0] * tone * dark, amber[1] * tone * dark, amber[2] * tone * dark];
    p.addScaledVector(n, -0.004); q.copy(p).addScaledVector(d, len);
    const a = Fu.v(p.x - w.x, p.y - w.y, p.z - w.z, { aCol: col, aB: [0, 0, 2, 0] }), b = Fu.v(p.x + w.x, p.y + w.y, p.z + w.z, { aCol: col, aB: [0, 1, 2, 0] });
    const c = Fu.v(q.x + w.x * 0.45, q.y + w.y * 0.45, q.z + w.z * 0.45, { aCol: col, aB: [1, 1, 2, 0] }), e = Fu.v(q.x - w.x * 0.45, q.y - w.y * 0.45, q.z - w.z * 0.45, { aCol: col, aB: [1, 0, 2, 0] });
    Fu.quad(a, b, c, e);
    if ((k & 1023) === 1023) await ctx.yield();
  }
  const skin = Sk.geometry(); await ctx.yield();
  return { skin, fur: Fu.geometry() };
}

export default {
  id: 'honey-cliff',
  name: 'The Honey Cliff',
  category: 'wilderness',
  weirdness: 0.05,
  media: ['air', 'tiny'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const vr = rng.fork('visit');
    const scene = new THREE.Scene();
    const sstep = (a, b, x) => smoothstep(a, b, x);

    // ---------- which visit is this ----------
    const sn = typeof ctx.seed === 'number' ? ctx.seed : hashSeed(String(ctx.seed));
    let look = ['autumn', 'dawn', 'sea', 'clear', 'rain'][Math.abs(Math.floor(sn)) % 5];
    if (vary.hour === 'dawn' || vary.hour === 'golden' || vary.hour === 'night') look = 'dawn';
    else if (vary.hour === 'day' && look === 'dawn') look = 'clear';
    const dawn = look === 'dawn', autumn = look === 'autumn', rain = look === 'rain', sea = look === 'sea';
    const hornetsHere = vr.chance(0.7), guideHere = vr.chance(0.5), rare = !!vary.rare, density = vary.density ?? 1;
    const sunAz = vr.range(-5, 5) * DEG, layout = vr.fork('layout');

    // ---------- light ----------
    const sunDir = (dawn ? V3(-0.33, 0.21, 0.92) : V3(-0.29, 0.53, 0.8)).applyAxisAngle(V3(0, 1, 0), sunAz).normalize();
    const hazeCol = col(dawn ? '#d8b3ad' : sea ? '#b3c7e3' : rain ? '#aebfd4' : autumn ? '#c3d2e2' : '#b6cde9');
    const sky = makeSky({
      rng, preset: dawn ? 'dawn' : 'day', sunDirection: sunDir,
      zenith: dawn ? '#35568f' : rain ? '#3d6187' : sea ? '#27548a' : '#2E5C8A', mid: dawn ? '#8f8fb8' : rain ? '#7f9dbd' : sea ? '#6396cf' : '#6f9fd0', horizon: dawn ? '#f0c4ae' : rain ? '#c9d6e2' : sea ? '#c3d6ec' : '#DCE8F2', ground: hazeCol,
      clouds: rain ? { coverage: 0.52, lit: '#eef0f2', shade: '#8494ab' } : false, clouds2: { opacity: dawn ? 0.5 : 0.3, coverage: 0.45, lit: dawn ? '#ffd0b8' : '#ffffff' },
    });
    scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(hazeCol.clone().multiplyScalar(0.92), dawn ? 0.00036 : rain ? 0.00043 : 0.00033);
    const rig = makeLightRig(sky, { intensity: 0.9 });
    scene.add(rig.object);
    await ctx.yield();

    // ---------- the hero: cliff, combs, curtains ----------
    const hero = await buildHero(ctx, {
      palette: ['#D01F2B', '#2E5C8A', '#b78658', '#F2A51E', '#1E1712', '#EADBA8', '#DCE8F2'], sunDir: sunDir.toArray(), hour: dawn ? 'dawn' : 'morning', season: autumn ? 'autumn' : 'spring', weather: rain ? 'rain' : 'clear',
      sunColor: dawn ? '#ffd2b4' : '#fff3df', sunIntensity: dawn ? 2.0 : rain ? 2.15 : 2.5, skyColor: dawn ? '#7f8bc6' : '#7b9fca', skyIntensity: dawn ? 0.7 : 0.62, bounceColor: dawn ? '#a895b4' : '#93a4c2',
    });
    scene.add(hero.object);
    const HU = hero.uniforms, A = hero.anchors;
    HU.uBeeDark.value.multiplyScalar(0.85);                          // curtains dark umber against the gold
    if (rain) HU.uCalm.value = 0.3;
    await ctx.yield();

    // shared uniforms: my materials are lit by exactly the hero's light
    const U = {
      uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uBounceCol: HU.uBounceCol, uHazeCol: { value: hazeCol },
      uTime: { value: 0 }, uAir: { value: new THREE.Vector4(sea ? 0.00095 : 0.001, dawn ? 0.6 : 1, rain ? 1 : 0, 450) }, uSea: HU.uSea,
    };
    if (sea) HU.uSea.value.set(0.8, 0.84, 0.9, 0.9);
    const mat = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra }, vertexShader: vs, fragmentShader: fs, side: THREE.DoubleSide, fog: true, ...o,
    });
    const pale = col(PAL[5]), beeDark = col(PAL[4]).multiplyScalar(1.5).add(new THREE.Color(0.006, 0.0045, 0.004));

    // ---------- the route ----------
    const FT = A.flyThrough;
    const d0 = V3(A.entry.d0[0], 0, A.entry.d0[1]).normalize(), r0 = V3(-d0.z, 0, d0.x), UP = V3(0, 1, 0);
    const Y0 = 180, S = V3(A.entry.S[0], Y0, A.entry.S[1]);
    const along = (d, y) => V3(S.x + d0.x * d, y, S.z + d0.z * d);
    const pts = [along(0, Y0), along(35, Y0), along(70, Y0), along(104, Y0)];
    for (let i = 0; i < FT.length; i++) pts.push(FT[i].clone());
    const path = makePath(pts, { samples: 640 });
    await ctx.yield();
    const LEN = path.length, duration = clamp(Math.round(LEN / 28), 42, 50);
    const P_ = V3(0, 0, 0), T_ = V3(0, 0, 0);
    // first u at or after u0 where the path's x has passed x (going in direction dir)
    const uWhereX = (x, u0, dir) => { for (let u = u0; u <= 1; u += 0.0005) { path.pointAt(u, P_); if ((P_.x - x) * dir >= 0) return u; } return 1; };
    // nearest approach of the path to a point, searched from u0 on
    const uNearest = (pt, u0) => { let best = Infinity, bu = u0; for (let u = u0; u <= 1; u += 0.0005) { const d = path.pointAt(u, P_).distanceToSquared(pt); if (d < best) { best = d; bu = u; } } return bu; };
    // the beats of the route: abeam the torn comb (uSix), the run north along the upper tier, the swing out over the gorge
    // (from uTiers), the far turn (uFar is its end, where the run back in begins), the ladder, then south along the curtains
    const RT = A.route, uSix = uNearest(FT[RT.comb6], 0), uTiers = uNearest(FT[RT.tiers], uSix), uFar = uNearest(FT[RT.far], uTiers);
    await ctx.yield();
    // the close pass keeps the timing it has always had: its beats are given on the old line's scale (uo), anchored on its first point
    const uPass = uNearest(FT[RT.pass], uFar), uo = (x) => uPass + (x - 0.626) * 1499.87 / LEN, uLadder = uo(0.5914);
    // (the close pass is the one this world has always flown: a place on it that was at u on the 1,500 m line is at uo(u) now)
    await ctx.yield();
    const uComb = [0, 1, 2, 3, 4, 5].map((i) => uWhereX(A.combs[i].center.x, uLadder, -1));
    await ctx.yield();
    const uTear = uNearest(A.tear.position, uComb[4]), uMouth = uNearest(A.cleftMouth, uTear);
    const uGapIn = uWhereX(-3, uComb[2], -1), uGapOut = uWhereX(-78, uComb[3], -1), uHornet = uWhereX(-104, uGapOut, -1);
    // station frame of the bough: P(station, angle from up clockwise looking forward, radius)
    const bp = (st, angDeg, rad, out = V3(0, 0, 0)) => out.copy(S).addScaledVector(d0, st).addScaledVector(r0, Math.sin(angDeg * DEG) * rad).addScaledVector(UP, Math.cos(angDeg * DEG) * rad);

    // the defence waves, keyed to u: the buzzard's sweep, the wave that breaks toward us, the hornets' lunges, the tear
    const c4x = A.combs[3].center.x, c5 = A.combs[4].center;
    // a wave that leaves (x0, 194) so that its front is `lead` metres ahead of us (to the south) when we are at u
    const meet = (u, lead, x0) => ({ u: u - Math.max(0.5, Math.abs(path.pointAt(u, P_).x - lead - x0) / 45) / duration, x: x0, y: 194 });
    const waves = [
      meet(uo(0.7), 12, c4x),                                       // from comb four: its front is 12 m ahead of us abeam comb three
      { u: uHornet - 0.75 / duration, x: c5.x + 10, y: 190 }, { u: uHornet + 1.1 / duration, x: c5.x - 8, y: 183 }, { u: uTear - 1.6 / duration, x: A.tear.position.x, y: A.tear.position.y },
      meet(uo(0.735), 4, c4x),                                          // a second front breaks through us abeam comb three
      meet(uComb[1] - 0.03, 16, A.combs[2].center.x),               // from comb three across comb two as we cut in toward it
    ];
    // (the waves that run under the buzzard on the first pass are added once its line is known)
    hero.setSchedule(waves, duration);
    hero.setProgress(0);
    await ctx.yield();

    // ---------- build-time check: nothing this world builds stands within 6 m of the camera line ----------
    // (the hero checks its own solids: hero.clearance). Every big mesh of the world is tested triangle by triangle.
    const clearance = { least: Infinity, what: '', hero: hero.clearance };
    scene.userData.clearance = clearance;
    const pathPts = [], pathBox = new THREE.Box3();
    for (let i = 0; i <= 420; i++) { const q = path.pointAt(i / 420); pathPts.push(q); pathBox.expandByPoint(q); }
    pathBox.expandByScalar(8);
    const checkClear = async (geo, what, from = 0) => {
      const pa = geo.attributes.position.array, ix = geo.index.array, tri = new THREE.Triangle(), cp = V3(0, 0, 0), bb = new THREE.Box3();
      let least = Infinity;
      for (let t = 0; t < ix.length; t += 3) {
        if (((t / 3) & 15) === 15) await ctx.yield();
        tri.a.fromArray(pa, ix[t] * 3); tri.b.fromArray(pa, ix[t + 1] * 3); tri.c.fromArray(pa, ix[t + 2] * 3);
        bb.makeEmpty(); bb.expandByPoint(tri.a); bb.expandByPoint(tri.b); bb.expandByPoint(tri.c);
        if (!bb.intersectsBox(pathBox)) continue;
        bb.expandByScalar(8);
        for (let i = from; i < pathPts.length; i++) { const q = pathPts[i]; if (!bb.containsPoint(q)) continue; tri.closestPointToPoint(q, cp); const d = cp.distanceTo(q); if (d < least) least = d; }
      }
      clearance[what] = Math.round(least * 10) / 10;
      if (least < clearance.least) { clearance.least = least; clearance.what = what; }
      if (least < 5.5) console.warn('honey-cliff: ' + what + ' is ' + least.toFixed(1) + ' m from the camera line');
    };

    // ---------- the mountain round the slab (the hero's own rock) ----------
    const rockMat = hero.rockMaterial([hazeCol.r * 0.94, hazeCol.g * 0.94, hazeCol.b * 0.94, sea ? 0.001 : 0.0011]);
    {
      const profZ = (x, y) => {
        const P = hero.profileAt(clamp(x, -330, 330)), L = P[P.length - 1];
        if (y <= P[0][1]) return P[0][0] + (P[0][1] - y) * 0.5;
        if (y >= L[1]) return L[0] - (y - L[1]) * 0.42;
        for (let k = 0; k < P.length - 1; k++) if (y <= P[k + 1][1]) return lerp(P[k][0], P[k + 1][0], (y - P[k][1]) / Math.max(1e-3, P[k + 1][1] - P[k][1]));
        return L[0];
      };
      const _bdw = [0, 0, 0, 0], _wpn = [];
      // At the north horn, where the hairpin passes, the mountain is the slab's own face carried on: it comes out through
      // the slab's surface just inside its last column (a ragged contact, not a seam) and swells out of it over some 60 m.
      // No step stands beside the horn: a step would be a flat face end-on to the beds, and its painted courses read as planking.
      const edgeMap = new Map();
      const edgeN = (y) => { const k = Math.round(clamp(y, -70, 300) * 4); let v = edgeMap.get(k); if (v === undefined) { v = hero.wallPoint(330, k / 4, _wpn)[2]; edgeMap.set(k, v); } return v; };
      const massifZ = (x, y) => {
        if (x < 326 && Math.abs(x) <= 330.5 && y >= -70.5 && y <= 300.5) return -150;       // behind the slab, well behind the cap of the cleft (z -89)
        const ex = Math.max(0, Math.abs(x) - 330), ey = y < -70 ? -70 - y : y > 300 ? y - 300 : 0, e = Math.hypot(ex, ey);
        const lift = (y > 300 && ex === 0) ? -8 : 16 + 10 * sstep(222, 262, y) + 8 * sstep(100, 55, y);
        const far = sstep(0, 260, e) * (y < -70 ? 0.45 : 1);
        const beds = 0.9 * hero.bedDisp(x, y, _bdw)[0] * sstep(2, 30, e) * (1 - sstep(500, 1100, e));     // the beds of the slab run on into the mountain
        const z = hero.zBack(x) + profZ(x, y) + lift - 0.42 * Math.min(ex, 700) * sstep(0, 120, ex) - 0.12 * Math.max(0, ex - 700) + far * (130 * noise.fbm2(x / 700 + 5, y / 520, 4) + 55 * (noise.ridged2(x / 240 + 3, y / 900, 3) - 0.45)) + 9 * noise.n2(x / 60, y / 45) * sstep(0, 40, e) + beds;
        if (x < 326) return z;
        const w = (1 - sstep(5, 70, ex)) * (1 - sstep(0, 30, ey));
        return lerp(z, edgeN(y) + (x < 331 ? -5.5 + (x - 327) * 2.33 : 2.5), w);
      };
      const xs = [], ys = [], out = [336], up = [306], dn = [-76];
      for (let x = 336, st = 5; x < 2900; st *= 1.13) { x += st; out.push(x); }
      for (let y = 306, st = 10; y < 1500; st *= 1.25) { y += st; up.push(y); }
      for (let y = -76, st = 12; y > -1150; st *= 1.3) { y -= st; dn.push(y); }
      for (let i = out.length - 1; i >= 0; i--) xs.push(-out[i]);
      xs.push(-330, -220, -110, 0, 110, 220, 322, 327, 330, ...out);
      for (let i = dn.length - 1; i >= 0; i--) ys.push(dn[i]);
      for (let y = -70; y <= 300.01; y += 370 / 50) ys.push(y);
      ys.push(...up);
      const B = GB({ color: 3 });
      for (let i = 0; i < xs.length; i++) {
        const x = xs[i], topK = 0.75 + 0.5 * noise.fbm2(x / 500 + 9, 0.3, 3);
        for (let j = 0; j < ys.length; j++) {
          const y0 = ys[j], y = y0 > 306 ? 306 + (y0 - 306) * topK : y0;
          B.v(x, y, massifZ(x, y0), { color: [0.5 + 0.5 * noise.fbm2(x * 0.008 + 3, y * 0.012, 3), 0.5 + 0.5 * noise.n2(x * 0.05, y * 0.012 + 9), 0] });
        }
        if (i & 1) await ctx.yield();
      }
      const R = ys.length;
      for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < R - 1; j++) { const a = i * R + j, b = a + R; B.quad(a, b, b + 1, a + 1); }
      const mg = B.geometry(); await ctx.yield();
      const m = new THREE.Mesh(mg, rockMat); m.frustumCulled = false; scene.add(m);
      await checkClear(mg, 'massif');
      // the top of the slab: a sloping ledge from its upper edge back into the mountain's face (the mountain stands a few
      // metres behind that edge, and what showed between them from out over the gorge was a black slit)
      const L = GB({ color: 3 }), NL = 132, wpl = [];
      for (let i = 0; i <= NL; i++) {
        const x = -330 + 660 * i / NL; hero.wallPoint(x, 299.6, wpl);
        const tone = 0.5 + 0.5 * noise.fbm2(x * 0.008 + 3, 3.6, 3), a = { color: [tone, 0.5, 0] };
        L.v(x, wpl[1] - 1.2, wpl[2] - 1.5, a); L.v(x, wpl[1] + 10 + 3 * noise.n2(x * 0.05, 1.5), wpl[2] - 13, a); L.v(x, wpl[1] + 46, wpl[2] - 44, a);
        if ((i & 31) === 31) await ctx.yield();
      }
      for (let i = 0; i < NL; i++) for (let j = 0; j < 2; j++) { const a = i * 3 + j, b = a + 3; L.quad(a, b, b + 1, a + 1); }
      scene.add(new THREE.Mesh(L.geometry(), rockMat));
    }
    await ctx.yield();

    // ---------- the gorge: forested slopes, the river thread 1,930 m down, the far wall ----------
    const rv0 = layout.range(0, 6.28), rv1 = layout.range(0, 6.28);
    const riverZ = (x) => 1300 + 240 * Math.sin(x / 1100 + rv0) + 110 * Math.sin(x / 420 + rv1);
    const riverY = (x) => -1790 + 0.03 * x + 0.1 * (Math.hypot(x - 600, 300) + x - 600);
    const landH = (x, z) => {
      const r = riverZ(x), y0 = riverY(x), s = z - r, as = Math.abs(s);
      let y = s < 0 ? lerp(-240, y0, Math.pow(clamp((z - 26) / (r - 26), 0, 1), 0.9)) : y0 + 2900 * (1 - Math.exp(-s / 1500));
      if (z < 26) y += (26 - z) * 1.2;
      y += sstep(60, 700, as) * (260 * noise.fbm2(x / 1000 + 2, z / 1000, 4) + 120 * (noise.ridged2(x / 520, z / 700 + 6, 3) - 0.5)) + 40 * noise.n2(x / 230, z / 230) * sstep(90, 400, as);
      return Math.max(y, y0 - 3);
    };
    const leafA = col(autumn ? '#3d451a' : '#132b19'), leafB = col(autumn ? '#8f7a1f' : '#3a5a27');
    const CAN = {
      uLeafA: { value: leafA }, uLeafB: { value: leafB }, uFleckCol: { value: col(autumn ? '#c8872a' : PAL[0]).multiplyScalar(autumn ? 0.8 : 0.85) }, uRock: { value: col(PAL[2]).multiplyScalar(0.8) },
      uFleck: { value: V3(autumn ? 0.5 : 0.64, autumn ? 0.6 : 0.62, sea || rain ? 0.55 : 0.4) },
      uSpur: { value: 0 }, uSlope: { value: 0 },
    };
    let landMat = null, blobMat = null;
    {
      const NXL = 92, NZ0 = 12, NZL = 70 + NZ0, B = GB({ aRiver: 1 });
      for (let i = 0; i <= NXL; i++) {
        const x = 200 + 5200 * Math.sinh(2.6 * (i / NXL * 2 - 1)) / Math.sinh(2.6);
        for (let j = 0; j <= NZL; j++) { const z = j < NZ0 ? -760 + 800 * j / NZ0 : 40 + 5300 * (Math.exp(2.4 * (j - NZ0) / (NZL - NZ0)) - 1) / (Math.exp(2.4) - 1); B.v(x, landH(x, z), z, { aRiver: [z - riverZ(x)] }); }
        if ((i & 7) === 7) await ctx.yield();
      }
      for (let i = 0; i < NXL; i++) for (let j = 0; j < NZL; j++) { const a = i * (NZL + 1) + j, b = a + NZL + 1; B.quad(a, a + 1, b + 1, b); }
      const g = B.geometry(); await ctx.yield();
      landMat = mat(LAND_VS, LAND_FS, CAN);
      const land = new THREE.Mesh(g, landMat); land.frustumCulled = false; scene.add(land);
    }
    await ctx.yield();
    // crowns: at bee scale a tree is a hill
    const instanced = (geo, material, list, pad = 4) => {
      const n = Math.max(1, list.length), mesh = new THREE.InstancedMesh(geo, material, n), seeds = new Float32Array(n);
      mesh.count = list.length;
      list.forEach((it, i) => { mesh.setMatrixAt(i, it.m); seeds[i] = it.seed; });
      geo.setAttribute('iSeed', new THREE.InstancedBufferAttribute(seeds, 1));
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
      if (mesh.boundingSphere) mesh.boundingSphere.radius += pad;
      scene.add(mesh); return mesh;
    };
    const M4 = (p, X, Y, Z, sx, sy = sx, sz = sx) => new THREE.Matrix4().set(X.x * sx, Y.x * sy, Z.x * sz, p.x, X.y * sx, Y.y * sy, Z.y * sz, p.y, X.z * sx, Y.z * sy, Z.z * sz, p.z, 0, 0, 0, 1);
    const yawM = (p, yaw, sx, sy = sx, sz = sx, tilt = 0) => { const c = Math.cos(yaw), s = Math.sin(yaw), X = V3(c, 0, -s), Y = V3(s * tilt, 1, c * tilt).normalize(), Z = V3(0, 0, 0).crossVectors(X, Y); return M4(p, X, Y, Z, sx, sy, sz); };
    {
      const list = [], nB = Math.round(225 * detail), br = rng.fork('crowns');
      for (let k = 0; k < nB * 3 && list.length < nB; k++) {
        const x = br.range(-2300, 3600), z = 430 + 2500 * Math.pow(br(), 1.25);
        if (Math.abs(z - riverZ(x)) < 130) continue;
        const R = br.range(62, 118) * (1 + z / 2600), y = landH(x, z);
        list.push({ m: yawM(V3(x, y + R * 0.28, z), br.range(0, 6.28), R, R * br.range(0.6, 0.85), R * br.range(0.85, 1.15)), seed: br() });
        if ((k & 127) === 127) await ctx.yield();
      }
      // the crown of the tree whose bough we leave: behind and above the start, never in the entry view
      blobMat = mat(BLOB_VS, BLOB_FS, { ...CAN, uOwn: { value: new THREE.Vector4(1, 1, 0, 1) } }, { side: THREE.FrontSide });
      instanced(new THREE.IcosahedronGeometry(1, 1), blobMat, list, 60);
    }
    await ctx.yield();
    // ---------- the far range: three ridges of snow peaks, highest in the north, their feet lost in haze ----------
    {
      const B = GB({ aL: 1 }), NA = 310, NT = 8, az0 = -62 * DEG, az1 = 242 * DEG, sr = rng.fork('range');
      const LAY = [{ R: 4250, W: 1150, lo: 260, hi: 820, base: -900, k: 3.1 }, { R: 4900, W: 1050, lo: 620, hi: 1560, base: -350, k: 2.3 }, { R: 5600, W: 950, lo: 1150, hi: 2450, base: 150, k: 1.7 }];
      for (let L = 0; L < 3; L++) {
        const o = LAY[L], off = sr.range(0, 50), st = B.count();
        for (let i = 0; i <= NA; i++) {
          const az = lerp(az0, az1, i / NA), ca = Math.cos(az), sa = Math.sin(az);
          const north = 0.5 + 0.5 * Math.pow(0.5 + 0.5 * Math.cos(az - 0.3), 1.4);               // the wall stands highest north-north-east
          const pk = Math.pow(clamp(noise.ridged2(az * o.k + off, L * 7.3, 4) * 1.7, 0, 1), 1.5) * 0.8 + 0.2 * (0.5 + 0.5 * noise.n2(az * o.k * 0.6 + off, 3.3));
          const crest = lerp(o.lo, o.hi, pk * north) + 60 * noise.n2(az * 23 + off, L);
          for (let j = 0; j <= NT; j++) {
            const t = j / NT, sp = noise.ridged2(az * o.k * 4.6 + off * 2, t * 1.3 + L * 5, 3), tt = Math.min(1, t * 3);
            const y = o.base + (crest - o.base) * Math.pow(1 - t, 1.25) * (0.76 + 0.24 * sp * (0.2 + 0.8 * tt)) / (0.76 + 0.24 * 0.2 * 0.5);
            const r = o.R - o.W * t - 170 * (sp - 0.45) * Math.sin(Math.PI * Math.min(1, t * 1.15));
            B.v(ca * r, y, sa * r, { aL: [L] });
          }
          if ((i & 63) === 63) await ctx.yield();
        }
        for (let i = 0; i < NA; i++) for (let j = 0; j < NT; j++) { const a = st + i * (NT + 1) + j, b = a + NT + 1; B.quad(a, a + 1, b + 1, b); }
      }
      const g = B.geometry(); await ctx.yield();
      const horizonCol = col(dawn ? '#f0c4ae' : rain ? '#c9d6e2' : sea ? '#c3d6ec' : '#DCE8F2');
      const range = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { ...U, uRangeHaze: { value: hazeCol.clone().lerp(horizonCol, 0.55).multiplyScalar(dawn ? 0.86 : 0.9) }, uRange: { value: new THREE.Vector4(0.95, dawn ? 0.36 : rain ? 0.52 : sea ? 0.2 : 0.28, 0.07, autumn ? 760 : 560) } },
        vertexShader: RANGE_VS, fragmentShader: RANGE_FS, side: THREE.DoubleSide, fog: false,
      }));
      range.frustumCulled = false; scene.add(range);
    }
    await ctx.yield();

    // ---------- the fin: a blade of rock under the first pass, crested with moss, ferns and drumstick primulas ----------
    const plantMat = mat(PLANT_VS, PLANT_FS, { uSilver: { value: col('#8f8d74') }, uSpot: { value: col('#2a0508') } });
    const pw = (x, tab) => { if (x <= tab[0][0]) return tab[0][1]; for (let k = 1; k < tab.length; k++) if (x <= tab[k][0]) return lerp(tab[k - 1][1], tab[k][1], (x - tab[k - 1][0]) / (tab[k][0] - tab[k - 1][0])); return tab[tab.length - 1][1]; };
    const leaves = [], fronds = [], lichens = [], cushions = [], primulas = [];
    const mossCol = col(autumn ? '#5c5a22' : '#3a5320'), fernCol = col(autumn ? '#8a6a22' : '#2f5a1f');
    const uFinA = uWhereX(-226, 0, 1), uFinB = uSix + 0.02;         // the fin lies under the way in from the bough and falls away before the torn comb
    let finRock = null, finCap = null;
    const FIN_W = [[0, 0], [0.08, 1.6], [0.16, 3.6], [0.26, 6.5], [0.38, 10], [0.52, 16], [0.68, 27], [0.84, 48], [1, 95]];
    const FIN_D = [[0, 0], [0.08, 0.3], [0.16, 1.4], [0.26, 5], [0.38, 16], [0.52, 42], [0.68, 95], [0.84, 200], [1, 430]];
    const finPoint = (t, v, out) => {
      path.pointAt(lerp(uFinA, uFinB, t), P_); path.tangentAt(lerp(uFinA, uFinB, t), T_);
      const lx = -T_.z, lz = T_.x, ll = Math.hypot(lx, lz) || 1, av = Math.abs(v), sg = v < 0 ? -1 : 1;
      const endDrop = 120 * Math.pow(sstep(0.15, 0, t), 1.4) + 90 * Math.pow(sstep(0.88, 1, t), 1.4);
      const crest = P_.y - 14.6 - endDrop + 1.9 * noise.n2(t * 11, 3.3) - 1.2 * Math.abs(noise.n2(t * 31, 8));
      const w = pw(av, FIN_W) * (1 + 0.25 * noise.n2(t * 7 + sg * 5, av * 3)) + 3.2 * noise.fbm2(t * 9 + 20, av * 4 * sg + 2, 3) * sstep(0.12, 0.4, av);
      const drop = pw(av, FIN_D) + 1.6 * Math.sin(pw(av, FIN_D) * 0.4 + t * 9) * sstep(0.2, 0.4, av);
      return out.set(P_.x + lx / ll * w * sg, crest - drop, P_.z + lz / ll * w * sg);
    };
    {
      const NS = 90, NV = 30, B = GB({ color: 3 }), q = V3(0, 0, 0);
      for (let i = 0; i <= NS; i++) {
        for (let j = 0; j <= NV; j++) {
          const v = j / NV * 2 - 1; finPoint(i / NS, Math.sign(v) * Math.pow(Math.abs(v), 1.25), q);
          B.v(q.x, q.y, q.z, { color: [0.5 + 0.4 * noise.n2(q.x * 0.02, q.y * 0.02), 0.5 + 0.5 * noise.n2(q.x * 0.05, q.y * 0.012 + 9), 0] });
        }
        if ((i & 3) === 3) await ctx.yield();
      }
      for (let i = 0; i < NS; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; B.quad(a, a + 1, b + 1, b); }
      const fg = B.geometry(); await ctx.yield();
      finRock = new THREE.Mesh(fg, rockMat); scene.add(finRock); await checkClear(fg, 'fin');
      await ctx.yield();
      // the moss cap
      const C = GB(PSPEC), NC = 10;
      for (let i = 0; i <= NS; i++) for (let j = 0; j <= NC; j++) {
        const e = j / NC * 2 - 1; finPoint(i / NS, e * 0.3, q);
        const tone = 0.75 + 0.5 * noise.n2(q.x * 0.11, q.z * 0.11 + i * 0.1);
        C.v(q.x, q.y + 0.35, q.z, { aCol: rgb(mossCol, tone), aK: [0, 6, 0], aUv: [(i < NS * 0.13 || i > NS * 0.9) ? 3 : e, i / NS] });
      }
      for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) { const a = i * (NC + 1) + j, b = a + NC + 1; C.quad(a, a + 1, b + 1, b); }
      finCap = instanced(C.geometry(), plantMat, [{ m: new THREE.Matrix4(), seed: 0.5 }]);
      await ctx.yield();
      const fr = rng.fork('fin');
      const nPrim = Math.round(86 * clamp(density, 0.85, 1.2));
      for (let k = 0; k < nPrim; k++) {
        const t = 0.14 + 0.74 * (k + fr()) / nPrim, v = fr.range(-0.2, 0.2); finPoint(t, v, q);
        path.pointAt(lerp(uFinA, uFinB, t), P_);
        const s = Math.min(fr.range(0.82, 1.16), (P_.y - 6.4 - q.y) / 7.8);
        if (s < 0.55) continue;
        primulas.push({ m: yawM(q.clone(), fr.range(0, 6.28), s, s, s, fr.range(-0.08, 0.08)), seed: fr() });
      }
      for (let k = 0; k < 60; k++) {
        const t = fr.range(0.1, 0.92), v = fr.range(-0.3, 0.3); finPoint(t, v, q);
        const n = 4 + Math.floor(fr() * 3), sc = fr.range(1.3, 2.1), y0 = fr.range(0, 6.28);
        for (let f = 0; f < n; f++) fronds.push({ m: yawM(q.clone(), y0 + f * 6.283 / n + fr.range(-0.3, 0.3), sc, sc, sc, fr.range(-0.5, -0.15)), seed: fr() });
        if (k < 46) { finPoint(fr.range(0.1, 0.92), fr.range(-0.34, 0.34), q); const cs = fr.range(1, 2.8); cushions.push({ m: yawM(q.clone(), fr.range(0, 6.28), cs, cs * fr.range(0.7, 1.2), cs), seed: fr() }); }
      }
      for (const f of fronds) f.fin = 1;
      for (const f of cushions) f.fin = 1;
    }
    await ctx.yield();

    // ---------- the east spur: a ridge of rhododendron scrub out over the gorge, the middle distance of the hairpin ----------
    // It climbs out of the gorge 500 m east of the horn, runs south along it and falls away again: from the hairpin its
    // crest crosses the frame at the top of the lower third, dark under the pale range, scarlet-flecked. It lies outside
    // every view of the first pass (east of what the camera sees while it flies north), so its scrub is drawn only for the turn.
    let scrub = null;
    {
      const RK = [[640, -140, 400], [600, -60, 430], [520, 60, 470], [430, 122, 510], [300, 108, 610], [150, 82, 720], [-20, 40, 760], [-200, -40, 740], [-380, -220, 690]].map((q) => V3(q[0], q[1], q[2]));
      const rc = new THREE.CatmullRomCurve3(RK, false, 'centripetal'), rr = ctx.core.makeRng(hashSeed('ridge:' + sn)), q = V3(0, 0, 0), c = V3(0, 0, 0), tg = V3(0, 0, 0);
      const RW = [[0, 0], [0.1, 16], [0.25, 46], [0.45, 100], [0.7, 210], [1, 440]], RD = [[0, 0], [0.1, 7], [0.25, 44], [0.45, 160], [0.7, 470], [1, 1150]];
      const ridgePoint = (t, v, out) => {
        rc.getPoint(t, c); rc.getTangent(t, tg);
        const lx = -tg.z, lz = tg.x, ll = Math.hypot(lx, lz) || 1, av = Math.abs(v), sg = v < 0 ? -1 : 1, nose = Math.sqrt(Math.max(0, 1 - sstep(0.86, 1, t)));
        const w = (pw(av, RW) * (1 + 0.3 * noise.n2(t * 6 + sg * 5, av * 3 + 40)) + 22 * noise.fbm2(t * 8 + 60, av * 4 * sg + 2, 3) * sstep(0.1, 0.4, av)) * nose;
        const drop = pw(av, RD) + 9 * Math.sin(pw(av, RD) * 0.05 + t * 9) * sstep(0.2, 0.4, av);
        return out.set(c.x + lx / ll * w * sg, c.y + 16 * noise.n2(t * 9, 4.4) - drop, c.z + lz / ll * w * sg);
      };
      const NS = 44, NV = 20, B = GB({ aRiver: 1 });
      for (let i = 0; i <= NS; i++) {
        for (let j = 0; j <= NV; j++) { const v = j / NV * 2 - 1; ridgePoint(i / NS, Math.sign(v) * Math.pow(Math.abs(v), 1.3), q); B.v(q.x, q.y, q.z, { aRiver: [9999] }); }
        if ((i & 7) === 7) await ctx.yield();
      }
      for (let i = 0; i < NS; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; B.quad(a, a + 1, b + 1, b); }
      const rg = B.geometry(); await ctx.yield();
      // (its own material of the land's shader: the same haze as its scrub, the shaded flank filled from the sky)
      const ridge = new THREE.Mesh(rg, mat(LAND_VS, LAND_FS, { ...CAN, uSpur: { value: 1 } })); ridge.frustumCulled = false; scene.add(ridge);
      // its scrub: rounded masses a third the size of the forest's crowns, finer-leaved, thick on the
      // crest and down the flank that faces the cliff
      const list = [], NSC = Math.round(120 * (0.7 + 0.3 * detail)), gA = V3(0, 0, 0), gB = V3(0, 0, 0), gC = V3(0, 0, 0);
      for (let k = 0; k < NSC; k++) {
        const t = 0.2 + 0.72 * (k + rr()) / NSC, v = k % 3 === 0 ? rr.range(-0.04, 0.06) : rr.range(-0.16, 0.44); ridgePoint(t, v, q);
        const R = rr.range(25, 43), yaw = rr.range(0, 6.28), sy = R * rr.range(0.5, 0.72), sz = R * rr.range(0.85, 1.15), sd = rr();
        // each bush stands square to the slope it grows on (so the shader knows whether that slope is turned from the sun)
        ridgePoint(Math.min(1, t + 0.012), v, gA); ridgePoint(Math.max(0, t - 0.012), v, gB); gA.sub(gB);
        ridgePoint(t, v + 0.03, gB); ridgePoint(t, v - 0.03, gC); gB.sub(gC);
        gC.crossVectors(gA, gB).normalize(); if (gC.y < 0) gC.multiplyScalar(-1);
        gC.lerp(UP, 0.3).normalize();
        gA.set(Math.cos(yaw), 0, -Math.sin(yaw)); gB.crossVectors(gA, gC).normalize(); gA.crossVectors(gC, gB).normalize();
        list.push({ m: M4(V3(q.x, q.y, q.z).addScaledVector(gC, R * 0.16), gA.clone(), gC.clone(), gB.clone(), R, sy, sz), seed: sd });
      }
      scrub = instanced(new THREE.IcosahedronGeometry(1, 1), mat(BLOB_VS, BLOB_FS, { ...CAN, uSlope: { value: 1 }, uOwn: { value: new THREE.Vector4(3.1, 1.2, 1, 0.8) } }, { side: THREE.FrontSide }), list, 60);
      scrub.userData.n = list.length;
    }
    await ctx.yield();

    // ---------- the ledge the tree leans from: a spur of the same rock south-east of the bay, and the tree's crown ----------
    const limb0 = S.clone().addScaledVector(d0, -40).addScaledVector(r0, lerp(-5, 3, 4 / 150) + 1.2 * Math.sin(-1)).addScaledVector(UP, -17.5);
    const treeFoot = limb0.clone().addScaledVector(d0, -165).addScaledVector(UP, -125);
    {
      const Z0 = -300, Z1 = treeFoot.z + 110, TF = (treeFoot.z - Z0) / (Z1 - Z0), q = V3(0, 0, 0);
      const SP_W = [[0, 0], [0.08, 3], [0.16, 7], [0.26, 12], [0.38, 19], [0.52, 30], [0.68, 48], [0.84, 80], [1, 150]];
      const SP_D = [[0, 0], [0.08, 0.6], [0.16, 3], [0.26, 10], [0.38, 30], [0.52, 75], [0.68, 160], [0.84, 330], [1, 720]];
      const spurPoint = (t, v, out) => {
        const av = Math.abs(v), sg = v < 0 ? -1 : 1, off = sstep(0.05, 0.25, Math.abs(t - TF));
        const cx = treeFoot.x + (t - TF) * 120 + 14 * noise.n2(t * 3.1, 7.7) * off, cz = lerp(Z0, Z1, t);
        const crest = treeFoot.y + 290 * Math.pow(Math.max(0, 1 - t / TF), 1.3) - 520 * Math.pow(sstep(TF + 0.035, 1, t), 1.5) + 5 * noise.n2(t * 13, 2.2) * off;
        const nose = Math.sqrt(Math.max(0, 1 - sstep(0.9, 1, t)));
        const w = (pw(av, SP_W) * (1 + 0.3 * noise.n2(t * 6 + sg * 5, av * 3)) + 6 * noise.fbm2(t * 8 + 20, av * 4 * sg + 2, 3) * sstep(0.12, 0.4, av)) * nose;
        const drop = pw(av, SP_D) + 3 * Math.sin(pw(av, SP_D) * 0.2 + t * 9) * sstep(0.2, 0.4, av);
        return out.set(cx + w * sg, crest - drop, cz - 0.12 * drop * sstep(0.8, 1, t));
      };
      const NS = 64, NV = 26, B = GB({ color: 3 });
      for (let i = 0; i <= NS; i++) {
        const t = 1 - Math.pow(1 - i / NS, 1.35);
        for (let j = 0; j <= NV; j++) {
          const v = j / NV * 2 - 1; spurPoint(t, Math.sign(v) * Math.pow(Math.abs(v), 1.25), q);
          B.v(q.x, q.y, q.z, { color: [0.5 + 0.4 * noise.n2(q.x * 0.02, q.y * 0.02), 0.5 + 0.5 * noise.n2(q.x * 0.05, q.y * 0.012 + 9), 0] });
        }
        if ((i & 15) === 15) await ctx.yield();
      }
      for (let i = 0; i < NS; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; B.quad(a, a + 1, b + 1, b); }
      const sg = B.geometry(), spur = new THREE.Mesh(sg, rockMat); spur.frustumCulled = false; scene.add(spur); await checkClear(sg, 'spur');
      await ctx.yield();
      // moss along its crest, ferns and cushions round the foot of the tree
      const C = GB(PSPEC), NC = 6, N2 = 40;
      for (let i = 0; i <= N2; i++) for (let j = 0; j <= NC; j++) {
        const e = j / NC * 2 - 1; spurPoint(lerp(0.3, 0.985, i / N2), e * 0.2, q);
        C.v(q.x, q.y + 0.5, q.z, { aCol: rgb(mossCol, 0.75 + 0.5 * noise.n2(q.x * 0.11, q.z * 0.11)), aK: [0, 6, 0], aUv: [(i < 2 || i > N2 - 2) ? 3 : e, i / N2] });
      }
      for (let i = 0; i < N2; i++) for (let j = 0; j < NC; j++) { const a = i * (NC + 1) + j, b = a + NC + 1; C.quad(a, a + 1, b + 1, b); }
      instanced(C.geometry(), plantMat, [{ m: new THREE.Matrix4(), seed: 0.7 }]);
      const tr = rng.fork('tree'), own = [];
      for (let k = 0; k < 26; k++) {
        spurPoint(tr.range(0.62, 0.97), tr.range(-0.16, 0.16), q);
        const n = 5 + Math.floor(tr() * 3), sc = tr.range(2.6, 4.6), y0 = tr.range(0, 6.28);
        for (let f = 0; f < n; f++) fronds.push({ m: yawM(q.clone(), y0 + f * 6.283 / n + tr.range(-0.3, 0.3), sc, sc, sc, tr.range(-0.5, -0.15)), seed: tr() });
        if (k < 14) { spurPoint(tr.range(0.6, 0.97), tr.range(-0.2, 0.2), q); const cs = tr.range(2.5, 6); cushions.push({ m: yawM(q.clone(), tr.range(0, 6.28), cs, cs * tr.range(0.6, 1), cs), seed: tr() }); }
      }
      // the crown: every bough carries a cluster of leaf masses, back-lit from the cliff; bushes along the spur
      const ownMat = mat(BLOB_VS, BLOB_FS, {
        ...CAN, uLeafA: { value: col(autumn ? '#4a4424' : '#14351b') }, uLeafB: { value: col(autumn ? '#8a7a40' : '#3d682b') },
        uFleckCol: { value: col(autumn ? '#f2b3c4' : PAL[0]).multiplyScalar(0.8) }, uFleck: { value: V3(autumn ? 0.5 : 0.63, 0.9, CAN.uFleck.value.z) },
        uOwn: { value: new THREE.Vector4(2.8, 1.5, 1, 1.15) },
      }, { side: THREE.FrontSide });
      for (const [bk, lat, up, R] of TREE_CROWN) {
        const c = S.clone().addScaledVector(d0, bk).addScaledVector(r0, lat).addScaledVector(UP, up);
        own.push({ m: yawM(c, tr.range(0, 6.28), R * 0.6, R * 0.44, R * 0.6), seed: tr() });
        for (let k = 0; k < 10; k++) {
          const a = k * 2.4 + tr.range(-0.4, 0.4), el = k < 3 ? tr.range(0.5, 1.0) : tr.range(-0.3, 0.55), rr = R * tr.range(0.55, 0.98), sr = R * tr.range(0.2, 0.38);
          own.push({ m: yawM(V3(c.x + Math.cos(a) * Math.cos(el) * rr, c.y + Math.sin(el) * rr * 0.62, c.z + Math.sin(a) * Math.cos(el) * rr), tr.range(0, 6.28), sr, sr * tr.range(0.5, 0.75), sr * tr.range(0.8, 1.2), tr.range(-0.25, 0.25)), seed: tr() });
        }
      }
      for (let k = 0; k < 14; k++) {
        spurPoint(tr.range(0.45, 0.96), tr.range(-0.24, 0.24), q); const R = tr.range(8, 17);
        if (q.distanceTo(treeFoot) < 30) continue;
        own.push({ m: yawM(V3(q.x, q.y + R * 0.25, q.z), tr.range(0, 6.28), R, R * tr.range(0.6, 0.85), R), seed: tr() });
      }
      instanced(new THREE.IcosahedronGeometry(1, 2), ownMat, own, 60);
    }
    await ctx.yield();

    // ---------- the bough we leave: tree rhododendron in bloom (or wild cherry in autumn) ----------
    const trunkMat = mat(TRUNK_VS, TRUNK_FS, { uMoss: { value: col(autumn ? '#55581f' : '#38541d') }, uCherry: { value: autumn ? 1 : 0 } });
    const bells = [];
    const barkCol = col(autumn ? '#5c2f25' : '#94583a'), leafCol = col(autumn ? '#5d5a22' : '#1c4020');
    const clearOf = (p, m = 6.2) => path.distanceTo(p.x, p.y, p.z) >= m;
    const basisFrom = (dir, ref, roll, pos, sc) => {       // Y = dir, Z as near ref as it can be
      const X = V3(0, 0, 0).crossVectors(dir, ref); if (X.lengthSq() < 1e-6) X.set(1, 0, 0); X.normalize();
      const Z = V3(0, 0, 0).crossVectors(X, dir).normalize();
      if (roll) { X.applyAxisAngle(dir, roll); Z.applyAxisAngle(dir, roll); }
      return M4(pos, X, dir, Z, sc);
    };
    {
      const br = rng.fork('bough'), B = GB(PSPEC), q = V3(0, 0, 0), q2 = V3(0, 0, 0);
      const limbAt = (st, out) => out.copy(S).addScaledVector(d0, st).addScaledVector(r0, lerp(-5, 3, (st + 44) / 150) + 1.2 * Math.sin(st * 0.05 + 1)).addScaledVector(UP, -pw(st, [[0, 17.5], [60, 14.2], [90, 10.8], [106, 8.8]]));
      const limbR = (st) => pw(st, [[0, 8], [20, 7], [45, 5.5], [65, 4], [85, 2.2], [100, 0.8], [106, 0.25]]);
      const bark = (r) => (t, ar, len) => ({ aCol: rgb(barkCol, 0.85 + 0.3 * noise.n2(len * 0.07, ar * 5)), aK: [0, 0, 0], aUv: [ar * 6.283 * r, len] });
      const lp = []; for (let st = -44; st <= 106; st += 5) lp.push(limbAt(st, V3(0, 0, 0)));
      tube(B, lp, (t, a, len) => limbR(-44 + 150 * t) * (1 + 0.05 * Math.sin(3 * a + len * 0.11) + 0.05 * noise.n2(a * 1.3, len * 0.09)), 18, bark(6));
      await ctx.yield();
      {                                                    // the trunk the limb springs from elbows back and down to the ledge on the spur; six limbs carry the crown
        const P0 = limbAt(-40, V3(0, 0, 0)), tp = [], gy = treeFoot.y - 7;
        for (let k = 0; k <= 16; k++) { const t = k / 16, bk = 165 * (1 - Math.pow(1 - t, 2.2)); tp.push(V3(P0.x - d0.x * bk + 6 * Math.sin(t * 5), P0.y - (P0.y - gy) * Math.pow(t, 1.7), P0.z - d0.z * bk + 6 * Math.sin(t * 4))); }
        tube(B, tp, (t, a, len) => lerp(8.6, 17, Math.pow(t, 0.8)) * (1 + 0.8 * sstep(0.8, 1, t)) * (1 + 0.06 * Math.sin(3 * a + len * 0.05) + 0.06 * noise.n2(a * 1.3, len * 0.05)), 16, bark(8));
        await ctx.yield();
        [[0, 3], [1, 5], [4, 4], [2, 2], [3, 6], [5, 7]].forEach(([ci, k0]) => {
          const [bk, lat, up] = TREE_CROWN[ci], c = S.clone().addScaledVector(d0, bk).addScaledVector(r0, lat).addScaledVector(UP, up), a0 = tp[k0], lp2 = [];
          for (let k = 0; k <= 6; k++) { const t = k / 6; lp2.push(V3(lerp(a0.x, c.x, t), lerp(a0.y, c.y, t) + 14 * Math.sin(t * 3.14), lerp(a0.z, c.z, t))); }
          tube(B, lp2, (t) => lerp(6.5, 2.2, t), 10, bark(5));
        });
      }
      await ctx.yield();
      // push a point out to at least m metres from the entry axis
      const pushOut = (p, m) => { const st = (p.x - S.x) * d0.x + (p.z - S.z) * d0.z; q2.copy(S).addScaledVector(d0, st); const d = p.distanceTo(q2); if (d < m && d > 1e-3) p.sub(q2).multiplyScalar(m / d).add(q2); return p; };
      const whorl = (pos, axis, n, th0, th1, sc0) => {
        const e1 = V3(0, 0, 0).crossVectors(axis, Math.abs(axis.y) > 0.9 ? V3(1, 0, 0) : UP).normalize(), e2 = V3(0, 0, 0).crossVectors(axis, e1), ph0 = br.range(0, 6.28);
        for (let k = 0; k < n; k++) {
          const th = br.range(th0, th1) * DEG, ph = ph0 + k * 6.283 / n + br.range(-0.25, 0.25), sc = sc0 * br.range(0.85, 1.15);
          const dir = axis.clone().multiplyScalar(Math.cos(th)).addScaledVector(e1, Math.cos(ph) * Math.sin(th)).addScaledVector(e2, Math.sin(ph) * Math.sin(th)).normalize();
          const tip = pos.clone().addScaledVector(dir, 5.3 * sc), mid = pos.clone().addScaledVector(dir, 2.6 * sc);
          if (!clearOf(tip, 6.4) || !clearOf(mid, 6.4)) continue;
          leaves.push({ m: basisFrom(dir, br.chance(0.8) ? axis : axis.clone().negate(), 0, pos, sc), seed: br() });
        }
      };
      const truss = (H, axis, n) => {
        const e1 = V3(0, 0, 0).crossVectors(axis, Math.abs(axis.y) > 0.9 ? V3(1, 0, 0) : UP).normalize(), e2 = V3(0, 0, 0).crossVectors(axis, e1);
        for (let k = 0; k < n; k++) {
          const th = lerp(14, 102, Math.sqrt((k + 0.5) / n)) * DEG, ph = k * 2.39996 + br.range(-0.2, 0.2);
          const dir = axis.clone().multiplyScalar(Math.cos(th)).addScaledVector(e1, Math.cos(ph) * Math.sin(th)).addScaledVector(e2, Math.sin(ph) * Math.sin(th)).addScaledVector(UP, -0.12).normalize();
          if (!clearOf(H.clone().addScaledVector(dir, 4.5), 6.2) || !clearOf(H.clone().addScaledVector(dir, 2.4), 6.2)) continue;
          bells.push({ m: basisFrom(dir, UP, br.range(0, 6.28), H, br.range(0.92, 1.1)), seed: br() });
        }
      };
      const shoot = (P0, H, r0s, r1s, bulge) => {
        const mid = P0.clone().lerp(H, 0.5); pushOut(mid, 7.4); const st = (mid.x - S.x) * d0.x + (mid.z - S.z) * d0.z;
        q.copy(S).addScaledVector(d0, st); const out = mid.clone().sub(q).normalize(); mid.addScaledVector(out, bulge).addScaledVector(d0, -2);
        const sp = [];
        for (let k = 0; k <= 8; k++) { const t = k / 8; sp.push(pushOut(P0.clone().multiplyScalar((1 - t) * (1 - t)).addScaledVector(mid, 2 * t * (1 - t)).addScaledVector(H, t * t), k === 0 ? 0 : 7.2)); }
        tube(B, sp, (t) => lerp(r0s, r1s, t), 7, bark(1));
        return { sp, axis: sp[8].clone().sub(sp[6]).normalize() };
      };
      const hubs = [[5, 125, 11.4], [9, 238, 11.8], [47, 305, 12.2], [52, 78, 12.6], [70, 205, 11.4], [88, 128, 11.2]];
      for (const [st0, an0, rd0] of hubs) {
        const st = st0 + br.range(-2, 2), H = bp(st, an0 + br.range(-9, 9), rd0 + br.range(0, 0.8), V3(0, 0, 0));
        const P0 = limbAt(Math.max(-30, st - 13), V3(0, 0, 0)); P0.addScaledVector(H.clone().sub(P0).normalize(), limbR(st - 13) * 0.6);
        const sh = shoot(P0, H, 1.3, 0.42, 3.5);
        truss(H, sh.axis, autumn ? 26 : 20);
        whorl(H.clone().addScaledVector(sh.axis, -0.7), sh.axis, 9, 78, 118, autumn ? 0.62 : 1);
        whorl(sh.sp[5].clone(), sh.sp[6].clone().sub(sh.sp[4]).normalize(), 6, 55, 100, autumn ? 0.6 : 0.9);
        for (const k of [3, 6]) { const p = sh.sp[k]; if (Math.abs((p.x - S.x) * r0.x + (p.z - S.z) * r0.z) > 6.9 || p.y < Y0 - 7) lichens.push({ m: yawM(p.clone().addScaledVector(UP, -0.6), br.range(0, 6.28), br.range(0.7, 1.2)), seed: br() }); }
        await ctx.yield();
      }
      // the ring of bells dead on the axis, 32 m in: a hoop of twig with a collar of leaves
      const RST = 32 + br.range(-1, 1), RR = 11.2, hoop = [];
      for (let k = 0; k <= 72; k++) hoop.push(bp(RST + 0.8 * Math.sin(k * 0.375), k * 5, RR + 0.35 * Math.sin(k * 0.71) + 0.12 * Math.sin(k * 2.3), V3(0, 0, 0)));
      tube(B, hoop, (t, a, len) => 0.4 * (0.8 + 0.28 * Math.sin(len * 0.8) + 0.1 * Math.sin(len * 3.1)), 6, bark(0.4));
      for (const an of [158, 203]) shoot(limbAt(RST - 9, V3(0, 0, 0)), bp(RST, an, RR, V3(0, 0, 0)), 1.0, 0.5, 0.5);
      for (let k = 0; k < 18; k++) {
        const an = k * 20 + br.range(-4, 4), H = bp(RST, an, RR, V3(0, 0, 0)), inward = bp(RST, an, 0, V3(0, 0, 0)).sub(H).normalize();
        const dir = inward.multiplyScalar(0.68).addScaledVector(d0, 0.55).addScaledVector(UP, -0.25).normalize();
        if (clearOf(H.clone().addScaledVector(dir, 4.5), 6.3)) bells.push({ m: basisFrom(dir, UP, br.range(0, 6.28), H, br.range(0.95, 1.12)), seed: br() });
        if (k % 3 === 0) { const outw = bp(RST, an, RR + 1, V3(0, 0, 0)).sub(H).normalize(); whorl(H, outw.addScaledVector(d0, -0.3).normalize(), 5, 20, 62, autumn ? 0.6 : 0.95); }
      }
      await ctx.yield();
      // life on the bark
      for (let k = 0; k < 96; k++) {
        const st = br.range(-14, 98), a = br.range(-62, 62) * DEG, R = limbR(st); limbAt(st, q);
        const nrm = UP.clone().multiplyScalar(Math.cos(a)).addScaledVector(r0, Math.sin(a)), p = q.clone().addScaledVector(nrm, R * 0.98);
        if (k < 52) { const cs = br.range(0.7, 1.5) * Math.min(1, R / 3); cushions.push({ m: basisFrom(nrm, d0, br.range(0, 6.28), p, cs), seed: br() }); }
        else if (k < 84) { const sc = br.range(0.9, 1.5) * Math.min(1, R / 2.5 + 0.3); fronds.push({ m: basisFrom(nrm.clone().addScaledVector(d0, br.range(-0.5, 0.5)).addScaledVector(r0, Math.sign(a) * 0.5).normalize(), UP, br.range(0, 6.28), p, sc), seed: br() }); }
        else lichens.push({ m: yawM(q.clone().addScaledVector(r0, Math.sign(a || 1) * R * 0.9).addScaledVector(UP, -R * 0.35), br.range(0, 6.28), br.range(0.8, 1.3)), seed: br() });
      }
      const g = B.geometry(); await ctx.yield();
      scene.add(new THREE.Mesh(g, trunkMat)); await checkClear(g, 'bough');
    }
    // ferns fringe the roof lip
    {
      const fr = rng.fork('lip');
      for (const p of A.roofLip) for (let f = 0; f < 6; f++) { const sc = fr.range(2.2, 3.4); fronds.push({ m: yawM(V3(p.x + fr.range(-9, 9), p.y + 1.6, p.z - 1.2), Math.PI + fr.range(-0.8, 0.8), sc, sc, sc, fr.range(-1.1, -0.5)), seed: fr() }); }
    }
    // growth on the wall itself: fern clumps and moss on the ledges where a bed stands back, beards of lichen hanging from
    // their lips, and a hanging garden on the sloping top of the lower roof, between the two tiers of combs
    {
      const wr = rng.fork('wall'), wp = [], mx = A.cleftMouth.x, my = A.cleftMouth.y;
      // a clump: seven to nine fronds from one crown, the middle ones arching out from the wall, the outer ones splayed along it
      const clump = (x, y, z, sc, n, lean) => {
        const y0 = wr.range(-0.3, 0.3);
        for (let f = 0; f < n; f++) {
          const e = n > 1 ? f / (n - 1) * 2 - 1 : 0, s1 = sc * wr.range(0.8, 1.15) * (1 - 0.25 * Math.abs(e));
          fronds.push({ m: yawM(V3(x + e * 0.5 * sc, y, z), Math.PI + y0 + e * 1.25 + wr.range(-0.12, 0.12), s1, s1, s1, lean * (0.75 + 0.9 * Math.abs(e)) * wr.range(0.85, 1.15)), seed: wr() });
        }
      };
      // hanging gardens: two to four clumps side by side on one ledge, moss under them, a beard of lichen from the lip
      const nG = Math.round(30 * (0.6 + 0.4 * detail));
      for (let k = 0, tries = 0; k < nG && tries < 1500; tries++) {
        const x = wr.range(-300, 300), mid = wr.chance(0.62), L = hero.ledgesAt(x, mid ? 147 : 15, mid ? 204 : 106).filter((l) => l.width > 0.9);
        if ((tries & 3) === 3) await ctx.yield();
        if (!L.length) continue;
        const l = L[wr.int(0, L.length - 1)], nc = 2 + wr.int(0, 2);
        let put = 0;
        for (let c = 0; c < nc; c++) {
          const xc = x + (c - (nc - 1) / 2) * wr.range(5.5, 8.5);
          hero.wallPoint(xc, l.y - 0.5, wp);
          if (path.distanceTo(wp[0], wp[1], wp[2]) < 12 || Math.hypot(xc - mx, wp[1] - my) < 36) continue;
          clump(wp[0], wp[1] + 0.2, wp[2] + 0.5, wr.range(1.7, 2.7) * Math.min(1.2, 0.7 + 0.2 * l.width), 7 + wr.int(0, 2), -1.05);
          const cs = wr.range(2.2, 4.2); cushions.push({ m: yawM(V3(wp[0] + wr.range(-2, 2), wp[1] + 0.1, wp[2] + 0.6), wr.range(0, 6.28), cs, cs * wr.range(0.5, 0.8), cs * 0.8), seed: wr() });
          if (c % 2 === 0) lichens.push({ m: yawM(V3(wp[0] + wr.range(-3, 3), wp[1] - 0.6, wp[2] + 0.9), wr.range(0, 6.28), wr.range(0.5, 1.0)), seed: wr() });
          put++;
        }
        if (put) k++;
      }
      await ctx.yield();
      // the top of the lower roof: a ramp of broken ledges under the upper combs, with ferns in drifts
      const nR = Math.round(30 * (0.6 + 0.4 * detail));
      for (let k = 0; k < nR; k++) {
        const x = wr.range(-290, 290), y = wr.range(118, 141), nc = 1 + wr.int(0, 2);
        for (let c = 0; c < nc; c++) {
          const xc = x + c * wr.range(5, 8);
          hero.wallPoint(xc, y + wr.range(-1.5, 1.5), wp);
          if (path.distanceTo(wp[0], wp[1], wp[2]) < 12) continue;
          clump(wp[0], wp[1] + 0.2, wp[2], wr.range(1.7, 2.6), 6 + wr.int(0, 2), -0.75);
          const cs = wr.range(2, 4.5); cushions.push({ m: yawM(V3(wp[0] + wr.range(-4, 4), wp[1] + 0.3, wp[2] + wr.range(-1, 1)), wr.range(0, 6.28), cs, cs * wr.range(0.5, 0.8), cs), seed: wr() });
        }
      }
    }
    await ctx.yield();
    // (bells and primulas are put in an order whose first part is an even sample of the whole, for the far view)
    const sample = (list, m, n) => [...list.filter((_, i) => i % n < m), ...list.filter((_, i) => i % n >= m)];
    const bellAll = bells.length, bellKeep = bells.filter((_, i) => i % 5 < 2).length, primAll = primulas.length, primKeep = primulas.filter((_, i) => i % 5 < 3).length;
    const bellMesh = instanced(bellGeo(col(autumn ? '#f2b3c4' : PAL[0]), col(autumn ? '#d0708f' : '#7d0f17'), col('#4f6a2a'), autumn), plantMat, sample(bells, 2, 5));
    instanced(leafGeo(leafCol, autumn ? 3.6 : 5, autumn ? 0.95 : 0.85), plantMat, leaves);
    await ctx.yield();
    // the fin's plants go last in every list, and the ferns of the north end before them: the fin leaves the picture once it is
    // behind us for good (from the wall's side it was a dark block across the gorge), the north end once we head south
    const frondS = fronds.filter((f) => !f.fin && f.m.elements[12] <= 165), frondN = fronds.filter((f) => !f.fin && f.m.elements[12] > 165);
    const frondAll = fronds.length, frondKeep = frondS.length, frondMid = frondS.length + frondN.length, cushKeep = cushions.filter((f) => !f.fin).length, cushAll = cushions.length;
    const frondMesh = instanced(stripGeo(3, 3, 1.15, 0.5, fernCol.clone().multiplyScalar(0.7), fernCol.clone().lerp(col('#9fb04a'), 0.45)), plantMat, [...frondS, ...frondN, ...fronds.filter((f) => f.fin)]);
    instanced(stripGeo(4, 10, 0.95, 0, col('#8f9a78'), col('#b9c19a')), plantMat, lichens);
    const cushMesh = instanced(cushionGeo(mossCol), plantMat, [...cushions.filter((f) => !f.fin), ...cushions.filter((f) => f.fin)]);
    const primMesh = instanced(primulaGeo(col(autumn ? '#a8935c' : '#9a6fd0'), col('#5d7a36')), plantMat, sample(primulas, 3, 5));
    await ctx.yield();

    // ---------- the honey hunters' gear at the north horn: rope ladder, smouldering torch ----------
    let smoke = null, ember = null, gearMesh = null;
    {
      // The ladder hangs over the lip of the roof just north of comb one, its ropes 1.5 m clear of the rock: we come in past it
      // (the nearer rope ten metres off our right wing) on the dive at the comb. The lip runs back toward the horn, and the ladder with it.
      const B = GB(PSPEC), Lc = V3(232, 186, 35.6), ll = V3(16, 0, -4).normalize(), Lp = V3(221, 0, 47);
      const ropeCol = col('#b99b62'), woodCol = col('#8a6a45'), TOP = 219, sway = (y) => Math.pow(clamp((TOP - y) / 100, 0, 1), 1.2);
      // A rope is three strands laid round each other, one turn in seven metres. Near our own height the strands are
      // modelled (rings 0.7 m apart, each strand a round lobe); above and below it is a plain tube and the shader lays them.
      const LAY = 0.14, gr = ctx.core.makeRng(hashSeed('gear:' + sn));
      const lobe = (a, len) => { let d = (a / 6.2832 - LAY * len) * 3; d = (d - Math.round(d)) * 2.0944; const q = Math.sin(d); return 0.536 * Math.cos(d) + Math.sqrt(Math.max(0.2153 - 0.2873 * q * q, 0)); };
      const ropeX = (x, y) => x + 0.25 * Math.sin(y * 0.11 + x), ropeZ = (z, y) => z + 0.2 * Math.sin(y * 0.09 + z);
      const rope = (x, z, y0, y1, R, fine) => {
        const part = (ya, yb, step, sides, lobed) => {
          const rp = []; for (let y = ya; y > yb + 0.01; y -= step) rp.push(V3(ropeX(x, y), y, ropeZ(z, y))); rp.push(V3(ropeX(x, yb), yb, ropeZ(z, yb)));
          if (rp.length < 2) return;
          tube(B, rp, (t, a, len) => { const L = y0 - ya + len, k = lobed ? 1 - sstep(15, 23, Math.abs(ya - len - Lc.y)) : 0; return R * lerp(0.84, lobe(a, L), k); }, sides,
            (t, ar, len) => ({ aCol: rgb(ropeCol, 0.85 + 0.3 * noise.n2((y0 - ya + len) * 0.3, ar * 3)), aK: [sway(ya - len), 1, 0], aUv: [ar, y0 - ya + len] }));
        };
        if (!fine) { part(y0, y1, 2, 7, false); return; }
        const fa = Math.min(y0, Lc.y + 24), fb = Math.max(y1, Lc.y - 24);
        part(y0, fa, 2, 9, false); part(fa, fb, 0.7, 18, true); part(fb, y1, 2, 9, false);
      };
      // a loose fibre: a thin three-sided sliver that springs from the rope and droops
      const fibre = (root, out, L, w, y, tone) => {
        const side = V3(0, 0, 0).crossVectors(out, UP).normalize(), a = { aCol: rgb(ropeCol, tone), aK: [sway(y), 4, 0], aUv: [0.5, 0] };
        const P1 = root.clone().addScaledVector(out, L * 0.5).addScaledVector(UP, L * 0.22), P2 = root.clone().addScaledVector(out, L * 0.86).addScaledVector(UP, -L * 0.3);
        const ring = (c, r) => [0, 2.094, 4.189].map((an) => B.v(c.x + side.x * Math.cos(an) * r, c.y + Math.sin(an) * r, c.z + side.z * Math.cos(an) * r, a));
        const r0 = ring(root, w), r1 = ring(P1, w * 0.62), tip = B.v(P2.x, P2.y, P2.z, a);
        for (let j = 0; j < 3; j++) { const k = (j + 1) % 3; B.quad(r0[j], r0[k], r1[k], r1[j]); B.tri(r1[j], r1[k], tip); }
      };
      const toPath = (x, z) => V3(Lp.x - x, 0, Lp.z - z).normalize();
      const fray = (x, z, y, R, L, w) => {
        const an = gr.range(0, 6.2832), out = V3(Math.cos(an), 0, Math.sin(an)), reach = out.dot(toPath(x, z)) > 0.25 ? Math.min(L, 0.85) : L;
        fibre(V3(ropeX(x, y) + out.x * R * 0.7, y, ropeZ(z, y) + out.z * R * 0.7), out, reach, w, y, gr.range(0.95, 1.35));
      };
      const yBot = Lc.y - 7 - 14 * 5;
      for (const e of [-1, 1]) {
        const x = Lc.x + ll.x * 8 * e, z = Lc.z + ll.z * 8 * e;
        rope(x, z, TOP, yBot - 9, 0.8, true);
        for (let k = 0; k < 58; k++) fray(x, z, Lc.y + gr.range(-21, 21), 0.8, gr.range(0.6, 1.7), gr.range(0.035, 0.06));
      }
      for (let y = Lc.y + 21; y > yBot - 1; y -= 14) {
        const tl = layout.range(-0.35, 0.35), rp = [];
        for (let k = 0; k <= 4; k++) { const e = k / 2 - 1; rp.push(V3(Lc.x + ll.x * 8.9 * e, y + tl * e + 0.12 * Math.sin(k * 2), Lc.z + ll.z * 8.9 * e)); }
        tube(B, rp, (t, a) => 0.45 * (1 + 0.08 * Math.sin(a * 2 + t * 9)), 8, (t, ar, len) => ({ aCol: rgb(woodCol, 0.9 + 0.2 * Math.sin(len)), aK: [sway(y), 2, 0], aUv: [ar, len] }));
        for (const e of [-1, 1]) {          // lashings: a whipping of cord over the rope, its loose ends frayed
          const lx = Lc.x + ll.x * 8 * e, lz = Lc.z + ll.z * 8 * e, yy = y + tl * e * 0.9, lp = [];
          for (let k = 0; k <= 6; k++) { const yk = yy + 0.95 - k * 0.3167; lp.push(V3(ropeX(lx, yk), yk, ropeZ(lz, yk))); }
          tube(B, lp, (t) => 0.8 * (0.9 + 0.36 * Math.sin(Math.PI * t)), 10, (t, ar, len) => ({ aCol: rgb(ropeCol, 0.7), aK: [sway(yy), 1, 0], aUv: [ar, len * 9] }));
          if (Math.abs(yy - Lc.y) < 30) for (let k = 0; k < 4; k++) fray(lx, lz, yy + gr.range(-0.9, 0.9), 1.05, gr.range(1.1, 2.2), gr.range(0.06, 0.09));
        }
      }
      await ctx.yield();
      // the torch: a 20 m bundle of long leaf blades bound round a core with three lashings, hung on a cord, smouldering at its foot
      const ts = V3(221, A.torchSeat.y, 26.5);                         // hung under the roof between the ladder and comb one: it stands beside the near rope as we dive at the comb
      const tp = []; for (let k = 0; k <= 10; k++) tp.push(V3(ts.x + 0.5 * Math.sin(k * 0.5), 200 - 2 * k, ts.z + 0.3 * Math.cos(k * 0.7)));
      const tAt = (f, out) => { const x = clamp(f, 0, 1) * 10, i = Math.min(9, Math.floor(x)); return out.lerpVectors(tp[i], tp[i + 1], x - i); };
      const tRad = (f) => 1.5 * (0.55 + 0.45 * Math.sin(Math.PI * (0.08 + 0.84 * f)));
      rope(ts.x, ts.z, 213, 199.5, 0.24, false);
      tube(B, tp, (t) => tRad(t) * 0.9, 9, (t, ar, len) => ({ aCol: rgb(col('#4f4326'), 0.7 + 0.4 * noise.n2(ar * 9, len * 0.2)), aK: [sway(200 - len), 3, sstep(0.72, 0.98, t)], aUv: [0.3, len] }));
      {
        const leafA = col('#8d7b3c'), leafB = col('#5f6d2f'), leafC = col('#a58a4c'), c0 = V3(0, 0, 0), rad = V3(0, 0, 0), tan = V3(0, 0, 0), q = V3(0, 0, 0), NB = 38;
        for (let b = 0; b < NB; b++) {
          const f0 = Math.min(0.74, (b % 5) * 0.165 + gr.range(-0.03, 0.05)), fl = gr.range(0.27, 0.4), ph = b * 2.4 + gr.range(-0.3, 0.3), w = gr.range(1.3, 2.0), lift = gr.range(0.08, 0.45), flare = gr.range(0.7, 2.1), tw = gr.range(-0.5, 0.5);
          const cc = (gr() < 0.3 ? leafB : gr() < 0.5 ? leafC : leafA).clone().multiplyScalar(gr.range(0.75, 1.15)), base = B.count();
          for (let k = 0; k <= 5; k++) {
            const e = k / 5, f = Math.min(1.03, f0 + fl * e), an = ph + tw * e; tAt(f, c0); if (f > 1) c0.y -= (f - 1) * 20;
            rad.set(Math.cos(an), 0, Math.sin(an)); tan.set(-Math.sin(an), 0, Math.cos(an));
            const r = tRad(Math.min(f, 1)) + lift + flare * e * e * e, hw = 0.5 * w * Math.pow(Math.sin(Math.PI * (0.1 + 0.9 * e) * 0.97), 0.7);
            for (let j = -1; j <= 1; j++) {
              q.copy(c0).addScaledVector(rad, r + (j === 0 ? 0.1 * w : 0)).addScaledVector(tan, j * hw);
              B.v(q.x, q.y, q.z, { aCol: rgb(cc, 1), aK: [sway(q.y), 3, sstep(0.72, 0.98, f)], aUv: [0.5 + 0.5 * j, fl * e * 20] });
            }
          }
          for (let k = 0; k < 5; k++) for (let j = 0; j < 2; j++) { const i0 = base + k * 3 + j; B.quad(i0, i0 + 1, i0 + 4, i0 + 3); }
        }
      }
      for (const k of [1, 4, 7]) {
        const lp = []; for (let i = 0; i <= 4; i++) lp.push(tAt(k / 10 + (i - 2) * 0.012, V3(0, 0, 0)));
        tube(B, lp, (t) => tRad(k / 10) + 0.5 + 0.14 * Math.sin(Math.PI * t), 12, (t, ar, len) => ({ aCol: rgb(ropeCol, 0.75), aK: [sway(tp[k].y), 1, 0], aUv: [ar, len * 7] }));
      }
      const g = B.geometry(); await ctx.yield();
      gearMesh = new THREE.Mesh(g, trunkMat); scene.add(gearMesh);
      scene.userData.gearPts = [tp[0], tp[5], tp[10], ...[-1, 1].map((e) => V3(Lc.x + ll.x * 8 * e, Lc.y, Lc.z + ll.z * 8 * e))]; await checkClear(g, 'ladder');
      const foot = tp[10];
      smoke = makeSmokeColumn({ rng, position: [foot.x, foot.y + 1, foot.z], height: 27, radius: [1.8, autumn ? 8 : 6], size: [3, autumn ? 13 : 10], count: Math.round((autumn ? 80 : 60) * detail), color: '#a7abb4', colorTop: '#cdd1d8', shadowColor: '#5c606c',
        ambient: '#383c46', opacity: autumn ? 0.75 : 0.55, rate: 0.07, wind: [0.25, 0, -0.7], bend: 0.7, sunDir: sunDir.toArray() });
      scene.add(smoke.object);
      ember = makeGlow({ position: [foot.x, foot.y + 1.2, foot.z], color: '#ff7a2a', size: 6, intensity: 1.5, flicker: 0.35 });
      scene.add(ember.object);
    }
    await ctx.yield();

    // ---------- the buzzard's line (keyed to u) ----------
    // It rakes north along the upper tier some 250 m ahead of us while we leave the bough and close on the torn comb, breaks
    // off the wall at the north horn and wheels to the right in one wide circle out over the gorge (a speck of scale beside
    // the tiers at u 0.25), and comes round across our bow as we swing out: at u 0.34 it is dead ahead, 75 m off and 25 m
    // above us, flying from right to left and banked into its turn, away from us, so that its barred underside and fanned
    // tail are spread against the sky. Then it makes off north along the mountain with its comet of guards.
    const BK = [[0, V3(-140, 188, 34)], [0.05, V3(-62, 190, 30)], [0.1, V3(34, 190.5, 29)], [0.14, V3(100, 191, 33)], [0.168, V3(150, 191, 58)], [0.2167, V3(208.4, 190, 109)], [0.2378, V3(220.7, 189, 138.8)],
      [0.2589, V3(208.4, 188, 168.5)], [0.28, V3(178.7, 187, 180.8)], [0.3011, V3(149, 186, 168.5)], [0.3222, V3(136.7, 185, 138.8)], [0.34, V3(145.6, 184.5, 112.9)], [0.3597, V3(171.4, 186, 97.4)],
      [0.385, V3(222, 188, 84)], [0.41, V3(270, 188, 80)], [0.44, V3(330, 192, 84)], [0.52, V3(470, 215, 110)], [0.62, V3(660, 260, 200)], [0.75, V3(860, 320, 340)]];
    const bCurve = new THREE.CatmullRomCurve3(BK.map((k) => k[1]), false, 'centripetal');
    const buzzAt = (u, out) => {
      const n = BK.length; let i = 0; while (i < n - 2 && u > BK[i + 1][0]) i++;
      const f = clamp((u - BK[i][0]) / (BK[i + 1][0] - BK[i][0]), 0, 1);
      return bCurve.getPoint((i + f) / (n - 1), out);
    };
    const buzzPos = V3(0, 0, 0); buzzAt(0, buzzPos);
    // The waves the raid raises. One leaves the south end of the upper tier every 2.25 s and runs north comb by comb (2,250 m
    // of wall per unit of u): a pale band is crossing the torn comb as we come abeam it (u 0.16), and at u 0.25 one is on
    // comb three and one on comb two, ahead of us down the tier. Two more start between combs one and two for the far
    // turn and the run back in, so that light runs along the row while the whole face is in the frame.
    for (const u0 of [0.062, 0.107, 0.152, 0.197, 0.242, 0.287]) waves.push({ u: u0, x: -200, y: 190 });
    waves.push({ u: 0.505, x: 146, y: 190 }, { u: 0.552, x: 30, y: 190 }, { u: uLadder - 0.016, x: 150, y: 190 });
    hero.setSchedule(waves, duration);

    // ---------- bees in the air ----------
    const seatP = A.portalSeat.position, axis = A.portalSeat.direction, tearP = A.tear.position;
    const flyU = { uStory: { value: 0 }, uSpine: { value: Array.from({ length: 21 }, () => V3(0, 0, 0)) }, uPale: { value: pale }, uBeeDark: { value: beeDark }, uClA: { value: A.cleftMouth.clone().addScaledVector(axis, 3) }, uClB: { value: seatP.clone() } , uPortalPos: HU.uPortalPos, uPortalCol: HU.uPortalCol, uFace: { value: 0 } };
    const shadeNear = { value: new THREE.Vector4(20, 60, 1.6, 0.4) }, wingNear = { value: new THREE.Vector4(0.035, 0.16, 0.34, 400) };
    const flyHiMat = mat(FLY_VS, FLY_FS, { ...flyU, uShade: shadeNear, uWing: wingNear, uNear: { value: new THREE.Vector4(2.2, 2.4, 5, 1.5) } });
    const flyLoMat = mat(FLY_VS, FLY_FS, { ...flyU, uShade: shadeNear, uWing: wingNear, uNear: { value: new THREE.Vector4(3.4, 6, 14, 1.7) } });
    const flyWingMat = mat(FLY_VS, FLY_FS, { ...flyU, uShade: shadeNear, uWing: wingNear, uNear: { value: new THREE.Vector4(2.2, 2.4, 5, 1.5) } }, { transparent: true, depthWrite: false });
    // the swarm: its bees keep their colours (tawny thorax, banded abdomen) out to 150 m and more, and their wings are a pale blur in the sun
    const shadeSwarm = { value: new THREE.Vector4(150, 340, 5.5, 1.5) }, wingSwarm = { value: new THREE.Vector4(0.32, 0.9, 0.34, 330) }, nearSwarm = { value: new THREE.Vector4(3.4, 6, 14, 1.7) };
    const flySwarmMat = mat(FLY_VS, FLY_FS, { ...flyU, uShade: shadeSwarm, uWing: wingSwarm, uNear: nearSwarm, uFace: { value: 1 } });
    const flySwarmWingMat = mat(FLY_VS, FLY_FS, { ...flyU, uShade: shadeSwarm, uWing: wingSwarm, uNear: nearSwarm, uFace: { value: 1 } }, { transparent: true, depthWrite: false });
    const makeFlyers = (list, g0, material, wings) => {
      const g = new THREE.InstancedBufferGeometry(), n = Math.max(1, list.length);
      g.index = g0.index; for (const k of ['position', 'normal', 'aP']) g.setAttribute(k, g0.attributes[k]);
      let gw = null;
      if (wings) {            // the wing blurs are drawn apart from the bodies, blended (the same instances, the other half of the index)
        const ix = g0.index.array, ap = g0.attributes.aP.array, body = [], wing = [];
        for (let t = 0; t < ix.length; t += 3) { const w = ap[ix[t]] > 1.5 && ap[ix[t]] < 2.5; (w ? wing : body).push(ix[t], ix[t + 1], ix[t + 2]); }
        g.setIndex(body); gw = new THREE.InstancedBufferGeometry(); gw.setIndex(wing);
      }
      const a = new Float32Array(n * 3), b = new Float32Array(n * 3), c = new Float32Array(n * 3), t = new Float32Array(n * 4), s = new Float32Array(n * 2);
      list.forEach((L, i) => { L.A.toArray(a, i * 3); L.B.toArray(b, i * 3); L.C.toArray(c, i * 3); t.set(L.t, i * 4); s[i * 2] = L.seed; s[i * 2 + 1] = L.pollen; });
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(a, 3)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(b, 3)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(c, 3));
      g.setAttribute('iT', new THREE.InstancedBufferAttribute(t, 4)); g.setAttribute('iS', new THREE.InstancedBufferAttribute(s, 2));
      g.instanceCount = list.length;
      const m = new THREE.Mesh(g, material); m.frustumCulled = false; scene.add(m);
      if (gw) { for (const k in g.attributes) gw.setAttribute(k, g.attributes[k]); gw.instanceCount = list.length; const wm = new THREE.Mesh(gw, wings); wm.frustumCulled = false; wm.renderOrder = 3; scene.add(wm); m.userData.wings = wm; }
      return m;
    };
    const jit = (r, k) => V3(r.range(-k, k), r.range(-k, k), r.range(-k, k));
    const combPt = (c, cx, d, off) => V3(c.center.x + c.tangent.x * cx + c.normal.x * off, c.top - d, c.center.z + c.tangent.z * cx + c.normal.z * off);
    let baseN = [0, 0, 0];
    const hi = [], lo = [], speck = [], swarm = [], ballPos = V3(0, 0, 0), riverGaze = V3(-186, 232, 135);
    const tAb = uComb[2] * duration - 2.2;                 // the rare event: when the colony on comb three lets go
    {
      const fr = rng.fork('flyers');
      // loop on world time: A -> B, through M if given; inbound bees carry pollen
      const loop = (list, A0, B0, M, speed, inbound) => {
        const A1 = inbound ? B0 : A0, B1 = inbound ? A0 : B0, mid = A1.clone().add(B1).multiplyScalar(0.5);
        const C = M ? M.clone().sub(mid).multiplyScalar(2) : V3(fr.range(-40, 40), fr.range(-30, 50), fr.range(-40, 40));
        list.push({ A: A1, B: B1, C, t: [fr(), (A1.distanceTo(B1) + C.length() * 0.6) / speed, 0, fr.range(0.9, 1.12)], seed: fr(), pollen: inbound ? 1 : 0 });
      };
      const once = (list, A0, B0, C, t0, speed) => list.push({ A: A0, B: B0, C, t: [t0, (A0.distanceTo(B0) + C.length() * 0.6) / speed, 1, fr.range(0.95, 1.15)], seed: fr(), pollen: 0 });
      // the bee-line between the combs and the forest
      const forest = [V3(S.x - 90, 150, S.z + 120), V3(-420, 90, 760), V3(420, 250, 1150), V3(-60, -160, 900), V3(900, 120, 700)];
      const nLine = Math.round(290 * clamp(density, 0.75, 1.25) * (0.55 + 0.45 * detail));
      for (let k = 0; k < nLine; k++) {
        const c = A.combs[fr.int(0, 11)], f = forest[k % 5 === 0 ? 0 : fr.int(0, 4)];
        loop(lo, combPt(c, fr.range(-0.7, 0.7) * c.halfWidth, fr.range(6, c.depth * 0.9), fr.range(3.5, 9)), f.clone().add(jit(fr, 70)), null, fr.range(25, 33), fr.chance(0.5));
      }
      await ctx.yield();
      // head-on traffic along our own line through the void and the first pass
      for (let k = 0; k < 60; k++) {
        const dA = fr.range(40, uLadder * LEN - 30), a = fr.range(0, 6.28), rad = fr.range(4.6, 15), off = (d) => { path.tangentAtDist(d, T_); return path.posAtDist(d).addScaledVector(V3(-T_.z, 0, T_.x).normalize(), Math.cos(a) * rad).addScaledVector(UP, Math.sin(a) * rad * 0.8); };
        loop(hi, off(dA + 115), off(dA - 60), off(dA + 27), fr.range(26, 32), false);
      }
      // home with us: in from over the gorge along the axis of the cleft, through the tear, into the mouth, down to the portal
      for (let k = 0; k < 42; k++) {
        const L = fr.range(45, 95);
        loop(hi, tearP.clone().addScaledVector(axis, -L).add(jit(fr, 0.2 * L)), seatP.clone().add(jit(fr, 3.2)), tearP.clone().add(jit(fr, 3.5)), fr.range(27, 33), false);
        hi[hi.length - 1].pollen = 1;
      }
      // a thread of homing bees along the front of the combs from the north, converging on the glow in the tear
      for (let k = 0; k < 44; k++) {
        const xa = fr.range(-105, 75), A0 = V3(xa, fr.range(182, 197), hero.zBack(xa) + 26 + fr.range(7, 22)), B0 = tearP.clone().addScaledVector(axis, -fr.range(1.5, 6)).add(jit(fr, 3.5));
        const xm = (xa + B0.x) / 2, M = V3(xm, (A0.y + B0.y) / 2 + fr.range(0, 4), Math.max(hero.zBack(xm) + 26 + 13, (A0.z + B0.z) / 2) + fr.range(0, 7));
        loop(hi, A0, B0, M, fr.range(29, 36), false);
        hi[hi.length - 1].pollen = k % 2;
      }
      // guards peel off the upper tier behind the buzzard and stream after it in a comet; most of them from combs two and
      // one, so the comet is thickest as we bank in and fly north beside it
      const BZ = [], nBZ = Math.floor(0.66 / 0.004), nLad = Math.floor(0.22 / 0.004);       // the bird's track, sampled once
      for (let i = 0; i <= nBZ; i++) BZ.push(buzzAt(i * 0.004, V3(0, 0, 0)));
      await ctx.yield();
      for (let k = 0; k < 230; k++) {
        const c = A.combs[k % 5 < 3 ? fr.int(0, 1) : fr.int(2, 5)], p = combPt(c, fr.range(-0.8, 0.8) * c.halfWidth, fr.range(8, 30), 3);
        let i0 = 0; while (i0 < nLad && BZ[i0].x < p.x) i0++;                                                  // when the bird passes this bee
        const tS = i0 * 0.004 * duration + fr.range(-0.3, 2.4), v = fr.range(44, 62); let ib = Math.max(0, Math.ceil(tS / duration / 0.004) + 2);
        while (ib < nBZ && BZ[ib].distanceTo(p) > v * (ib * 0.004 * duration - tS)) ib++;                       // where it catches the bird
        once(speck, p, BZ[Math.min(ib, nBZ)].clone().add(jit(fr, 7)).addScaledVector(UP, -4), V3(fr.range(-10, 10), fr.range(-8, 8), fr.range(2, 18)), tS, v);
        if (k === 115) await ctx.yield();
      }
      await ctx.yield();
      // comb five: guards ball one hornet (or mob the second buzzard's wake)
      const c5c = A.combs[4];
      for (let k = 0; k < 40; k++) {
        const p = combPt(c5c, fr.range(-0.7, 0.7) * c5c.halfWidth, fr.range(8, 30), 3), tw = waves[k % 2 ? 1 : 2].u * duration + fr.range(0.3, 1.4);
        once(lo, p, V3(c5c.center.x + fr.range(-60, 20), fr.range(190, 240), c5c.center.z + fr.range(60, 130)), V3(fr.range(-10, 10), fr.range(-12, 6), fr.range(5, 25)), tw, fr.range(22, 30));
      }
      // the ball of bees round one hornet (only where there are hornets)
      const fb = rng.fork('ball');
      path.pointAt(uHornet + 0.002, P_); path.tangentAt(uHornet + 0.002, T_);
      ballPos.copy(P_).addScaledVector(V3(-T_.z, 0, T_.x).normalize(), 4).addScaledVector(UP, -7);
      if (hornetsHere) for (let k = 0; k < 56; k++) {
        const d = V3(fb.gauss(), fb.gauss(), fb.gauss()).normalize(), p = ballPos.clone().addScaledVector(d, fb.range(1.1, 2.5));
        lo.push({ A: p, B: p.clone().addScaledVector(V3(0, 0, 0).crossVectors(d, UP).normalize(), 0.5), C: V3(0, 0, 0), t: [fb(), fb.range(0.5, 1.1), 0, 0.9], seed: fb(), pollen: 0 });
      }
      // A swarm in the air over the gorge, 100 m off the north horn: a few hundred bees milling in a loose ball thirty metres
      // through. We pass it on the way out (it hangs before the snow wall), and from the far turn it stands in front of the
      // whole cliff, between the combs and the tree island.
      {
        // (its own list and its own model; not drawn until we have left the torn comb: it is half a kilometre off and behind the horn till then)
        const fs = rng.fork('swarm'), SWC = V3(243, 139, 133), pt = () => V3(SWC.x + clamp(fs.gauss() * 0.5, -1.25, 1.25) * 15, SWC.y + clamp(fs.gauss() * 0.5, -1.25, 1.25) * 9.5, SWC.z + clamp(fs.gauss() * 0.5, -1.25, 1.25) * 12);
        for (let k = 0; k < 300; k++) {
          const A0 = pt(), B0 = pt(), C = V3(fs.gauss(), fs.gauss() * 0.6, fs.gauss()).multiplyScalar(7), v = fs.range(8, 14);
          swarm.push({ A: A0, B: B0, C, t: [fs(), (A0.distanceTo(B0) + C.length() * 0.6) / v, 0, fs.range(0.95, 1.15)], seed: fs(), pollen: 0 });
        }
      }
      await ctx.yield();
      // The rare event: the colony on comb three absconds. Each bee lets go as the curtain unravels past it and joins one
      // river, and the river takes our own road: behind comb four, out through the gap into the light (it pours round the
      // lens all the way), then straight on, up and away over the gorge, while we wheel left for the cleft. The bees nearest
      // its axis are the detailed ones, timed to be about us while we are in it; the rest are the dark body of the stream.
      baseN = [hi.length, lo.length, speck.length];
      if (rare) {
        const c3 = A.combs[2], H = 17.5, uS0 = uGapIn - 0.015, SP = flyU.uSpine.value, K = [combPt(c3, 0, 16, 4)];
        for (let j = 0; j < 11; j++) K.push(path.pointAt(uS0 + j * H / LEN).add(V3(0, 0.6, 0)));
        const dirF = V3(-0.42, 0.3, 0.86).normalize();
        for (let j = 1; j <= 7; j++) { const d = H * (Math.pow(1.3, j) - 1) / Math.log(1.3); K.push(K[11].clone().addScaledVector(dirF, d).addScaledVector(UP, d * d * 0.0003)); }
        SP[0].copy(K[0]).multiplyScalar(2).sub(K[1]); for (let i = 0; i < 19; i++) SP[i + 1].copy(K[i]); SP[20].copy(K[18]).multiplyScalar(2).sub(K[17]);
        const slCam = (u) => H + (u - uS0) * LEN;             // how far down the river the camera is, in metres
        const nFar = Math.round(540 * (0.7 + 0.3 * detail)), nNear = 156, tIn = uGapIn * duration, tOut = (uHornet + 0.04) * duration;
        riverGaze.copy(K[15]);
        for (let k = 0; k < nFar + nNear; k++) {
          const near = k >= nFar, v = near ? fb.range(33, 40) : fb.range(44, 56);
          const d = fb.range(2, c3.depth * 0.92), cx = fb.range(-0.85, 0.85) * c3.halfWidth * Math.sqrt(Math.max(0.05, 1 - Math.pow(d / c3.depth, 2)));
          let tS = tAb + (d / c3.depth) * 6 + fb.range(0, 4.5);
          if (near) { const um = fb.range(uGapIn + 0.005, uHornet + 0.036); tS = Math.max(tAb, um * duration - (slCam(um) + fb.range(-4, 24)) / v); }
          const rad = near ? 1.8 + 4.6 * Math.sqrt(fb()) : 3.5 + 8.5 * Math.pow(fb(), 0.75);
          // a bee of the body that passes within 30 m of us while we are in the river gets the rounder model
          let close = false; for (let t = Math.max(tIn, tS); t <= tOut && !close; t += 0.3) close = Math.abs(v * (t - tS) - slCam(t / duration)) < 19;
          (near ? hi : close ? lo : speck).push({ A: combPt(c3, cx, d, 2.2), B: V3(0, 0, 0), C: V3(rad, fb.range(0, 6.283), fb.range(-0.5, 0.5)), t: [tS, v, 2, fb.range(0.95, 1.15)], seed: fb(), pollen: 0 });
          if ((k & 127) === 127) await ctx.yield();
        }
      }
    }
    await ctx.yield();
    // the river's bees are the last of each list and are not drawn at all until just before the colony lets go
    const flyM = [makeFlyers(hi, beeHiGeo(), flyHiMat, flyWingMat), makeFlyers(lo, beeLoGeo(false), flyLoMat), makeFlyers(speck, beeLoGeo(true), flyLoMat)], allN = [hi.length, lo.length, speck.length];
    const flyWings = flyM[0].userData.wings;
    await ctx.yield();
    const swarmM = makeFlyers(swarm, beeMidGeo(), flySwarmMat, flySwarmWingMat), swarmN = swarm.length;
    await ctx.yield();

    // ---------- companions, hornets, buzzards, our own body ----------
    const hx = (h, k = 1) => rgb(col(h), k);
    const creaU = { uPale: { value: pale }, uFlap: { value: new THREE.Vector4(0, 0, 2.4, 0.7) } };
    const creaMat = mat(CREA_VS, CREA_FS, creaU);
    const buzzU = { uPale: { value: pale }, uFlap: { value: new THREE.Vector4(0, 0.78, 2.4, 0.7) } };
    const buzzMat = mat(CREA_VS, CREA_FS, buzzU);
    const fanMat = mat(FAN_VS, FAN_FS, { uFan: { value: new THREE.Vector4(0.34, 0.36, 0.4, 0.11) }, uClA: flyU.uClA, uClB: flyU.uClB }, { transparent: true, depthWrite: false });
    const dyn = (geo, material, n) => { const m = new THREE.InstancedMesh(geo, material, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; scene.add(m); return m; };
    const dk = rgb(beeDark), tawny = [0.42, 0.26, 0.07];
    const beeGeo = insectGeo({
      abdomen: [[-0.63, 0.03, dk], [-0.56, 0.1, dk], [-0.45, 0.17, dk], [-0.3, 0.2, dk], [-0.15, 0.19, dk], [-0.02, 0.15, [0.26, 0.15, 0.04]], [0.06, 0.08, [0.3, 0.17, 0.05]]], bands: 1,
      thorax: [[0.05, 0.09], [0.1, 0.17], [0.2, 0.215], [0.3, 0.19], [0.38, 0.1]], fur: tawny, head: [[0.38, 0.1, 0.1], [0.45, 0.16, 0.15], [0.52, 0.14, 0.13], [0.58, 0.06, 0.06]], headCol: rgb(beeDark, 1.3),
      eye: [0.02, 0.016, 0.014], legs: dk, legZ: [0.3, 0.22, 0.14], legLen: 0.5, dangle: 0.02, pollen: rgb(pale, 0.95),
    });
    const NCOMP = 5, compMesh = dyn(beeGeo, creaMat, NCOMP), compFan = dyn(fanGeo(0.82, 0.12, 0.2), fanMat, NCOMP);
    const COMP = [[9.5, -5, 1.3], [7.2, 4.2, -1.7], [13.5, 6.6, 2.3], [6.6, -3.5, -2.3], [10.5, 3.1, 2.7]].map(([lead, lat, up], i) => ({ lead: lead + layout.range(-1, 1), lat: lat + layout.range(-0.6, 0.6), up: up + layout.range(-0.4, 0.4), ph: i * 1.7 + layout.range(0, 1) }));
    const _m = new THREE.Matrix4(), _x = V3(0, 0, 0), _y = V3(0, 0, 0), _z = V3(0, 0, 0), _p = V3(0, 0, 0), _q = V3(0, 0, 0), _l = V3(0, 0, 0);
    // pose a creature: forward f (need not be unit), bank about it, at p, scaled
    const pose = (p, f, bank, sc) => {
      _z.copy(f).normalize(); _x.crossVectors(UP, _z); if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0); _x.normalize(); _y.crossVectors(_z, _x);
      if (bank) { _x.applyAxisAngle(_z, bank); _y.applyAxisAngle(_z, bank); }
      return _m.set(_x.x * sc, _y.x * sc, _z.x * sc, p.x, _x.y * sc, _y.y * sc, _z.y * sc, p.y, _x.z * sc, _y.z * sc, _z.z * sc, p.z, 0, 0, 0, 1);
    };
    // (abeam the torn comb, and again from the far turn, we look well to the side of our course: the companions then hold
    // station where we look, flying our course, so they cross the picture broadside)
    const bump = (u, a, b, w) => smoothstep(a, a + w, u) * (1 - smoothstep(b - w, b, u));
    const _cq = V3(0, 0, 0), _cl = V3(0, 0, 0);
    const updateCompanions = (time, u, cf) => {
      const tight = lerp(1, 0.5, sstep(uLadder - 0.05, uLadder + 0.03, u)), kg = cf ? 0.85 * Math.max(bump(u, uSix - 0.06, uSix + 0.05, 0.03), bump(u, uFar - 0.03, uLadder - 0.02, 0.03)) : 0;
      if (kg > 0) { _cq.set(cf.x, cf.y * 0.4, cf.z).normalize(); _cl.set(-cf.z, 0, cf.x).normalize(); }
      for (let i = 0; i < NCOMP; i++) {
        const c = COMP[i], lead = c.lead + 1.6 * Math.sin(time * 0.55 + c.ph), d = u * LEN + lead * (1 - kg);
        path.posAtDist(d, _p); path.tangentAtDist(d, T_); _l.set(-T_.z, 0, T_.x).normalize();
        if (kg > 0) { _p.addScaledVector(_cq, lead * kg * 1.2); _l.lerp(_cl, kg).normalize(); }
        const wv = Math.sin(time * 0.9 + c.ph), wy = Math.sin(time * 1.3 + c.ph * 2);
        _p.addScaledVector(_l, c.lat * tight + 0.7 * wv).addScaledVector(UP, c.up * lerp(0.6, 1, tight * 2 - 1) + 0.5 * wy);
        _q.copy(T_).addScaledVector(_l, 0.12 * Math.cos(time * 0.9 + c.ph)).addScaledVector(UP, 0.1 * Math.cos(time * 1.3 + c.ph * 2));
        pose(_p, _q, -0.35 * Math.cos(time * 0.9 + c.ph), 1);
        compMesh.setMatrixAt(i, _m); compFan.setMatrixAt(i, _m);
      }
      compMesh.instanceMatrix.needsUpdate = true; compFan.instanceMatrix.needsUpdate = true;
    };
    await ctx.yield();
    // Hornets. Two leaders hang in the gap between combs four and five as we come out of the alley (one against the dark
    // back of comb five, one against the roof shadow), fall back before us round the rim of comb five and along its
    // curtain 12 m ahead, lunge at it, and take station; three more hawk further along; the sixth is balled by guards.
    // Everything is keyed to u, so they are in frame from the gap (u 0.80) until we wheel away (u 0.86).
    const NHOR = 6, HSC = 2.0;
    let hornMesh = null, hornFan = null; const HOR = [];
    const pws = (x, tab) => { if (x <= tab[0][0]) return tab[0][1]; for (let k = 1; k < tab.length; k++) if (x <= tab[k][0]) return lerp(tab[k - 1][1], tab[k][1], smoothstep(tab[k - 1][0], tab[k][0], x)); return tab[tab.length - 1][1]; };
    const HA = uGapOut - 0.0185;
    const hornAt = (h, u, out) => {            // a leader's place at u (h.l is left pointing at the comb side of our line there)
      const D = Math.min(Math.max(u, HA) * LEN + h.ahead, h.stop), uh = D / LEN;
      path.posAtDist(D, out); path.tangentAtDist(D, T_); h.l.set(-T_.z, 0, T_.x).normalize();
      return out.addScaledVector(h.l, pws(uh, h.lat)).addScaledVector(UP, pws(uh, h.up));
    };
    if (hornetsHere) {
      const or = [0.9, 0.3, 0.025], dkb = [0.05, 0.03, 0.02];
      hornMesh = dyn(insectGeo({
        abdomen: [[-0.66, 0.03, or], [-0.58, 0.12, dkb], [-0.48, 0.18, or], [-0.38, 0.21, dkb], [-0.27, 0.22, or], [-0.16, 0.21, dkb], [-0.06, 0.17, or], [0.04, 0.09, dkb]], bands: 0,
        thorax: [[0.03, 0.1], [0.1, 0.19], [0.2, 0.23], [0.3, 0.2], [0.38, 0.11]], fur: [0.16, 0.09, 0.05], head: [[0.38, 0.11, 0.1], [0.46, 0.2, 0.18], [0.55, 0.19, 0.17], [0.63, 0.08, 0.08]], headCol: or,
        eye: [0.1, 0.04, 0.02], legs: [0.5, 0.2, 0.04], legZ: [0.3, 0.22, 0.14], legLen: 0.72, dangle: 0.17, pollen: null,
      }), creaMat, NHOR);
      hornFan = dyn(fanGeo(1.0, 0.14, 0.22), mat(FAN_VS, FAN_FS, { uFan: { value: new THREE.Vector4(0.5, 0.34, 0.14, 0.15) }, uClA: flyU.uClA, uClB: flyU.uClB }, { transparent: true, depthWrite: false }), NHOR);
      const g = uGapOut;
      HOR.push({ lead: 1, ahead: 12.5, stop: (uHornet + 0.008) * LEN, lat: [[g - 0.002, 7.2], [g + 0.0015, 6.4], [g + 0.0065, 2.0], [g + 0.0115, 2.0], [g + 0.0215, 6.5]], up: [[g - 0.002, 5.0], [g + 0.006, 3.6], [g + 0.0215, 2.6]], p: V3(0, 0, 0), l: V3(0, 0, -1), ph: 0, wave: 1 });
      HOR.push({ lead: 1, ahead: 9.5, stop: (uHornet + 0.0035) * LEN, lat: [[g - 0.004, 9.0], [g - 0.0005, 8.2], [g + 0.0045, 2.4], [g + 0.0125, 2.6], [g + 0.0235, 8.0]], up: [[g - 0.004, 6.4], [g + 0.005, 4.8], [g + 0.0235, 4.2]], p: V3(0, 0, 0), l: V3(0, 0, -1), ph: 2.1, wave: 1 });
      [[18, 9, -2.6], [29, 9.4, -0.6], [36, 7, 3]].forEach(([ahead, lat, up], i) => {
        const uu = uHornet + ahead / LEN; path.pointAt(uu, P_); path.tangentAt(uu, T_); const l = V3(-T_.z, 0, T_.x).normalize();
        HOR.push({ lead: 0, p: P_.clone().addScaledVector(l, lat).addScaledVector(UP, up), l, ph: 4.2 + i * 2.1, wave: 2 });
      });
      HOR.push({ lead: 0, p: ballPos.clone(), l: V3(0, 0, -1), ph: 9, wave: -1 });
    }
    // where the gaze rests from the gap to comb five: on the two leaders, then on the hornets on station (or, where there
    // are no hornets, on the curtain of comb five beyond its north rim)
    const hornGaze = V3(0, 0, 0), _g1 = V3(0, 0, 0), c5a = A.combs[4], c5front = combPt(c5a, 0.42 * c5a.halfWidth, 17, 1);
    const hornTarget = (time, u) => {
      if (!hornetsHere) return c5front;
      hornAt(HOR[0], u, hornGaze); hornAt(HOR[1], u, _g1); hornGaze.lerp(_g1, 0.5);
      _g1.copy(HOR[2].p).lerp(HOR[3].p, 0.5);
      return hornGaze.lerp(_g1, smoothstep(uHornet - 0.004, uHornet + 0.011, u));
    };
    const updateHornets = (time, u) => {
      if (!hornMesh) return;
      const st = u * duration, tRet = waves[2].u * duration + 1.3;
      for (let i = 0; i < NHOR; i++) {
        const h = HOR[i]; _p.copy(h.p);
        if (h.wave < 0) { _p.y -= 3 * sstep(tRet, tRet + 6, st); _p.x += 0.15 * Math.sin(time * 9); _q.set(Math.sin(time * 0.7), -0.3, Math.cos(time * 0.7)); pose(_p, _q, 0.8 * Math.sin(time * 5), HSC); }
        else {
          let fwd = 0, k = 1;
          if (h.lead) {                         // falling back before us: it flies crabwise, broadside to our road (so we see its banded flank), and keeps its weave small in the gap
            hornAt(h, u, _p);
            const uStop = (h.stop - h.ahead) / LEN;
            fwd = sstep(HA - 0.012, HA, u) * (1 - sstep(uStop - 0.004, uStop + 0.004, u)); k = 0.45;
          }
          const tau = st - waves[h.wave].u * duration + 0.35, lunge = sstep(0, 0.4, tau) * (1 - sstep(0.55, 1.4, tau)), ret = sstep(0, 3.5, st - tRet - i * 0.25);
          _p.addScaledVector(h.l, (h.lead ? 3.2 : 4.2) * lunge - 26 * ret).addScaledVector(UP, k * 1.1 * Math.sin(time * 1.9 + h.ph) + 9 * ret);
          _p.x += k * 0.9 * Math.sin(time * 1.3 + h.ph * 2); _p.z += k * 0.5 * Math.cos(time * 2.3 + h.ph);
          _q.copy(h.l).multiplyScalar(1 - 1.8 * ret).addScaledVector(T_, 0.15 * fwd); _q.x += 0.35 * Math.sin(time * 0.8 + h.ph) - 0.6 * ret; _q.y += -0.15 + 0.5 * lunge;
          pose(_p, _q, 0.25 * Math.sin(time * 1.7 + h.ph), HSC);
        }
        if (h.lead) h.p.copy(_p);
        hornMesh.setMatrixAt(i, _m); hornFan.setMatrixAt(i, _m);
      }
      hornMesh.instanceMatrix.needsUpdate = true; hornFan.instanceMatrix.needsUpdate = true;
    };
    // the buzzard (a second one where there are no hornets)
    const NBUZ = hornetsHere ? 1 : 2;
    const buzz = dyn(buzzardGeo({ top: hx('#4b3a2a'), head: hx('#7e8996'), cere: hx('#c9a23a', 0.8), beak: hx('#17140f'), pale: hx('#e6d8ba', 0.8) }), buzzMat, NBUZ);
    const _b0 = V3(0, 0, 0), _b1 = V3(0, 0, 0), _b2 = V3(0, 0, 0), _bz = V3(0, 0, 0);
    const updateBuzzards = (time, u) => {
      buzzU.uFlap.value.x = time * 2.6;
      // it beats its wings along the tier and making off; wheeling out over the gorge it glides, wings spread
      buzzU.uFlap.value.y = 0.78 - 0.6 * smoothstep(0.19, 0.23, u) * (1 - smoothstep(0.37, 0.42, u));
      for (let i = 0; i < NBUZ; i++) {
        const uu = Math.max(0, u - i * 0.05), e = 0.006;
        if (i === 0) {
          buzzAt(uu, _b0); buzzAt(uu + e, _b1); buzzAt(uu - e, _b2);
          _q.subVectors(_b1, _b2); buzzPos.copy(_b0);
          _b0.y += 1.3 * Math.sin(time * 2.6 + 1.2);                                                   // the body rides its own wingbeat
          // raking the tier it carries its wall-side wing low; round its circle it is banked to the right, into the turn
          const rake = 0.35 * smoothstep(0.02, 0.06, uu) * (1 - smoothstep(0.13, 0.17, uu)), wheel = 0.75 * smoothstep(0.17, 0.215, uu) * (1 - smoothstep(0.365, 0.41, uu));
          pose(_b0, _q, wheel - rake, 1);
        } else {
          // (the second bird, where there is one, works north before the lower tier, a hundred metres below the first and
          // always ahead of us: never within 55 m of our line)
          const xb = -60 + uu * 1750, zb = (x) => hero.zBack(x) + 62 + 0.12 * Math.max(0, x - 260);
          _b0.set(xb, 104 + 4 * Math.sin(uu * 40) + 1.3 * Math.sin(time * 2.6 + 2.2), zb(xb)); _q.set(10, 0, zb(xb + 5) - zb(xb - 5));
          pose(_b0, _q, -0.3, 1);
        }
        buzz.setMatrixAt(i, _m);
      }
      buzz.instanceMatrix.needsUpdate = true;
    };
    // Our own body, built round the camera and carried with it: the furred top of our thorax along the bottom edge of the
    // frame (amber fur with a darker saddle, a soft golden fringe against the picture), our two antennae rising from behind it in a soft
    // elbowed curve, out and forward, and a blur of wing in the upper corners. No legs: they are tucked. It is lit in the
    // camera's own space (BODY_FS), so it reads as a bee in every light.
    const body = new THREE.Group(); body.matrixAutoUpdate = false; scene.add(body);
    const bodyU = { uKey: { value: HU.uSunCol.value.clone().multiplyScalar(0.5) }, uFill: { value: HU.uSkyCol.value.clone().multiplyScalar(0.9) }, uGlow: { value: new THREE.Color(1.25, 0.72, 0.26) }, uDim: { value: 0 } };
    const bodyMat = new THREE.ShaderMaterial({ uniforms: { ...bodyU, uSoft: { value: 0 } }, vertexShader: BODY_VS, fragmentShader: BODY_FS, side: THREE.DoubleSide });
    const furMat = new THREE.ShaderMaterial({ uniforms: { ...bodyU, uSoft: { value: 1 } }, vertexShader: BODY_VS, fragmentShader: BODY_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false });
    // The trunk (thorax, fringe, antennae) is one group about the centre of the thorax, 1 m ahead of the eye. It is placed
    // from the camera's projection every frame (updateBody): its size follows the width of the view and its height is set
    // so that the crest of the fur stands the same small share above the bottom edge at any field of view and any shape
    // of screen (the engine opens the view right up on an upright phone, which used to bring the whole dome into frame).
    const trunk = new THREE.Group(); trunk.position.set(0, -0.83, -1.0); body.add(trunk);
    const ants = [-1, 1].map((sx) => { const m = new THREE.Mesh(antennaGeo(), bodyMat); m.position.set(sx * 0.085, 0.088, -0.22); m.scale.set(sx, 1, 1); m.frustumCulled = false; trunk.add(m); return m; });
    await ctx.yield();
    {
      const tg = await thoraxGeo(ctx, ctx.core.makeRng(hashSeed('fur')));
      const thorax = new THREE.Mesh(tg.skin, bodyMat); thorax.frustumCulled = false; trunk.add(thorax);
      const fur = new THREE.Mesh(tg.fur, furMat); fur.frustumCulled = false; fur.renderOrder = 7; trunk.add(fur);
    }
    await ctx.yield();
    let blur = null;
    {
      const F = GB({ aUv: 2 });
      for (const sx of [-1, 1]) {
        const c = F.v(sx * 1.62, 1.12, -1.05, { aUv: [0.15, 0] }), rim = [];
        for (let k = 0; k <= 7; k++) { const b = (8 + k * 10) * DEG; rim.push(F.v(sx * (1.62 - Math.cos(b) * 0.62), 1.12 - Math.sin(b) * 0.62, -1.05 - 0.1 * k / 7, { aUv: [0.8, k / 7 * 2 - 1] })); }
        for (let k = 0; k < 7; k++) F.tri(c, rim[k], rim[k + 1]);
      }
      blur = new THREE.Mesh(F.geometry(), mat(FAN_VS, FAN_FS, { uFan: { value: new THREE.Vector4(0.6, 0.62, 0.66, 0.14) }, uClA: flyU.uClA, uClB: flyU.uClB }, { transparent: true, depthWrite: false })); blur.frustumCulled = false; blur.renderOrder = 5; body.add(blur);
    }
    const _dir = V3(0, 0, -1), _prevDir = V3(0, 0, -1); let turnS = 0;
    const TH0 = Math.tan(31 * DEG), TW0 = TH0 * 16 / 9, CREST = 0.052;          // the view the body was drawn for; the share of the frame's height under the crest of the skin
    const updateBody = (dt, time, camera, u) => {
      body.matrix.copy(camera.matrixWorld); body.matrixWorldNeedsUpdate = true;
      _dir.set(-camera.matrixWorld.elements[8], -camera.matrixWorld.elements[9], -camera.matrixWorld.elements[10]);
      const yawRate = dt > 1e-4 ? clamp((_prevDir.z * _dir.x - _prevDir.x * _dir.z) / dt, -1.5, 1.5) : 0;
      turnS += (yawRate - turnS) * Math.min(1, dt * 3); _prevDir.copy(_dir);
      // the antennae feel the air and lean into each turn; the thorax rides the wingbeat
      for (let i = 0; i < 2; i++) {
        const sx = i ? 1 : -1;
        ants[i].rotation.set(0.05 * Math.sin(time * 1.1 + i * 2) + 0.025 * Math.sin(time * 3.7 + i), 0.05 * Math.sin(time * 0.9 + i * 1.7) * sx, 0.05 * Math.sin(time * 1.6 + i * 3) + 0.22 * turnS);
      }
      // where the trunk sits: read the half-height and half-width of the view at 1 m from the projection; the size goes
      // with the width (never over 45% of it), and the height puts the line from the eye that grazes the dome CREST of
      // the frame above its bottom edge (the tangent from the eye to an ellipse of half-axes b up and a forward, 1 m off)
      const pe = camera.projectionMatrix.elements, th = pe[5] > 1e-3 ? 1 / pe[5] : TH0, tw = pe[0] > 1e-3 ? 1 / pe[0] : TW0;
      const sc = clamp(tw / TW0, 0.42, 1.15), M = (1 - 2 * CREST) * th, a = sc * THX.RZ, b = sc * THX.RY;
      trunk.scale.setScalar(sc);
      trunk.position.y = -M - Math.sqrt(a * a * M * M + b * b) + 0.005 * sc * Math.sin(time * 2.3); trunk.rotation.z = 0.1 * turnS;
      blur.scale.set(tw / TW0, th / TH0, 1);
      bodyU.uDim.value = smoothstep(uMouth - 0.012, uMouth + 0.012, u);
      body.visible = u > 0.0004;
    };
    await ctx.yield();
    // a pair of Himalayan griffons, each some 66 m across, wheeling over the gorge: the measure of the place. One hangs over
    // the scrub ridge to the north-east, ahead of us as we swing out over the gorge; the other is high off the north horn.
    // A third, a young bird half their size, quarters the lower wall before the lower tier: from the far turn it is the
    // measure of the lower wall (it is 60 m and more off the combs, and 50 m below our line).
    const grifU = { uPale: { value: pale }, uFlap: { value: new THREE.Vector4(0, 0.1, 2.4, 0.7) } };
    const griffon = dyn(buzzardGeo({ top: hx('#5d4d3a'), head: hx('#d8cfb8'), cere: hx('#8a8a80'), beak: hx('#2a2620'), pale: hx('#d9c9a4', 0.8) }), mat(CREA_VS, CREA_FS, grifU), 3);
    const GRIF = [{ c: V3(560, 192, 420), r: 62, a0: 0.4, w: 0.1 }, { c: V3(398, 236, 74), r: 50, a0: 2.6, w: -0.12 }, { c: V3(150, 100, 95), r: 30, a0: 1.2, w: 0.14, s: 0.8 }], grifPos = V3(0, 0, 0), grifProbe = V3(0, 0, 0);
    const updateGriffon = (time) => {
      grifU.uFlap.value.x = time * 0.9;
      for (let i = 0; i < 3; i++) {
        const g = GRIF[i], a = g.a0 + time * g.w, sg = Math.sign(g.w);
        grifPos.set(g.c.x + Math.cos(a) * g.r, g.c.y + 9 * Math.sin(time * 0.11 + i * 2), g.c.z + Math.sin(a) * g.r);
        _q.set(-Math.sin(a) * sg, 0.02 * Math.cos(time * 0.11 + i * 2), Math.cos(a) * sg);
        pose(grifPos, _q, 0.4 * sg, g.s || 1.55); griffon.setMatrixAt(i, _m); if (i === 1) grifProbe.copy(grifPos);
      }
      griffon.instanceMatrix.needsUpdate = true;
    };
    updateGriffon(0);
    // the honeyguide, pecking old wax on the rim of the cleft
    let guide = null;
    if (guideHere) {
      const dir = A.portalSeat.direction, rt = V3(-dir.z, 0, dir.x).normalize(), perch = A.cleftMouth.clone().addScaledVector(rt, 19.6).addScaledVector(UP, -6);
      perch.z = hero.wallPoint(perch.x, perch.y)[2] + 0.5;
      instanced(cushionGeo(col(PAL[5]).lerp(col(PAL[3]), 0.3).multiplyScalar(0.7)), plantMat, [{ m: yawM(perch.clone().addScaledVector(UP, -2.2), 0.4, 3.6, 4.4, 3.2), seed: 0.3 }]);
      guide = new THREE.Mesh(honeyguideGeo(), creaMat); guide.position.copy(perch); guide.rotation.order = 'YXZ'; guide.rotation.y = Math.PI + 0.35; scene.add(guide);
      if (!clearOf(perch, 10)) guide.visible = false;
    }
    await ctx.yield();

    // ---------- air: pollen, petals, cloud shreds out of the gorge (or a cloud sea), drips after rain ----------
    const pollen = makeParticles({ rng, preset: 'pollen', count: Math.round(1100 * detail), box: [64, 38, 64], colors: ['#f6e7a8', '#f2c14a', '#fff6d8'], size: [0.07, 0.2] });
    scene.add(pollen.object);
    const petals = makeParticles({ rng, preset: 'petals', count: Math.round(420 * detail), box: [56, 34, 56], colors: autumn ? ['#f6c3d0', '#ffdfe6', '#e895ad'] : ['#d01f2b', '#e8404a', '#8f1119'], size: [0.35, 0.8], lightDir: sunDir.toArray() });
    scene.add(petals.object);
    let drips = null;
    if (rain) { drips = makeParticles({ rng, preset: 'rain', count: Math.round(700 * detail), box: [60, 44, 60], opacity: 0.45 }); scene.add(drips.object); }
    await ctx.yield();
    const cr = rng.fork('cloud'), shreds = [];
    const nShred = sea ? 3 : rain ? 11 : 6 + Math.floor(cr() * 3);
    for (let k = 0; k < nShred; k++) shreds.push([cr.range(-900, 2000), sea ? cr.range(40, 160) : cr.range(-560, rain ? 110 : 20), cr.range(rain ? 300 : 380, 1700), cr.range(190, 430)]);
    shreds.push([395, 30, 700, 330], [290, 24, 770, 260]);                     // one stands east of the hairpin, behind the wheeling griffon
    // the clouds' tileable noise (fbm in R and G, shifted copies of R in B and A), made here in slices so that no build step is long
    const cloudNoise = await (async () => {
      const size = 256, N = size * size, f = [new Float32Array(N), new Float32Array(N)], nr = rng.fork('cloudnoise');
      const ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
      for (let ch = 0; ch < 2; ch++) {
        const acc = f[ch];
        for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
          const lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = nr();
          for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
          for (let y = 0; y < size; y++) {
            const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
            for (let x = 0, q = y * size; x < size; x++, q++) {
              const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x], top = a + (b - a) * w;
              acc[q] += amp * (top + (c + (d - c) * w - top) * wy);
            }
            if ((y & 63) === 63) await ctx.yield();
          }
          await ctx.yield();
        }
      }
      const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = new Uint8Array(N * 4), m = size - 1;
      const px = (v) => Math.max(0, Math.min(255, ((v / norm - 0.5) * 1.75 + 0.5) * 255));
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const q = y * size + x, s1 = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
          data[q * 4] = px(f[0][q]); data[q * 4 + 1] = px(f[1][q]); data[q * 4 + 2] = px(f[0][s1]); data[q * 4 + 3] = px(f[0][s2]);
        }
        if ((y & 63) === 63) await ctx.yield();
      }
      await ctx.yield();
      const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
      tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
      return tex;
    })();
    const shredField = makeCloudField({ rng, sky, mode: 'cumulus', at: shreds, puffs: 20, height: 0.5, wind: [1.6, rain ? 3 : 2.2, 0.5], opacity: 0.7, noiseTexture: cloudNoise });
    scene.add(shredField.object);
    await ctx.yield();
    let seaField = null;
    if (sea) {
      // a sea with form: tall billows and turrets, their sunward sides warm white, their troughs and lee sides blue
      seaField = makeCloudField({ rng, sky, mode: 'sea', altitude: -44, relief: 104, towers: 0.42, bump: 1.7, softness: 0.3, noiseTexture: shredField.noiseTexture, wind: [2.2, 0, 0.8] });
      { const su = seaField.uniforms; su.uLit.value.set('#dcd5c7'); su.uShade.value.set('#536ea6'); su.uBottom.value.set('#3a5284'); su.uLight.value.x = 0.15;
        // (the sea is modelled by a lower sun than the rock's: seen from above, a cloud top under a high sun is one white sheet)
        const sd = su.uSunDir.value; sd.y *= 0.2; sd.normalize(); }
      scene.add(seaField.object);
      await ctx.yield();
    }
    // The portal's light spilling out of the cleft: a glow in the mouth, the lit air in front of it, a glow where it comes
    // through the tear in comb six, and shafts of it reaching out over the gorge. This is what marks the way home from the
    // far end of the alley behind the combs, long before the mouth itself can be seen.
    const glowAt = (pt, size, intensity, core, near) => { const g = makeGlow({ position: [pt.x, pt.y, pt.z], color: '#ffb648', size, intensity, halo: 1, core, flicker: 0.05, depthBias: 0.06, near, fogAmount: 0.4 }); scene.add(g.object); return g; };
    const glows = [
      glowAt(A.cleftMouth.clone().addScaledVector(axis, -1.5), 38, 1.7, 0.25, [0.25, 1.2]),
      glowAt(A.cleftMouth.clone().addScaledVector(axis, -12), 112, 3.2, 0, [0.3, 1.1]),          // the lit air of the alley, seen from far down it
      glowAt(tearP.clone().addScaledVector(axis, -6), 120, 2.6, 0, [0.3, 1.1]),                  // and what comes through the tear, seen from out over the gorge
    ];
    const shafts = makeGodRays({ rng, position: A.cleftMouth.toArray(), direction: [-axis.x, -axis.y, -axis.z], radius: 7, count: Math.round(12 * (0.6 + 0.4 * detail)), length: 80, width: [2.2, 9.5], color: '#ffc468', intensity: 0.9, falloff: 1.2 });
    scene.add(shafts.object);
    await ctx.yield();
    // ---------- THE BEE-LINE (added; everything above stands as it was) ----------
    // The design: "800 foragers flying a bee-line between forest and cliff, returning ones carrying cream pollen loads";
    // "then open air in the bee-line"; "outbound foragers flick past head-on at 50 m/s closing speed".
    // A river of bees with bodies, as a place in the air. Its line is found from places built above: from the bough's last
    // twig it runs straight for the place where our road turns north along the tiers, and from there it is the road's own
    // line: north beside the tiers, out over the gorge, round the far turn and in as far as the honey hunters' ladder. Its
    // lanes leave it for their combs (comb one, comb two and the two under them): four in nine of them from the
    // far turn, the others somewhere between the vista and there, straight across the bay; at the other end each lane goes
    // into a bell of the bough. The bees are dealt from a stream of their own ('bee-line' and the world's seed; no other
    // stream is drawn from) and fly on world time alone, each along its own lane for ever, every other one outbound and the
    // rest homeward with pollen; one that reaches its bell or its comb starts again at the other end. They are strung out
    // and quick at the forest end, closer and slower from there on. Seventeen lanes in twenty lie in the core, a rope of
    // bees some 10 m through that runs beside the line (3.9 to 14 m off it) and passes over it; the rest are a loose sheath
    // about the line, out to 40 m. No lane comes within BEE_LINE.RMIN of the road's line anywhere, less the reach of a
    // bee's own weave (1.6 m): every lane is measured against the road here and dealt again if it does.
    // The lanes that come nearest the line carry the near model of a flying bee (beeHiGeo), the rest the swarm's (beeMidGeo
    // with pollen loads); the colours are the flyers' own, with the sun gold in the wing blur and in the fur. Four draws;
    // nothing of it is touched in update().
    {
      const lr = ctx.core.makeRng(hashSeed('bee-line:' + sn));
      const NK = BEE_LINE.NK, F = NK - 1, RMIN = BEE_LINE.RMIN, FA = BEE_LINE.FA, BEND = BEE_LINE.BEND, SPREAD = BEE_LINE.SPREAD;
      // the places it is laid through: the bough's last twig, the turn north, the end of the far turn, the ladder
      const E0 = pts[3], uNorth = uNearest(FT[RT.north], uSix);
      await ctx.yield();
      const uEnd = uNearest(FT[RT.ladder], uFar), dJ = uNorth * LEN, dFar = uFar * LEN, dEnd = uEnd * LEN;
      await ctx.yield();
      const dVista = uNearest(FT[RT.vista], uTiers) * LEN;
      await ctx.yield();
      const J = path.posAtDist(dJ), TJ = path.tangentAtDist(dJ, V3(0, 0, 0)), reach = E0.distanceTo(J) / 3;
      const lead = new THREE.CubicBezierCurve3(E0.clone(), E0.clone().lerp(J, 1 / 3), J.clone().addScaledVector(TJ, -reach), J.clone());
      const poly = [], cum = [0];
      for (let i = 0; i <= 60; i++) poly.push(lead.getPoint(i / 60));
      for (let d = dJ + 3; d < dEnd - 1; d += 3) poly.push(path.posAtDist(d));
      poly.push(path.posAtDist(dEnd));
      for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + poly[i].distanceTo(poly[i - 1]));
      const total = cum[cum.length - 1], sJ = cum[60], fJ = F * sJ / total, fB = F * (sJ + dFar - dJ) / total, fV = F * (sJ + dVista - dJ) / total, fT = F * (sJ + uTiers * LEN - dJ) / total;
      // the core: a rope of lanes 10 m through whose middle runs 9 m off the line. Beside the tiers it lies above the line
      // on the gorge side; where the road swings out from the tiers it comes over the top, and from the vista on it lies
      // above the line on the cliff side (bearings round the line: 0 to the right, a quarter turn straight up)
      const ROPE = [9, 0.7, 1.22], ROPE_R = 5.1;
      // its knots, evenly spaced along it (the ends doubled outward), and the bend of the line at each (smoothed)
      const KX = new Float32Array((NK + 2) * 4), bend = new Float32Array(NK + 2), knot = V3(0, 0, 0), lineK = [];
      for (let j = 0, i = 1; j < NK; j++) {
        const sAt = total * j / F; while (i < cum.length - 1 && cum[i] < sAt) i++;
        knot.copy(poly[i - 1]).lerp(poly[i], clamp((sAt - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]), 0, 1));
        KX[(j + 1) * 4] = knot.x; KX[(j + 1) * 4 + 1] = knot.y; KX[(j + 1) * 4 + 2] = knot.z;
      }
      for (let a = 0; a < 3; a++) { KX[a] = 2 * KX[4 + a] - KX[8 + a]; KX[(NK + 1) * 4 + a] = 2 * KX[NK * 4 + a] - KX[(NK - 1) * 4 + a]; }
      for (let m = 1; m <= NK; m++) {
        const ax = KX[m * 4] - KX[m * 4 - 4], az = KX[m * 4 + 2] - KX[m * 4 - 2], bx = KX[m * 4 + 4] - KX[m * 4], bz = KX[m * 4 + 6] - KX[m * 4 + 2];
        bend[m] = Math.atan2(ax * bz - az * bx, ax * bx + az * bz) / Math.max(1, 0.5 * (Math.hypot(ax, az) + Math.hypot(bx, bz)));
      }
      for (let m = 1; m <= NK; m++) KX[m * 4 + 3] = 0.25 * bend[m - 1] + 0.5 * bend[m] + 0.25 * bend[m + 1];
      for (let m = 0; m < NK + 2; m++) lineK.push(new THREE.Vector4(KX[m * 4], KX[m * 4 + 1], KX[m * 4 + 2], KX[m * 4 + 3]));
      await ctx.yield();
      // where a lane is at knot f: the sum the vertex shader does (BEELINE_VS laneAt), done here to measure the lanes
      const _sp = [0, 0, 0], _st = [0, 0, 0];
      const laneAt = (f, c, out) => {
        const fc = clamp(f, 0, F - 1e-3), fi = Math.floor(fc), t = fc - fi, o = fi * 4;
        for (let a = 0; a < 3; a++) {
          const q0 = KX[o + a], q1 = KX[o + 4 + a], q2 = KX[o + 8 + a], q3 = KX[o + 12 + a], cb = q2 - q0, cc = 2 * q0 - 5 * q1 + 4 * q2 - q3, cd = -q0 + 3 * q1 - 3 * q2 + q3;
          _sp[a] = 0.5 * (2 * q1 + cb * t + cc * t * t + cd * t * t * t); _st[a] = 0.5 * (cb + 2 * cc * t + 3 * cd * t * t);
        }
        _st[0] += 1e-4; const il = 1 / Math.hypot(_st[0], _st[1], _st[2]); _st[0] *= il; _st[1] *= il; _st[2] *= il;
        let sx = -_st[2], sz = _st[0] + 1e-4; const sl = 1 / Math.hypot(sx, sz); sx *= sl; sz *= sl;
        const ux = -sz * _st[1], uy = sz * _st[0] - sx * _st[2], uz = sx * _st[1];
        const core = c.C.z > 5 ? 1 : 0, rope = ROPE[1] + ROPE[2] * smoothstep(fT, fV, fc), ang = c.C.y + (c.C.z - 10 * core) * fc + core * rope, wide = 1 + SPREAD * (1 - smoothstep(0, fJ, fc)), kap = lerp(KX[o + 7], KX[o + 11], t);
        let x = (c.C.x * Math.cos(ang) + core * ROPE[0] * Math.cos(rope)) * wide; const y = (c.C.x * Math.sin(ang) + core * ROPE[0] * Math.sin(rope)) * wide, ax = Math.abs(x) - RMIN;
        if (kap * x > 0 && ax > 0) x = Math.sign(x) * (RMIN + ax / (1 + BEND * Math.abs(kap) * ax));
        out.set(_sp[0] + sx * x + ux * y, _sp[1] + uy * y, _sp[2] + sz * x + uz * y);
        const away = c.z >= 1 ? 1 : 0;
        return out.lerp(c.A, 1 - smoothstep(0, FA, fc)).lerp(c.B, smoothstep(lerp(fV, fB, c.z - 2 * away), F, fc));
      };
      // the road's line, every 1.5 m as far as comb two, sorted into cells: a lane is clear if no sample of it (every
      // 1.6 m) lies within CL of any of these (so its true nearest approach is 3.4 m or more, and its bee's 1.8 m or more)
      const CELL = 8, CL = 3.6, grid = new Map(), fine = [];
      const key = (x, y, z) => (Math.floor(x / CELL) + 512) + (Math.floor(y / CELL) + 512) * 1024 + (Math.floor(z / CELL) + 512) * 1048576;
      for (let d = 0, dLast = uComb[1] * LEN + 40; d <= dLast; d += 1.5) {
        path.posAtDist(d, knot); fine.push(knot.x, knot.y, knot.z); const i = fine.length / 3 - 1;
        for (let c = 0; c < 8; c++) { const kk = key(knot.x + (c & 1 ? CL : -CL), knot.y + (c & 2 ? CL : -CL), knot.z + (c & 4 ? CL : -CL)); let g = grid.get(kk); if (!g) grid.set(kk, g = []); if (g[g.length - 1] !== i) g.push(i); }
      }
      await ctx.yield();
      const clearLane = (c) => {
        for (let f = 0; f <= F; f += 0.1) {
          laneAt(f, c, knot);
          const g = grid.get(key(knot.x, knot.y, knot.z));
          if (g) for (let i = 0; i < g.length; i++) { const o = g[i] * 3, dx = fine[o] - knot.x, dy = fine[o + 1] - knot.y, dz = fine[o + 2] - knot.z; if (dx * dx + dy * dy + dz * dz < CL * CL) return false; }
        }
        return true;
      };
      // the two ends of a lane: the mouth of a bell of the bough, and a place on the cloaked face of a comb at the north horn
      // (the comb's own middle plane: a bee goes in through the curtain and out through it)
      // (how deep in the bell: three quarters of the way from its hub to the tips of its stamens, measured on the bell as built)
      const bellY = bellMesh.geometry.attributes.position; let bellTop = 0;
      for (let i = 0; i < bellY.count; i++) bellTop = Math.max(bellTop, bellY.getY(i));
      const inBell = 0.74 * bellTop, mouths = bells.map((b) => { const e = b.m.elements; return V3(e[12] + e[4] * inBell, e[13] + e[5] * inBell, e[14] + e[6] * inBell); });
      const homes = [0, 0, 0, 1, 1, 6, 6, 7].map((i) => A.combs[i]);
      const home = () => { const c = lr.pick(homes), d = lr.range(14, c.depth * 0.75), w = c.halfWidth * Math.pow(1 - (d / c.depth) * (d / c.depth), 0.62); return combPt(c, lr.range(-0.6, 0.6) * w, d, 0); };
      const NB = Math.round(480 * (0.55 + 0.45 * detail)), NHI = Math.round(NB * 0.0583), lanes = [];
      for (let k = 0; k < NB; k++) {
        const core = k % 20 < 17, out = k % 2;
        for (let tries = 0; tries < 20; tries++) {
          // seventeen lanes in twenty are of the core (within ROPE_R of its middle), the rest of the sheath (4 to 40 m off the line);
          // four in nine turn for their combs at the far turn, the others somewhere between the vista and there
          const r = core ? ROPE_R * Math.pow(lr(), 0.6) : 4 + 36 * Math.pow(lr(), 1.15);
          const c = { A: lr.pick(mouths), B: home(), C: V3(r, lr.range(0, 6.2832), lr.range(-0.035, 0.035) + (core ? 10 : 0)), z: 2 * out + Math.min(0.999, lr() * 1.8), near: 0 };
          if (!clearLane(c)) continue;
          // (how near the line the lane comes between the turn north and the far turn)
          c.near = 1e9;
          for (let f = fJ; f <= fB; f += 0.5) { const tw = c.C.z - (core ? 10 : 0), a = c.C.y + tw * f; c.near = Math.min(c.near, core ? Math.hypot(ROPE[0] + r * Math.cos(a), r * Math.sin(a)) : r); }
          lanes.push({ A: c.A, B: c.B, C: c.C, z: c.z, near: c.near, t: [lr(), lr.range(27, 34), c.z, lr.range(1, 1.2)], seed: lr(), pollen: out ? 0 : 1 });
          break;
        }
        if ((k & 15) === 15) await ctx.yield();
      }
      await ctx.yield();
      // the lanes that come nearest the line get the near model
      lanes.sort((a, b) => a.near - b.near);
      const nearLanes = lanes.slice(0, NHI), farLanes = lanes.slice(NHI);
      // THE WHOLE ROAD (a pass over the lanes as dealt; nothing is drawn from the stream in it). The test above lays the
      // road only as far as comb two, and after comb two the road comes back past the place where the river meets it,
      // through the sheath: a lane of the sheath dealt across the road there puts its bee on the road. So the road is laid
      // here to the route's end; every lane is walked whole against the road after the end of the test above, and a
      // lane that is being turned is held against all of the road (in the first measure below walked against all of
      // it; in the second walked against the road after the test's end and held before it by the test above itself).
      // LIM, the distance a lane must keep, is a sum: 2.0 m of clear air, the weave at its extremes (BEELINE_VS main:
      // 1 + 0.3 to the side with 0.7 + 0.25 up or down) and the reach of the lane's own model at the lane's dealt size
      // (the model's furthest vertex from the bee's point, measured on the model as built).
      // A lane that keeps LIM from the road after the end of the test above stays as dealt. One that does not has its
      // dealt bearing (C.y) turned, either way, to an angle at which it keeps LIM from the whole road: the angle is
      // walked up in steps of 0.01 rad, the + side tried before the - side at each step, and halved four times between
      // the first step that passes and the one before it on that side. That is the least turn to 0.000625 rad where one
      // threshold lies between those two steps; an opening narrower than a step is walked over, and where both sides
      // pass at the same step the + side is taken. If no angle up to a half turn gives that, the same walk is made for LIM after the
      // end of the test above and, before it, the test above as it stands (clearLane: the distance every lane is dealt
      // to); if that gives none either, the lane stays as dealt (turned counts the three). Nothing else of a lane is changed.
      // How it is measured: the road is the chords between points 1.5 m apart (the test's own, and on to the end), each
      // sorted into every cell within RC of it (cells RC across, twice the test's CELL), so that a place finds in its own
      // cell every chord within RC of it and is known to stand RC or more from the road where it finds none.
      // SAG is the greatest, over the chords, of how far the route at a chord's middle distance stands off the chord's
      // middle (one place a chord), and is added to the distance asked.
      // A lane is walked at its bee's own point (the middle of the lane 0.03 knot behind and ahead, as BEELINE_VS main
      // takes it), knot by knot; the piece between two samples is taken as clear if both stand further from the chords
      // than the distance asked by the piece's whole length (d*d >= lim*lim + g*g: a straight piece needs half of g
      // there, the rest is room for the piece's bow off its chord, which is not measured here), and is halved if not; a
      // piece under a millimetre is taken at its ends.
      // A lane's model and its place in the list were given before the turn (near, above: for a lane of the core it reads
      // the dealt bearing, for a lane of the sheath its radius alone) and are kept through a turn.
      const hiGeo = beeHiGeo(), farGeo = beeLineGeo(), WEAVE = Math.hypot(1 + 0.3, 0.7 + 0.25), turned = [0, 0, 0];
      const reachOf = (g) => { const p = g.attributes.position; let r = 0; for (let i = 0; i < p.count; i++) r = Math.max(r, Math.hypot(p.getX(i), p.getY(i), p.getZ(i))); return r; };
      const nLive = fine.length / 3 - 1, road = fine.slice(), cells = new Map(), _bk = V3(0, 0, 0), _d2 = [0, 0];     // (chords from nLive on lie after the end of the test above)
      const RC = 2 * CELL, cellOf = (x, y, z) => key(x * CELL / RC, y * CELL / RC, z * CELL / RC);
      for (let d = 1.5 * (nLive + 1); d < LEN; d += 1.5) { path.posAtDist(d, knot); road.push(knot.x, knot.y, knot.z); }
      path.posAtDist(LEN, knot); road.push(knot.x, knot.y, knot.z);
      let SAG = 0;
      for (let i = 0, n = road.length / 3 - 1; i < n; i++) {
        const o = i * 3, lo = (a) => Math.floor((Math.min(road[o + a], road[o + 3 + a]) - RC) / RC) * RC, hi = (a) => Math.max(road[o + a], road[o + 3 + a]) + RC;
        for (let x = lo(0), x1 = hi(0); x <= x1; x += RC) for (let y = lo(1), y1 = hi(1); y <= y1; y += RC) for (let z = lo(2), z1 = hi(2); z <= z1; z += RC) { const kk = cellOf(x, y, z); let g = cells.get(kk); if (!g) cells.set(kk, g = []); g.push(i); }
        path.posAtDist(0.5 * (1.5 * i + Math.min(LEN, 1.5 * i + 1.5)), knot);
        SAG = Math.max(SAG, Math.hypot(knot.x - 0.5 * (road[o] + road[o + 3]), knot.y - 0.5 * (road[o + 1] + road[o + 4]), knot.z - 0.5 * (road[o + 2] + road[o + 5])));
      }
      await ctx.yield();
      // (the squares of a place's least distances to the chords the test above holds, _d2[0], and to those after its end, _d2[1]; RC's square where none is within RC; _d2[0] is measured only where all is passed, else it stays RC's square)
      const roadD2 = (x, y, z, all) => {
        const g = cells.get(cellOf(x, y, z)); _d2[0] = _d2[1] = RC * RC;
        if (g) for (let q = g.length - 1; q >= 0 && (all || g[q] >= nLive); q--) {
          const o = g[q] * 3, ex = road[o + 3] - road[o], ey = road[o + 4] - road[o + 1], ez = road[o + 5] - road[o + 2], px = x - road[o], py = y - road[o + 1], pz = z - road[o + 2];
          const tt = clamp((px * ex + py * ey + pz * ez) / Math.max(1e-9, ex * ex + ey * ey + ez * ez), 0, 1), dx = px - ex * tt, dy = py - ey * tt, dz = pz - ez * tt, d2 = dx * dx + dy * dy + dz * dz, w = g[q] >= nLive ? 1 : 0;
          if (d2 < _d2[w]) _d2[w] = d2;
        }
      };
      // (how much room a place has: the least of its squared distances less the squared distances asked; under 0, too near)
      let lim2 = 0, held2 = 0, jAt = 0;
      const room = (p) => { roadD2(p.x, p.y, p.z, held2 > 0); return Math.min(_d2[1] - lim2, _d2[0] - held2); };
      const beeOn = (f, c, out) => { laneAt(f - 0.03, c, _bk); return laneAt(f + 0.03, c, out).add(_bk).multiplyScalar(0.5); };
      const piece = (c, f0, x0, y0, z0, r0, f1, x1, y1, z1, r1) => {
        const g2 = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + (z1 - z0) * (z1 - z0);
        if (Math.min(r0, r1) >= g2 || g2 < 1e-6) return true;
        const fm = 0.5 * (f0 + f1); beeOn(fm, c, knot); const xm = knot.x, ym = knot.y, zm = knot.z, rm = room(knot);
        return rm >= 0 && piece(c, f0, x0, y0, z0, r0, fm, xm, ym, zm, rm) && piece(c, fm, xm, ym, zm, rm, f1, x1, y1, z1, r1);
      };
      // does lane c keep lim from the road after the end of the test above and held from the road before it (held 0: not asked)?
      // (the walk begins at the knot where the last one failed, which changes nothing but how soon a failing lane is told)
      const keeps = (c, lim, held) => {
        lim2 = (lim + SAG) * (lim + SAG); held2 = held > 0 ? (held + SAG) * (held + SAG) : 0;
        let x0 = 0, y0 = 0, z0 = 0, r0 = 0;
        for (let n = 0, j = jAt; n < F; n++, j = (j + 1) % F) {
          if (n === 0 || j === 0) { beeOn(j, c, knot); x0 = knot.x; y0 = knot.y; z0 = knot.z; r0 = room(knot); if (r0 < 0) { jAt = j; return false; } }
          beeOn(j + 1, c, knot); const x1 = knot.x, y1 = knot.y, z1 = knot.z, r1 = room(knot);
          if (r1 < 0 || !piece(c, j, x0, y0, z0, r0, j + 1, x1, y1, z1, r1)) { jAt = j; return false; }
          x0 = x1; y0 = y1; z0 = z1; r0 = r1;
        }
        return true;
      };
      // the turn of lane c's bearing, by the walk and the halvings told above, after which it passes test (false, and the bearing as dealt, if none does)
      // (each side's first walk begins at the knot where the lane as dealt failed; each later walk of that side a knot before the one where its last walk stopped: the knot that failed, or, where the lane kept the road and failed the rest of test, the knot it began at)
      const turnFor = async (c, test) => {
        const dealt = c.C.y, from = [jAt, jAt], ok = (s, a) => { const k = s > 0 ? 0 : 1; c.C.y = dealt + s * a; jAt = from[k]; if (test()) return true; from[k] = (jAt + F - 1) % F; return false; };
        for (let n = 1; n * 0.01 <= Math.PI; n++) {
          for (const s of [1, -1]) if (ok(s, n * 0.01)) {
            let lo = (n - 1) * 0.01, hi = n * 0.01;
            for (let h = 0; h < 4; h++) { const mid = 0.5 * (lo + hi); if (ok(s, mid)) hi = mid; else lo = mid; }
            c.C.y = dealt + s * hi; return true;
          }
          if ((n & 15) === 15) await ctx.yield();
        }
        c.C.y = dealt; return false;
      };
      for (const [list, geo] of [[nearLanes, hiGeo], [farLanes, farGeo]]) {
        const reach = reachOf(geo);
        for (let k = 0; k < list.length; k++) {
          const c = list[k], LIM = 2.0 + WEAVE + reach * c.t[3];
          if (!keeps(c, LIM, 0)) { turned[await turnFor(c, () => keeps(c, LIM, LIM)) ? 0 : await turnFor(c, () => keeps(c, LIM, 0) && clearLane(c)) ? 1 : 2]++; await ctx.yield(); }
          else if ((k & 15) === 15) await ctx.yield();
        }
      }
      await ctx.yield();
      // (the swarm's numbers for the body, a little tawnier and the abdomen a little lifted; the wing blur brighter and more opaque)
      const lineU = { uPale: flyU.uPale, uBeeDark: flyU.uBeeDark, uShade: { value: new THREE.Vector4(150, 340, 6, 2.2) }, uWing: { value: new THREE.Vector4(0.5, 0.9, 0.5, 420) }, uGold: { value: V3(1, 0.78, 0.36) },
        uLine: { value: lineK }, uLay: { value: new THREE.Vector4(F, fJ, fB, fT) }, uRope: { value: new THREE.Vector4(ROPE[0], ROPE[1], ROPE[2], fV) } };
      const lineMat = mat(BEELINE_VS, BEELINE_FS, lineU), lineWingMat = mat(BEELINE_VS, BEELINE_FS, lineU, { transparent: true, depthWrite: false });
      makeFlyers(nearLanes, hiGeo, lineMat, lineWingMat);
      await ctx.yield();
      makeFlyers(farLanes, farGeo, lineMat, lineWingMat);
      // (for whoever measures it: the bees, the places of the line, and where bee i is at a given time, without its weave)
      // (and turned: how many lanes the pass over the whole road turned to keep LIM from all of it, how many to keep LIM after comb two and CL before, how many it could not)
      scene.userData.beeLine = { bees: lanes.length, near: nearLanes.length, turned, length: total, lay: [F, fJ, fB], from: E0.clone(), join: J.clone(), turn: path.posAtDist(dFar), to: path.posAtDist(dEnd),
        at: (i, time, out) => { const L = lanes[i], s0 = time / L.t[1] + L.t[0], s = s0 - Math.floor(s0), sg = L.z >= 1 ? 1 - s : s, x1 = Math.min(sg / 0.2, 1); return laneAt(F * (0.8 * sg + 2 * (sg - 0.2 * (x1 * x1 * x1 - 0.5 * x1 * x1 * x1 * x1) - Math.max(sg - 0.2, 0))), L, out); } };
    }
    await ctx.yield();
    hero.setPortalLight('#ffd27a', 1.9, 1.7);
    updateCompanions(0, 0, null); updateHornets(0, 0); updateBuzzards(0, 0);
    await sky.prewarm(ctx.renderer, null, scene);

    scene.userData.probe = {
      hornets: () => HOR.filter((h) => h.wave >= 0).map((h) => ({ p: h.p.clone(), size: 1.29 * HSC })),
      ball: () => ({ p: ballPos.clone(), size: 6 }), griffon: () => ({ p: grifProbe.clone(), size: 34 }), gear: () => scene.userData.gearPts.map((q, i) => ({ p: q, size: i < 3 ? 3.5 : 1.6 })),
      buzzard: () => {
        return { p: buzzPos.clone(), size: 26 };
      },
    };
    const c6a = A.combs[5], sixGaze = V3(c6a.center.x + 6, c6a.center.y - 3, c6a.center.z), tierGaze = V3(150, 140, 0), northGaze = V3(330, 190, -20), faceGaze = V3(-80, 175, 0), ladderGaze = V3(200, 188, 22), gaze = V3(0, 0, 0), winGaze = V3(0, 0, 0), c4a = A.combs[3];
    const hornetGaze = path.pointAt(uHornet + 22 / LEN).addScaledVector(V3(-path.tangentAt(uHornet + 22 / LEN, T_).z, 0, T_.x).normalize(), 8);
    const mouthGaze = A.cleftMouth.clone().addScaledVector(axis, -6);
    const _sz = new THREE.Vector2(), _cam = V3(0, 0, 0);
    return {
      scene, path, duration,
      // slow abeam the torn comb, a little quicker out over the gorge, slow again round the far turn while the whole face
      // stands in the frame, slow along the curtains, behind the window and among the hornets; even again for the cleft
      pace: (u) => 1 - 0.14 * bump(u, uSix - 0.035, uSix + 0.045, 0.03) + 0.12 * bump(u, uTiers + 0.03, uFar - 0.05, 0.04) - 0.12 * bump(u, uFar - 0.06, uFar + 0.06, 0.03) - 0.16 * bump(u, uComb[0] - 0.01, uo(0.905), 0.05),
      title: dawn ? 'The Honey Cliff, First Sun' : sea ? 'The Honey Cliff above the Cloud' : rain ? 'The Honey Cliff after Rain' : autumn ? 'The Honey Cliff, Harvest' : 'The Honey Cliff',
      camera: { fov: 62, near: 0.3, far: 6400, lookAhead: 24, sway: 0.6, bank: 0.4 },
      pois: [
        // the torn comb as we close on it and pass 50 m before it; the tiers as we fly north beside them; the buzzard as it
        // comes round across our bow; then, from the far turn, the whole face (three of the same: together they pull as one
        // of weight 0.94, for we are flying at the horn and the picture is 50 degrees to the left of it; the steady camera
        // takes a third of each); last comb one and the ladder
        { at: sixGaze, from: 0.05, to: uSix + 0.06, weight: 0.62 },
        { at: tierGaze, from: uSix + 0.045, to: uTiers + 0.005, weight: 0.5 },
        { at: () => buzzPos, from: uTiers - 0.01, to: uTiers + 0.1, weight: 0.62 },
        { at: northGaze, from: 0.385, to: uFar - 0.021, weight: 0.5 },                               // out over the gorge: the swarm, the horn of the cliff and the snow wall in one frame
        { at: faceGaze, from: uFar - 0.11, to: uPass - 0.03, weight: 0.6, fade: 0.5 },             // the far turn: the whole cliff, three times over (it must win against the turn)
        { at: faceGaze, from: uFar - 0.09, to: uPass - 0.03, weight: 0.6, fade: 0.5 },
        { at: faceGaze, from: uFar - 0.07, to: uPass - 0.03, weight: 0.6, fade: 0.5 },
        { at: ladderGaze, from: uPass - 0.075, to: uPass - 0.012, weight: 0.6, fade: 0.3 },         // the dive: comb one's face, the ladder and the torch to its right
        { at: () => gaze, from: uLadder + 0.004, to: uGapIn + 0.01, weight: 0.4 },
        // (on the rare visit the river holds the frame from the gap on, and the gaze is left as it was)
        { at: () => winGaze, from: uGapIn - 0.03, to: rare || !hornetsHere ? uGapOut + 0.012 : uGapOut - 0.004, weight: 0.66 },
        rare || !hornetsHere ? { at: hornetGaze, from: uGapOut - 0.012, to: uHornet + 0.022, weight: 0.6 }
          : { at: hornTarget, from: uGapOut - 0.046, to: uHornet + 0.0325, weight: 0.62, fade: 0.2 },
        ...(rare ? [{ at: riverGaze, from: uHornet + 0.008, to: uHornet + 0.05, weight: 0.7 }] : []),      // the river going, up and away over the gorge
        { at: mouthGaze, from: uHornet + (rare ? 0.043 : 0.03), to: uTear, weight: 0.65 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#ffd98a', glow: 1.1, revealDistance: 220, tilt: true },
      post: { exposure: dawn ? 1.0 : 0.93, bloom: { strength: 0.38, radius: 0.6, threshold: 1.05 },
        grade: { saturation: 1.0, contrast: 1.05, tint: dawn ? '#fff0e6' : '#ffffff', shadowTint: '#070b16', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none', companion: 'none',          // we are the bee, and five of our own kind fly with us
      update(dt, time, camera, u) {
        U.uTime.value = time; flyU.uStory.value = u * duration;
        if (ctx.renderer && ctx.renderer.getDrawingBufferSize) HU.uPx.value = U.uAir.value.w = ctx.renderer.getDrawingBufferSize(_sz).y || 450;
        sky.update(dt, time, camera); rig.update(dt, time, camera);
        hero.setProgress(u);
        if (rare) hero.setAbscond(clamp((u * duration - tAb) / 6, 0, 1));
        hero.update(dt, time, camera);
        // the gaze along the curtains: a point ahead of us, drawn toward the wall
        const d = u * LEN + 34; path.posAtDist(d, gaze); path.tangentAtDist(d, T_); gaze.x += -T_.z * 13; gaze.z += T_.x * 13;
        // behind comb four: the honey crown a little ahead of abeam, where the sun comes through it
        path.pointAt(u, _cam);
        const wcx = clamp((_cam.x - 30 - c4a.center.x) * c4a.tangent.x, -c4a.halfWidth * 1.1, c4a.halfWidth * 0.5);       // (well ahead of abeam, and on to the gap beyond the comb: the alley's depth, never a slab square-on)
        winGaze.set(c4a.center.x + c4a.tangent.x * wcx, c4a.top - 10.5, c4a.center.z + c4a.tangent.z * wcx);
        fanMat.uniforms.uFan.value.w = 0.11 * (1 - 0.4 * smoothstep(uTear - 0.03, uTear + 0.012, u));
        updateBuzzards(time, u); updateCompanions(time, u, u > 0.0004 ? _dir.set(-camera.matrixWorld.elements[8], -camera.matrixWorld.elements[9], -camera.matrixWorld.elements[10]) : null); updateHornets(time, u); updateBody(dt, time, camera, u);
        if (guide) { const g = Math.max(0, Math.sin(time * 0.8)) > 0.3 ? Math.pow(Math.max(0, Math.sin(time * 7)), 2) : 0; guide.rotation.x = 0.45 * g; guide.rotation.y = Math.PI + 0.35 + 0.2 * Math.sin(time * 0.5); }
        updateGriffon(time);
        pollen.update(dt, time, camera); petals.update(dt, time, camera); petals.setOpacity(1 - smoothstep(0.07, 0.15, u));
        if (drips) drips.update(dt, time, camera);
        if (smoke) smoke.update(dt, time, camera);
        if (ember) ember.update(dt, time, camera);
        // the lit air of the alley and the glow through the tear belong to the second half of the flight: on the first pass
        // the torn comb shows as a comb, with only the small glow in its bite
        const gk = smoothstep(uLadder - 0.03, uLadder + 0.07, u);
        glows[1].uniforms.uIntensity.value = 3.2 * (0.07 + 0.93 * gk); glows[2].uniforms.uIntensity.value = 2.6 * gk; shafts.uniforms.uIntensity.value = 0.9 * (0.3 + 0.7 * gk);
        // once the bough is far behind us (we are northbound, it is astern) two bells in five stand for the truss, and from
        // the hairpin on, three primulas in five for the fin's crest: they are specks by then
        bellMesh.count = u > 0.2 ? bellKeep : bellAll; primMesh.count = u > 0.25 ? primKeep : primAll; frondMesh.count = u > uComb[1] ? frondKeep : u > 0.3 ? frondMid : frondAll; cushMesh.count = u > 0.3 ? cushKeep : cushAll; primMesh.visible = finRock.visible = finCap.visible = u < 0.3; gearMesh.visible = u < uComb[1] + 0.01; scrub.count = u > 0.16 && u < uLadder ? scrub.userData.n : 0;      // the ladder is far behind us by then
        { const on = u * duration > tAb - 0.6; for (let i = 0; i < 3; i++) flyM[i].geometry.instanceCount = on ? allN[i] : baseN[i]; flyWings.geometry.instanceCount = flyM[0].geometry.instanceCount;
          // the swarm hangs off the north horn: in the picture from the swing out until we are past comb two on the way south
          swarmM.geometry.instanceCount = swarmM.userData.wings.geometry.instanceCount = u > 0.18 && u < uComb[1] ? swarmN : 0; }
        for (const g of glows) g.update(dt, time, camera); shafts.update(dt, time);
        shredField.update(dt, time, camera); if (seaField) seaField.update(dt, time, camera);
      },
      dispose() { hero.dispose(); if (sky.dispose) sky.dispose(); },
    };
  },
};
