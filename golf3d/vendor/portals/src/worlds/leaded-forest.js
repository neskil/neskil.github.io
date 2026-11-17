// THE LEADED FOREST: a forest of backlit stained glass in black lead, crossed on a glass dragonfly while a year
// passes: lilac spring over a cobalt brook, a green summer canopy, autumn arriving inside the dome of the Wisteria
// Tree (src/parts/leaded-forest.js) whose forty thousand panes let go, then a winter avenue of bare lead beeches
// and a climb into a ring set in the tracery of their vault.
// Nothing is lit. Every pane is  family colour x sheet(view ray) x grazing x streak  in black came, against one even
// sheet of light; depth is halation (fog toward the sheet colour). Seasons are fronts keyed to path progress u.
// Looks (seeded, ctx.vary.hour): pearl day, ultramarine evening, rain. Hero: wisteria / laburnum, autumn
// amber / wine / ginkgo. Cast: kingfishers / swallows / moths, koi / water-lilies, stag / fox.
// Rare: the early thaw (lilac panes stream up the final climb and re-hang on the bare lead).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, Tubes, GLSL_COMMON } from '../parts/leaded-forest.js';

const PALETTE = ['#0A0B0E', '#DDE9F0', '#8E6BD6', '#2FA35A', '#F2A21E', '#D9471C', '#1D5FBF'];
const BX = 28;                                              // the brook (and the hero's approach line) is x = 28
const A1 = (7 * Math.PI) / 6, EX = Math.sin(A1) * 28, EZ = Math.cos(A1) * 28, HX = Math.cos(A1), HZ = -Math.sin(A1);   // exit line
const AV_W = 15, AV_T0 = 56, AV_T1 = 223, AV_STEP = 11.5, VAULT_Y0 = 33, VAULT_R = 112;   // winter avenue
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- GLSL shared by the world's glass
const W_COMMON = GLSL_COMMON + /* glsl */`
uniform float uU, uGroundGain, uDome; uniform vec3 uSheetCol, uPearl, uFront, uCeladon, uCobalt, uHorizon;
// seasons run along the path as fronts four times faster than the camera; s = where the thing stands (path u)
float frontAt(float off, float s){ return (uU - off) * 4. - s; }
vec3 wSeason(float x, float s, float r, float green){
  float f1 = smoothstep(0., 0.06, frontAt(uFront.x, s) - r * 0.06);
  float f2 = smoothstep(0., 0.06, frontAt(uFront.y, s) - r * 0.06);
  vec3 sp = mix(fam(0., x), mix(uCeladon * 0.62, uCeladon * 1.12, x), green);
  return mix(mix(sp, fam(1., x), f1), fam(2., x), f2);
}
float wFallT(float s, float r){ return frontAt(uFront.z, s) * 10. - r * 3.5; }
float wFrost(float s){ return smoothstep(0.03, 0.2, frontAt(uFront.z, s)); }
vec3 rotAx(vec3 v, vec3 ax, float a){ float c = cos(a), s = sin(a); return v * c + cross(ax, v) * s + ax * dot(ax, v) * (1. - c); }
`;
const FOG_V = '#include <fog_pars_vertex>', FOG_F = '#include <fog_pars_fragment>';
const shader = (U, o) => new THREE.ShaderMaterial({ fog: true, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...(o.extra || {}) }, vertexShader: o.vs, fragmentShader: o.fs, side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, depthWrite: o.depthWrite ?? true, blending: o.blending ?? THREE.NormalBlending, defines: o.defines || {} });

// leaves: instanced panes. iA = size, random, path s, kind (0 birch leaf, 1 door-sized leaded leaf, 2 frost shard,
// 3 beech leaf: lets go with the dome and is gone before the avenue is flown; 4 a late amber pane that hangs in the
// winter vault, lets go and falls straight down past the dragonfly, over and over, during the climb; +0.5 = celadon)
// iB = yaw, tilt, aspect, hang (sway arm)
function leafMaterial(U) {
  return shader(U, {
    side: THREE.DoubleSide,
    vs: W_COMMON + /* glsl */`
      attribute vec3 iPos; attribute vec4 iA, iB;
      varying vec2 vUv; varying vec3 vCol, vCol2, vN, vWp; varying vec4 vK;
      ${FOG_V}
      void main(){
        float r1 = iA.y, s = iA.z, kind = floor(iA.w), green = step(0.25, iA.w - kind);
        float shard = step(1.5, kind) * step(kind, 2.5), late = step(3.5, kind), beech = step(2.5, kind) * (1. - late);
        float cyc = fract(uTime * 0.075 + r1 * 7.31), fallD = max(cyc - 0.16, 0.) * 39.;      // hangs 2 s, then 33 m at 2.9 m/s
        float tt = shard > 0.5 ? 0. : late > 0.5 ? fallD * 0.34 : max(wFallT(s, r1), 0.), fell = step(0.0001, tt);
        vec3 c = iPos + sway(iPos, iB.w) * exp(-tt * 0.8);
        c.y -= mix(4. * (tt - (1. - exp(-1.4 * tt)) / 1.4), fallD, late);
        c.xz += vec2(sin(tt * 0.9 + r1 * 40.), cos(tt * 0.7 + r1 * 23.)) * min(tt, 2.5) * 0.6 * (1. - late);
        float land = smoothstep(0.15, 1.8, c.y); c.y = max(c.y, 0.12);
        float yaw = iB.x + 0.32 * sin(uTime * 2.3 + r1 * 50.) * (1. - fell);
        float tilt = iB.y + 0.15 * sin(uTime * 1.7 + r1 * 31.);
        vec3 X = vec3(cos(yaw), 0., -sin(yaw)), N = vec3(sin(yaw) * cos(tilt), sin(tilt), cos(yaw) * cos(tilt));
        vec3 Y = cross(N, X);
        vec3 ax = normalize(vec3(sin(r1 * 90.), 0.35, cos(r1 * 90.)));
        float ang = tt * (1.2 + 2.2 * fract(r1 * 7.3)) * (1. - 0.5 * late);
        X = rotAx(X, ax, ang); Y = rotAx(Y, ax, ang); N = rotAx(N, ax, ang);
        float cd = distance(c, cameraPosition);
        float lateOn = smoothstep(0.735, 0.775, uU) * (1. - smoothstep(0.975, 0.995, uU)) * smoothstep(0., 0.05, cyc) * (1. - smoothstep(0.93, 1., cyc));
        float sc = mix(1., land * smoothstep(0.7, 1.8, cd) * mix(0.3, 1., smoothstep(2., 9., cd)), fell) * iA.x * (1. - beech * smoothstep(3.5, 7., tt)) * mix(1., lateOn, late);
        vec3 lp = c + (X * position.x * iB.z + Y * position.y) * sc;
        vUv = position.xy * 2.; vN = N;
        float x = mix(0.12 + 0.76 * fract(r1 * 3.7), 0.3 + 0.3 * fract(r1 * 3.7), late);
        vec3 a = wSeason(x, s, r1, green) * (1. - 0.45 * late), b = mix(wSeason(fract(x + 0.31), s, r1, green), a, late);
        vec3 w0 = fam(3., x);
        float fr = shard;
        vec3 ice = vec3(0.7, 0.87, 1.04);
        vCol = mix(a, w0 * ice, fr); vCol2 = mix(b, fam(3., fract(x + 0.31)) * ice, fr);
        vK = vec4(r1, kind, fell, smoothstep(-0.02, 0.3, frontAt(uFront.z, s) - r1 * 0.12));
        vec4 wp = vec4(lp, 1.); vWp = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fs: W_COMMON + /* glsl */`
      varying vec2 vUv; varying vec3 vCol, vCol2, vN, vWp; varying vec4 vK;
      ${FOG_F}
      void main(){
        float u = vUv.x, v = vUv.y, r = vK.x, kind = vK.y;
        float fw = (abs(dFdx(u)) + abs(dFdy(u)) + abs(dFdx(v)) + abs(dFdy(v))) * 0.6;
        float e, cell = 0.5, bwMin = 0.11;
        if (kind < 0.5 || kind > 2.5) {                     // birch or beech leaf: a pointed oval
          float w = 0.86 * sqrt(max(1. - v * v, 0.)) * (1. - 0.3 * v);
          e = w - abs(u);
        } else if (kind < 1.5) {                            // a leaf as large as a door: five to nine leaded cells
          float w = 0.95 * pow(max(1. - v * v, 0.), 0.42) * (1. - 0.16 * v);
          e = w - abs(u);
          vec2 p = vec2(u * 1.05, v * 1.75) + r * 17.3, ip = floor(p), fp = fract(p);
          float d1 = 9., d2 = 9.; vec2 id = vec2(0.);
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j)), o = vec2(h21(ip + g), h21(ip + g + 57.3)) * 0.7 + 0.15;
            vec2 dv = g + o - fp; float d = dot(dv, dv);
            if (d < d1) { d2 = d1; d1 = d; id = ip + g; } else if (d < d2) { d2 = d; }
          }
          e = min(e, (sqrt(d2) - sqrt(d1)) * 0.75 + 0.012);
          e = min(e, abs(u) * 0.9 + 0.035 + 0.3 * (1. - step(v, 0.55)));   // midrib
          cell = h21(id + 1.3); bwMin = 0.05;
        } else {                                            // frost shard caught in a fork
          e = 1.;
          for (int k = 0; k < 5; k++) { float fk = float(k), an = fk * 1.2566 + (h11(fk + r * 7.) - 0.5) * 0.9 + r * 6.; e = min(e, 0.55 + 0.4 * h11(fk * 3. + r * 13.) - dot(vUv, vec2(cos(an), sin(an)))); }
        }
        if (e < 0.) discard;
        float bw = max(bwMin, 1.5 * fw);
        float came = 1. - smoothstep(bw * 0.65, bw, e);
        vec3 V = normalize(vWp - cameraPosition), N = normalize(vN);
        float b = sheet(V) * mix(0.42, 1., smoothstep(0., 0.75, abs(dot(N, V))));
        float streak = 0.8 + 0.2 * sin(v * 3.2 + u * 7. * (r - 0.5) + r * 30. + sin(u * 4. + r * 11. + cell * 9.));
        vec2 bb = fract(vUv * 2.3 + r * 7.) - 0.5; float bub = smoothstep(0.12, 0.04, length(bb)) * step(0.78, h21(floor(vUv * 2.3 + r * 7.) + r));
        float isShard = step(1.5, kind) * step(kind, 2.5);
        vec2 fcell = floor(vUv * 2.6 + r * 5.);
        float craze = smoothstep(0.1, 0.0, abs(sin(u * 7. + r * 9. + sin(v * 5.) * 1.3) * sin(v * 6.3 + r * 7. + sin(u * 4.) * 1.1) - 0.15)) * isShard * step(h21(fcell + 3.1), vK.w * 1.05);
        craze *= 0.7 + 0.6 * smoothstep(0.2, 1., sin(uTime * (0.9 + 1.3 * h21(fcell + 7.7)) + h21(fcell + 1.9) * 40.));      // frost glitters, cell by cell
        float run = smoothstep(0.8, 1., sin(u * 9. + r * 40.)) * smoothstep(0.3, 1., sin(v * 2.4 + uTime * (2. + 2. * r) + r * 60.)) * uRain;
        vec3 gc = mix(vCol, vCol2, smoothstep(0.35, 0.65, cell)) * (0.78 + 0.44 * cell);
        gc = mix(gc, uSheetCol * uDome * vec3(0.6, 0.79, 1.0) * (0.74 + 0.34 * fract(r * 5.3)) / max(b * uGlassGain, 0.2), isShard * 0.75);      // a frost pane is nearly clear: the sheet seen through it
        vec3 glass = gc * b * streak * uGlassGain * (1. - 0.12 * uRain) + bub * 0.4 + craze * 0.45 * uPearl + run * 0.5;
        float gl = abs(dot(N, normalize(vec3(0., 0.75, 0.) - V)));
        gl *= gl; gl *= gl; gl *= gl; gl *= gl; gl *= gl; gl *= gl;
        glass += vec3(1., 0.97, 0.92) * gl * 2.6 * vK.z;
        float dissolve = 1. - smoothstep(0.18, 0.5, fw);
        vec3 col = mix(glass, mix(glass * 0.72, uLead, dissolve), came);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// lead: merged tubes that never get thinner than about a pixel and a half. BIRCH = white opal glass banded in lead.
function leadMaterial(U, birch) {
  return shader(U, {
    defines: birch ? { BIRCH: 1 } : {},
    vs: /* glsl */`
      attribute float aRad; varying vec3 vWp, vN;
      ${FOG_V}
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.); vN = normalize(mat3(modelMatrix) * normal);
        float dist = length(wp.xyz - cameraPosition);
        wp.xyz += vN * max(0., min(0.0009 * dist, 0.3) - aRad);
        vWp = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fs: W_COMMON + /* glsl */`
      varying vec3 vWp, vN;
      ${FOG_F}
      void main(){
        vec3 V = normalize(vWp - cameraPosition), N = normalize(vN);
        float fr = 1. - abs(dot(N, V)); fr = fr * fr * fr;
        vec3 col = uLead + uSheetCol * fr * 0.03 * sheet(V);
        #ifdef BIRCH
          float hh = h21(floor(vWp.xz * 0.11));
          float band = smoothstep(0.8, 0.9, sin(vWp.y * 2.6 + hh * 40.) * sin(vWp.y * 0.83 + hh * 17.) + 0.2 * sin(vWp.y * 9. + N.x * 3.));
          float ring = smoothstep(0.9, 0.97, sin(vWp.y * 1.26 + hh * 9.));
          float frost = wFrost(hh);
          vec3 opal = mix(vec3(0.93, 0.94, 0.9), fam(3., 0.6), frost * 0.5) * uPearl * 1.25 * sheet(V) * mix(0.5, 1., smoothstep(0., 0.8, abs(dot(N, V)))) * (0.85 + 0.15 * sin(vWp.y * 5. + vWp.x * 3.));
          col = mix(opal * uGlassGain * 0.72, uLead, max(band, ring));
        #endif
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// the ground: a dark slate mosaic with the brook as a road of sliding cobalt ripple-glass, pools of the season's
// colour under the trees, fallen panes as a litter of amber, then frost crazing along the came.
function groundMaterial(U) {
  return shader(U, {
    vs: /* glsl */`
      attribute float aS; varying vec3 vWp; varying float vS;
      ${FOG_V}
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; vS = aS;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fs: W_COMMON + /* glsl */`
      varying vec3 vWp; varying float vS;
      ${FOG_F}
      void main(){
        vec2 p = vWp.xz; float bx = abs(p.x - ${BX}.), brook = 1. - step(4., bx);
        float frost = wFrost(vS);
        float flow = uTime * 1.5 * (1. - frost);
        vec2 q = mix(p * 0.6, vec2(p.x * 0.75 + 0.2 * sin(p.y * 0.4 + flow * 0.5), (p.y + flow) * 0.3), brook);
        float fw = length(fwidth(p)) * mix(0.6, 0.5, brook);
        vec2 ip = floor(q), fp = fract(q);
        float d1 = 9., d2 = 9.; vec2 id = vec2(0.);
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j)), o = vec2(h21(ip + g), h21(ip + g + 57.3)) * 0.8 + 0.1;
          vec2 dv = g + o - fp; float d = dot(dv, dv);
          if (d < d1) { d2 = d1; d1 = d; id = ip + g; } else if (d < d2) { d2 = d; }
        }
        float edge = sqrt(d2) - sqrt(d1), h = h21(id + 2.7), h2 = h21(id + 9.1);
        float bw = max(0.045, 1.5 * fw), came = 1. - smoothstep(bw * 0.6, bw, edge);
        came = max(came, brook * (1. - smoothstep(0.12, 0.2, 4. - bx)) + (1. - brook) * (1. - smoothstep(0.1, 0.22, bx - 4.)));   // the banks are two lead lines
        vec3 V = normalize(vWp - cameraPosition);
        float sh = sheet(vec3(V.x, abs(V.y), V.z));
        float gr = 1. - abs(V.y); gr *= gr; gr *= gr;
        vec3 tintS = mix(vec3(1.), uSheetCol * 1.2, 0.7);
        // slate
        float streak = 0.8 + 0.2 * sin(dot(p, vec2(cos(h * 6.28), sin(h * 6.28))) * 5. + h2 * 20.);
        vec3 slate = mix(vec3(0.028, 0.036, 0.055), vec3(0.085, 0.1, 0.135), h * h) * streak * tintS * 1.15 * uGroundGain;
        float rr = length(p), forest = smoothstep(52., 70., rr);
        // pools of the season's colour sliding under the canopies
        float t = uTime * 0.22;
        float m = sin(p.x * 0.31 + t + sin(p.y * 0.23 - t * 0.7)) * sin(p.y * 0.37 - t * 0.6 + sin(p.x * 0.19)) ;
        float leafy = 1. - smoothstep(0., 3., wFallT(vS, 0.5));
        vec3 pool = wSeason(0.3 + 0.4 * h, vS, h2, 0.3) * smoothstep(0.1, 0.75, m) * forest * leafy * 0.3;
        slate += pool * pool * 2.2 + pool * 0.25;
        // litter: fallen panes lie as a mosaic of autumn, in drifts
        float drift = 0.5 + 0.5 * sin(p.x * 0.13 + sin(p.y * 0.09) * 2.) * sin(p.y * 0.11 + 1.3);
        drift = smoothstep(0.42, 0.8, drift + 0.25 * sin(p.x * 0.047 - p.y * 0.031 + 2.));
        vec2 av = p - vec2(${EX.toFixed(3)}, ${EZ.toFixed(3)}); float avT = dot(av, vec2(${HX.toFixed(4)}, ${HZ.toFixed(4)})), avL = dot(av, vec2(${(-HZ).toFixed(4)}, ${HX.toFixed(4)}));
        float rows = (1. - smoothstep(1.5, 8., abs(abs(avL) - ${AV_W}.))) * step(30., avT);   // banked against the avenue's trunks
        float mouth = (1. - smoothstep(6., 20., abs(avL))) * (1. - smoothstep(12., 30., abs(avT - 38.)));   // and spilt out of the parting
        float under = max(1. - smoothstep(40., 52., rr), forest * 0.8);
        float lit = step(h2, 0.08 + 0.9 * max(drift, max(rows, mouth)) * under) * under;
        float appear = mix(smoothstep(2., 9., uFallT + h * 3.), smoothstep(0., 5., wFallT(vS, h)), forest);
        vec3 litter = fam(2., 0.62 + 0.38 * h) * sh * (0.8 + 0.45 * streak) * mix(0.75, 1.1, h2 * 3.) * 1.6;
        float frostL = frost * smoothstep(0.80, 0.90, uU + h * 0.03);
        slate = mix(slate, litter, lit * appear * (1. - frostL * 0.8));
        // the brook
        float rip = 0.75 + 0.25 * sin(q.y * 9. + sin(q.x * 5. + flow) * 2. + h * 6.28);
        vec3 water = mix(uCobalt, uCobalt * vec3(4., 2.6, 1.55), h * h * 0.75) * (0.9 + 1.5 * h2) * rip * sh;
        water += uSheetCol * smoothstep(0.93, 1., sin(q.y * 7. + q.x * 3. + flow * 2.3 + h * 40.)) * 0.5;
        water = mix(water, fam(3., h) * sh * 0.8, frost * 0.7);
        vec3 col = mix(slate, water, brook);
        // frost: a white craze growing along the came, cell by cell
        float fz = frost * step(h * 0.8, frost) * (1. - lit * appear * (1. - smoothstep(0.79, 0.86, uU)));
        float craze = smoothstep(0.25, 0.0, edge) * (0.5 + 0.5 * sin(edge * 60. + h * 30.));
        col += uPearl * fz * (0.1 + 0.42 * craze) * (0.6 + 0.4 * streak);
        float dissolve = 1. - smoothstep(0.12, 0.45, fw);
        col = mix(col, mix(col * 0.55, mix(uLead, uPearl * 0.55, fz * 0.8), dissolve), came);
        col += uSheetCol * gr * 0.16 * sh;                  // the sheet glancing off the glass floor far away
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// the light sheet: an even pearl glow that follows the camera, a little brighter overhead, slowly mottled
function sheetMaterial(U) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: U,
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform vec3 uSheetCol, uHorizon; uniform float uDome, uU, uMottle; varying vec3 vD;
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        vec3 d = normalize(vD);
        vec2 c = d.xz / (abs(d.y) + 0.45) * 1.6 + uTime * vec2(0.03, 0.017);
        float cl = vn(c) * 0.55 + vn(c * 2.1 + 3.7) * 0.3 + vn(c * 4.3 + 9.1) * 0.15;
        float m = 1. - mix(0.3, 0.52, smoothstep(0.66, 0.8, uU)) * uMottle * smoothstep(0.3, 0.72, cl);
        float band = 1. - smoothstep(0.0, 0.3, abs(d.y)); band *= band;
        vec3 col = mix(uSheetCol, uHorizon, band) * uDome * (sheet(d) / uSheetGain) * m * (1. - 0.1 * smoothstep(0., -0.5, d.y));
        col *= mix(mix(vec3(1.), vec3(0.8, 0.9, 1.0), uMottle), vec3(1.), smoothstep(0.55, 1., m));     // the dimmer cloud-shapes are a cooler, ice-blue pearl
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// small flora: cylindrical billboards. iP = x, y, z, size; iQ = kind (0 grass tuft, 1 iris or lily, 2 fern), random, path s, aspect
function floraMaterial(U) {
  return shader(U, {
    side: THREE.DoubleSide,
    vs: W_COMMON + /* glsl */`
      attribute vec4 iP, iQ; varying vec2 vUv; varying vec4 vQ; varying vec3 vWp;
      ${FOG_V}
      void main(){
        vec3 right = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-4, 0., 0.));
        float a = (iQ.y - 0.5) * 1.1; right = vec3(right.x * cos(a) - right.z * sin(a), 0., right.x * sin(a) + right.z * cos(a));
        float v = position.y;
        float wind = sin(uTime * 1.5 + iP.x * 0.21 + iP.z * 0.17 + iQ.y * 6.) + 0.5 * sin(uTime * 2.7 + iQ.y * 40.);
        vec3 wp = iP.xyz + right * (position.x * iP.w * iQ.w + wind * 0.07 * v * v * iP.w) + vec3(0., v * iP.w, 0.);
        vUv = vec2(position.x * 2., v); vQ = iQ; vWp = wp;
        vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fs: W_COMMON + /* glsl */`
      varying vec2 vUv; varying vec4 vQ; varying vec3 vWp;
      ${FOG_F}
      void main(){
        float u = vUv.x, v = vUv.y, kind = vQ.x, r = vQ.y, s = vQ.z;
        float fw = (abs(dFdx(u)) + abs(dFdy(u)) + abs(dFdx(v)) + abs(dFdy(v))) * 0.6;
        float e = -1., x = 0.5, green = 1., lead = 0.;
        if (kind < 0.5) {                                   // a tuft of glass blades
          for (int k = 0; k < 5; k++) {                     // five curved blades arching outward, each a pane in its own came
            float fk = float(k), hk = h11(fk * 7.3 + r * 13.), lk = h11(fk * 3.1 + r * 29.) - 0.5;
            float hgt = (0.6 + 0.4 * hk) * (1. - 0.16 * abs(fk - 2.)), q = v / hgt;
            float lean = (fk - 2.) * 0.3 + lk * 0.22;
            float cx = (fk - 2.) * 0.1 + lk * 0.08 + lean * q * (0.3 + 0.7 * q);
            float ek = min(0.125 * (1. - q * q) * (0.5 + 0.5 * smoothstep(0., 0.14, q)) - abs(u - cx), (1. - q) * 0.5);
            if (ek > 0.) { e = ek; x = 0.15 + 0.7 * h11(fk + r * 5.); }
          }
        } else if (kind < 1.5) {                            // iris: lead stem, two blades, a three-petalled flower
          lead = step(abs(u), 0.04) * step(v, 0.66);
          float bladeL = 0.085 * (1. - v / 0.56) - abs(abs(u) - 0.1 - 0.55 * v * v);
          vec2 pp = vec2(u, (v - 0.76) * 2.1); float ang = atan(pp.y, pp.x + 1e-5), rr = length(pp);
          float pet = 0.47 * (0.5 + 0.5 * abs(cos(1.5 * ang + 0.52 + r))) - rr;
          e = max(bladeL, pet); green = step(pet, bladeL); x = green > 0.5 ? 0.3 + 0.5 * r : 0.2 + 0.6 * fract(ang * 0.48 + r);
          e = max(e, lead - 0.5);
        } else {                                            // fern: graded leaflets either side of a lead rib
          float uu = u - (r - 0.5) * 1.5 * v * v;           // each frond arches to one side, widest low down, tapering to both ends
          lead = step(abs(uu), 0.03) * step(v, 0.97);
          float k = v * 12., fv = fract(k);
          float wv = 0.5 * pow(max(sin(3.1416 * pow(max(v, 0.), 0.55)), 0.), 0.8) * (0.8 + 0.2 * sin(floor(k) * 2.4 + r * 9.));
          e = min(wv - abs(uu), 0.44 - abs(fv - 0.5));
          e = min(e, abs(uu) - 0.02); x = 0.15 + 0.8 * v; e = max(e, lead - 0.5);
        }
        if (e < 0.) discard;
        float bw = kind < 0.5 ? min(max(0.026, 1.5 * fw), 0.05) : max(0.05, 1.5 * fw), came = max(1. - smoothstep(bw * 0.6, bw, e), lead);
        vec3 V = normalize(vWp - cameraPosition);
        vec3 gc = mix(wSeason(x, s, r, green), fam(3., x), wFrost(s));
        vec3 glass = gc * sheet(V) * (0.8 + 0.2 * sin(v * 9. + r * 30. + u * 4.)) * uGlassGain * (kind < 0.5 ? 0.86 : 0.92);
        float dissolve = kind < 0.5 ? 1. - smoothstep(0.012, 0.04, fw) : kind > 1.5 ? 1. - smoothstep(0.07, 0.26, fw) : 1. - smoothstep(0.2, 0.55, fw);
        gl_FragColor = vec4(mix(glass, mix(glass * 0.7, uLead, dissolve), came), 1.);
        #include <fog_fragment>
      }`,
  });
}

// pools of the season's colour on the ground under the crowns: soft additive decals that slide as the panes sway
function poolMaterial(U) {
  return shader(U, {
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vs: W_COMMON + /* glsl */`
      attribute vec4 iP; attribute vec2 iQ; varying vec2 vUv; varying vec3 vCol; varying float vR;
      ${FOG_V}
      void main(){
        float r = iQ.y, s = iQ.x;
        vec3 c = vec3(iP.x, 0.07 + r * 0.05, iP.y);
        c += sway(c, 24.) * 1.5 + vec3(sin(uTime * 0.31 + r * 40.), 0., cos(uTime * 0.27 + r * 23.)) * 1.3;
        vCol = wSeason(0.25 + 0.6 * r, s, r, 0.3) * (1. - smoothstep(0., 3., wFallT(s, r)));
        vUv = position.xz * 2.; vR = r;
        vec4 mvPosition = viewMatrix * vec4(c + position * iP.z, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fs: W_COMMON + /* glsl */`
      varying vec2 vUv; varying vec3 vCol; varying float vR;
      ${FOG_F}
      void main(){
        float a = atan(vUv.y, vUv.x + 1e-4), l = length(vUv);
        float lobes = 0.86 + 0.14 * sin(a * 3. + vR * 20. + uTime * 0.3) * sin(a * 2. - vR * 9.);
        float m = smoothstep(lobes, 0.0, l);
        gl_FragColor = vec4((vCol * 0.3 + vCol * vCol * 0.35) * m * m, 1.);
        #ifdef FOG_EXP2
          gl_FragColor.rgb *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
        #endif
      }`,
  });
}

// drifting chips: petals in spring, opal snow in winter, streaks in rain. A box of them wraps round the camera.
function chipMaterial(U, extra) {
  return shader(U, {
    side: THREE.DoubleSide, extra,
    vs: W_COMMON + /* glsl */`
      attribute vec4 iP; uniform vec4 uChip; uniform vec3 uChipCol, uBox; uniform float uGust; varying vec2 vUv; varying vec3 vCol;
      ${FOG_V}
      void main(){
        float r = iP.w;
        float gust = sin(uTime * 0.37 + iP.y * 5.) + 0.6 * sin(uTime * 0.23 + iP.y * 11. + 1.7);
        vec3 q = iP.xyz * uBox + vec3(sin(uTime * 0.31 + r * 40.) * 1.5 + uTime * 0.5 + gust * uGust, -uTime * uChip.y * (0.7 + 0.6 * r), cos(uTime * 0.27 + r * 23.) * 1.5 + gust * uGust * 0.5);
        q = mod(q - cameraPosition + uBox * 0.5, uBox) - uBox * 0.5;
        float dist = length(q);
        float on = step(r, uChip.x) * smoothstep(1.5, 4., dist) * (1. - smoothstep(uBox.x * 0.4, uBox.x * 0.5, dist));
        float ang = uTime * (1. + 2. * fract(r * 7.)) * uChip.w + r * 50.;
        vec2 o = vec2(position.x * cos(ang) - position.y * sin(ang), position.x * sin(ang) + position.y * cos(ang));
        o = mix(o, vec2(position.x * 0.22, position.y * 9.), 1. - uChip.w);
        float sz = uChip.z * (0.6 + 0.8 * fract(r * 13.)) * on;
        vec4 mvPosition = viewMatrix * vec4(q + cameraPosition, 1.);
        mvPosition.xy += o * sz * vec2(1., 0.55 + 0.45 * sin(ang * 1.7));
        vUv = position.xy * 2.;
        vCol = uChipCol * (0.8 + 0.5 * step(0.93, sin(ang * 1.3)));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fs: /* glsl */`
      varying vec2 vUv; varying vec3 vCol;
      ${FOG_F}
      void main(){
        if (abs(vUv.x) + abs(vUv.y) * 0.8 > 1.) discard;
        gl_FragColor = vec4(vCol, 1.);
        #include <fog_fragment>
      }`,
  });
}

// koi (or water-lilies) under the ripple-glass: flat instanced quads on the brook. iK = x, z, random, length
function koiMaterial(U, lilies) {
  return shader(U, {
    side: THREE.DoubleSide, defines: lilies ? { LILY: 1 } : {},
    vs: W_COMMON + /* glsl */`
      attribute vec4 iK; varying vec2 vUv; varying vec4 vK; varying vec3 vWp;
      ${FOG_V}
      void main(){
        float r = iK.z, t = uTime;
        vec3 c = vec3(iK.x + sin(t * 0.23 + r * 20.) * 1.6, 0.07 + r * 0.03, iK.y + sin(t * 0.17 + r * 31.) * 5.);
        float near = smoothstep(26., 7., length(c.xz - cameraPosition.xz));
        #ifdef LILY
          float h = t * 0.1 + r * 6.28; float open = 1. - 0.72 * near;
          vec2 l = position.xz * iK.w * 0.8; vK = vec4(r, open, 0., 0.);
        #else
          float h = 1.57 + 0.6 * sin(t * 0.21 + r * 9.) + near * (1.4 + r) * (r > 0.5 ? 1. : -1.);
          vec2 l = position.xz * vec2(iK.w * 0.36, iK.w);
          l.x += sin(position.z * 4.5 - t * (3. + 3. * near) + r * 9.) * 0.13 * iK.w * (0.25 + (position.z + 0.5));
          vK = vec4(r, 1., near, 0.);
        #endif
        vec2 w = vec2(l.x * cos(h) + l.y * sin(h), -l.x * sin(h) + l.y * cos(h));
        vWp = c + vec3(w.x, 0., w.y); vUv = position.xz * 2.;
        vec4 mvPosition = viewMatrix * vec4(vWp, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fs: W_COMMON + /* glsl */`
      varying vec2 vUv; varying vec4 vK; varying vec3 vWp;
      ${FOG_F}
      void main(){
        float u = vUv.x, v = vUv.y, r = vK.x; float e, ptc = 0., seg;
        float fw = (abs(dFdx(u)) + abs(dFdy(u)) + abs(dFdx(v)) + abs(dFdy(v))) * 0.6;
        #ifdef LILY
          float ang = atan(v, u + 1e-5), rr = length(vUv);
          float pad = 0.98 - rr - 0.5 * smoothstep(0.25, 0.0, abs(ang - 1.));
          float pet = (0.3 + 0.36 * abs(cos(ang * 4. + r * 5.))) * vK.y - rr;
          e = max(pad, pet); ptc = step(0., pet); seg = fract(ang * 1.2732 + r) ;
          e = min(e, abs(pet) + 0.02);
        #else
          float body = v < 0.45 ? 0.82 * sqrt(max(1. - (v + 0.3) * (v + 0.3) / 0.5625, 0.)) : 0.1 + 1.5 * (v - 0.45);
          e = min(body - abs(u), 1. - v); seg = fract(v * 2.2 + r);
          ptc = step(abs(v + 0.6 * r - 0.3), 0.3) * step(0.2, r);
          e = min(e, abs(seg - 0.5) * 0.9 + 0.01 + step(0.45, v));
          e = min(e, abs(u) + 0.03 + step(v, 0.45));
        #endif
        if (e < 0.) discard;
        float bw = max(0.09, 1.5 * fw), came = 1. - smoothstep(bw * 0.6, bw, e);
        vec3 V = normalize(vWp - cameraPosition);
        vec3 seasonC = mix(wSeason(0.2 + 0.6 * r, uU, r, 0.), fam(3., r), wFrost(uU));
        #ifdef LILY
          vec3 gc = mix(wSeason(0.5, uU, r, 1.) * 0.8, mix(vec3(0.95), seasonC, 0.55), ptc);
        #else
          vec3 gc = mix(vec3(0.92, 0.95, 0.97), seasonC, ptc);
        #endif
        float rip = 0.8 + 0.2 * sin(vWp.z * 2.7 + uTime * 1.5 + sin(vWp.x * 5.) * 2.);
        vec3 glass = gc * sheet(vec3(V.x, abs(V.y), V.z)) * rip * uGlassGain * mix(vec3(0.72, 0.85, 1.), vec3(1.), 0.35);
        gl_FragColor = vec4(mix(glass, uLead, came * (1. - smoothstep(0.25, 0.6, fw))), 1.);
        #include <fog_fragment>
      }`,
  });
}

// pane-winged birds: five panes each, wings hinged on lead; three groups steered on the CPU, the rest here.
function birdMaterial(U, extra) {
  return shader(U, {
    side: THREE.DoubleSide, extra,
    vs: W_COMMON + /* glsl */`
      attribute vec4 iO; attribute float iG, aPart; attribute vec2 aUv;
      uniform vec4 uGrp[3]; uniform vec4 uGrpV[3]; uniform vec3 uBird;      // uBird: flap rate, flap amplitude, glide
      varying vec2 vUv; varying vec3 vWp, vN; varying vec2 vK;
      ${FOG_V}
      void main(){
        int g = int(iG + 0.5); vec4 G = uGrp[g], GV = uGrpV[g]; float r = iO.w, t = uTime;
        vec3 p = position;
        float fl = sin(t * uBird.x * (0.85 + 0.3 * r) + r * 40.) * uBird.y * (1. - uBird.z * smoothstep(0.2, 0.9, sin(t * 0.6 + r * 17.)));
        if (aPart > 0.5 && aPart < 2.5) { float a = fl + 0.44; p = vec3(p.x * cos(a), p.y + abs(p.x) * sin(a), p.z); }
        vec3 n = aPart < 0.5 ? vec3(1., 0., 0.) : vec3(0., 1., 0.);
        p.y += fl * -0.06;
        float h = G.w + 0.25 * sin(t * 0.8 + r * 21.), bank = 0.3 * sin(t * 0.7 + r * 11.);
        p = vec3(p.x * cos(bank) - p.y * sin(bank), p.x * sin(bank) + p.y * cos(bank), p.z);
        p.yz = vec2(p.y * cos(GV.y) + p.z * sin(GV.y), -p.y * sin(GV.y) + p.z * cos(GV.y));
        vec3 w = vec3(p.x * cos(h) + p.z * sin(h), p.y, -p.x * sin(h) + p.z * cos(h)) * GV.x;
        vec3 off = iO.xyz * GV.z + vec3(sin(t * 0.7 + r * 9.), 0.5 * sin(t * 0.9 + r * 5.), cos(t * 0.6 + r * 7.)) * 1.1;
        off = vec3(off.x * cos(G.w) + off.z * sin(G.w), off.y, -off.x * sin(G.w) + off.z * cos(G.w));
        vWp = G.xyz + off + w; vUv = aUv; vK = vec2(r, aPart);
        vN = vec3(n.x * cos(h) + n.z * sin(h), n.y, -n.x * sin(h) + n.z * cos(h));
        vec4 mvPosition = viewMatrix * vec4(vWp, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fs: W_COMMON + /* glsl */`
      varying vec2 vUv; varying vec3 vWp, vN; varying vec2 vK;
      ${FOG_F}
      void main(){
        float fw = (abs(dFdx(vUv.x)) + abs(dFdy(vUv.x)) + abs(dFdx(vUv.y)) + abs(dFdy(vUv.y))) * 0.6;
        float e = min(min(vUv.x, vUv.y), 1. - vUv.x - vUv.y * 0.0);
        e = min(vUv.x, min(vUv.y, 1. - max(vUv.x, vUv.y)));
        float bw = max(0.07, 1.5 * fw), came = 1. - smoothstep(bw * 0.6, bw, e);
        vec3 V = normalize(vWp - cameraPosition);
        float r = vK.x, part = vK.y;
        vec3 sc = mix(wSeason(0.25 + 0.6 * fract(r * 5. + part * 0.21), uU, r, 0.), fam(3., r), wFrost(uU));
        vec3 gc = (part < 0.5 || part > 4.5) ? sc * 0.7 : part > 3.5 ? vec3(0.9, 0.93, 0.95) : sc;
        vec3 glass = gc * sheet(V) * (0.85 + 0.15 * sin(vUv.x * 9. + r * 30.)) * uGlassGain;
        gl_FragColor = vec4(mix(glass, uLead, came * (1. - smoothstep(0.3, 0.7, fw))), 1.);
        #include <fog_fragment>
      }`,
  });
}

// leaded cells on any surface (the dragonfly, the stag's glazing, frost panes in the rose): 3D Voronoi came
function cellMaterial(U, extra, opt = {}) {
  return shader(U, {
    side: opt.side ?? THREE.FrontSide, extra,
    vs: /* glsl */`
      varying vec3 vLp, vWp, vN;
      ${FOG_V}
      void main(){
        vLp = position; vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fs: W_COMMON + /* glsl */`
      uniform vec3 uTint, uTint2; uniform vec4 uCell;     // uCell: cells per metre, jitter, season glow, craze
      varying vec3 vLp, vWp, vN;
      ${FOG_F}
      float h31(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      void main(){
        vec3 p = vLp * uCell.x; float fw = length(fwidth(p));
        vec3 ip = floor(p), fp = fract(p); float d1 = 9., d2 = 9.; vec3 id = vec3(0.);
        for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec3 g = vec3(float(i), float(j), float(k));
          vec3 o = 0.5 + (vec3(h31(ip + g), h31(ip + g + 19.7), h31(ip + g + 43.1)) - 0.5) * uCell.y;
          vec3 dv = g + o - fp; float d = dot(dv, dv);
          if (d < d1) { d2 = d1; d1 = d; id = ip + g; } else if (d < d2) { d2 = d; }
        }
        float edge = sqrt(d2) - sqrt(d1), h = h31(id + 3.3);
        float bw = max(0.08, 1.5 * fw), came = 1. - smoothstep(bw * 0.6, bw, edge);
        vec3 V = normalize(vWp - cameraPosition), N = normalize(vN);
        float nv = abs(dot(N, V));
        vec3 seasonC = mix(wSeason(0.3 + 0.5 * h, uU, h, 0.), fam(3., h), wFrost(uU));
        vec3 gc = mix(mix(uTint, uTint2, h * h), seasonC, uCell.z * (1. - nv) );
        float craze = smoothstep(0.07, 0.0, abs(sin(p.x * 7. + h * 9.) * sin(p.y * 6.3 + h * 7.) - 0.2)) * uCell.w;
        vec3 glass = gc * sheet(V) * mix(0.5, 1., smoothstep(0., 0.8, nv)) * (0.8 + 0.2 * sin(dot(p, vec3(3., 5., 4.)) + h * 20.)) * uGlassGain + craze * 0.3;
        glass += uSheetCol * pow(1. - nv, 3.) * 0.25;
        gl_FragColor = vec4(mix(glass, uLead, came * (1. - smoothstep(0.35, 0.9, fw))), 1.);
        #include <fog_fragment>
      }`,
  });
}

// the four wings: fans of blur. Cross-veins survive the stroke as arcs; everything else smears.
function wingMaterial(U, extra) {
  return shader(U, {
    side: THREE.DoubleSide, transparent: true, depthWrite: false, extra,
    vs: /* glsl */`
      attribute vec2 aFan; varying vec2 vFan; varying vec3 vWp; varying vec4 vClip;
      ${FOG_V}
      void main(){
        vFan = aFan; vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; vClip = gl_Position;
        #include <fog_vertex>
      }`,
    fs: W_COMMON + /* glsl */`
      uniform float uWingA; varying vec2 vFan; varying vec3 vWp; varying vec4 vClip;
      ${FOG_F}
      void main(){
        float f = vFan.x, a = vFan.y;                     // f: root 0 .. tip 1; a: stroke -1 .. 1
        float fw = abs(dFdx(f)) + abs(dFdy(f));
        float dwell = smoothstep(0.5, 1., abs(a));
        float envF = smoothstep(0.03, 0.2, f) * (1. - smoothstep(0.9, 1., f)), env = (1. - smoothstep(0.9, 1., abs(a))) * envF;
        float vd = abs(fract(f * 17. + 0.3 * sin(f * 23. + a * 2.)) - 0.5), vein = 1. - smoothstep(0.03, 0.09 + fw * 14., vd);
        float costa = smoothstep(0.8, 0.9, abs(a)) * (1. - smoothstep(0.95, 1., abs(a)));
        float shim = 1. + 0.1 * sin(uTime * 12.566 + a * 3.);
        vec3 V = normalize(vWp - cameraPosition);
        float ph = f * 9. + a * 2.;
        vec3 irid = max(uSheetCol * 0.45 * sheet(V) / uSheetGain + 0.05 * vec3(sin(ph), sin(ph + 2.1), sin(ph + 4.2)), vec3(0.));   // a grey veil, never a milky pane
        float rib = smoothstep(0.1, 0., abs(abs(a) - 0.62 - 0.2 * f)) * 0.5;      // the long veins, smeared to a soft band
        float aM = env * (0.014 + 0.016 * dwell), aV = env * (0.56 * vein * (0.6 + 0.4 * dwell) + 0.08 * rib) + envF * 0.34 * costa;
        vec2 ndc = vClip.xy / max(vClip.w, 1e-4);           // fans of blur at the left and right edges of the frame, never over the view
        float edgeM = smoothstep(0.58, 0.8, abs(ndc.x)) * (1. - smoothstep(0.1, 0.42, ndc.y));
        float alpha = min((aM + aV) * shim * uWingA * edgeM, 1.);
        vec3 col = (irid * aM + uLead * aV) / max(aM + aV, 1e-4);
        gl_FragColor = vec4(col, alpha);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- looks
const LOOKS = {
  pearl: { sheet: '#DDE9F0', pearl: '#DDE9F0', dome: 1.9, sheetGain: 1.15, glass: 1.5, fog: 0.0028, rain: 0, exposure: 1.0, bloom: { strength: 0.3, radius: 0.6, threshold: 2.2 }, sat: 1.08, portal: '#cfe4ff' },
  evening: { sheet: '#3A4372', horizon: '#8A97C6', mottle: 0.45, ground: 1.4, pearl: '#9DB6F2', dome: 1.08, sheetGain: 0.8, glass: 1.4, fog: 0.0038, rain: 0, exposure: 1.1, bloom: { strength: 0.36, radius: 0.7, threshold: 1.2 }, sat: 1.0, portal: '#9fb8ff' },
  rain: { sheet: '#C3D2DD', pearl: '#D3E0E8', dome: 1.5, sheetGain: 1.05, glass: 1.5, fog: 0.0041, rain: 1, exposure: 1.0, bloom: { strength: 0.3, radius: 0.6, threshold: 1.75 }, sat: 1.04, portal: '#cfe4ff' },
};

// instanced pane set
class Panes {
  constructor() { this.p = []; this.a = []; this.b = []; }
  add(x, y, z, size, rnd, s, kind, yaw, tilt, aspect, hang) { this.p.push(x, y, z); this.a.push(size, rnd, s, kind); this.b.push(yaw, tilt, aspect, hang); }
  get count() { return this.p.length / 3; }
  mesh(mat) {
    const quad = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
    g.index = quad.index; g.setAttribute('position', quad.getAttribute('position'));
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(this.a), 4));
    g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(this.b), 4));
    g.instanceCount = this.count;
    const box = new THREE.Box3(); for (let i = 0; i < this.p.length; i += 3) box.expandByPoint(V3(this.p[i], this.p[i + 1], this.p[i + 2]));
    g.boundingSphere = box.isEmpty() ? new THREE.Sphere(V3(0, 0, 0), 1) : box.getBoundingSphere(new THREE.Sphere()); g.boundingSphere.radius += 6;
    return new THREE.Mesh(g, mat);
  }
}
function instQuad(geo, attrs, count, center, radius) {
  const g = new THREE.InstancedBufferGeometry(); g.index = geo.index;
  for (const k of Object.keys(geo.attributes)) g.setAttribute(k, geo.attributes[k]);
  for (const [name, arr, n] of attrs) g.setAttribute(name, new THREE.InstancedBufferAttribute(arr instanceof Float32Array ? arr : new Float32Array(arr), n));
  g.instanceCount = count; g.boundingSphere = new THREE.Sphere(center, radius);
  return g;
}

export default {
  id: 'leaded-forest', name: 'The Leaded Forest', category: 'wilderness', weirdness: 0.55, media: ['air'],
  async build(ctx) {
    const { rng } = ctx, noise = ctx.noise, { clamp, smoothstep, lerp } = ctx.core;
    const vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3) * detail;
    // ---- what this visit is ----
    const pick = rng.fork('look'), lr = pick(), vr = pick(), ar = pick();
    const hour = vary.hour || 'any';
    const lookId = hour === 'night' ? 'evening' : (hour === 'day' || hour === 'golden') ? 'pearl' : hour === 'dawn' ? 'rain' : lr < 0.42 ? 'pearl' : lr < 0.74 ? 'evening' : 'rain';
    const look = LOOKS[lookId];
    const variant = vr < 0.62 ? 'wisteria' : 'laburnum';
    const autumn = ar < 0.5 ? 'amber' : ar < 0.75 ? 'wine' : 'ginkgo';
    const birdKind = pick.pick(['kingfisher', 'swallow', 'moth']), lilies = pick.chance(0.4), beast = pick.chance(0.6) ? 'stag' : 'fox';
    pick.chance(0.5);                                         // (was: a second dragonfly in the dome. Retired: it never read at flight distance. The draw is kept so every other seeded choice stays as it was)
    const rare = !!vary.rare;
    const pal = PALETTE.slice(); pal[1] = look.pearl;
    const FRONT = { summer: 0.131, autumn: 0.405, winter: 0.485 };
    const xr = ctx.core.makeRng('leaded-forest-more:' + ctx.seed);   // its own stream: later additions never shift the draws of what was already there

    const scene = new THREE.Scene();
    const hero = await buildHero(ctx, {
      palette: pal, variant, autumn, density: clamp(vary.density ?? 1, 0.7, 1.15), sheetGain: look.sheetGain, glassGain: look.glass, rain: look.rain, duration: 60,
      timeline: { summer: [0.235, 0.285], autumn: [0.50, 0.60], fall: 0.555, winter: [0.66, 0.76] },
    });
    scene.add(hero.object);
    await ctx.yield();

    // ---- the path: brook, canopy, dome, avenue, the climb to the ring ----
    const sw = rng.range(0.88, 1.1), lift = rng.range(-1, 1.5);
    const pts = [[BX, 2.5, 330], [BX, 2.5, 292], [BX, 2.5, 254], [BX, 2.7, 222], [BX + 3.5 * sw, 5.4, 198], [BX + 12 * sw, 11, 174], [BX + 20 * sw, 16.3 + lift * 0.5, 150],
      [BX + 23 * sw, 18.6 + lift, 127], [BX + 20 * sw, 18.4 + lift, 105], [BX + 11 * sw, 17.4 + lift * 0.4, 83], [BX + 2.6, 16.2, 61], [BX + 0.3, 15.5, 47]];
    const fly = hero.anchors.flyThrough;
    for (let k = 2; k <= fly.length - 2; k++) pts.push([fly[k].x, fly[k].y, fly[k].z]);
    for (const [t, y] of [[60, 12.5], [85, 8], [104, 6.2], [118, 7.9], [132, 13.8], [146.4, 23.6], [164.27, 38.6], [182.13, 53.6], [200, 68.6]]) pts.push([EX + HX * t, y, EZ + HZ * t]);
    const path = makePath(pts);
    const sOf = (x, z) => path.nearestXZ(x, z).u;
    const clearPt = (p, m) => path.distanceTo(p.x, p.y, p.z) > m;
    const uOfT = (t) => sOf(EX + HX * t, EZ + HZ * t);

    // ---- uniforms shared with the hero ----
    const sheetCol = new THREE.Color(look.sheet), pearlCol = new THREE.Color(look.pearl);
    const WU = {
      ...hero.uniforms, uU: { value: 0 }, uSheetCol: { value: sheetCol }, uPearl: { value: pearlCol }, uDome: { value: look.dome },
      uFront: { value: V3(FRONT.summer, FRONT.autumn, FRONT.winter) },
      uCeladon: { value: new THREE.Color('#9AD9B4') }, uCobalt: { value: new THREE.Color(PALETTE[6]) },
      uHorizon: { value: new THREE.Color(look.horizon || look.sheet) }, uGroundGain: { value: look.ground || 1 }, uMottle: { value: look.mottle ?? 1 },
    };
    const fogCol = WU.uHorizon.value.clone().multiplyScalar(look.dome * 1.02);
    scene.fog = new THREE.FogExp2(fogCol, look.fog);
    scene.background = fogCol.clone();
    const sheetDome = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), sheetMaterial(WU));
    sheetDome.renderOrder = -1; sheetDome.frustumCulled = false; scene.add(sheetDome);

    // ---- ground ----
    {
      const g = new THREE.PlaneGeometry(1700, 1700, 64, 64).rotateX(-Math.PI / 2).translate(-30, 0, 90);
      const pa = g.getAttribute('position'), aS = new Float32Array(pa.count);
      for (let i = 0; i < pa.count; i++) aS[i] = sOf(pa.getX(i), pa.getZ(i));
      g.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
      scene.add(new THREE.Mesh(g, groundMaterial(WU)));
    }
    await ctx.yield();

    // ---- trees ----
    const leafMat = leafMaterial(WU), leadMat = leadMaterial(WU, false), birchMat = leadMaterial(WU, true);
    const limbPts = (p0, dir, len, n, curl, rr, margin, wob = 0.18) => {
      const out = [p0.clone()], d = dir.clone().normalize(), p = p0.clone(), step = len / n;
      for (let k = 1; k <= n; k++) {
        d.x += rr.range(-wob, wob); d.z += rr.range(-wob, wob); d.y += curl + rr.range(-0.08, 0.08); d.normalize();
        p.addScaledVector(d, step);
        if (margin && !clearPt(p, margin)) break;
        out.push(p.clone());
      }
      return out.length >= 3 ? out : null;
    };
    const addChecked = (tb, ps, rad, sides, margin) => {       // adds the runs of a polyline that keep clear of the camera
      let run = [], k0 = 0; const N = ps.length;
      const flush = (k) => { if (run.length >= 3) { const a = k0, m = run.length; tb.add(run, typeof rad === 'function' ? (q) => rad((a + q * (m - 1)) / (N - 1)) : rad, sides); } run = []; };
      for (let k = 0; k < N; k++) { if (clearPt(ps[k], margin)) { if (!run.length) k0 = k; run.push(ps[k]); } else flush(k); }
      flush(N);
    };
    const leafOK = (x, y, z, size) => y > 1 && path.distanceTo(x, y, z) > 6.6 + size * 0.55;
    const poolPts = [];
    // the sight tunnel through the summer canopy: along the lines the camera looks down between u 0.18 and 0.4 (the path
    // ahead, and the dome) a flat slot is kept free of leaves, wide to the sides and 6 m up and down, so leaves still
    // pass above and below while the middle of the frame stays open on the far greens and the dome
    const sight = [];
    {
      const c = V3(0, 0, 0), a = V3(0, 0, 0), h = V3(0, 0, 0);
      for (let dd = 108; dd <= 252; dd += 6) {
        path.posAtDist(dd, c); path.posAtDist(dd + 40, a); a.sub(c).normalize();
        sight.push(c.x, c.y, c.z, a.x, a.y, a.z, 64, 0.2, 10, 5.7);
        if (dd >= 156) {
          h.set(-c.x, 31 - c.y, -c.z).normalize(); sight.push(c.x, c.y, c.z, h.x, h.y, h.z, 120, 0.13, 7.5, 5.7);
          a.lerp(h, 0.45).normalize(); sight.push(c.x, c.y, c.z, a.x, a.y, a.z, 84, 0.2, 9, 5.7);
        }
      }
    }
    const inSight = (x, y, z, size) => {
      for (let i = 0; i < sight.length; i += 10) {
        const dx = x - sight[i], dy = y - sight[i + 1], dz = z - sight[i + 2], t = dx * sight[i + 3] + dy * sight[i + 4] + dz * sight[i + 5];
        if (t < 4 || t > sight[i + 6]) continue;
        const py = dy - t * sight[i + 4], ph2 = Math.max(0, dx * dx + dy * dy + dz * dz - t * t - py * py), g = 2.4 + sight[i + 7] * t;
        const rh = Math.min(sight[i + 8], g) + size * 0.4, rv = Math.min(sight[i + 9], g) + size * 0.3;
        if (ph2 / (rh * rh) + (py * py) / (rv * rv) < 1) return true;
      }
      return false;
    };
    const doorLeaf = (L, p, spread, drop, size, s, rr, tight, skip) => {
      const x = p.x + rr.range(-spread, spread), y = p.y - rr.range(0.2, drop), z = p.z + rr.range(-spread, spread);
      if (tight ? !(y > 1 && path.distanceTo(x, y, z) > 6.1 + size * 0.5) : !leafOK(x, y, z, size)) return;
      const flat = rr() < 0.55, tilt = (flat ? rr.range(0.55, 0.95) : rr.range(0.1, 0.55)) * rr.sign(), r1 = rr(), yaw = rr() * 6.283;
      if (skip || (s > 0.15 && s < 0.45 && inSight(x, y, z, size))) return;
      L.add(x, y, z, size, r1, s, 1, yaw, tilt, 0.62, 3 + drop * 2);
    };
    function summerTree(tb, L, x, z, lod, rr, s) {
      if (lod < 2) poolPts.push(x, z, s);
      const H = rr.range(34, 42), R0 = rr.range(1.0, 1.45), ph = rr() * 9, tp = [], n = lod === 0 ? 9 : lod === 1 ? 6 : 4, lx = rr.range(-0.04, 0.04), lz = rr.range(-0.04, 0.04);
      for (let k = 0; k <= n; k++) { const t = k / n, y = -1 + t * (H + 1); tp.push(V3(x + lx * y + 0.5 * Math.sin(t * 5 + ph), y, z + lz * y + 0.5 * Math.cos(t * 4 + ph))); }
      tb.add(tp, (t) => R0 * (1 - 0.72 * t) * (1 + 1.1 * Math.exp(-t * 14)), lod === 0 ? 7 : lod === 1 ? 5 : 4);
      const at = (h) => { const t = (h + 1) / (H + 1) * n, i = Math.min(n - 1, Math.floor(t)); return tp[i].clone().lerp(tp[i + 1], t - i); };
      const nb = lod === 0 ? rr.int(6, 8) : lod === 1 ? rr.int(4, 5) : 0, lk = lod === 0 ? 1 : 1.5;
      for (let b = 0; b < nb; b++) {
        const top = lod === 0 && b >= nb - 2, h = top ? rr.range(27, H - 3) : rr.range(10.5, 23), az = (b / nb) * 6.283 + rr.range(-0.5, 0.5), len = top ? rr.range(6, 9) : rr.range(9, 15);
        const bp = limbPts(at(h), V3(Math.sin(az), rr.range(0.25, 0.6), Math.cos(az)), len, lod === 0 ? 5 : 4, -0.07, rr, 7.2);
        if (!bp) continue;
        const r0 = R0 * rr.range(0.24, 0.34);
        tb.add(bp, (t) => r0 * (1 - 0.75 * t), lod === 0 ? 4 : 3);
        for (let k = 1; k < bp.length; k++) for (let j = 0; j < 3; j++) if (rr() < dens) doorLeaf(L, bp[k], 2.2 * lk, 2.2, rr.range(1.9, 2.9) * (lod === 0 ? 0.84 : lk), s, rr, false, lod === 0 && j === 2);   // near trees: two smaller leaves a joint, so one canopy shows through another
        if (lod === 0) for (let j = 0; j < 2; j++) {
          const q = bp[rr.int(1, bp.length - 2)], a2 = az + rr.range(0.6, 1.4) * rr.sign();
          const sp = limbPts(q, V3(Math.sin(a2), rr.range(-0.1, 0.4), Math.cos(a2)), rr.range(4, 6.5), 3, -0.1, rr, 7);
          if (!sp) continue;
          tb.add(sp, (t) => r0 * 0.42 * (1 - 0.7 * t), 3);
          for (let k = 1; k < sp.length; k++) for (let i = 0; i < 2; i++) if (rr() < dens) doorLeaf(L, sp[k], 1.8, 2.4, rr.range(1.8, 2.7) * 0.88, s, rr);
        }
      }
      const nc = lod === 2 ? 15 : 10, top = tp[n];
      for (let i = 0; i < nc; i++) if (rr() < dens) { const a = rr() * 6.283, r = rr.range(1.5, lod === 2 ? 9 : 7); doorLeaf(L, V3(top.x + Math.sin(a) * r, rr.range(lod === 2 ? 14 : 25, H + 2), top.z + Math.cos(a) * r), 0.5, 1, rr.range(2.2, 3.2) * (lod === 2 ? 2.1 : 1.3), s, rr); }
    }
    function birchTree(tb, tw, L, x, z, lod, rr, s) {
      const H = rr.range(18, 25), R0 = rr.range(0.3, 0.44), ph = rr() * 9, tp = [], n = lod === 0 ? 7 : lod === 1 ? 5 : 3, lx = rr.range(-0.05, 0.05), lz = rr.range(-0.05, 0.05);
      for (let k = 0; k <= n; k++) { const t = k / n, y = -0.5 + t * (H + 0.5); tp.push(V3(x + lx * y + 0.35 * Math.sin(t * 4 + ph), y, z + lz * y + 0.35 * Math.cos(t * 3 + ph))); }
      tb.add(tp, (t) => R0 * (1 - 0.8 * t) * (1 + 0.5 * Math.exp(-t * 20)), lod === 0 ? 6 : lod === 1 ? 5 : 4);
      const nb = lod === 0 ? 7 : lod === 1 ? 4 : 0, lk = lod === 0 ? 1 : 1.55;
      for (let b = 0; b < nb; b++) {
        const t = rr.range(0.32, 0.95) * n, i = Math.min(n - 1, Math.floor(t)), p0 = tp[i].clone().lerp(tp[i + 1], t - i), az = rr() * 6.283;
        const bp = limbPts(p0, V3(Math.sin(az), rr.range(0.5, 1.1), Math.cos(az)), rr.range(3, 6), 4, -0.2, rr, 6.4, 0.12);
        if (!bp) continue;
        tw.add(bp, (q) => 0.085 * (1 - 0.6 * q), 3);
        for (let k = 1; k < bp.length; k++) for (let j = 0; j < (lod === 0 ? 5 : 3); j++) if (rr() < dens) {
          const sz = rr.range(0.5, 0.82) * lk, lx2 = bp[k].x + rr.range(-0.9, 0.9), drop = rr.range(0.2, 2.4), ly = bp[k].y - drop, lz2 = bp[k].z + rr.range(-0.9, 0.9);
          if (leafOK(lx2, ly, lz2, sz)) L.add(lx2, ly, lz2, sz, rr(), s, rr() < 0.36 ? 0.5 : 0, rr() * 6.283, rr.range(-0.35, 0.35), 0.72, drop + 0.6);
        }
      }
      if (lod === 2) for (let i = 0; i < 12; i++) { const a = rr() * 6.283, r = rr.range(0.5, 3.2); L.add(tp[n].x + Math.sin(a) * r, rr.range(H * 0.4, H + 1), tp[n].z + Math.cos(a) * r, rr.range(1.4, 2.2), rr(), s, rr() < 0.36 ? 0.5 : 0, rr() * 6.283, rr.range(-0.35, 0.35), 0.72, 2); }
    }
    const SB = 0.36, beechL = new Panes();                    // beech leaves turn and let go with the dome, whatever their place on the path
    const beechLeaf = (p, rr, k = 1, spread = 1.3) => {
      const size = rr.range(1.5, 2.4) * k, x = p.x + rr.range(-spread, spread), y = p.y - rr.range(0.2, 1.8), z = p.z + rr.range(-spread, spread);
      if (leafOK(x, y, z, size)) beechL.add(x, y, z, size, rr(), SB, 3, rr() * 6.283, rr.range(-0.6, 0.6), 0.68, 1.5);
    };
    function beechTree(tb, L, x, z, lod, rr, s) {
      const H = rr.range(48, 68), R0 = rr.range(0.9, 1.3), ph = rr() * 9, tp = [], n = lod === 1 ? 6 : 4;
      for (let k = 0; k <= n; k++) { const t = k / n, y = -1 + t * (H * 0.62 + 1); tp.push(V3(x + 0.6 * Math.sin(t * 4 + ph), y, z + 0.6 * Math.cos(t * 3 + ph))); }
      tb.add(tp, (t) => R0 * (1 - 0.6 * t) * (1 + 0.9 * Math.exp(-t * 14)), lod === 1 ? 5 : 4);
      if (lod === 1) for (let b = 0; b < 3; b++) {
        const a = (b / 3) * 6.283 + ph, len = 2.4 + 1.5 * Math.sin(ph * 3 + b * 2.1) ** 2, rp = [];
        for (let k = 0; k <= 2; k++) { const q = k / 2; rp.push(V3(tp[0].x + Math.sin(a) * (0.4 + len * q), 2.6 * (1 - q) * (1 - q) - 0.25, tp[0].z + Math.cos(a) * (0.4 + len * q))); }
        tb.add(rp, (q) => R0 * (0.5 - 0.36 * q), 4);
      }
      const nb = lod === 1 ? 5 : 3;
      for (let b = 0; b < nb; b++) {
        const i = rr.int(Math.floor(n / 2), n), az = (b / nb) * 6.283 + rr.range(-0.4, 0.4);
        const bp = limbPts(tp[i], V3(Math.sin(az) * 0.6, 1, Math.cos(az) * 0.6), H * rr.range(0.3, 0.42), 5, 0.02, rr, 7, 0.14);
        if (!bp) continue;
        tb.add(bp, (t) => R0 * 0.36 * (1 - 0.8 * t), lod === 1 ? 4 : 3);
        if (lod === 1) for (let j = 0; j < 4; j++) {
          const q = bp[rr.int(1, bp.length - 1)], a2 = rr() * 6.283, sp = limbPts(q, V3(Math.sin(a2), rr.range(0.2, 1), Math.cos(a2)), rr.range(4, 9), 3, 0.05, rr, 7, 0.2);
          if (sp) { tb.add(sp, (t) => 0.11 * (1 - 0.6 * t), 3); if (rr() < 0.3) L.add(sp[1].x, sp[1].y - 0.4, sp[1].z, rr.range(0.9, 1.6), rr(), s, 2, rr() * 6.283, rr.range(-0.4, 0.4), 0.7, 1); for (let i = 1; i < sp.length; i++) if (rr() < dens) beechLeaf(sp[i], rr, 1.5, 2); }
        }
        else for (let k = 2; k < bp.length; k++) if (rr() < dens) beechLeaf(bp[k], rr, 2.6, 3);
      }
    }

    // ---- the forest: birches by the brook, the broad-leaved summer wood, bare beeches beyond the clearing ----
    const springTw = new Tubes(), birchTr = new Tubes(), summerLead = new Tubes(), winterLead = new Tubes();
    const birchL = new Panes(), summerL = new Panes(), winterL = new Panes();
    {
      const fr = rng.fork('forest'), CELL = 7.5; let row = 0;
      for (let gz = -255; gz < 352; gz += CELL) {
        for (let gx = -330; gx < 275; gx += CELL) {
          const x = gx + fr.range(0.1, 0.9) * CELL, z = gz + fr.range(0.1, 0.9) * CELL, roll = fr();
          if (Math.hypot(x, z) < 64 || Math.abs(x - BX) < 6) continue;
          if (z > 54 && x < 34 && x > 22 - Math.max(0, 330 - z) * 0.1) continue;          // the glade that shows the dome from the brook
          const near = path.nearestXZ(x, z), d = near.dist; if (d > 270) continue;
          const t = (x - EX) * HX + (z - EZ) * HZ, lat = (x - EX) * -HZ + (z - EZ) * HX;
          const wedge = 0.42 * t + 24 - Math.abs(lat), kind = (t > 58 && wedge > 0) ? 2 : z > 214 + 12 * noise.n2(x * 0.02, 3.1) ? 0 : 1;
          const belt = (kind === 1 && (Math.hypot(x, z) < 104 || (t > 30 && wedge > -46))) ? 1.7 : 1;
          const rr = fr.fork('t' + gx + '_' + gz);
          if (kind === 0) {
            if (d < 5.8) continue;
            const lod = d < 32 ? 0 : d < 75 ? 1 : 2;
            if (roll < (lod === 0 ? 0.62 : lod === 1 ? 0.3 : 0.12)) birchTree(birchTr, springTw, birchL, x, z, lod, rr, near.u);
          } else if (kind === 1) {
            if (d < 10.5) continue;
            const lod = d < 30 ? 0 : d < 84 ? 1 : 2;
            if (roll < (lod === 0 ? 0.2 : lod === 1 ? 0.13 : 0.075) * belt) summerTree(summerLead, summerL, x, z, lod, rr, near.u);
          } else {
            if (Math.abs(lat) < 27 && t < AV_T1 + 14) continue;
            const lod = d < 62 ? 1 : 2;
            if (roll < (lod === 1 ? 0.1 : 0.04)) beechTree(winterLead, winterL, x, z, lod, rr, near.u);
          }
        }
        if (++row % 2 === 0) await ctx.yield();
      }
    }
    // ---- the canopy tunnel: summer trees close on both sides of the climb, their boughs arching over and under the
    // line of flight, so the leaves pass above and below and the clearing bursts open at its far end ----
    {
      const tr = rng.fork('tunnel'), c0 = V3(0, 0, 0), tg = V3(0, 0, 0); let i = 0;
      const bough = (x, z, side, lat, py, s, over) => {
        const y0 = over ? py + tr.range(8.6, 11.5) : py - tr.range(8.6, 10.5); if (y0 < 3.2) return;
        const lend = -side * tr.range(1, 9), fwd = tr.range(-5, 5), ps = [];
        for (let k = 0; k <= 7; k++) { const q = k / 7, l = lat + (lend - lat) * q, a = fwd * q; ps.push(V3(c0.x + (-tg.z) * l + tg.x * a, y0 + (over ? 1.6 : -1.2) * Math.sin(q * Math.PI) - (over ? 1.2 : -0.6) * q, c0.z + tg.x * l + tg.z * a)); }
        ps[0].set(x, y0 - (over ? 2 : -1), z);
        addChecked(summerLead, ps, (q) => 0.36 * (1 - 0.7 * q), 4, 7.3);
        for (let k = 1; k <= 7; k++) for (let j = 0; j < 4; j++) if (tr() < dens) doorLeaf(summerL, ps[k], 2.6, over ? 2.8 : 1.4, tr.range(2.0, 3.2) * 0.88, s, tr, true);
      };
      for (let dd = 119; dd < 247; dd += 6.4, i++) {
        path.posAtDist(dd, c0); path.tangentAtDist(dd, tg); const hl = Math.hypot(tg.x, tg.z) || 1; tg.x /= hl; tg.z /= hl;
        for (const side of [-1, 1]) {
          const lat = side * tr.range(9.8, 13.2), x = c0.x - tg.z * lat, z = c0.z + tg.x * lat, rr = tr.fork('t' + i + side);
          if (Math.abs(x - BX) < 7.5 || (x < 35.5 && x > 16 - Math.max(0, 330 - z) * 0.1) || Math.hypot(x, z) < 66 || path.nearestXZ(x, z).dist < 9.3) continue;
          const s = sOf(x, z);
          summerTree(summerLead, summerL, x, z, 0, rr, s);
          bough(x, z, side, lat, c0.y, s, true); if (i % 2 === (side > 0 ? 0 : 1)) bough(x, z, side, lat, c0.y, s, false);
        }
        if (i % 2 === 1) await ctx.yield();
      }
    }

    // ---- the winter avenue: two rows of lead beeches whose crowns lace into a pointed vault ----
    const hangPts = [], AV_YAW = Math.atan2(HX, HZ);
    const avLead = new Tubes(), AP = (t, lat, y) => V3(EX + HX * t - HZ * lat, y, EZ + HZ * t + HX * lat);
    const APEX_H = Math.sqrt(VAULT_R * VAULT_R - (VAULT_R - AV_W) * (VAULT_R - AV_W)), ribOff = (h) => AV_W - (VAULT_R - Math.sqrt(Math.max(0, VAULT_R * VAULT_R - h * h)));
    {
      const ar = rng.fork('avenue');
      const twigs = (ps, n, s) => {
        for (let k = 2; k < ps.length; k++) for (let j = 0; j < n; j++) {
          if (!clearPt(ps[k], 7)) continue;
          if (ps[k].y > 40) hangPts.push(ps[k]);
          const a = ar() * 6.283, sp = limbPts(ps[k], V3(Math.sin(a), ar.range(-0.3, 0.9), Math.cos(a)), ar.range(4, 10), 2, 0.07, ar, 6.9, 0.3);
          if (!sp) continue;
          avLead.add(sp, (q) => 0.12 * (1 - 0.6 * q), 3);
          for (let i = 1; i < sp.length; i += 1) if (ar() < 0.8 * dens) beechLeaf(sp[i], ar);
          if (ar() < 0.24) winterL.add(sp[1].x, sp[1].y - 0.5, sp[1].z, ar.range(1, 1.9), ar(), s, 2, ar() * 6.283, ar.range(-0.5, 0.5), 0.7, 1);
          else if (xr() < 0.47) winterL.add(sp[1].x, sp[1].y - 0.5, sp[1].z, xr.range(1, 1.9), xr(), s, 2, xr() * 6.283, xr.range(-0.5, 0.5), 0.7, 1);
        }
      };
      let bay = 0;
      for (let t = AV_T0; t <= AV_T1; t += AV_STEP, bay++) {
        const s = uOfT(Math.min(t, 200));
        for (const side of [-1, 1]) {
          const tt = t + ar.range(-1.2, 1.2), l0 = side * (AV_W + ar.range(-0.6, 0.8)), ph = ar() * 9, R0 = ar.range(1.05, 1.35), tp = [], sc = ar.range(0.7, 1.15);
          for (let k = 0; k <= 9; k++) { const q = k / 9, y = -1 + q * (VAULT_Y0 + 1), w = Math.sin(q * Math.PI); tp.push(AP(tt + sc * w * Math.sin(q * 5.2 + ph), l0 + side * 0.5 * w + sc * 0.6 * w * Math.cos(q * 4.4 + ph), y)); }
          avLead.add(tp, (q) => R0 * (1 - 0.35 * q) * (1 + 0.75 * Math.exp(-q * 16)) * (1 + 0.05 * Math.sin(q * 31 + ph)), 7);
          for (let b = 0, nr = ar.int(4, 5); b < nr; b++) {     // roots flaring into the slate
            const a = (b / nr) * 6.283 + ar.range(-0.4, 0.4), len = ar.range(2.6, 4.2), ca = Math.cos(a), sa = Math.sin(a), rp = [];
            for (let k = 0; k <= 4; k++) { const q = k / 4; rp.push(AP(tt + ca * (0.5 + len * q), l0 + sa * (0.5 + len * q), 3.1 * (1 - q) * (1 - q) - 0.25)); }
            avLead.add(rp, (q) => R0 * (0.5 - 0.36 * q), 4);
          }
          for (let b = 0, nf = ar.int(4, 6); b < nf; b++) {     // fine branches low on the trunk, some holding a pane of frost
            const q = ar.range(0.2, 0.76) * 9, i0 = Math.floor(q), p0 = tp[i0].clone().lerp(tp[i0 + 1], q - i0), a = ar() * 6.283;
            const fp = limbPts(p0, V3(Math.sin(a), ar.range(0.15, 0.7), Math.cos(a)), ar.range(3.5, 8), 4, 0.07, ar, 6.9, 0.2);
            if (!fp) continue;
            avLead.add(fp, (qq) => 0.1 * (1 - 0.65 * qq), 3);
            if (ar() < 0.55) { const fq = fp[fp.length - 2]; winterL.add(fq.x, fq.y - 0.5, fq.z, ar.range(1.1, 2.1), ar(), s, 2, ar() * 6.283, ar.range(-0.5, 0.5), 0.7, 1); }
            else if (xr() < 0.67) { const fq = fp[fp.length - 2]; winterL.add(fq.x, fq.y - 0.5, fq.z, xr.range(1.1, 2.1), xr(), s, 2, xr() * 6.283, xr.range(-0.5, 0.5), 0.7, 1); }
          }
          for (const [dt, r0, n, sides] of [[0, 0.72, 12, 6], [AV_STEP * 0.5, 0.42, 9, 5], [-AV_STEP * 0.5, 0.42, 9, 5]]) {
            const rib = [];
            for (let k = 0; k <= n; k++) { const q = k / n, h = q * APEX_H; rib.push(AP(tt + dt * q + 0.5 * Math.sin(q * 7 + ph + dt), (l0 / AV_W) * ribOff(h) * (dt ? 1 : 1) + 0.4 * Math.sin(q * 9 + ph), VAULT_Y0 + h + (dt ? -2.5 * Math.sin(q * Math.PI) : 0))); }
            addChecked(avLead, rib, (q) => r0 * (1 - 0.68 * q), sides, 6.9);
            twigs(rib, dt ? 1 : 2, s);
            for (let j = 0, np = dt ? 3 : 5; j < np; j++) {   // clear, frost-crazed panes still glazing the vault: they face down the avenue, so the climb looks through half-glazed tracery
              const q = rib[xr.int(1, n - 1)], gx = q.x + xr.range(-0.7, 0.7), gy = q.y - xr.range(0.3, 1.5), gz = q.z + xr.range(-0.7, 0.7), size = xr.range(2.0, 3.6), r1 = xr(), yw = AV_YAW + xr.range(-0.55, 0.55), tl = xr.range(-0.5, 0.2);
              if (path.distanceTo(gx, gy, gz) > 8 + size * 0.5) winterL.add(gx, gy, gz, size, r1, s, 2, yw, tl, 0.8, 0.6);
            }
          }
          for (let b = 0; b < 3; b++) {                       // limbs that reach away from the avenue
            const a = Math.atan2(-HZ * side, HX * side) + ar.range(-1.1, 1.1), p0 = tp[ar.int(5, 9)];
            const lp = limbPts(p0, V3(Math.sin(a) * 0.7, 1, Math.cos(a) * 0.7), ar.range(20, 34), 5, 0.02, ar, 7, 0.14);
            if (lp) { avLead.add(lp, (q) => R0 * 0.34 * (1 - 0.8 * q), 4); twigs(lp, 1, s); }
          }
          for (let b = 0; b < 2; b++) {                       // low boughs leaning into the avenue
            const p0 = tp[ar.int(3, 6)], a = Math.atan2(HZ * side, -HX * side) + ar.range(-0.9, 0.9);
            const lp = limbPts(p0, V3(Math.sin(a), 0.5, Math.cos(a)), ar.range(5, 8), 4, 0.06, ar, 7, 0.16);
            if (lp) avLead.add(lp, (q) => 0.2 * (1 - 0.7 * q), 4);
          }
        }
        await ctx.yield();
      }
      // ridge and purlins tie the bays together
      for (const [h, lats, r] of [[APEX_H - 0.5, [0], 0.3], [30, [-1, 1], 0.2], [15, [-1, 1], 0.17]]) for (const sd of lats) {
        const ps = []; for (let t = AV_T0 - 4; t <= AV_T1 + 4; t += 1.9) { const f = ((t - AV_T0) / AV_STEP) % 1, arch = Math.sin(Math.PI * Math.abs(f)); ps.push(AP(t, sd * (ribOff(h) + 0.3), VAULT_Y0 + h + (sd ? 2.6 * arch : -1.6 * arch))); }
        addChecked(avLead, ps, r, 4, 6.9);
      }
    }
    await ctx.yield();
    // the last of autumn: amber panes hung in the vault over the climb. Each lets go, falls straight down past the
    // dragonfly, and another takes its place (the leaf shader loops them on time; they are scaled away outside the climb)
    for (let i = 0, n = Math.round(140 * Math.min(1, dens)); i < n; i++) {
      const t = xr.range(102, 205), q = AP(t, xr.range(2, 5.5) * xr.sign(), 0), py = path.nearestXZ(q.x, q.z).y;
      winterL.add(q.x, Math.min(py + xr.range(8, 20), VAULT_Y0 + APEX_H - 3), q.z, xr.range(0.6, 1.0), xr(), SB, 4, xr() * 6.283, xr.range(-0.6, 0.6), 0.68, 1.2);
    }

    // ---- the ring: a rose of tracery set in the vault, the next world in its eye ----
    const endM = path.frameAt(true, new THREE.Matrix4(), true), endT = path.endTangent.clone();
    {
      const rr = rng.fork('rose'), RP = (r, a, z = 0) => V3(Math.cos(a) * r, Math.sin(a) * r, z).applyMatrix4(endM);
      const circle = (r, rad, sides, seg) => { const ps = []; for (let k = 0; k <= seg; k++) ps.push(RP(r, (k / seg) * 6.2832)); avLead.add(ps, rad, sides); };
      circle(7.8, 0.46, 8, 56); circle(12.6, 0.3, 6, 64);
      const NF = 12, tilt = Math.asin(clamp(-endT.y, -1, 1)), yaw = Math.atan2(-endT.x, -endT.z);
      for (let i = 0; i < NF; i++) {
        const a0 = (i / NF) * 6.2832, a1 = ((i + 1) / NF) * 6.2832, am = (a0 + a1) / 2;
        for (const [af, at] of [[a0, am], [a1, am]]) { const ps = []; for (let k = 0; k <= 7; k++) { const q = k / 7; ps.push(RP(7.8 + 4.8 * Math.sin(q * Math.PI / 2), af + (at - af) * q * q)); } avLead.add(ps, 0.17, 4); }
        const ps = [], len = rr.range(8, 15), bend = rr.range(-0.12, 0.12);
        for (let k = 0; k <= 6; k++) { const q = k / 6; ps.push(RP(12.6 + len * q, a0 + bend * q * q, -1.5 * q * q)); }
        avLead.add(ps, (q) => 0.3 * (1 - 0.7 * q), 5);
        for (const sg of [-1, 1]) { const fs = []; for (let k = 0; k <= 4; k++) { const q = k / 4; fs.push(RP(12.6 + len * (0.4 + 0.5 * q), a0 + bend * 0.16 + sg * 0.17 * q, -0.6 * q)); } avLead.add(fs, (q) => 0.15 * (1 - 0.6 * q), 3); }
        if (i % 2 === 0) { const c = RP(10.4, am, 0.05); winterL.add(c.x, c.y, c.z, 3.3, rr(), 0.99, 2, yaw, tilt, 0.8, 0.2); }
      }
    }

    // ---- meshes for the trees ----
    const addLead = async (tb, mat, cx, cy, cz, rad) => { if (!tb.i.length) return null; const m = new THREE.Mesh(tb.geometry(), mat); m.geometry.boundingSphere = new THREE.Sphere(V3(cx, cy, cz), rad); scene.add(m); await ctx.yield(); return m; };
    const springMeshes = [await addLead(birchTr, birchMat, BX, 10, 290, 330), await addLead(springTw, leadMat, BX, 10, 290, 330)];
    await addLead(summerLead, leadMat, 0, 20, 60, 470); await addLead(winterLead, leadMat, EX + HX * 190, 30, EZ + HZ * 190, 420);
    await addLead(avLead, leadMat, EX + HX * 150, 60, EZ + HZ * 150, 190);
    const birchLeaves = birchL.mesh(leafMat), summerLeaves = summerL.mesh(leafMat), winterShards = winterL.mesh(leafMat), beechLeaves = beechL.mesh(leafMat);
    scene.add(birchLeaves, summerLeaves, winterShards, beechLeaves); springMeshes.push(birchLeaves);
    await ctx.yield();
    {   // colour pools under the summer crowns
      const fr = rng.fork('pools'), nT = poolPts.length / 3, n = Math.min(Math.round(300 * Math.min(1, detail)), nT * 2), P = [], Q = [];
      for (let i = 0; i < n; i++) { const k = Math.floor(fr() * nT) * 3; P.push(poolPts[k] + fr.range(-6, 6), poolPts[k + 1] + fr.range(-6, 6), fr.range(8, 15), fr()); Q.push(poolPts[k + 2], fr()); }
      const m = new THREE.Mesh(instQuad(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), [['iP', P, 4], ['iQ', Q, 2]], n, V3(0, 0, 90), 420), poolMaterial(WU));
      m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
    }
    await ctx.yield();

    // ---- small flora: irises on the banks, glass grass, ferns ----
    {
      const fr = rng.fork('flora'), P = [], Q = [], tmp = V3(0, 0, 0), tan = V3(0, 0, 0);
      const put = (x, z, size, kind, aspect, drop) => { if (Math.abs(x - BX) < 4.5 || path.distanceTo(x, size * 0.5, z) < 5.6) return; const r = fr(); if (drop) return; P.push(x, 0, z, size); Q.push(kind, r, sOf(x, z), aspect); };
      const put2 = (x, z, size, kind, aspect) => { if (Math.abs(x - BX) < 4.5 || Math.hypot(x, z) < 7.5 || path.distanceTo(x, size * 0.5, z) < 5.6) return; P.push(x, 0, z, size); Q.push(kind, xr(), sOf(x, z), aspect); };
      for (let z = 346; z > -170; z -= (z > 212 ? 1.25 : 3.4) / dens) for (const sd of [-1, 1]) if (fr() < 0.8) put(BX + sd * fr.range(5.9, 7.2), z + fr.range(-0.5, 0.5), fr.range(1.5, 2.3), 1, 0.5);
      const nG = Math.round(3000 * dens), nF = Math.round(1100 * dens);
      for (let i = 0; i < nG + nF; i++) {
        const fern = i >= nG, u = fern ? fr.range(0.12, 0.74) : fr() < 0.6 ? fr.range(0, 0.2) : fr.range(0.2, 0.76), lat = fr.range(4, fern ? 34 : 30) * fr.sign();
        path.pointAt(u, tmp); path.tangentAt(u, tan);
        const x = tmp.x - tan.z * lat, z = tmp.z + tan.x * lat;
        if (fern) { const k = fr.int(2, 3); for (let j = 0; j < k; j++) put(x + fr.range(-0.3, 0.3), z + fr.range(-0.3, 0.3), fr.range(1.3, 2.4), 2, 0.85); }
        else { const sz = fr.range(0.5, 1.15), open = u > 0.2; put(x, z, open ? sz * 1.5 : sz, 0, 1.7, open && noise.n2(x * 0.05 + 7.3, z * 0.05) < -0.1); }   // past the brook the blades stand in clumps, not an even scatter
        if ((i & 511) === 511) await ctx.yield();
      }
      for (let i = 0, nB = Math.round(1700 * dens); i < nB; i++) {      // the banks of the brook are thick with blades
        const u = fr.range(0, 0.19), lat = fr.range(4.7, 15) * fr.sign();
        path.pointAt(u, tmp); path.tangentAt(u, tan);
        put(tmp.x - tan.z * lat, tmp.z + tan.x * lat, fr.range(0.7, 1.5), 0, 1.5);
        if ((i & 511) === 511) await ctx.yield();
      }
      for (let i = 0, n = Math.round(1500 * dens); i < n; i++) {        // clumps of broad blades on the slate of the clearing, under the dome and down the avenue
        const u = xr.range(0.3, 0.78), lat = xr.range(4.5, 26) * xr.sign();
        path.pointAt(u, tmp); path.tangentAt(u, tan);
        const x = tmp.x - tan.z * lat, z = tmp.z + tan.x * lat;
        if (noise.n2(x * 0.05 + 7.3, z * 0.05) > 0.05) for (let j = 0, k = xr.int(2, 4); j < k; j++) put2(x + xr.range(-1.7, 1.7), z + xr.range(-1.7, 1.7), xr.range(0.9, 1.9), 0, 1.7);
        if ((i & 31) === 31) await ctx.yield();
      }
      for (let i = 0, n = Math.round(420 * dens); i < n; i++) {         // ferns of graded panes beside the path across the clearing
        const u = xr.range(0.325, 0.49), lat = xr.range(4.5, 20) * xr.sign();
        path.pointAt(u, tmp); path.tangentAt(u, tan);
        const x = tmp.x - tan.z * lat, z = tmp.z + tan.x * lat;
        for (let j = 0, k = xr.int(3, 5); j < k; j++) put2(x + xr.range(-1, 1), z + xr.range(-1, 1), xr.range(1.6, 3.0), 2, 0.9);
        if ((i & 31) === 31) await ctx.yield();
      }
      const geo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
      const m = new THREE.Mesh(instQuad(geo, [['iP', P, 4], ['iQ', Q, 4]], P.length / 4, V3(0, 0, 90), 420), floraMaterial(WU));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- koi (or water-lilies) in the brook ----
    {
      const fr = rng.fork('koi'), K = [];
      for (let i = 0; i < 12; i++) K.push(BX + fr.range(-2.4, 2.4), 224 + (i + fr()) * 8.4, fr(), lilies ? fr.range(1.4, 2.2) : fr.range(1.3, 1.8));
      for (let i = 0; i < 9; i++) K.push(BX + fr.range(-2.4, 2.4), -55 + (i + fr()) * 13, fr(), lilies ? fr.range(1.4, 2.2) : fr.range(1.3, 1.8));
      const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(instQuad(geo, [['iK', K, 4]], K.length / 4, V3(BX, 0, 140), 260), koiMaterial(WU, lilies));
      m.frustumCulled = false; scene.add(m);
    }

    // ---- drifting chips: petals, opal snow, rain ----
    const chipU = { uGust: { value: 0.6 }, uChip: { value: new THREE.Vector4(0.15, 0.7, 0.16, 1) }, uChipCol: { value: new THREE.Color(1, 1, 1) }, uBox: { value: V3(70, 44, 70) } };
    let rainU = null;
    {
      const fr = rng.fork('chips'), n = Math.round(7600 * detail), C = new Float32Array(n * 4);
      for (let i = 0; i < n * 4; i++) C[i] = fr();
      const geo = new THREE.PlaneGeometry(1, 1);
      const m = new THREE.Mesh(instQuad(geo, [['iP', C, 4]], n, V3(0, 0, 0), 1), chipMaterial(WU, chipU));
      m.frustumCulled = false; scene.add(m);
      if (look.rain) {
        rainU = { uGust: { value: 0 }, uChip: { value: new THREE.Vector4(1, 26, 0.11, 0) }, uChipCol: { value: pearlCol.clone().multiplyScalar(0.62) }, uBox: { value: V3(60, 40, 60) } };
        const n2 = Math.round(1500 * detail), C2 = new Float32Array(n2 * 4); for (let i = 0; i < n2 * 4; i++) C2[i] = fr();
        const m2 = new THREE.Mesh(instQuad(geo, [['iP', C2, 4]], n2, V3(0, 0, 0), 1), chipMaterial(WU, rainU));
        m2.frustumCulled = false; scene.add(m2);
      }
    }
    await ctx.yield();

    // ---- pane-winged birds: three loose groups that cross ahead and then pace the dragonfly ----
    const BK = { kingfisher: { L: 0.5, S: 0.4, c: 0.4, sweep: 0.1, tail: 0.14, beak: 0.2, scale: 1.4, flap: 13, amp: 0.95, glide: 0.5 },
      swallow: { L: 0.5, S: 0.44, c: 0.36, sweep: 0.26, tail: 0.34, beak: 0.07, scale: 1.4, flap: 9, amp: 0.8, glide: 0.85 },
      moth: { L: 0.36, S: 0.5, c: 0.6, sweep: -0.06, tail: 0.04, beak: 0.03, scale: 2.0, flap: 5.5, amp: 1.05, glide: 0.1 } }[birdKind];
    const birdU = { uGrp: { value: [0, 1, 2].map(() => new THREE.Vector4()) }, uGrpV: { value: [0, 1, 2].map(() => new THREE.Vector4(0, 0, 1, 0)) }, uBird: { value: V3(BK.flap, BK.amp, BK.glide) } };
    {
      const b = BK, hL = b.L / 2, quads = [
        [0, [0, 0, hL], [0, 0.16, 0], [0, 0, -hL], [0, -0.16, 0]],
        [5, [0, 0, hL], [0.1, 0, 0], [0, 0, -hL], [-0.1, 0, 0]],
        [1, [-0.03, 0, b.c / 2], [-b.S, 0, b.c / 2 - b.sweep], [-b.S, 0, -b.c * 0.1 - b.sweep], [-0.03, 0, -b.c / 2]],
        [2, [0.03, 0, b.c / 2], [b.S, 0, b.c / 2 - b.sweep], [b.S, 0, -b.c * 0.1 - b.sweep], [0.03, 0, -b.c / 2]],
        [3, [-b.tail * 0.5, 0, -hL - b.tail], [0, 0, -hL + 0.06], [b.tail * 0.5, 0, -hL - b.tail], [0, 0, -hL - b.tail * 0.5]],
        [4, [0, 0.075, hL - 0.04], [0, 0.01, hL + b.beak], [0, -0.06, hL - 0.04], [0, 0, hL - 0.14]]];
      const pos = [], part = [], uv = [], idx = [];
      quads.forEach(([pt, a, bq, c, d], q) => { for (const [v, st] of [[a, [0, 0]], [bq, [1, 0]], [c, [1, 1]], [d, [0, 1]]]) { pos.push(...v); part.push(pt); uv.push(...st); } idx.push(q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3); });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1)); geo.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
      const fr = rng.fork('birds'), nPer = Math.round(clamp(20 * (vary.density ?? 1), 14, 26)), O = [], G = [];
      for (let g = 0; g < 3; g++) for (let i = 0; i < nPer; i++) { O.push(fr.range(-1.8, 1.8), fr.range(-2.4, 2.4), (i / nPer - 0.5) * 30 + fr.range(-0.6, 0.6), fr()); G.push(g); }
      const m = new THREE.Mesh(instQuad(geo, [['iO', O, 4], ['iG', G, 1]], G.length, V3(0, 0, 0), 1), birdMaterial(WU, birdU));
      m.frustumCulled = false; scene.add(m);
    }
    const BW = [[-0.03, 0.2, 1], [0.19, 0.37, -1], [0.33, 0.5, 1]], _bp = V3(0, 0, 0), _bq = V3(0, 0, 0), _bt = V3(0, 0, 0);
    const birdPos = (g, u, out) => {
      const [a, b, sg] = BW[g], w = (u - a) / (b - a), inn = smoothstep(0, 0.45, w), outw = smoothstep(0.75, 1, w);
      const d = lerp(lerp(72, 11 + g * 1.5, inn), 46, outw), lat = sg * lerp(lerp(40, -8.5, inn), -34, outw), dy = lerp(lerp(7, -2.5, inn), 13, outw);
      const dist = u * path.length + d; path.posAtDist(dist, out); path.tangentAtDist(dist, _bt);
      out.x += -_bt.z * lat; out.z += _bt.x * lat; out.y = Math.max(out.y + dy, 5.2);
      return w;
    };

    // ---- the dragonfly: built round the camera ----
    const cobalt = new THREE.Color(PALETTE[6]);
    function buildDragonfly(tint, tint2, wingA) {
      const g = new THREE.Group();
      const bodyU = { uTint: { value: tint }, uTint2: { value: tint2 }, uCell: { value: new THREE.Vector4(10.5, 0.9, 0.12, 0) } };
      const eyeU = { uTint: { value: tint.clone().multiplyScalar(0.8) }, uTint2: { value: tint.clone().lerp(tint2, 0.55) }, uCell: { value: new THREE.Vector4(24, 0.3, 0.8, 0) } };
      const body = cellMaterial(WU, bodyU), eye = cellMaterial(WU, eyeU);
      const add = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.frustumCulled = false; g.add(m); return m; };
      add(new THREE.SphereGeometry(0.22, 22, 14), body, 0, -0.78, -1.73, 1.0, 0.74, 0.95);                    // the head: broad and flat
      const eg = new THREE.SphereGeometry(0.175, 22, 14);
      for (const sx of [-1, 1]) add(eg, eye, sx * 0.205, -0.85, -1.71, 0.95, 0.8, 1.2);                      // domed eyes low on its sides, never above it
      add(new THREE.SphereGeometry(0.3, 22, 14), body, 0, -1.0, -1.22, 1.0, 1.0, 1.45);                      // the thorax, just under the lens
      add(new THREE.CylinderGeometry(0.06, 0.17, 3.5, 10, 8).rotateX(Math.PI / 2), body, 0, -1.03, 1.2);     // the abdomen trails behind
      const lt = new Tubes();
      for (const sx of [-1, 1]) {
        lt.add([V3(sx * 0.07, -0.64, -1.84), V3(sx * 0.11, -0.58, -1.99), V3(sx * 0.2, -0.57, -2.12), V3(sx * 0.3, -0.59, -2.2)], (q) => 0.016 - 0.008 * q, 4);   // antennae
        lt.add([V3(sx * 0.12, -0.72, -1.36), V3(sx * 0.27, -0.78, -1.3), V3(sx * 0.6, -0.72, -1.36)], (q) => 0.02 - 0.012 * q, 4);    // wing roots
        lt.add([V3(sx * 0.12, -0.74, -1.1), V3(sx * 0.27, -0.84, -1.05), V3(sx * 0.62, -0.8, -0.98)], (q) => 0.02 - 0.012 * q, 4);
      }
      lt.add([V3(0, -0.7, -1.02), V3(0, -0.69, -1.25), V3(0, -0.75, -1.5), V3(0, -0.8, -1.56)], 0.018, 4);   // the dorsal seam
      const lm = new THREE.Mesh(lt.geometry(), leadMat); lm.frustumCulled = false; g.add(lm);
      // wings: four fans, root to tip along f, stroke along a
      const pos = [], fan = [], idx = [], up = V3(0, 1, 0), T = V3(0, 0, 0), ax = V3(0, 0, 0), p = V3(0, 0, 0), NA = 10;
      const wing = (rx, ry, rz, tx, ty, tz, amp) => {
        const base = pos.length / 3; T.set(tx, ty, tz); ax.crossVectors(T, up).normalize();
        for (let k = 0; k <= NA; k++) { const a = (k / NA) * 2 - 1; for (const f of [0.06, 1]) { p.copy(T).multiplyScalar(f).applyAxisAngle(ax, a * amp * (rx < 0 ? -1 : 1)); pos.push(rx + p.x, ry + p.y, rz + p.z); fan.push(f, a); } }
        for (let k = 0; k < NA; k++) { const i = base + k * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
      };
      // ours: fans swept forward and wide so they stand face-on at the edges of the frame
      for (const sx of [-1, 1]) {
        { wing(sx * 0.27, -0.78, -1.3, sx * 2.8, 0.75, -1.5, 0.42); wing(sx * 0.27, -0.84, -1.05, sx * 2.9, 0.3, -0.5, 0.36); }
      }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute('aFan', new THREE.Float32BufferAttribute(fan, 2)); wg.setIndex(idx);
      const wm = new THREE.Mesh(wg, wingMaterial(WU, { uWingA: { value: wingA } })); wm.frustumCulled = false; wm.renderOrder = 6; g.add(wm); g.userData.wings = wm;
      return g;
    }
    const fly1 = buildDragonfly(cobalt, new THREE.Color(0.2, 0.45, 1.0), 1); scene.add(fly1);   // our own wings: black veins smeared into fans, held to the outer edges of the frame by the shader
    await ctx.yield();

    // ---- the stag (or fox) of lead tracery glazed in clear glass, at the edge of the avenue ----
    const beastT = 99, BEAST_LAT = 10.8, beastU = uOfT(beastT), beastG = new THREE.Group(), headG = new THREE.Group(), muzzle = V3(1.8, 1.05, 0);
    const breathU = { uMuzzle: { value: V3(0, 0, 0) }, uBreathDir: { value: V3(1, 0, 0) }, uBreath: { value: 0 } };
    {
      const fox = beast === 'fox', iceU = { uTint: { value: pearlCol.clone().multiplyScalar(0.85) }, uTint2: { value: new THREE.Color(0.62, 0.8, 1.0) }, uCell: { value: new THREE.Vector4(2.3, 0.9, 0, 1) } };
      const ice = cellMaterial(WU, iceU, { side: THREE.DoubleSide });
      const panel = (grp, tb, pts2) => {
        const sh = new THREE.Shape(pts2.map(([x, y]) => new THREE.Vector2(x, y)));
        grp.add(new THREE.Mesh(new THREE.ShapeGeometry(sh), ice));
        const ol = pts2.map(([x, y]) => V3(x, y, 0)); ol.push(ol[0].clone(), ol[1].clone()); tb.add(ol, 0.055, 4);
      };
      const bt = new Tubes(), ht = new Tubes();
      panel(beastG, bt, [[1.15, 2.45], [0.95, 3.05], [0.35, 2.96], [-0.5, 2.8], [-1.25, 2.98], [-1.68, 2.62], [-1.62, 1.95], [-1.1, 1.74], [-0.4, 1.96], [0.45, 1.58], [0.95, 1.74]]);
      if (!fox) bt.add([V3(-1.64, 2.72, 0), V3(-1.86, 2.62, 0), V3(-1.98, 2.36, 0)], (q) => 0.07 - 0.03 * q, 4);
      if (fox) panel(beastG, bt, [[-1.5, 2.7], [-2.7, 3.35], [-3.4, 2.7], [-2.6, 1.95], [-1.5, 2.2]]);
      for (const [zz, k] of [[0.22, 0], [-0.22, 0.12]]) {
        bt.add([V3(0.8 + k, 1.95, zz), V3(0.72 + k, 1.4, zz), V3(0.9 + k, 0.95, zz), V3(0.84 + k, 0.4, zz), V3(0.78 + k * 2, 0, zz)], (q) => 0.13 - 0.07 * q, 5);
        bt.add([V3(-1.3 - k, 2.1, zz), V3(-1.52 - k, 1.15, zz), V3(-1.22 - k, 0.62, zz), V3(-1.27 - k * 2, 0, zz)], (q) => 0.15 - 0.09 * q, 5);
      }
      const px = 0.95, py = 2.75;                             // the neck pivots here
      panel(headG, ht, [[0.05, -0.55], [-0.2, 0.2], [0.72, 1.5], [1.08, 1.12], [0.45, -0.2]]);
      panel(headG, ht, [[0.7, 1.52], [1.02, 1.12], [1.78, 0.92], [1.84, 1.14], [1.12, 1.68]]);
      const ear = fox ? 0.75 : 0.45; ht.add([V3(0.9, 1.6, 0.1), V3(0.7, 1.6 + ear, 0.25), V3(0.62, 1.55, 0.1)], 0.05, 4); ht.add([V3(0.9, 1.6, -0.1), V3(0.75, 1.6 + ear, -0.25), V3(0.66, 1.55, -0.1)], 0.05, 4);
      if (!fox) for (const zz of [0.2, -0.2]) {
        const beam = []; for (let k = 0; k <= 8; k++) { const q = k / 8; beam.push(V3(0.98 - 0.9 * q + 0.9 * q * q, 1.62 + 2.1 * q, zz * (1 + 2.2 * q))); }
        ht.add(beam, (q) => 0.12 - 0.07 * q, 5);
        for (const k of [1, 2, 4, 5, 7]) { const b0 = beam[k], tl = 0.75 + 0.12 * k; ht.add([b0, V3(b0.x + 0.42, b0.y + 0.28 * tl, b0.z), V3(b0.x + 0.62, b0.y + 0.8 * tl, b0.z + zz * 0.5), V3(b0.x + 0.6, b0.y + 1.2 * tl, b0.z + zz * 0.7)], (q) => 0.075 - 0.045 * q, 4); }
      }
      beastG.add(new THREE.Mesh(bt.geometry(), leadMat)); headG.add(new THREE.Mesh(ht.geometry(), leadMat));
      headG.position.set(px, py, 0); beastG.add(headG);
      const sc = fox ? 0.95 : 1.45, bp = AP(beastT, BEAST_LAT, 0); beastG.position.copy(bp); beastG.scale.setScalar(sc);
      const cp = AP(beastT - 34, 0, 0); beastG.rotation.y = Math.atan2(cp.x - bp.x, cp.z - bp.z) + 0.3 + Math.PI;   // broadside to the approach, head toward the path
      scene.add(beastG);
      const fr = rng.fork('breath'), n = 28, B = []; for (let i = 0; i < n; i++) B.push(fr.range(-1, 1), fr.range(-0.6, 1), fr.range(-1, 1), fr());
      const bm = new THREE.Mesh(instQuad(new THREE.PlaneGeometry(1, 1), [['iP', B, 4]], n, V3(0, 0, 0), 1), shader(WU, {
        side: THREE.DoubleSide, extra: breathU,
        vs: /* glsl */`attribute vec4 iP; uniform vec3 uMuzzle, uBreathDir, uPearl; uniform float uTime, uBreath; varying vec2 vUv; varying vec3 vC;
          ${FOG_V}
          void main(){ float r = iP.w, life = clamp(fract(uTime * 0.3) * 2.4 - r * 0.6, 0., 1.);
            vec3 c = uMuzzle + uBreathDir * (life * 1.7) + iP.xyz * life * 0.6 + vec3(0., life * life * 0.6, 0.);
            vec4 mvPosition = viewMatrix * vec4(c, 1.); float a = r * 40. + uTime * 2.;
            mvPosition.xy += vec2(position.x * cos(a) - position.y * sin(a), position.x * sin(a) + position.y * cos(a)) * 0.2 * sin(3.1416 * life) * uBreath;
            vUv = position.xy * 2.; vC = uPearl * 1.3; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fs: /* glsl */`varying vec2 vUv; varying vec3 vC;
          ${FOG_F}
          void main(){ if (abs(vUv.x) + abs(vUv.y) > 1.) discard; gl_FragColor = vec4(vC, 1.);
            #include <fog_fragment>
          }`,
      }));
      bm.frustumCulled = false; scene.add(bm);
    }

    // ---- rare: the early thaw. Fallen panes lift off the ground on the final climb and re-hang as blossom ----
    if (rare && hangPts.length > 20) {
      const fr = rng.fork('thaw'), n = Math.round(1500 * detail), S = [], T = [];
      for (let i = 0; i < n; i++) {
        const t = fr.range(118, 214), g = AP(t, fr.range(3, 15) * fr.sign(), 0.15), h = hangPts[fr.int(0, hangPts.length - 1)], tt = fr.range(0, 1) * 0.35 + 0.65 * clamp((t - 118) / 96, 0, 1);
        S.push(g.x, g.y, g.z, fr()); T.push(h.x + fr.range(-1.5, 1.5), h.y - fr.range(0.3, 3.5), h.z + fr.range(-1.5, 1.5), tt);
      }
      const m = new THREE.Mesh(instQuad(new THREE.PlaneGeometry(1, 1), [['iS', S, 4], ['iT', T, 4]], n, V3(0, 0, 0), 1), shader(WU, {
        side: THREE.DoubleSide,
        vs: W_COMMON + /* glsl */`attribute vec4 iS, iT; varying vec2 vUv; varying vec3 vCol, vN, vWp; varying float vR;
          ${FOG_V}
          void main(){
            float r = iS.w, w = clamp((uU - 0.85 - iT.w * 0.085) / 0.05, 0., 1.), e = w * w * (3. - 2. * w), arc = sin(3.1416 * e);
            vec3 c = mix(iS.xyz, iT.xyz, e); c.xz += vec2(sin(e * 6. + r * 40.), cos(e * 5. + r * 23.)) * 3. * arc; c.y += arc * 3.;
            c += sway(c, 3.) * step(0.999, w);
            float yaw = r * 6.283 + 0.35 * sin(uTime * 2.1 + r * 50.), tilt = 0.3 * sin(uTime * 1.7 + r * 31.);
            vec3 X = vec3(cos(yaw), 0., -sin(yaw)), N = vec3(sin(yaw) * cos(tilt), sin(tilt), cos(yaw) * cos(tilt)), Y = cross(N, X);
            vec3 ax = normalize(vec3(sin(r * 90.), 0.35, cos(r * 90.))); float ang = (1. - e) * 12. * (0.4 + r) * step(0.001, w);
            X = rotAx(X, ax, ang); Y = rotAx(Y, ax, ang); N = rotAx(N, ax, ang);
            float sz = (0.8 + 0.6 * fract(r * 9.)) * smoothstep(0., 0.06, w);
            vec3 lp = c + (X * position.x * 0.8 + Y * position.y * 1.2) * sz;
            vUv = position.xy * 2.; vN = N; vR = r; vCol = fam(0., 0.15 + 0.75 * fract(r * 3.7)); vWp = lp;
            vec4 mvPosition = viewMatrix * vec4(lp, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fs: W_COMMON + /* glsl */`varying vec2 vUv; varying vec3 vCol, vN, vWp; varying float vR;
          ${FOG_F}
          void main(){
            float u = vUv.x, v = vUv.y;
            float w = v < 0. ? 0.84 * pow(max(v + 1., 0.), 0.7) : 0.84 * sqrt(max(1. - v * v, 0.));
            float e = w - abs(u); if (e < 0.) discard;
            float fw = (abs(dFdx(u)) + abs(dFdy(u)) + abs(dFdx(v)) + abs(dFdy(v))) * 0.6, bw = max(0.12, 1.5 * fw);
            vec3 V = normalize(vWp - cameraPosition);
            vec3 glass = vCol * sheet(V) * mix(0.45, 1., smoothstep(0., 0.75, abs(dot(normalize(vN), V)))) * (0.8 + 0.2 * sin(v * 3.2 + vR * 30.)) * uGlassGain;
            gl_FragColor = vec4(mix(glass, mix(glass * 0.72, uLead, 1. - smoothstep(0.18, 0.5, fw)), 1. - smoothstep(bw * 0.65, bw, e)), 1.);
            #include <fog_fragment>
          }`,
      }));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- per-frame ----
    const fam = hero.uniforms.uFam.value, chipCols = [fam[2].clone().multiplyScalar(1.3), fam[6].clone().multiplyScalar(1.4), fam[10].clone().multiplyScalar(1.3), pearlCol.clone().multiplyScalar(lookId === 'evening' ? 1.3 : 0.8)];
    const _t0 = V3(0, 0, 0), _t1 = V3(0, 0, 0), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _m = new THREE.Matrix4(), _p = V3(0, 0, 0), _p2 = V3(0, 0, 0), UP = V3(0, 1, 0);
    const endP = path.end.clone(), beastHead = AP(beastT, BEAST_LAT - 2, 5.2), _q2 = new THREE.Quaternion(), _s = V3(1, 1, 1);
    function update(dt, time, camera, u) {
      hero.update(dt, time); hero.setProgress(u); WU.uU.value = u;
      sheetDome.position.setFromMatrixPosition(camera.matrixWorld);
      hero.uniforms.uHeroFog.value = lerp(0.3, 1, smoothstep(0.1, 0.24, u));     // the dome reads clear from the far end of the brook
      // chips: petals, motes, embers of autumn, then opal snow
      const sum = smoothstep(0.16, 0.22, u), aut = smoothstep(0.5, 0.56, u), win = smoothstep(0.64, 0.74, u), ch = chipU.uChip.value;
      chipU.uChipCol.value.copy(chipCols[0]).lerp(chipCols[1], sum).lerp(chipCols[2], aut).lerp(chipCols[3], win);
      ch.x = lerp(lerp(0.045, 0.021, sum), look.rain ? 0.42 : 1, win); ch.y = lerp(0.7, 2.1, win); ch.z = lerp(0.2, 0.24, win); chipU.uGust.value = lerp(0.6, 2.8, win);
      // the dragonfly rides the camera, banking with the turn and dipping its head in a dive
      path.tangentAt(u, _t0); path.tangentAt(Math.min(1, u + 0.02), _t1);
      const turn = _t0.z * _t1.x - _t0.x * _t1.z;
      _e.set(clamp(_t0.y, -0.6, 0) * 0.3 + 0.012 * Math.sin(time * 1.3), 0, clamp(-turn * 1.5, -0.3, 0.3) + 0.02 * Math.sin(time * 0.9));
      fly1.visible = u > 0 && !ctx.through;
      camera.matrixWorld.decompose(fly1.position, _q2, _s); fly1.quaternion.copy(_q2).multiply(_q.setFromEuler(_e));
      fly1.position.y += 0.012 * Math.sin(time * 2.1);
      // birds
      for (let g = 0; g < 3; g++) {
        const w = birdPos(g, u, _bp), G = birdU.uGrp.value[g], GV = birdU.uGrpV.value[g];
        if (w <= 0 || w >= 1) { GV.x = 0; continue; }
        birdPos(g, u + 0.003, _bq);
        const dx = _bq.x - _bp.x, dy = _bq.y - _bp.y, dz = _bq.z - _bp.z;
        G.set(_bp.x, _bp.y, _bp.z, Math.atan2(dx, dz));
        GV.set(BK.scale * smoothstep(0, 0.04, w) * (1 - smoothstep(0.96, 1, w)), clamp(Math.atan2(dy, Math.hypot(dx, dz) + 1e-3), -0.6, 0.6), lerp(1.0, 0.75, smoothstep(0.2, 0.5, w)), 0);
      }
      // the stag lifts its head and watches; its breath is a puff of opal chips
      const lift = smoothstep(beastU - 0.105, beastU - 0.06, u);
      headG.rotation.z = lerp(-1.2, 0.12, lift) + 0.03 * Math.sin(time * 0.8);
      beastG.updateMatrixWorld(true);
      headG.localToWorld(breathU.uMuzzle.value.copy(muzzle));
      headG.localToWorld(_p.set(2.8, 0.85, 0)); breathU.uBreathDir.value.copy(_p).sub(breathU.uMuzzle.value).normalize();
      breathU.uBreath.value = lift;
      const far = u > 0.6; for (const m of springMeshes) if (m) m.visible = !far;
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(path.start) }, 0);

    return {
      scene, path, duration: 40,
      title: lookId === 'evening' ? 'The Leaded Forest at Evening' : lookId === 'rain' ? 'The Leaded Forest in Rain' : 'The Leaded Forest',
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 3200, lookAhead: 22, sway: 0.8, bank: 1.1 },
      pois: [
        { at: [0, 38, 0], from: 0, to: 0.2, weight: 0.22 },
        { at: [0, 33, 0], from: 0.3, to: 0.47, weight: 0.4 },
        { at: [0, 40, 0], from: 0.5, to: 0.67, weight: 0.4 },
        { at: beastHead, from: beastU - 0.1, to: beastU - 0.005, weight: 0.3 },
        { at: endP, from: 0.7, to: 0.94, weight: 0.45 },
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 0.7, tilt: true, revealDistance: 280 },
      post: { exposure: look.exposure, bloom: look.bloom, grade: { saturation: look.sat, contrast: 1.05, tint: '#ffffff', shadowTint: '#000000', vignette: 0.24, grain: 0.018, aberration: 0 } },
      update,
      dispose() {},
    };
  },
};
