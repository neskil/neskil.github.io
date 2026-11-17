// THE LEAF WIND (maple-gale): a cold front hits a Vermont maple gorge at peak colour and the camera is the gust.
//
// World coordinates are the hero's own: +X is downwind and the way we fly, the brink of the fall is x = 11, the
// great maple stands at the origin on the left bank, the stream runs under the camera at z = 16 and +Z is the
// camera's right (where the sun is). The flight: 100 m level over the upland crowns aimed at the maple (a quilt of
// this world's own small-leaved crowns 11 m beneath us, the dark white pine left of the axis), a dive into the head of
// the gorge, a 450 m run 5 m above a stream in spate between groups of white birch, the rise past the maple as it
// strips, 20 m of open air over the lip, a nose-over and a 50 degree dive to a ring 5 m above the eye of a spiral of leaves.
//
// Looks (by seed, or ctx.vary.hour): slate afternoon with one travelling break of sun | golden hour after the front |
// a snow squall | clear frosty dawn lit from the left rear. Season: early / peak / late. Cast: jays, robins or ravens
// (held ahead of the lens u 0.2-0.47); deer bolting down a pale bar (u 0.50-0.58) or a cow moose and calf in the
// shallows; wood ducks flushed past us at the lip (u 0.86-0.92). Rare event (ctx.vary.rare): a dead birch snag on the
// right bank snaps at u 0.578, leans 35 degrees across the stream at u 0.62 in a puff of bark, passes over the lens at
// u 0.67 and is down by u 0.71. Two braided ribbons of leaves run the gorge: one along the left bank u 0.255-0.47 and
// the right bank u 0.585-0.785 parting round birch trunks, one low along the right edge of the water over its boulders.
// THE CROWN BURSTS: the front rides 25 m ahead of the lens; as it reaches each broadleaf tree near the flight line (one
// every ten metres of path from the first of the descent to the last tree before the great maple) the crown heaves, shows
// its pale undersides, thins by a third and throws a plume of its own leaves downwind into the stream (the hero's
// setBursts draw; keyed to path distance only, so two or three trees ahead of us are in mid-burst all the way down).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { makeSky, makeCloudField, skyDirection } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, GLSL_LEAF } from '../parts/maple-gale.js';

const PALETTE = ['#C8281C', '#E8742A', '#F0B428', '#23262B', '#55606C', '#E9E4D6', '#1F3A2E'];
const LIP_X = 11, POOL_Y = -61.5, STREAM_Z = 16, CASC_X = -306;      // CASC_X: where the side ravine and its cascade come in on the right

// ---------- the four looks ----------
const LOOKS = {
  slate: {
    sky: { preset: 'overcast', zenith: '#3a434e', mid: '#55606C', horizon: '#87919b', ground: '#3a4048', horizonPow: 3, scatterColor: '#e2d6bb', scatter: 0.5, scatterPow: 4,
      sunElevation: 26, sunAzimuth: 190, sunIntensity: 0, veil: 1.1, sunGlow: 0.5,
      clouds: { coverage: 0.9, softness: 0.5, lit: '#b3b6b6', shade: '#353d47', absorb: 1.8, silver: 0.9, scale: 0.8, detail: 0.8, wind: [0.07, 0.016] },
      clouds2: { coverage: 0.95, softness: 0.6, scale: 0.5, stretch: 0.3, opacity: 1, lit: '#7d8791', shade: '#3C444E', wind: [0.035, 0.008] } },
    // patch: [radius, sun outside the break]. 110 m: the design's break is 250 m across with edges eased over 60 m (whole to
    //   95 m from its centre, gone at 155 m); here the edge is eased over 64 m about this radius (whole to 78 m, gone at
    //   142 m), a little tighter, so the dark wall still shows either side of the lit trees in a frame 62 degrees wide.
    //   0.32: under the deck a third of the sun comes through, so a shaded crown stands at about half a lit one's tone.
    // patchGain 1.7: inside the break the crowns take 2.7 times that sun: the most at which the brightest tenth of the lit
    //   far crowns stays under the clip (measured in round 11 at a display luma of about 200). patchLift 1.05: and the
    //   sky's light on them there is doubled in the break's own cream, so their shaded sides glow instead of greying.
    az: 190, el: 36, sun: '#FFE9C4', sunI: 3.7, hemiSky: '#8a9cb6', hemiGround: '#5c544c', hemiI: 1.36,
    fog: '#66727f', fogD: 0.0009, patch: [110, 0.32], patchGain: 1.7, patchLift: 1.05, faunaSun: 0.55, exposure: 1.2, bloom: 0.34, sat: 1.12, tint: '#fff7ee', shadow: '#10161f',
    clouds: { lit: '#8a9199', count: 7 }, wind: 2.0, portal: '#ffe6b8', mist: 0, snow: 0, gorge: [53, 0.49, 1], title: 'The Leaf Wind',
  },
  golden: {
    sky: { preset: 'goldenHour', zenith: '#27385e', mid: '#56688e', horizon: '#eeb078', ground: '#4a4038', scatterColor: '#ff9a3c', scatter: 0.6, scatterPow: 6, scatterHigh: 0.04,
      sunElevation: 8, sunAzimuth: 215, sunIntensity: 9, sunGlow: 0.7,
      clouds: { coverage: 0.62, softness: 0.4, lit: '#f6b880', shade: '#353c54', absorb: 2, silver: 1.5, scale: 0.9, wind: [0.05, 0.012] },
      clouds2: { lit: '#ffd2a2', shade: '#5a5670', opacity: 0.35, wind: [0.03, 0.006] } },
    az: 212, el: 26, sun: '#ffc487', sunI: 3.4, hemiSky: '#8598d2', hemiGround: '#5a4a44', hemiI: 1.7,
    fog: '#7f8498', fogD: 0.00095, patch: [1e5, 1], faunaSun: 0.9, exposure: 1.14, bloom: 0.36, sat: 1.04, tint: '#fff4e4', shadow: '#0e1430',
    clouds: { lit: '#e09a60', count: 6 }, wind: 1.7, portal: '#ffd9a0', mist: 0, snow: 0, gorge: [53, 0.49, 0.7], title: 'The Leaf Wind, Evening',
  },
  squall: {
    sky: { preset: 'overcast', zenith: '#6c747d', mid: '#8a9198', horizon: '#aeb4b9', ground: '#666c72', horizonPow: 2, scatterColor: '#d8d8d2', scatter: 0.25,
      sunElevation: 26, sunAzimuth: 190, sunIntensity: 0, veil: 0.3,
      clouds: { coverage: 0.98, softness: 0.6, lit: '#b6bbbf', shade: '#535b64', absorb: 1.4, silver: 0.3, scale: 0.8, wind: [0.09, 0.02] },
      clouds2: { coverage: 0.97, softness: 0.6, scale: 0.5, stretch: 0.3, opacity: 1, lit: '#9aa0a6', shade: '#626a73', wind: [0.05, 0.01] } },
    az: 190, el: 44, sun: '#e4e8ee', sunI: 1.5, hemiSky: '#b4bcc8', hemiGround: '#5a5650', hemiI: 1.9,
    fog: '#99a1a8', fogD: 0.0034, patch: [1e5, 1], faunaSun: 1, exposure: 1.04, bloom: 0.28, sat: 1.2, tint: '#f4f7ff', shadow: '#1d2430',
    clouds: null, wind: 2.4, portal: '#fff0d0', mist: 0, snow: 1, gorge: [53, 0.49, 0], title: 'The Leaf Wind, First Snow',
  },
  dawn: {
    sky: { preset: 'dawn', zenith: '#27468a', mid: '#7f8fc4', horizon: '#f4b9a2', ground: '#6c6a80', scatterColor: '#ffc890', scatter: 0.7, scatterPow: 4,
      sunElevation: 7, sunAzimuth: -32, sunGlow: 0.7,
      clouds: { coverage: 0.3, lit: '#ffd0bc', shade: '#64638e', silver: 1.3, wind: [0.03, 0.008] }, clouds2: { lit: '#ffd6cc', shade: '#a28bae', opacity: 0.4, coverage: 0.55, wind: [0.02, 0.004] } },
    az: -32, el: 23, sun: '#ffc79c', sunI: 3.3, hemiSky: '#93a6dc', hemiGround: '#7a6068', hemiI: 2.25,
    fog: '#a9a6b8', fogD: 0.0014, patch: [1e5, 1], faunaSun: 0.9, exposure: 1.16, bloom: 0.38, sat: 1.08, tint: '#fff2ea', shadow: '#161a2c',
    clouds: null, wind: 1.3, portal: '#ffe0c0', mist: 1, snow: 0, gorge: [53, 0.49, 0], title: 'The Leaf Wind, Frost Dawn',
  },
};

// ---------- shared GLSL for this world's own small shaders ----------
const GLSL_PATCH = /* glsl */`
  uniform vec4 uMgPatch;   // world x, z of the travelling break of sun, radius, sun gain outside it
  uniform vec3 uMgPatch2;  // the second break that rests on the great maple: x, z, radius
  float mgPatchA(vec2 w){ return 1.0 - smoothstep(uMgPatch.z - 42.0, uMgPatch.z + 8.0, distance(w, uMgPatch.xy)); }   // the travelling break alone
  float mgPatchAt(vec2 w){
    float a = 1.0 - smoothstep(uMgPatch.z - 32.0, uMgPatch.z + 32.0, distance(w, uMgPatch.xy));
    float b = 1.0 - smoothstep(uMgPatch2.z*0.55, uMgPatch2.z*1.5, distance(w, uMgPatch2.xy));
    return mix(uMgPatch.w, 1.0, max(a, b));
  }
`;
// THE CAST SHADE of the bank trees: one small map of the gorge floor seen from above (world x and z; made in build(), see
// "the shade map"), each tree thrown along the way this look's shadows fall by its height over the tangent of the sun's
// elevation. A point h metres above the floor is in the shade the floor has h / tan(elevation) farther along that way.
// It multiplies the direct sun only: in the shade what is left is the sky's own slate-blue; in the lit gaps the sun term
// is raised (the floor of the gorge has little direct sun of its own: it lies under the right wall's soft shadow, and a
// gap is where the low sun comes through), but to no more than this look's open sun and a little over.
const GLSL_SHADE = /* glsl */`
  uniform sampler2D tMgShade;
  uniform vec4 uMgShBox;    // the map's corner in world x, z; 1 / its width, 1 / its depth
  uniform vec4 uMgShSun;    // the way shadows fall (x, z: a unit vector), 1 / tan(sun elevation), the most a lit gap's sun term may be raised to (0: this look has no sun to cast shade, the squall)
  uniform vec4 uMgShK;      // the sun left in full shade, the sun's gain in the lit gaps, time, 1 where the shade lives only inside the travelling break (the slate look)
  float mgShW(float x){ if (x >= 0.0) return -1.5; if (x >= -420.0) return -1.5 - x*0.0642857; if (x >= -560.0) { float t = (-420.0 - x)/140.0; return 25.5 + 20.5*(t + 0.04*sin(t*18.85)); } return 46.0 + (-560.0 - x)*0.012; }
  float gMgSh = 0.0, gMgShK = 0.0;                     // the shade at the last point looked up (0 .. 1), and how far the map reaches it
  void mgShadeAt(vec3 w, float top){                   // top: metres above the floor at which this thing is out of the shade's reach
    gMgSh = 0.0; gMgShK = 0.0;
    float hh = max(w.y - (mgShW(w.x) + 1.0), 0.0);
    float k = step(0.001, uMgShSun.w)*(1.0 - smoothstep(top*0.5, top, hh));
    if (k <= 0.001) return;
    vec2 q = w.xz + uMgShSun.xy*(hh*uMgShSun.z);
    q += 0.4*vec2(sin(uMgShK.z*1.3 + q.x*0.13 + q.y*0.07), sin(uMgShK.z*1.05 + q.y*0.11 + q.x*0.05 + 1.7));    // the crowns heave in the wind: the shade breathes
    vec2 uv = (q - uMgShBox.xy)*uMgShBox.zw;
    vec2 e = smoothstep(vec2(0.0), vec2(0.02, 0.08), uv)*(1.0 - smoothstep(vec2(0.98, 0.92), vec2(1.0), uv));
    gMgShK = k*e.x*e.y*mix(1.0, mgPatchA(w.xz), uMgShK.w);
    gMgSh = textureLod(tMgShade, clamp(uv, 0.0, 1.0), 0.0).r;
  }
  float mgSunShade(float m, vec3 w, float top){        // the sun term m of a thing at w, with the wood's shade cast on it
    mgShadeAt(w, top);
    float lit = max(m, min(m*uMgShK.y, uMgShSun.w));
    return mix(m, mix(lit, m*uMgShK.x, gMgSh), gMgShK);
  }
`;
// THE FINE WANDER OF THE WATERLINE, the same in the land's shader and the stream's so both draw one edge: scallops 1.3 to
// 4 m long in world x (the land's own mesh, 2.6 m to a cell, carries only the longer bays and points of the bar).
// mgEdge is -1 .. 1; times uMgEdge.w it is metres added to the depth of the water there.
const GLSL_EDGE = /* glsl */`
  uniform vec4 uMgEdge;     // three phases of this visit, metres of depth the edge wanders by (0.06: on the bar's 8% beach, three quarters of a metre either way)
  float mgEdge(vec2 w){
    return 0.51*(sin(w.x*1.53 + uMgEdge.x + 0.9*sin(w.x*0.37 + uMgEdge.y)) + 0.6*sin(w.x*2.71 + w.y*0.9 + uMgEdge.z) + 0.35*sin(w.x*4.9 - w.y*1.7 + uMgEdge.x*2.0));
  }
  float mgBarX(float x, vec4 bar){ return smoothstep(bar.x - 12.0, bar.x + 4.0, x)*(1.0 - smoothstep(bar.y - 4.0, bar.y + 12.0, x)); }   // 1 along the gravel bar
`;
const GLSL_WHASH = /* glsl */`
  float wHash(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
  float wNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
    return mix(mix(wHash(i), wHash(i + vec2(1., 0.)), f.x), mix(wHash(i + vec2(0., 1.)), wHash(i + vec2(1., 1.)), f.x), f.y); }
`;
// how far a point lies from the nearest wall between two cells of a scattered lattice: the strands of a lace of foam
const GLSL_WCELL = /* glsl */`
  float wCell(vec2 p){
    vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y)), cc = i + o;
      vec2 r = o + 0.1 + 0.8*vec2(wHash(cc), wHash(cc + 31.7)) - f; float dd = dot(r, r);
      if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) { d2 = dd; }
    }
    return sqrt(d2) - sqrt(d1);
  }
`;
// the lie of the stream, for the terrain's leaf litter: centre line z and water level at world x; leaf flecks
const GLSL_LAND = /* glsl */`
  uniform vec4 uMgLand;    // bend offset of the stream head, water level offset, litter density, 0
  uniform vec4 uMgBar;     // the pale gravel bar: x0, x1, nearest and farthest distance left of the stream centre
  uniform vec3 uMgRamp[4];
  float mgZc(float x){ return ${STREAM_Z.toFixed(1)} + uMgLand.x*(1.0 - smoothstep(-540.0, -420.0, x)); }
  float mgWater(float x){
    if (x >= 0.0) return -1.5;
    if (x >= -420.0) return -1.5 - x*0.0642857;
    if (x >= -560.0) { float t = (-420.0 - x)/140.0; return 25.5 + 20.5*(t + 0.04*sin(t*18.85)); }
    return 46.0 + (-560.0 - x)*0.012;
  }
  float mgH2(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
  float mgVn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
    return mix(mix(mgH2(i), mgH2(i + vec2(1., 0.)), f.x), mix(mgH2(i + vec2(0., 1.)), mgH2(i + vec2(1., 1.)), f.x), f.y); }
  uniform vec3 uMgFill;    // sky light added in the shade
  uniform vec4 uMgShade;   // the shadow the right wall throws: its height at the stream's centre line, its fall per metre leftward, strength, 0
  uniform vec3 uMgSheen;   // what wet rock takes from the sky
  uniform vec3 uMgFloor;   // the least light on the land (scene-linear)
  uniform vec2 uMgWall;    // the sun's gain on the left wall above the right wall's shadow: outside the travelling break, inside it
  uniform vec3 uMgWood;    // the far wood painted on the upland: metres from the stream where it begins, where it is whole, the size of a crown
  uniform vec3 uMgCrown[5];
  float gMgRk = 0.0, gMgTone = 0.5, gMgWetL = 0.0;
  vec3 mgFleck(vec2 q, float dens, float fw){          // (colour pick, shade, coverage) of the fallen leaf in this cell
    vec2 id = floor(q), f = fract(q) - 0.5; float h = mgH2(id), h2 = mgH2(id + 17.3);
    vec2 g = f - (vec2(h2, fract(h2*7.13)) - 0.5)*0.5;
    float a = h*6.283, ca = cos(a), sa = sin(a);
    g = vec2(g.x*ca + g.y*sa, -g.x*sa + g.y*ca)*vec2(1.0, 1.5);
    float leaf = (1.0 - smoothstep(0.26 - fw, 0.26 + fw, length(g)))*step(fract(h*5.3), dens);
    return vec3(h2, fract(h*13.7), leaf);
  }
`;

// Adds the travelling sun patch (and, for foliage, the pale wave of turned leaves; for the land, fallen leaves) to a lit three.js / kit material.
function sunPatch(mat, S, kind) {
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  mat.onBeforeCompile = function (shader, renderer) {
    if (prev) prev.call(mat, shader, renderer);
    shader.uniforms.uMgPatch = S.uPatch; shader.uniforms.uMgPatch2 = S.uPatch2; shader.uniforms.uMgWave = S.uWave; shader.uniforms.uMgPale = S.uPale;
    shader.uniforms.uMgFront = S.uFront; shader.uniforms.uMgBurst = S.uBurst;
    shader.uniforms.tMgShade = S.tShade; shader.uniforms.uMgShBox = S.uShBox; shader.uniforms.uMgShSun = S.uShSun; shader.uniforms.uMgShK = S.uShK;
    let fs = shader.fragmentShader, vs = shader.vertexShader;
    const pars = GLSL_PATCH + GLSL_SHADE + 'uniform vec4 uMgWave; uniform vec3 uMgPale; uniform vec4 uMgBurst;\n';
    if (kind === 'flora') {
      fs = fs.replace('#include <common>', '#include <common>\nvarying vec2 vMgB;\n' + pars);
      // THE CROWN BURSTS. The front is a line across the gorge 25 m ahead of the lens (uMgFront: a point on it and the way it
      // travels). As it reaches a plant the plant heaves downwind and its leaves turn pale side up, windward side first; a
      // broadleaf tree near the flight line then loses a third of its crown (the plume of those leaves is the hero's draw).
      const swayLine = 'fWorld.xyz += floraSway(fWorld.xyz, fOrigin, wind, fScale, fGust);';
      vs = vs.replace('#include <common>', '#include <common>\nuniform vec4 uMgFront, uMgBurst; varying vec2 vMgB;');
      // (uMgBurst.y: in the slate look the crowns inside the travelling break of sun blaze: the sun's own gain there)
      // (and what grows within 5 m of the floor stands in the bank trees' shade with the ground under it: ferns, sedge, the feet of the trunks)
      const gain = '(mgPatchAt(vFloraWorld.xz)*mgSunShade(1.0 + uMgBurst.y*mgPatchA(vFloraWorld.xz), vFloraWorld, 5.0))';
      if (vs.includes(swayLine)) vs = vs.replace(swayLine, swayLine + /* glsl */`
        {
          #ifdef USE_INSTANCING
            vec2 mgO = fOrigin.xz; float mgTree = smoothstep(2.5, 4.5, fWorld.y - fOrigin.y);
          #else
            vec2 mgO = fWorld.xz; float mgTree = 0.0;
          #endif
          vec2 mgT = uMgFront.zw;
          float mgD = dot(uMgFront.xy - mgO, mgT) - 0.8*dot(fWorld.xz - mgO, mgT);      // metres the front is past this leaf: it crosses a crown from windward to leeward
          float mgNear = 1.0 - smoothstep(26.0, 42.0, abs(dot(mgO - uMgFront.xy, vec2(-mgT.y, mgT.x))));
          float mgK = uMgBurst.x*(0.35 + 0.65*mgNear);
          float mgHv = smoothstep(-15.0, -1.0, mgD)*(1.0 - smoothstep(3.0, 20.0, mgD))*mgK;
          fWorld.xyz += vec3(mgT.x, -0.28, mgT.y)*(wind.x*fScale*uFloraWind.z*1.3*mgHv);
          vMgB = vec2(smoothstep(-9.0, -3.0, mgD)*(1.0 - smoothstep(0.0, 6.0, mgD))*mgK*mgTree, smoothstep(-4.0, 9.0, mgD)*mgNear*mgTree*uMgBurst.x);   // the flash is brief: a third of a second
        }`);
      else vs = vs.replace('#include <fog_vertex>', 'vMgB = vec2(0.0);\n#include <fog_vertex>');
      // gust fronts: bands of leaves turned pale side up, running downwind through the canopy
      fs = fs.replace('#include <normal_fragment_begin>', /* glsl */`
        { float mgPh = fract((vFloraWorld.x + 0.35*vFloraWorld.z - uMgWave.x)/uMgWave.y) - 0.5;
          float mgBand = exp(-mgPh*mgPh*70.0)*uMgWave.z*smoothstep(0.5, 1.0, fLeaf);
          diffuseColor.rgb = mix(diffuseColor.rgb, uMgPale*(0.55 + 0.45*diffuseColor.r), mgBand*(0.35 + 0.65*vFlora.w)); }
        { // the burst: warm leaves torn out in clumps (needles stay), and the pale flash of the heave
          float mgWarm = step(vColor.g*1.02, vColor.r);
          if (fLeaf > 0.5 && vMgB.y > 0.001 && floraNoise(vFloraPos*0.85 + 3.7) < 0.44*vMgB.y*mgWarm) discard;
          float mgFl = vMgB.x*mgWarm*smoothstep(0.5, 1.0, fLeaf)*smoothstep(0.38, 0.62, floraNoise(vec3(vFloraPos.xz*1.3, uFloraTime*2.2 + vFloraPos.y*1.3)));
          diffuseColor.rgb = mix(diffuseColor.rgb, uMgPale*(0.55 + 0.45*diffuseColor.r), 0.6*mgFl); }
        #include <normal_fragment_begin>`);
      const anchor = 'reflectedLight.indirectDiffuse *= mix(uFloraLight.y, uFloraLight.z, fLeaf);';
      // (uMgBurst.z: and the sky's light on them there is the break's own warm cream)
      const lift = 'reflectedLight.indirectDiffuse *= vec3(1.0) + uMgBurst.z*mgPatchA(vFloraWorld.xz)*vec3(1.0, 0.914, 0.769);';
      if (fs.includes(anchor)) fs = fs.replace(anchor, 'reflectedLight.directDiffuse *= ' + gain + ';\n' + lift + '\n' + anchor);
      else fs = fs.replace('#include <aomap_fragment>', '#include <aomap_fragment>\nreflectedLight.directDiffuse *= ' + gain + ';');
    } else if (kind === 'terrain' || kind === 'land') {
      const litter = 'gTSnow = sn; gTWet = wet; gTSpark *= 1. - rock;';
      const doLitter = kind === 'land' && fs.includes(litter);
      fs = fs.replace('#include <common>', '#include <common>\n' + pars + (doLitter ? 'varying vec2 vMgBn;\n' + GLSL_EDGE + GLSL_LAND : ''));
      if (doLitter) {                                             // the bench coordinate of the bowl, from the land's own corners
        vs = vs.replace('#include <common>', '#include <common>\nattribute vec2 aMgB; varying vec2 vMgBn;');
        vs = vs.replace('vTWorld = (tm * tw).xyz;', 'vMgBn = aMgB; vTWorld = (tm * tw).xyz;');
      }
      if (kind === 'terrain') {                                    // boulders and cobbles: the sky's light in the shade, as the land has
        const shadeEnd = 'reflectedLight.indirectSpecular *= tamb; }';
        if (fs.includes(shadeEnd)) {
          fs = fs.replace(shadeEnd, 'reflectedLight.indirectSpecular *= tamb; reflectedLight.indirectDiffuse += diffuseColor.rgb*uMgFill*((.5 + .5*tamb)*(1. - .5*tsun)); }');
          fs = fs.replace('#include <common>', '#include <common>\nuniform vec3 uMgFill;');
          shader.uniforms.uMgFill = S.uRockFill;
        }
      }
      // in the gorge the right wall's shadow lies across the stream and the foot of the left wall; above it the left wall stands in the sun
      fs = fs.replace('#include <aomap_fragment>', (doLitter ? /* glsl */`{ float mgM = mgPatchAt(vTWorld.xz);
          float mgDl = mgZc(vTWorld.x) - vTWorld.z;
          float mgIn = smoothstep(-45.0, -25.0, mgDl)*(1.0 - smoothstep(4.0, 16.0, vTWorld.x))*uMgShade.z;
          float mgLit = smoothstep(-3.0, 6.0, vTWorld.y - (uMgShade.x - uMgShade.y*mgDl));
          mgM *= mix(1.0, mix(0.4, 1.0, mgLit), mgIn);
          // the left wall faces the sun: above the right wall's shadow it takes what sun there is, and where the travelling
          // break lies on it, the break's whole warm light (uMgWall: the sun's gain on it outside the break, inside it)
          mgM = max(mgM, mgLit*mgIn*smoothstep(8.0, 18.0, mgDl)*(1.0 - smoothstep(100.0, 125.0, mgDl))*mix(uMgWall.x, uMgWall.y, mgPatchA(vTWorld.xz)));
          mgM *= mix(1.0, 0.5, smoothstep(12.0, 30.0, vTWorld.x)*(1.0 - smoothstep(-46.0, -6.0, vTWorld.y)));   // the bowl is deep: less of the sun gets down
          mgM = mgSunShade(mgM, vTWorld, 28.0);             // the shade of the bank trees across the banks, the bar and the foot of the walls
          reflectedLight.directDiffuse *= mgM*vec3(1.1, 1.0, 0.84); reflectedLight.directSpecular *= mgM; }` : '{ float mgM = mgSunShade(mgPatchAt(vTWorld.xz), vTWorld, 28.0); reflectedLight.directDiffuse *= mgM; reflectedLight.directSpecular *= mgM; }') + '\n#include <aomap_fragment>');
      if (doLitter) {
        // the sky's own light in the shade: without it shaded rock and litter fall under the toe of the tone curve
        const shadeEnd = 'reflectedLight.indirectSpecular *= tamb; }';
        if (fs.includes(shadeEnd)) fs = fs.replace(shadeEnd, 'reflectedLight.indirectSpecular *= tamb; reflectedLight.indirectDiffuse += diffuseColor.rgb*uMgFill*((.45 + .55*tamb)*(1. - .6*tsun)*(1. + .9*smoothstep(8., 40., vTWorld.x))); }');
        shader.uniforms.uMgFill = S.uFill;
        // nothing on the land falls to black: the least the sky gives wet rock and shaded litter, eased in under the tones
        // above it so they keep their order (beds stay darker than the faces between them)
        // (the light is measured no lower than black, so the floor never adds more than itself: on an antialiased edge of the
        // land the light can come out a little under nought, and the easing would then raise that pixel past any white)
        fs = fs.replace('#include <opaque_fragment>', /* glsl */`{ vec3 mgFl = uMgFloor*(0.72 + 0.56*gMgTone)*mix(0.72, 1.0, gMgRk);
          float mgLu = max(dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722)), 0.0), mgLf = max(dot(mgFl, vec3(0.2126, 0.7152, 0.0722)), 1e-5);
          outgoingLight += mgFl*exp(-2.0*mgLu/mgLf); }
          #include <opaque_fragment>`);
        shader.uniforms.uMgFloor = S.uFloor; shader.uniforms.uMgWall = S.uWall; shader.uniforms.uMgWood = S.uWood; shader.uniforms.uMgCrown = { value: S.crownRamp };
        shader.uniforms.uMgLand = S.uLand; shader.uniforms.uMgBar = S.uBar; shader.uniforms.uMgRamp = { value: S.litterRamp }; shader.uniforms.uMgShade = S.uShade; shader.uniforms.uMgSheen = S.uSheen;
        // fallen leaves at leaf scale over everything that is not bare rock or under water; far off they melt into their mean colour
        fs = fs.replace(litter, /* glsl */`
          { // thinly bedded schist on everything steep: beds dipping down the gorge, each standing proud over the shadowed foot
            // of the next, fine laminae inside them, wet black streaks that take the cold sky
            float mgRk = rock*steep;
            // (the beds are measured on the smooth lie of the rock: the fine warp is left out of the pixel measure, or its own
            // sparkle would switch the beds off at a distance, and is itself eased away where it falls under a pixel)
            float mgS0 = wp.y + 0.14*wp.x + 0.05*wp.z, mgF0 = fwidth(mgS0);
            float mgSy = mgS0 + (tM.r - 0.5)*2.4 + (tD.r - 0.5)*0.6*(1.0 - smoothstep(0.04, 0.2, mgF0));
            // thin beds 2.3 m thick, and the benches they are gathered in, 7.6 m thick: where the thin ones fall under a few
            // pixels the benches carry the banding on, so the wall is bedded from the bank to the far end of the gorge
            float mgKb = mgSy/2.3 + 0.7*sin(mgSy*0.23), mgFr = fract(mgKb), mgId = floor(mgKb), mgFw = mgF0*0.6;
            float mgKc = mgSy/7.6 + 0.5*sin(mgSy*0.071 + 1.3), mgFc = fract(mgKc), mgIc = floor(mgKc), mgFwc = mgF0*0.17;
            float mgE = smoothstep(0.0, clamp(mgFw*1.5, 0.002, 0.5), mgFr), mgEc = smoothstep(0.0, clamp(mgFwc*1.5, 0.002, 0.5), mgFc);
            // each bed: its foot in shadow under the bed above it, its face in its own tone, its top a lit ledge
            float mgTf = mix((0.84 + 0.34*mgH2(vec2(mgId - 1.0, 7.0)))*1.26, (0.84 + 0.34*mgH2(vec2(mgId, 7.0)))*(1.0 + 0.26*smoothstep(0.84, 0.94, mgFr)), mgE);
            float mgTc = mix((0.86 + 0.3*mgH2(vec2(mgIc - 1.0, 3.0)))*1.3, (0.86 + 0.3*mgH2(vec2(mgIc, 3.0)))*(1.0 + 0.3*smoothstep(0.9, 0.96, mgFc)), mgEc);
            float mgSf = (1.0 - smoothstep(0.08, 0.32, mgFr))*mgE, mgSc = (1.0 - smoothstep(0.04, 0.17, mgFc))*mgEc;
            float mgAa = 1.0 - smoothstep(0.2, 0.5, mgFw), mgAc = 1.0 - smoothstep(0.2, 0.5, mgFwc);
            float mgProf = mix(1.0, mgTf, mgAa)*mix(1.0, mgTc, mgAc*mix(1.0, 0.45, mgAa));
            float mgSh = max(mgSf*mgAa, mgSc*mgAc*mix(1.0, 0.55, mgAa));
            float mgLam = mix(1.0, 0.88 + 0.24*mgH2(vec2(floor(mgSy/0.36), 3.0)), 1.0 - smoothstep(0.25, 0.8, mgF0/0.36));
            // THE BOWL (vMgBn, from the land's own corners: x the bench coordinate, y how far this is the bowl's stepped
            // wall). Its rock is ledged schist in four strong benches, and what marks it is the benches: here the thin beds
            // and the gathered ones of the gorge are only faint changes of tone, with no shadowed foot to any of them, so
            // no thin dark line runs round the bowl; the kit's own beds are eased toward the rock's mean in the same way.
            float mgBw = vMgBn.y, mgFb = fract(vMgBn.x), mgIb = floor(vMgBn.x);
            mgProf = mix(mgProf, 1.0 + (mgProf - 1.0)*0.2, mgBw); mgSh *= 1.0 - mgBw; mgLam = mix(mgLam, 1.0 + (mgLam - 1.0)*0.5, mgBw);
            float mgKitL = dot(mix(uTRock, st.rgb*st.rgb, uTStrata.x), vec3(0.3333)), mgEase = mix(1.0, clamp(dot(uTRock, vec3(0.3333))/max(mgKitL, 1e-3), 0.7, 1.5), 0.7*mgBw);
            float mgHor = wp.x + 0.7*wp.z;
            float mgStk = smoothstep(0.5, 0.76, mgVn(vec2(mgHor*0.37, mgSy*0.028))*0.7 + mgVn(vec2(mgHor*1.6, wp.y*0.09) + 5.0)*0.3);
            vec3 mgRc = diffuseColor.rgb*(mgEase*mgProf*mgLam*(1.0 - 0.46*mgStk));
            // the shadow under each bed is the sky's own slate-blue, never black
            mgRc *= mix(vec3(1.0), uMgFill*vec3(0.72, 0.93, 1.28)*(0.24/max(max(uMgFill.r, uMgFill.g), max(uMgFill.b, 1e-3))), mgSh);
            // ledge plants: straw fern and dark moss hanging in tufts from the lip of a bench here and there (seen from the stream)
            { float mgTu = mgVn(vec2(mgHor*0.33 + mgIc*7.1, mgIc*3.7)), mgT2 = mgVn(vec2(mgHor*1.9, mgSy*0.9) + 11.0);
              float mgPl = smoothstep(0.56, 0.7, mgTu)*smoothstep(0.86 - 0.3*mgT2*smoothstep(0.5, 0.9, mgTu), 0.93, mgFc)*mgAc*smoothstep(0.05, 0.1, mgF0)*(1.0 - mgBw);
              mgRc = mix(mgRc, mix(vec3(0.05, 0.09, 0.045), vec3(0.3, 0.23, 0.09), smoothstep(0.35, 0.7, mgVn(vec2(mgHor*0.9, mgIc*5.0) + 3.0)))*(0.6 + 0.8*mgT2), mgPl*0.85); }
            float mgUl = 0.0;
            // (mgAng: metres round the bowl at its walls; the turn of the angle lies at the low far end, where there is no wall)
            float mgAng = atan(-(wp.z - ${STREAM_Z.toFixed(1)}), -(wp.x - 90.0))*62.0, mgJp = fwidth(mgAng)/8.0;
            if (mgBw > 0.002) {
              // Each riser is cut by joints every 5 to 12 m round the bowl into blocks, every block its own tone; two joints
              // in five stand open as a dark crack up from the riser's foot or down from its lip.
              // (the joints lean and wander: none is a ruled upright; a crack runs only part of the way up its riser)
              float mgJw = mgAng/8.0 + 5.0*mgH2(vec2(mgIb, 2.0)) + 0.8*sin(mgAng*0.09 + mgIb*2.3) + 0.45*sin(mgAng*0.31 + mgIb*1.1) + (mgFb - 0.5)*0.5*sin(mgAng*0.043 + mgIb*4.0) + 0.5*(tM.r - 0.5);
              float mgJi = floor(mgJw), mgJf = fract(mgJw), mgJe = mgJi + step(0.5, mgJf);
              float mgBt = 0.84 + 0.3*mgH2(vec2(mgJi, mgIb + 3.0));
              float mgCh = mgH2(vec2(mgJe, mgIb + 9.0)), mgC2 = mgH2(vec2(mgJe, mgIb + 21.0));
              float mgCr = (1.0 - smoothstep(0.0, 0.02 + mgJp, min(mgJf, 1.0 - mgJf)))*step(0.6, mgCh)*(1.0 - smoothstep(0.2, 0.5, mgJp))
                *(mgC2 < 0.5 ? 1.0 - smoothstep(0.35 + 0.8*mgC2, 0.5 + 0.8*mgC2, mgFb) : smoothstep(0.1 + 0.8*(mgC2 - 0.5), 0.25 + 0.8*(mgC2 - 0.5), mgFb));
              // under the lip of the bench above, a soft slate shadow: deepest under the lip, gone by the middle of the
              // riser, and deeper or shallower from one block to the next, so its lower edge is broken at every joint
              mgUl = smoothstep(0.4 + 0.22*mgH2(vec2(mgJi, mgIb + 5.0)), 0.95, mgFb)*(1.0 - smoothstep(0.975, 0.998, mgFb))*mgBw;
              // talus against the riser's foot: a ragged apron of broken stone, paler and mottled
              float mgTa = (1.0 - smoothstep(0.04, 0.12 + 0.18*mgVn(vec2(mgAng*0.21, mgIb*3.1)), mgFb))*smoothstep(0.003, 0.02, mgFb);
              // straw fern and dark moss hanging in tufts from the lip, here and there
              float mgTu2 = mgVn(vec2(mgAng*0.3 + mgIb*7.1, mgIb*3.7)), mgT3 = mgVn(vec2(mgAng*1.9, wp.y*0.9) + 11.0);
              float mgPlB = smoothstep(0.52, 0.66, mgTu2)*smoothstep(0.9 - 0.22*mgT3, 0.96, mgFb)*(1.0 - smoothstep(0.985, 0.999, mgFb));
              vec3 mgBc = mgRc*(mgBt*(1.0 - 0.3*mgCr));
              mgBc = mix(mgBc, mgBc*(1.0 + 0.5*mgVn(wp.xz*1.7 + wp.y*0.9)), 0.8*mgTa);
              mgBc *= mix(vec3(1.0), uMgFill*vec3(0.8, 0.95, 1.2)*(0.5/max(max(uMgFill.r, uMgFill.g), max(uMgFill.b, 1e-3))), 0.85*mgUl/max(mgBw, 1e-3));
              mgBc = mix(mgBc, mix(vec3(0.05, 0.09, 0.045), vec3(0.3, 0.23, 0.09), smoothstep(0.35, 0.7, mgVn(vec2(mgAng*0.9, mgIb*5.0) + 3.0)))*(0.6 + 0.8*mgT3), 0.85*mgPlB);
              mgRc = mix(mgRc, mgBc, mgBw);
            }
            float mgFres = 1.0 - max(dot(wnS, normalize(cameraPosition - wp)), 0.0); mgFres *= mgFres*mgFres;
            mgRc = mix(mgRc, uMgSheen, (0.04 + 0.45*mgFres)*(0.3 + 0.7*mgStk));
            diffuseColor.rgb = mix(diffuseColor.rgb, mgRc, mgRk);
            gMgRk = mgRk; gMgTone = clamp((mgProf*(1.0 - 0.6*max(mgSh, 0.7*mgUl)) - 0.68)/0.72, 0.0, 1.0);
            // (the bump is slight: a bed whose foot is turned right under loses the sun and the sky together and shows black;
            // in the bowl the beds have no relief of their own: its relief is the benches)
            bed = (clamp(bed, -0.5, 0.3) + mgRk*mgAa*(0.5*(1.0 - smoothstep(0.0, 0.3, mgFr)) - 1.2*smoothstep(0.82, 0.95, mgFr))*0.3)*(1.0 - 0.8*mgBw); }
          { float mgW = mgWater(wp.x) + uMgLand.y, mgD = abs(wp.z - mgZc(wp.x));
            float mgDry = wp.x < 13.0 ? max(smoothstep(mgW + 0.4, mgW + 1.0, wp.y), step(34.0, mgD)) : smoothstep(-60.7, -59.7, wp.y);
            float mgLat = ${STREAM_Z.toFixed(1)} - wp.z;
            // (the bar's stream side is its waterline, which wanders: under the water nothing lies, so the mask needs no inner edge)
            float mgBx = mgBarX(wp.x, uMgBar), mgBarK = mgBx*smoothstep(0.0, 2.0, mgLat)*(1.0 - smoothstep(uMgBar.w - 1.5, uMgBar.w + 1.5, mgLat));
            float mgK = (1.0 - rock)*mgDry*(1.0 - 0.82*mgBarK);
            // THE WATERLINE: within a stride of the water the gravel and the stones are wet, dark and cool, the band wandering
            // with the edge (mgEdge, as the stream draws it) and breathing as the water laps; on the bar's gentle beach it
            // is two metres wide, on a steep bank a hand's breadth
            { float mgHw = wp.y - (mgW + 0.28) - uMgEdge.w*mgEdge(wp.xz)*mix(0.5, 1.0, mgBx) + 0.015*sin(uMgShK.z*1.3 + wp.x*0.9);
              gMgWetL = (1.0 - smoothstep(0.02, 0.13 + 0.07*tD.r, mgHw))*(1.0 - smoothstep(13.0, 16.0, wp.x))*(1.0 - smoothstep(26.0, 34.0, mgD));
              diffuseColor.rgb *= mix(vec3(1.0), vec3(0.4, 0.43, 0.5), gMgWetL*(1.0 - 0.5*rock)); }
            vec2 mgQ1 = wp.xz*3.1, mgQ2 = vec2(wp.x*0.8 + wp.z*0.6, -wp.x*0.6 + wp.z*0.8)*4.3 + 7.7;
            float mgF1 = fwidth(mgQ1.x) + fwidth(mgQ1.y);
            float mgDens = clamp(0.28 + 0.8*tD.r + 0.5*(tM.r - 0.5), 0.05, 0.95)*uMgLand.z;
            vec3 mgA = mgFleck(mgQ1, mgDens, mgF1*0.6), mgB = mgFleck(mgQ2, mgDens, mgF1*0.8);
            float mgFar = smoothstep(0.45, 1.5, mgF1);
            vec3 mgCa = uMgRamp[int(min(mgA.x*4.0, 3.0))]*(0.5 + 0.6*mgA.y), mgCb = uMgRamp[int(min(mgB.x*4.0, 3.0))]*(0.5 + 0.6*mgB.y);
            vec3 mgC = diffuseColor.rgb;
            mgC = mix(mgC, mgCa, mgA.z*mgK*(1.0 - mgFar));
            mgC = mix(mgC, mgCb, mgB.z*mgK*(1.0 - mgFar));
            mgC = mix(mgC, (uMgRamp[0] + uMgRamp[1] + uMgRamp[2] + uMgRamp[3])*0.2, mgFar*mgK*mgDens*0.34);
            diffuseColor.rgb = mgC; }
          { // far off, the floor of the upland is the closed wood seen from above: crowns in the leaf colours, each lit on its
            // top and dark where it meets the next (a rule in world coordinates: beyond uMgWood.x .. y metres from the stream)
            float mgAx = abs(wp.z - mgZc(wp.x));
            float mgWd = smoothstep(uMgWood.x, uMgWood.y, mgAx)*(1.0 - rock)*(1.0 - smoothstep(40.0, 70.0, wp.x));
            vec2 mgP = wp.xz/uMgWood.z;
            float mgSoft = smoothstep(0.35, 1.6, fwidth(mgP.x) + fwidth(mgP.y)), mgMot = mgVn(wp.xz*0.8);
            if (mgWd > 0.002) {
              vec2 mgI = floor(mgP), mgFp = fract(mgP), mgId = mgI; float mgD1 = 8.0, mgD2 = 8.0;
              for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
                vec2 o = vec2(float(x), float(y)), cc = mgI + o;
                vec2 r = o + 0.15 + 0.7*vec2(mgH2(cc), mgH2(cc + 31.7)) - mgFp; float dd = dot(r, r);
                if (dd < mgD1) { mgD2 = mgD1; mgD1 = dd; mgId = cc; } else if (dd < mgD2) { mgD2 = dd; }
              }
              float mgEd = sqrt(mgD2) - sqrt(mgD1), mgHh = mgH2(mgId + 5.5);
              vec3 mgCc = uMgCrown[int(min(mgHh*5.0, 4.0))]*(0.62 + 0.5*mgH2(mgId + 9.1));
              mgCc *= mix(0.42 + 0.8*smoothstep(0.0, 0.42, mgEd), 0.82, mgSoft)*(0.74 + 0.5*mgMot);
              diffuseColor.rgb = mix(diffuseColor.rgb, mgCc, mgWd);
            } }
          ` + litter + ' gTWet = max(gTWet, 0.7*gMgWetL);');
        shader.uniforms.uMgEdge = S.uEdge;
      }
    } else {
      vs = vs.replace('#include <common>', '#include <common>\nvarying vec2 vMgW;').replace('#include <project_vertex>', '#include <project_vertex>\nvMgW = (cameraPosition + mvPosition.xyz*mat3(viewMatrix)).xz;');
      fs = fs.replace('#include <common>', '#include <common>\nvarying vec2 vMgW;\n' + pars + (kind === 'dome' ? GLSL_WHASH : ''));
      if (kind === 'dome') {                                     // far crowns: clumps of lit and shaded leaves, never a smooth ball
        // each crown is a clump of soft lobes: leaf-textured, lit on top and shaded beneath, and its outline is the ragged
        // edge of its outermost leaves (cut by noise where the surface turns away from the eye), never the edge of a facet
        vs = vs.replace('#include <common>', '#include <common>\nattribute float aMgBark; varying vec3 vMgY;').replace('#include <project_vertex>', '#include <project_vertex>\nvMgY = vec3((modelMatrix*instanceMatrix*vec4(transformed, 1.0)).y, objectNormal.y, aMgBark);');
        fs = fs.replace('#include <common>', '#include <common>\nvarying vec3 vMgY; uniform vec3 uMgDomeFill;');
        shader.uniforms.uMgDomeFill = S.uDomeFill;
        fs = fs.replace('#include <color_fragment>', `#include <color_fragment>
          { vec2 mgq = vMgW*0.5 + vMgY.x*vec2(0.37, 0.23);
            float mgm = wNoise(mgq)*0.45 + wNoise(mgq*2.6 + 5.0)*0.33 + wNoise(mgq*6.3 + 11.0)*0.22;
            float mgNdv = abs(dot(normalize(vNormal), normalize(vViewPosition)));
            // The wood round the bowl and beyond the pool (a rule in world coordinates: east of the brink) is looked down on
            // from the lip, a crown twenty or thirty pixels across: there each crown is clumps of leaves, lit on top and
            // dark in the hollows between them and beneath, sprays of leaves a metre across over the clumps, a ragged edge;
            // its trunk (aMgBark) is dark bark. So is any far crown the lens comes within 200 m of (a rule from distance:
            // on the descent the crowns of the flank stand close above us); the rest are as they were.
            float mgEast = smoothstep(70.0, 100.0, vMgW.x), mgNear = (1.0 - smoothstep(110.0, 200.0, length(vViewPosition)))*(1.0 - mgEast), mgRim = max(mgEast, mgNear), mgBk = step(0.5, vMgY.z);
            if (mgBk < 0.5 && mgNdv < 0.08 + mix(0.4, 0.62, mgRim)*wNoise(mgq*2.9 + 3.0)) discard;
            float mgOld = (0.55 + 0.85*smoothstep(0.28, 0.72, mgm))*(0.7 + 0.42*smoothstep(-0.5, 0.7, vMgY.y));
            float mgc1 = wNoise(mgq*0.56 + 17.0), mgc2 = wNoise(mgq*1.7 + 29.0), mgc3 = mix(0.5, wNoise(mgq*3.8 + 41.0), 1.0 - smoothstep(0.1, 0.26, fwidth(mgq.x) + fwidth(mgq.y)));   // (the finest eased away under a pixel: no sparkle)
            float mgCl = smoothstep(0.3, 0.7, mgc1*0.42 + mgc2*0.4 + mgc3*0.18), mgTop = smoothstep(-0.6, 0.7, vMgY.y);
            vec3 mgTex = mix(vec3(0.24, 0.2, 0.25), vec3(1.2, 1.16, 0.98), mgCl)*(mix(0.36, 1.12, mgTop)*(0.78 + 0.44*mgc3));
            mgTex *= mix(vec3(1.0), vec3(1.1, 1.18, 0.86), smoothstep(0.62, 0.92, mgCl)*mgTop);       // the lit clumps a shade toward gold
            diffuseColor.rgb *= mix(vec3(mgOld), mgTex, mgRim)*(1.0 - 0.34*mgNear);        // (close to, a tone lower: the low sun must not burn the clumps flat)
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.028, 0.024, 0.022), mgBk); }`);
      }
      fs = fs.replace('#include <aomap_fragment>', '{ float mgM = mgPatchAt(vMgW)*(1.0 + uMgBurst.y*mgPatchA(vMgW)' + (kind === 'dome' ? '*(1.0 - 0.5*smoothstep(70.0, 100.0, vMgW.x))' : '') + '); reflectedLight.directDiffuse *= mgM; reflectedLight.directSpecular *= mgM; }\n' + (kind === 'dome' ? 'reflectedLight.indirectDiffuse += diffuseColor.rgb*uMgDomeFill;\n' : '') + '#include <aomap_fragment>');
    }
    shader.fragmentShader = fs; shader.vertexShader = vs;
  };
  mat.customProgramCacheKey = function () { return (prevKey ? prevKey.call(mat) : '') + '|mg-' + kind; };
  mat.needsUpdate = true;
  return mat;
}

// ---------- floating / fallen leaves: one instanced draw of single triangles with the hero's leaf outline ----------
// iA = (a, b, c, size), iB = (kind, p1, p2, p3):
//   kind 0 riding the river   a = x0, b = lateral, c = phase            p1 = speed m/s, p2 = spin
//   kind 1 the pool spiral    a = arm angle, b = tau0, c = radial jitter  p1 = rate, p2 = spin, p3 = angle jitter
//   kind 2 loose on the pool  a = x, b = z, c = phase                     p1 = drift radius, p2 = spin
//   kind 3 litter on the ground a = x, b = y, c = z                       p1 = yaw, p2 = flutter, p3 = tilt seed
function floaterMaterial(S, eye) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uPx: S.uPx, uMgPatch: S.uPatch, uMgPatch2: S.uPatch2, uSunCol: S.uSunCol, uSunDir: S.uSunDir, uHemiSky: S.uHemiSky, uHemiGround: S.uHemiGround, tMgShade: S.tShade, uMgShBox: S.uShBox, uMgShSun: S.uShSun, uMgShK: S.uShK, 
      uEye: { value: eye }, uRiver: { value: new THREE.Vector4(-432, 441, -1.5, 27 / 420) }, uLevel: S.uLevel, uS0: S.uS0 },
    vertexShader: /* glsl */`
      attribute vec4 iA, iB; attribute vec3 iCol;
      uniform float uTime, uPx, uLevel; uniform vec3 uEye; uniform vec4 uRiver; uniform vec2 uS0;
      varying vec2 vQ, vW; varying vec3 vCol, vN; varying float vWet, vSh;
      ${GLSL_STREAM}
      ${GLSL_PATCH}
      ${GLSL_SHADE}
      #include <fog_pars_vertex>
      void main(){
        float k = iB.x, fade = 1.0, spin = iB.z*uTime + iA.z*7.0;
        vec3 P; vec3 up = vec3(0.0, 1.0, 0.0);
        vWet = 1.0;
        if (k < 0.5) {
          float x = uRiver.x + mod(iA.x + iB.y*uTime, uRiver.y);
          P = vec3(x, uRiver.z + max(-x, 0.0)*uRiver.w + uLevel + 0.4 + 0.04*sin(uTime*3.0 + iA.z*9.0), ${STREAM_Z.toFixed(1)} + iA.y + 0.5*sin(x*0.07 + iA.z*6.0));
          { vec4 wo; P.y += mgSurf(uS0.y + (x - uS0.x), P.z - ${STREAM_Z.toFixed(1)}, 1.0 - smoothstep(-16.0, 3.0, x), uTime, wo) - 0.05; }   // it rides the standing waves of the stream
          fade = smoothstep(0.0, 14.0, x - uRiver.x)*(1.0 - smoothstep(uRiver.y - 6.0, uRiver.y, x - uRiver.x));
          up = normalize(vec3(0.25*sin(uTime*2.3 + iA.z*5.0), 1.0, 0.25*cos(uTime*1.9 + iA.z*3.0)));
        } else if (k < 1.5) {
          float tau = fract(iA.y + uTime*iB.y);
          float r = max(24.0*pow(1.0 - tau, 0.8) + 1.4 + iA.z*(0.4 + 1.5*(1.0 - tau)), 1.2);
          float ang = iA.x + iB.w*(0.4 + 6.0/(r + 4.0)) + 4.5*log(r + 1.0) - uTime*0.06;      // the same log spiral as the leaf mat under it
          P = uEye + vec3(cos(ang)*r, 0.06, sin(ang)*r);
          fade = smoothstep(0.0, 0.07, tau)*(1.0 - smoothstep(0.93, 1.0, tau));
        } else if (k < 2.5) {
          P = vec3(iA.x + iB.y*sin(uTime*0.11 + iA.z*6.0), uEye.y + 0.05, iA.y + iB.y*cos(uTime*0.09 + iA.z*6.0));
        } else {
          P = vec3(iA.x, iA.y + 0.05, iA.z); spin = iB.y; vWet = 0.0;
          float lift = iB.z*max(0.0, sin(uTime*(2.0 + 3.0*fract(iB.w*7.3)) + iB.w*40.0 + iA.x*0.3));
          up = normalize(vec3(0.5*sin(iB.w*31.0) + 0.8*lift, 1.0, 0.5*cos(iB.w*17.0)));
          P.y += lift*0.12;
        }
        vec3 e1 = normalize(cross(up, vec3(sin(spin), 0.0, cos(spin)))), e2 = cross(e1, up);
        vec4 mvc = viewMatrix*vec4(P, 1.0);
        float dist = length(mvc.xyz);
        float size = max(iA.w, 1.2*uPx*dist)*fade*smoothstep(0.8, 2.0, dist);
        vec3 wp = P + (position.x*e1 + position.y*e2)*size;
        vec4 mvPosition = viewMatrix*vec4(wp, 1.0);
        vQ = position.xy; vW = wp.xz; vCol = iCol; vN = up;
        vSh = mgSunShade(1.0, P, 28.0);                             // the whole leaf lies in the shade its middle lies in
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uSunDir, uHemiSky, uHemiGround;
      varying vec2 vQ, vW; varying vec3 vCol, vN; varying float vWet, vSh;
      ${GLSL_PATCH}
      ${GLSL_LEAF}
      #include <fog_pars_fragment>
      void main(){
        float d = mgLeaf(vQ);
        float fw = fwidth(d);
        d = mix(d, 0.82 - length(vQ - vec2(0.0, 0.05)), smoothstep(0.22, 0.6, fw));
        if (d < 0.0) discard;
        vec3 n = normalize(vN);
        float ax = abs(vQ.x), yy = vQ.y + 0.22;
        float vein = max(smoothstep(0.05, 0.0, ax), smoothstep(0.045, 0.0, abs(ax*0.62 - yy*0.78)*step(0.0, yy)))*(1.0 - smoothstep(0.02, 0.1, fw));
        vec3 col = vCol*(1.0 + 0.3*vein)*(0.8 + 0.2*smoothstep(0.0, 0.25, d));
        vec3 amb = mix(uHemiGround, uHemiSky, 0.5 + 0.5*n.y);
        vec3 c = col*0.3183*(uSunCol*max(dot(n, uSunDir), 0.0)*mgPatchAt(vW)*vSh + amb);
        c += vWet*amb*0.045;                                   // wet sheen takes the sky
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// The pool: one sheet that is the whole water surface. Dark peat water mirroring the amphitheatre walls and the lit wood
// along its sides and the slate sky in the middle, soft foam drifting out from the foot of the fall, ripple rings, the
// leaf mat of the spiral with its dark eye, the wakes the wood ducks left as they pattered off, the ring's light.
function poolMaterial(S, glow, eye, foot, wakes, C) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uMgPatch: S.uPatch, uMgPatch2: S.uPatch2, uSunCol: S.uSunCol, uSunDir: S.uSunDir, uHemiSky: S.uHemiSky, uHemiGround: S.uHemiGround,
      uRamp: { value: S.ramp }, uGlow: { value: glow }, uEyeXZ: { value: new THREE.Vector2(eye.x, eye.z) }, uFoot: { value: new THREE.Vector2(foot.x, foot.z) },
      uSkyZ: { value: C.skyZ }, uSkyH: { value: C.skyH }, uRockC: { value: C.rock }, uLeafA: { value: C.leafA }, uLeafB: { value: C.leafB }, uBody: { value: C.body }, uRim: { value: C.rim ?? 0.35 },
      uWake: { value: wakes }, uWakeAge: S.uWakeAge, uWakeC: { value: C.wakeC }, uFloorLo: { value: C.floorLo }, uFloorHi: { value: C.floorHi }, uSheenK: { value: C.sheenK } },
    vertexShader: /* glsl */`
      varying vec3 vWp;
      #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix*vec4(position, 1.0); vWp = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uWakeAge; uniform vec3 uSunCol, uSunDir, uHemiSky, uHemiGround, uRamp[4], uGlow, uSkyZ, uSkyH, uRockC, uLeafA, uLeafB, uBody; uniform vec2 uEyeXZ, uFoot; uniform float uRim, uSheenK; uniform vec3 uFloorLo, uFloorHi;
      uniform vec4 uWake[8];           // lift-off point x, z, heading, length of the pattered trail
      uniform vec3 uWakeC;             // middle of the wakes: x, z
      varying vec3 vWp;
      ${GLSL_PATCH}
      ${GLSL_WHASH}
      ${GLSL_WCELL}
      #include <fog_pars_fragment>
      void main(){
        vec2 vW = vWp.xz;
        float pxw = fwidth(vW.x) + fwidth(vW.y);                               // metres of water under one pixel
        vec2 pe = (vW - vec2(90.0, ${STREAM_Z.toFixed(1)}))/vec2(74.0, 52.0);
        float re = length(pe);
        float shore = 1.0 - smoothstep(0.90, 0.955, re);
        if (re > 0.975) discard;
        vec3 amb = mix(uHemiGround, uHemiSky, 0.85);
        vec3 ambW = mix(amb, vec3(dot(amb, vec3(0.3333))), 0.65);            // the same light with its blue taken out: leaves keep their hue under it
        float sun = max(uSunDir.y, 0.0)*mgPatchAt(vW);
        // ----- the mirror: where the reflected ray meets the amphitheatre wall, rock below and the lit wood above; else sky
        vec3 V = normalize(cameraPosition - vWp);
        vec2 rip = vec2(wNoise(vW*0.55 + vec2(uTime*0.22, 0.0)), wNoise(vW*0.55 + vec2(7.0, -uTime*0.19))) - 0.5;
        rip += 0.5*(vec2(wNoise(vW*1.7 - vec2(uTime*0.4, 3.0)), wNoise(vW*1.7 + vec2(11.0, uTime*0.35))) - 0.5);
        vec3 n = normalize(vec3(rip.x*0.10, 1.0, rip.y*0.10));
        vec3 R = reflect(-V, n);
        float F = 0.02 + 0.98*pow(1.0 - max(dot(n, V), 0.0), 5.0);
        vec2 Rh = R.xz; float rl = max(length(Rh), 1e-3); vec2 D = (Rh/rl)/vec2(74.0, 52.0);
        float qa = dot(D, D), qb = dot(pe, D), qc = dot(pe, pe) - 1.0;
        float th = (-qb + sqrt(max(qb*qb - qa*qc, 0.0)))/max(qa, 1e-6);          // metres to the foot of the wall along the ray's heading
        vec2 hit = vW + (Rh/rl)*th;
        float wallH = 84.0*(1.0 - 0.9*smoothstep(50.0, 250.0, hit.x)) + 14.0*(wNoise(hit*0.04) - 0.5);
        float rise = (th + 9.0)*max(R.y, 0.0)/rl;                               // height where the ray meets it
        float wn = wNoise(hit*0.07 + rise*0.05);
        vec3 wood = mix(uLeafA, uLeafB, wn)*0.3183*(uSunCol*0.45*mgPatchAt(hit) + ambW*1.4);
        vec3 rockc = uRockC*0.3183*(uSunCol*0.22*mgPatchAt(hit) + amb*(1.0 + 0.5*wn));
        vec3 wall = mix(rockc, wood, smoothstep(0.62, 0.92, rise/max(wallH, 1.0) + 0.25*(wn - 0.5)));
        vec3 sky = mix(uSkyH, uSkyZ, smoothstep(0.0, 0.8, max(R.y, 0.0)));
        vec3 refl = mix(wall, sky, smoothstep(0.92, 1.12, rise/max(wallH, 1.0)));
        // the body: dark peat water whose surface can be seen. Its two tones are worked out in build() from this look's
        // exposure, tone curve, contrast and shadow tint, so that they show as luma 29 and 38 whatever the look: the grade's
        // contrast takes 0.03 off every tone after the tone curve, and a colour picked by eye here shows as pure black
        float bodyN = wNoise(vW*0.045 + vec2(3.0, uTime*0.006))*0.6 + wNoise(vW*0.16 - vec2(uTime*0.02, 5.0))*0.4;
        vec3 c = max(uBody*0.3183*(uSunCol*sun*0.5 + amb), mix(uFloorLo, uFloorHi, smoothstep(0.25, 0.75, bodyN))) + refl*F*(0.3 + 0.7*smoothstep(0.45, 0.85, re));
        // the wood on the rim lies mirrored round the outer third whatever the angle we look from: crowns and trunks drawn
        // inward from the shore in warm streaks, broken by the ripples; brightest under the sunlit wall
        vec2 dirN = pe/max(re, 1e-3);
        vec2 fp0 = vW - uFoot; float fd0 = length(fp0);
        float brk = smoothstep(0.3, 0.7, wNoise(vec2(fd0*1.1 - uTime*0.5, fp0.y*0.16) + rip*1.5)*0.65 + wNoise(vec2(fd0*2.9 - uTime*0.8, fp0.y*0.4 + 5.0))*0.35);   // ripple arcs running out from the fall
        float strk = wNoise(dirN*10.0 + re*0.8)*0.55 + wNoise(dirN*24.0 + 9.0 - re*1.3)*0.45;
        float band = smoothstep(0.7, 0.9, re + 0.14*(wNoise(dirN*2.6 + 4.0) - 0.5))*(1.0 - 0.6*smoothstep(0.9, 0.955, re));
        vec3 rimc = mix(uLeafA, uLeafB, smoothstep(0.3, 0.7, wNoise(dirN*4.3 + 7.0)))*0.3183*(uSunCol*0.5*mgPatchAt(vW) + vec3(1.0, 0.84, 0.66)*(dot(amb, vec3(0.3333))*1.3));
        c += rimc*(band*smoothstep(0.44, 0.66, strk)*(0.25 + 0.75*brk)*(1.0 - 0.38*smoothstep(-0.5, 0.3, pe.y))*uRim);
        // and the slate sky lies on the middle in soft cold patches
        float shn = wNoise(vW*0.04 + vec2(uTime*0.01, 3.0))*0.65 + wNoise(vW*0.11 + vec2(7.0, -uTime*0.013))*0.35;
        float finer = wNoise(vW*0.9 + vec2(uTime*0.11, -uTime*0.07) + rip*2.0);                                 // the wind's own small ripples in it
        c += mix(uSkyH, uSkyZ, 0.5)*(uSheenK*(0.1 + 0.9*smoothstep(0.36, 0.7, shn))*(1.0 - smoothstep(0.55, 0.92, re))*(0.62 + 0.38*brk)*(0.78 + 0.44*finer));
        float alpha = shore;
        // ----- the spiral of leaves and its dark eye
        vec2 vP = vW - uEyeXZ;
        float r = length(vP) + 1e-3, a = atan(vP.y, vP.x + 1e-4);
        float turn = -uTime*0.06;                                              // the whole figure turns; the leaves run in along its two arms
        float ph = 2.0*a - 9.0*log(r + 1.0) - 2.0*turn;
        float arm = 0.5 + 0.5*sin(ph);
        float ca = cos(turn), sa = sin(turn); vec2 rp = vec2(vP.x*ca + vP.y*sa, -vP.x*sa + vP.y*ca);
        float n1 = wNoise(rp*0.7), n2 = wNoise(rp*3.7);
        float mat = smoothstep(0.5, 0.86, arm + 0.3*(n1 - 0.5))*smoothstep(1.5, 4.0, r)*(1.0 - smoothstep(17.0, 27.0, r));
        mat *= 0.5 + 0.5*smoothstep(0.25, 0.6, n2);
        vec2 cell = floor(rp*5.5); float h = wHash(cell);
        vec3 lc = uRamp[int(min(h*4.0, 3.0))]*(0.55 + 0.7*wHash(cell + 7.7));
        vec3 leafc = lc*0.3183*(uSunCol*sun + ambW*1.3);
        float eye = 1.0 - smoothstep(0.6, 5.0, r);
        c = mix(c, leafc, mat*0.85);
        c = mix(c, uFloorLo*0.86, eye*0.8);
        // ----- foam: pale lace drawn out along the current that leaves the foot of the fall, the boil at the foot, ripple rings.
        // First where it lies (soft-edged, thinning with distance from the fall), then what it is: strands round dark holes of
        // water, thick where it lies thick, single threads and then flecks where it thins. Never a blotch with a hard edge.
        vec2 fp = vW - uFoot; float fd = length(fp) + 1e-3; float fa0 = atan(fp.y, fp.x + 1e-4);
        vec2 fq = vec2(fd*0.085 - uTime*0.05, fa0*(2.2 + fd*0.035));
        float fn = wNoise(fq)*0.6 + wNoise(fq*2.3 + 3.1)*0.4;
        fn += 0.22*(wNoise(vW*0.12 + vec2(uTime*0.01, 4.0)) - 0.5);
        float reach = exp(-fd/70.0);
        float clearW = 0.08 + 0.92*smoothstep(13.0, 26.0, distance(vW, uWakeC.xy));  // the ducks' water is clear of it
        float lie = smoothstep(0.58 - 0.26*reach, 0.96 - 0.26*reach, fn)*(0.25 + 0.75*reach)*smoothstep(3.0, 14.0, fd)*clearW;
        vec2 dr = vec2(uTime*0.06, uTime*0.02);
        float cellA = wNoise(vW*0.6 - dr), cellB = wNoise(vW*1.5 + dr*1.7 + 4.0), cellC = wNoise(vW*3.6 - dr*2.0 + 9.0);
        // the churn the fall drives out across the pool: a fan of white water breaking into streaks sixty metres from the foot
        float tz = fp.y/(9.0 + 0.16*max(fp.x, 0.0));
        vec2 cq = vec2(fp.x*0.3 - uTime*0.5, fp.y*0.36) + 1.6*vec2(cellA, cellB);
        float cn = wNoise(cq)*0.5 + wNoise(cq*2.7 + 5.0)*0.3 + wNoise(cq*6.1 + 11.0)*0.2, cth = 0.62 - 0.4*exp(-max(fp.x, 0.0)/26.0);
        float churn = exp(-tz*tz)*smoothstep(2.0, 14.0, fp.x)*(1.0 - smoothstep(40.0, 78.0, fp.x))*smoothstep(cth - 0.12, cth + 0.28, cn)*clearW;
        float thick = clamp(max(lie*1.25, churn*1.6), 0.0, 1.0);
        vec2 lq = vec2(fd*0.22 - uTime*0.1, fa0*fd*0.4) + 0.45*vec2(cellA, cellB);       // cells drawn out along the current that carries them from the fall
        float e1 = wCell(lq);
        // the threads between the cells are hair-fine where the foam lies thin and broaden as it thickens, until the holes
        // close into froth: so a raft has no edge, it thins away into single threads
        float s1 = 0.11 + pxw*0.5, w1 = (0.5 + s1)*thick - s1;
        float thread = 1.0 - smoothstep(w1 - s1, w1 + s1, e1);
        float lace = max(thread*(0.6 + 0.4*thick), smoothstep(0.5, 1.0, thick)*0.8);
        float fleck = smoothstep(0.74, 0.9, cellB*0.45 + cellC*0.55)*smoothstep(0.34 - 0.26*reach, 0.8 - 0.26*reach, fn)*smoothstep(3.0, 14.0, fd)*clearW*0.5;
        float boil = exp(-fd*fd/460.0)*smoothstep(0.35, 0.75, wNoise(fp*0.5 - vec2(uTime*0.8, 0.0))*0.6 + wNoise(fp*1.7 + uTime*0.5)*0.4);
        float rings = (0.5 + 0.5*sin(fd*0.9 - uTime*2.4))*exp(-fd/55.0)*smoothstep(4.0, 16.0, fd);
        float edge = smoothstep(0.9, 0.945, re)*smoothstep(0.36, 0.7, wNoise(vW*0.45 + vec2(uTime*0.07, 2.0))*0.6 + (cellA*0.45 + cellB*0.35 + cellC*0.2)*0.4)*0.7;     // a broken pale fringe along the rock
        // ----- wakes: where each duck pattered across the water and lifted off, one thin bright V, no wider than the bird
        float wk = 0.0, wsg = max(0.14, 0.7*pxw);
        for (int i = 0; i < 8; i++) {
          vec4 w = uWake[i];
          vec2 d = vW - w.xy; float cw = cos(w.z), sw = sin(w.z);
          float al = -(d.x*cw + d.y*sw), ac = abs(-d.x*sw + d.y*cw);            // metres behind the lift-off point, metres off its line
          float alp = max(al, 0.0), len = w.w*0.44, hw = 0.08 + (0.11 + 0.003*uWakeAge)*alp + 0.1*sin(al*1.3 + float(i)*2.1);
          float arms = exp(-(ac - hw)*(ac - hw)/(wsg*wsg))*smoothstep(-0.3, 0.4, al)*(1.0 - smoothstep(len*0.15, len, al))*(0.7 + 0.3*sin(al*3.1 + float(i)));
          float pat = exp(-ac*ac/(wsg*wsg))*(0.5 + 0.5*cos(al*4.6))*smoothstep(0.2, 0.8, al)*(1.0 - smoothstep(1.5, 4.5, al))*0.55;   // the last few splashes of its feet
          wk = max(wk, max(arms, pat)*(1.0 - 0.025*uWakeAge));
        }
        float white = clamp(churn + boil + wk, 0.0, 1.0);
        vec3 foamC = vec3(0.8, 0.82, 0.82)*0.3183*(uSunCol*sun + amb*(1.9 + 1.1*white));   // the churn and the wakes white, the far lace pale
        float fa = clamp(max(lace + fleck + boil*0.8 + edge, wk*0.85), 0.0, 1.0)*(1.0 - eye)*(1.0 - 0.85*mat);
        c = mix(c, foamC, fa);
        c += uHemiSky*0.3183*0.18*rings*rings*(1.0 - fa)*(1.0 - mat);          // ripple rings carry a little sky
        float g = exp(-r*r/50.0)*0.42 + exp(-r*r/120.0)*0.1;                    // the ring's light on the water: a pool of cream two rings wide
        c += uGlow*g*(0.7 + 0.3*n2);
        gl_FragColor = vec4(c, alpha);
        #include <fog_fragment>
      }`,
  });
}

// The stream in spate: a ribbon along the bed whose surface is shaped, not flat. The bed breaks the flow at ledges set
// 8 to 18 m apart, no two alike. At each the pool above stands level and the water drops: through a gap in the ledge it
// slides in a clean dark tongue with two lines of broken water down its shoulders, and stands up below in a train of
// waves, the first of them breaking white; along the rest of the ledge it pours over white into a boil. Foam torn from
// the boil rides down the next pool in rafts no longer than a stride. Dark tea body; each wave is a trough of tea and a
// back that mirrors the cold sky. The mesh carries the same shape, so the waves stand above the water under the lens.
const GLSL_STREAM = /* glsl */`
  float mgLh(float n){ vec2 p = fract(vec2(n, n + 3.7)*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
  float mgLedgeS(float s, float lat){
    float ls = s + lat*0.3*sin(s*0.083 + 1.0) + 0.6*sin(lat*0.9 + s*0.05) + 1.5*sin(lat*0.43 + 2.6*sin(s*0.017)) + 0.45*sin(lat*2.1 + s*0.3);
    return ls + 6.0*sin(ls*0.031) + 3.2*sin(ls*0.071 + 1.7);                 // the spacing wanders: no two reaches the same length
  }
  // metres the surface stands above the mean plane of the falling water. o = (metres below the ledge, how far inside the
  // tongue 0..1, the strength of this ledge 0.5..1.1, the height of the wave train here -1..1)
  float mgSurf(float s, float lat, float k, float tm, out vec4 o){
    float q = mgLedgeS(s, lat)/11.0, lid = floor(q), p = q - lid, tt = p*11.0;
    float amp = 0.5 + 0.6*mgLh(lid);
    float gc = (mgLh(lid + 0.37) - 0.5)*6.0, gw = 1.5 + 2.2*mgLh(lid + 0.71), dl = abs(lat - gc);
    float tong = 1.0 - smoothstep(gw*0.55, gw*1.5, dl);
    float fall = p - smoothstep(0.0, 0.1, p) + 0.35;                          // the pool stands level; the ledge drops it
    float env = exp(-tt*0.2)*smoothstep(0.0, 0.9, tt)*(1.0 - smoothstep(0.72, 0.98, p));
    float tr = sin(tt*1.9 - 2.2 - 0.3*dl + 0.5*sin(lat*0.8 + lid*4.0))*env;
    float A = (0.09 + 0.37*tong)*(1.0 + 0.1*sin(tm*1.7 + lid*2.4));
    o = vec4(tt, tong, amp, tr);
    return (0.34*fall + A*tr)*amp*k;
  }
`;
function streamMaterial(S, C) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uMgPatch: S.uPatch, uMgPatch2: S.uPatch2, uSunCol: S.uSunCol, uSunDir: S.uSunDir, uHemiSky: S.uHemiSky, uHemiGround: S.uHemiGround, tMgShade: S.tShade, uMgShBox: S.uShBox, uMgShSun: S.uShSun, uMgShK: S.uShK, uMgBar: S.uBar, uMgEdge: S.uEdge,
      uSkyZ: { value: C.skyZ }, uSkyH: { value: C.skyH }, uWallC: { value: C.wall }, uLeafA: { value: C.leafA }, uLeafB: { value: C.leafB }, uBirch: { value: C.birch }, uMapleC: { value: C.maple }, uDeep: { value: C.deep }, uBedC: { value: C.bed },
      uFoam: { value: C.foam }, uShade: { value: C.shade }, uRamp: { value: S.ramp }, uLeafDens: { value: C.leafDens }, uFloorS: { value: C.floor }, uLaneK: { value: C.laneK }, uSheenS: { value: C.sheenK }, uCrestK: { value: C.crestK }, uWhiteK: { value: C.whiteK }, uFloorR: { value: C.floorR }, uCoolS: { value: C.cool } },
    vertexShader: /* glsl */`
      attribute vec4 aS;       // metres from the centre line, metres along, drop per metre, half width of the water
      attribute float aD;      // metres of water over the bed here (under zero: dry bank)
      uniform float uTime;
      varying vec4 vS; varying vec3 vWp; varying float vK, vD;
      ${GLSL_STREAM}
      #include <fog_pars_vertex>
      void main(){
        vS = aS; vD = aD;
        vK = clamp(aS.z/0.064, 0.15, 1.7)*(1.0 - smoothstep(-16.0, 3.0, position.x))*smoothstep(0.0, 0.9, aD);
        vec4 wo;
        vec3 p = position; p.y += mgSurf(aS.y, aS.x, vK, uTime, wo);
        vec4 w = modelMatrix*vec4(p, 1.0); vWp = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uFoam, uShade, uLeafDens, uLaneK, uSheenS, uCrestK, uWhiteK; uniform vec4 uMgBar;
      uniform vec3 uSunCol, uSunDir, uHemiSky, uHemiGround, uSkyZ, uSkyH, uWallC, uLeafA, uLeafB, uBirch, uMapleC, uDeep, uBedC, uRamp[4], uFloorS, uFloorR, uCoolS;
      varying vec4 vS; varying vec3 vWp; varying float vK, vD;
      ${GLSL_PATCH}
      ${GLSL_SHADE}
      ${GLSL_EDGE}
      ${GLSL_WHASH}
      ${GLSL_STREAM}
      ${GLSL_LEAF}
      #include <fog_pars_fragment>
      vec3 wNoiseD(vec2 p){                                                     // value noise and its gradient
        vec2 i = floor(p), f = fract(p), u = f*f*f*(f*(f*6.0 - 15.0) + 10.0), du = 30.0*f*f*(f - 1.0)*(f - 1.0);   // quintic: the slope has no creases at the lattice
        float a = wHash(i), b = wHash(i + vec2(1., 0.)), c = wHash(i + vec2(0., 1.)), d = wHash(i + vec2(1., 1.)), k = a - b - c + d;
        return vec3(a + (b - a)*u.x + (c - a)*u.y + k*u.x*u.y, du*vec2((b - a) + k*u.y, (c - a) + k*u.x));
      }
      vec3 mgCobble(vec2 p){                                                    // the stone here (its id), and how far in from its edge
        vec2 i = floor(p), f = fract(p), id = i; float d1 = 8.0, d2 = 8.0;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec2 o = vec2(float(x), float(y)), cc = i + o;
          vec2 r = o + 0.12 + 0.76*vec2(wHash(cc), wHash(cc + 31.7)) - f; float dd = dot(r, r);
          if (dd < d1) { d2 = d1; d1 = dd; id = cc; } else if (dd < d2) { d2 = dd; }
        }
        return vec3(id, sqrt(d2) - sqrt(d1));
      }
      // a fallen leaf riding the water in this cell: (which colour, its shade, how much of the pixel it covers)
      vec3 mgRider(vec2 q, float dens, float pl, float spin){
        vec2 id = floor(q), f = fract(q) - 0.5; float h = wHash(id), h2 = wHash(id + 17.3);
        if (fract(h*5.3) > dens) return vec3(h2, h, 0.0);
        vec2 g = f - (vec2(h2, fract(h2*7.13)) - 0.5)*0.42;
        float a = h*6.283 + spin*(h2 - 0.5), ca = cos(a), sa = sin(a), sz = 0.16 + 0.06*fract(h*11.3);
        g = vec2(g.x*ca + g.y*sa, -g.x*sa + g.y*ca)/sz;
        float w = pl/sz;                                                        // a pixel, in the leaf's own measure
        float dl = mix(mgLeaf(g), 0.8 - length(g), smoothstep(0.25, 0.7, w));
        return vec3(h2, h, smoothstep(-0.5*w, 0.5*w, dl)*(1.0 - smoothstep(0.9, 2.2, w)));
      }
      void main(){
        float hw = vS.w, lat = clamp(vS.x, -(hw + 3.1), hw + 3.1), s = vS.y, slope = vS.z, t = uTime, k = vK;   // (lat: clamped to the ribbon's own half width, hw + 3.1 m)
        // ----- the shape of the surface in this reach: the drop at the ledge, the tongue through its gap, the waves below
        const float e = 0.3;
        vec4 wi, wj;
        float h0 = mgSurf(s, lat, k, t, wi), hs = mgSurf(s + e, lat, k, t, wj), hl = mgSurf(s, lat + e, k, t, wj);
        float tt = wi.x, tong = wi.y, lamp = wi.z, trn = wi.w, p = tt/11.0;
        // the water laps in and out along the bank
        // (and its edge wanders in scallops, the same the land's wet band follows: most along the gravel bar, on our left)
        float barX = mgBarX(vWp.x, uMgBar), barK = barX*smoothstep(0.5, -1.5, lat);
        float depth = vD + (0.05*sin(t*1.3 + s*0.9) + 0.04*sin(t*2.1 - s*1.7 + lat*0.8) + uMgEdge.w*mgEdge(vWp.xz)*mix(0.5, 1.0, barX))*(1.0 - smoothstep(0.0, 0.5, vD));
        float aEdge = smoothstep(0.0, 0.08, depth);
        if (aEdge <= 0.0) discard;
        float px = fwidth(s) + fwidth(lat);                                      // metres of water under one pixel
        float o1 = 1.0 - smoothstep(0.3, 1.0, px), o2 = 1.0 - smoothstep(0.12, 0.42, px), o3 = 1.0 - smoothstep(0.05, 0.17, px), mid = 1.0 - smoothstep(1.5, 5.0, px);
        float steep = smoothstep(0.03, 0.15, slope);
        float lid = floor(mgLedgeS(s, lat)/11.0);
        // the steep reach at the head of the gorge is cascades (casc): every ledge a white chute, dark tea in the pool below
        float casc = steep*smoothstep(1.05, 1.5, k), run = 1.0 - casc;
        float wk = smoothstep(0.15, 0.75, k);
        float chute = 1.0 - smoothstep(0.17, 0.4 + 0.08*wNoise(vec2(lat*0.6, lid*5.1)), p);
        float gapc = (mgLh(lid + 0.37) - 0.5)*6.0, gapw = 1.5 + 2.2*mgLh(lid + 0.71), dl = abs(lat - gapc);
        float tongue = mix(tong, max(smoothstep(0.45, 0.75, wNoise(vec2(lat*0.33 + lid*7.3, lid*3.1))), tong), casc);
        float brk = (1.0 - 0.88*tongue)*mix(1.0, 0.12 + 0.88*smoothstep(0.34, 0.58, wNoise(vec2(lat*0.62 + lid*3.7, lid*1.9 + 4.0))), run);   // where the ledge breaks the water white: in lengths, with dark slides between
        float lipG = smoothstep(0.84, 0.97, p);                                  // the slick that slides to the next drop
        float riffle = clamp((1.0 - smoothstep(0.05, 0.6, p))*lamp*(1.0 - 0.6*tongue) + 0.5*steep*mix(1.0, chute, casc), 0.0, 1.0)*(0.35 + 0.65*wk);
        // ----- the normal: the waves the mesh carries, then three sizes of ripple carried on the flow
        float rough = (0.3 + 0.7*riffle)*(1.0 - 0.6*lipG);
        vec3 r1 = wNoiseD(vec2((s - t*1.3)*0.85 + lat*0.2, lat*0.55));
        vec3 r2 = wNoiseD(vec2((s - t*2.4)*2.2 - lat*0.5, lat*1.8) + 7.0);
        vec3 r3 = wNoiseD(vec2((s - t*3.6)*5.6 + lat*1.3, lat*4.9) + 19.0);
        vec2 gW = clamp(vec2(hs - h0, hl - h0)/e, -1.3, 1.3)*mix(0.3, 1.0, mid);
        vec2 g = gW;
        g += vec2(r1.y*0.85, r1.y*0.2 + r1.z*0.55)*(0.05*o1*rough);
        g += vec2(r2.y*2.2, -r2.y*0.5 + r2.z*1.8)*(0.05*o2*rough);
        g += vec2(r3.y*5.6, r3.y*1.3 + r3.z*4.9)*(0.019*o3*(0.4 + 0.6*rough));
        vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
        vec3 V = normalize(cameraPosition - vWp);
        float ndv = clamp(dot(n, V), 0.0, 1.0);
        float F = 0.07 + 0.93*pow(1.0 - ndv, 5.0);
        // ----- the mirror. Down the gorge the reflected ray finds the open sky: a bright lane along the middle of the stream.
        // To either side it finds the trees on the banks (crowns in leaf colours over pale trunks and the dark bank), and at
        // the far end of the straight, low on the axis, the great maple.
        vec3 R = reflect(-V, n); R.y = abs(R.y) + 0.015;
        float rh = max(length(R.xz), 1e-3), ry = R.y/rh; vec2 hd = R.xz/rh;
        float sideZ = hd.y > 0.0 ? 1.0 : -1.0;
        float tb = (12.5 - sideZ*lat)/max(abs(hd.y), 0.02);                       // metres to the bank along the ray's heading
        float bx = vWp.x + hd.x*tb, by = ry*tb;                                  // where it arrives: along the bank, above the water
        float top = (10.0 + 7.0*wNoise(vec2(bx*0.12, sideZ*3.0)))*mix(0.45, 1.0, smoothstep(0.25, 0.5, wNoise(vec2(bx*0.045, sideZ*7.0 + 2.0))));
        vec3 crown = mix(uWallC*0.5, mix(uLeafA, uLeafB, smoothstep(0.3, 0.7, wNoise(vec2(bx*0.21, by*0.25 + sideZ*5.0)))), 0.74)*(0.4 + 0.85*wNoise(vec2(bx*0.55, by*0.7)))*(sideZ > 0.0 ? 0.8 : 1.1);
        float trunk = smoothstep(0.8, 0.88, wNoise(vec2(bx*1.4, sideZ*9.0)));
        vec3 bank = mix(uWallC*(0.22 + 0.2*wNoise(vec2(bx*0.3, sideZ*4.0))), uBirch, trunk*0.6);   // the shaded foot of the bank: dark in the water, pale trunks drawn down through it
        vec3 trees = mix(bank, crown, smoothstep(3.0, 7.5, by));
        vec3 sky = mix(mix(uSkyH, uSkyZ, smoothstep(0.0, 0.9, ry)), uCoolS, 0.55);     // the open sky in dark water: this look's own slate-blue
        // straight overhead the crowns of the bank trees close over most of the sky: the water under the lens mirrors leaf
        // and shadow with gaps of sky between (the ray is followed up to the height of the crowns: each face finds its own)
        vec2 hp = vWp.xz + R.xz*(13.0/max(R.y, 0.07));
        float cano = smoothstep(0.34, 0.5, wNoise(hp*vec2(0.035, 0.09) + 5.0)*0.6 + wNoise(hp*vec2(0.09, 0.23))*0.4)*(1.0 - smoothstep(0.035, 0.13, px));
        sky = mix(sky, mix(uLeafA, uLeafB, wNoise(hp*vec2(0.05, 0.13) + 1.0))*(0.3 + 0.5*wNoise(hp*vec2(0.16, 0.4) + 9.0)), cano*0.9);
        vec3 refl = mix(trees, sky, smoothstep(top*0.55, top*1.25, by));
        float mapleK = (1.0 - smoothstep(0.03, 0.16, abs(hd.y)))*step(0.0, hd.x)*smoothstep(0.015, 0.05, ry)*(1.0 - smoothstep(0.1, 0.24, ry))*(1.0 - smoothstep(-60.0, -15.0, vWp.x));
        refl = mix(refl, uMapleC, mapleK*0.8);
        // (the bank trees' shade lies across the water too: foam and riding leaves are lit in the gaps and slate-blue in it)
        float pch = mgSunShade(mgPatchAt(vWp.xz)*uShade, vWp, 28.0), sunY = max(uSunDir.y, 0.0);
        vec3 amb = mix(uHemiGround, uHemiSky, 0.85);
        vec3 ambW = mix(amb, vec3(dot(amb, vec3(0.3333))), 0.6);
        // ----- under the surface: tea-brown water over a cobbled bed. Dark tea wherever there is half a metre of it; only
        // along the very margin, where the bed shelves up to the stones of the bank, a ragged amber shallow with the cobbles
        // dim under it. The channel's tone is worked out in build() to show as luma 25 under this look's grade: never black.
        float dv = max(depth + 0.3*(wNoise(vec2(s*0.3, lat*0.6)) - 0.5), 0.0);
        vec3 cb = mgCobble(vWp.xz*2.7 + n.xz*(0.5 + dv));
        float stone = (0.78 + 0.44*wHash(cb.xy + 3.3))*(0.84 + 0.16*smoothstep(0.0, 0.25, cb.z));
        // the bar shelves into the stream under a hand of water: there the bed is the bar's own pale cobbles, each stone
        // and the dark seam round it showing amber through the tea
        float shelf = barK*(1.0 - smoothstep(0.2, 0.6, depth));
        stone += shelf*((stone - 1.0)*0.6 - 0.22*(1.0 - smoothstep(0.0, 0.16, cb.z)));
        vec3 bed = uBedC*mix(1.0, stone, o2)*(0.42 + 0.3*wNoise(vWp.xz*0.4))*(1.0 + 0.8*shelf);
        vec3 tea = exp(-vec3(1.3, 1.8, 2.6)*dv*2.3);                             // what the water lets back up: amber over the first hand of depth, then nothing
        vec3 body = (bed*tea + uDeep*(1.0 - tea.r))*0.3183*(uSunCol*(sunY*pch*0.8) + ambW*2.6);
        body = max(body, mix(uFloorS, uFloorR, run)*(0.85 + 0.3*wNoise(vec2((s - t*1.1)*0.11, lat*0.5) + 13.0)));   // the channel: dark tea, the palette's own dark, never caramel
        body += uFloorS*vec3(1.5, 0.85, 0.3)*(0.8*lipG*lamp*(1.0 - 0.5*tongue)*run*wk);   // sliding thin over the ledge the tea is lit through: amber
        refl = max(refl, uFloorR*(1.05*run));                                             // the shaded bank in the water is dark tea, not a black bar
        float Fm = clamp(F, 0.0, 1.0)*(1.0 - 0.72*casc)*(1.0 - 0.7*run);                           // fast broken water is no mirror: the cascades are tea and white, not a sheet of sky
        vec3 c = mix(body, refl, Fm);
        // each standing wave: a trough of dark tea on the face that leans toward us, the cold sky on the back that leans away
        vec2 Vh = V.xz/max(length(V.xz), 1e-3);
        float away = dot(gW, Vh);
        float back = smoothstep(0.03, 0.42, away), face = smoothstep(0.03, 0.42, -away);
        c *= 1.0 - 0.3*face*run;
        c += uCoolS*(uCrestK*0.7*back*run*(0.45 + 0.55*smoothstep(0.3, 0.7, r2.x)));
        // down the middle of the channel the slack water mirrors the open sky between the two walls of trees: not a sheet but
        // the ripple faces that are tilted to it, wandering from side to side with the current
        float laneC = hw*0.3*sin(s*0.045 + 1.0), laneW = hw*(0.25 + 0.08*sin(s*0.021));
        float skyLane = exp(-(lat - laneC)*(lat - laneC)/(laneW*laneW));
        float facet = smoothstep(0.34, 0.68, r1.x*0.55 + r2.x*0.45);
        float laneAmt = mix(mix(0.6, 0.22 + 0.78*facet, o2), 0.7*mix(0.32, 0.04 + 0.96*facet, o2), run);
        c += uCoolS*(uLaneK*skyLane*laneAmt*(1.0 - clamp(F*1.6, 0.0, 1.0))*(1.0 - 0.6*riffle)*(1.0 - 0.6*casc));
        // the low sun down the gorge is a path of sparks on the ripple faces that find it, not a pale sheet laid over the water
        float sunR = max(dot(R, uSunDir), 0.0);
        float spark = smoothstep(0.58, 0.8, r3.x)*smoothstep(0.35, 0.65, r2.x);
        c += min(uSunCol*pch*(0.9*pow(sunR, 900.0) + pow(sunR, 110.0)*mix(0.07, 1.3*spark, o3)), vec3(0.8));      // (capped: at dawn the sun down the gorge blew a white flare 80 px across)
        // small glints where a steep ripple finds the brightest of the sky
        float gl = smoothstep(0.62, 0.9, r3.x)*smoothstep(0.5, 0.8, r2.x)*o3;
        c += uSkyH*(0.55*gl*(0.3 + 0.7*rough));
        // and soft patches of sky sheen, so the dark water between the leaves is never one flat tone
        float sheen = smoothstep(0.4, 0.85, wNoise(vec2((s - t*2.0)*0.45 + lat*0.7, lat*1.9 - s*0.17) + 33.0)*0.6 + r2.x*0.4)*o2;
        c += uCoolS*(uSheenS*sheen*(0.4 + 0.6*rough)*(1.0 - 0.5*lipG));
        // between the white the deep water is dark and cool: what it mirrors of the banks' leaves is drawn most of the way to
        // the sky's slate (the amber of the margin and of the thin slide over a ledge is left as it is)
        { const vec3 LW = vec3(0.2126, 0.7152, 0.0722);
          float lc = dot(c, LW), lf = max(dot(uFloorR, LW), 1e-4), ls = max(dot(uCoolS, LW), 1e-4);
          vec3 hue = mix(uFloorR/lf, uCoolS/ls, smoothstep(lf*1.3, lf*5.0, lc));         // the palette's dark in the troughs, its cool on the lit backs
          c = mix(c, hue*lc, 0.72*run*smoothstep(0.2, 0.7, dv)*(1.0 - 0.8*lipG*lamp)); }
        // ----- fallen leaves riding the water, gathered into lanes and rafts by the current (none in the tongues and the white
        // water: they are swept through); far off, their colour
        float cellA = 0.95, cellB = 0.74;
        vec2 qa = vec2(s - t*2.5, lat + 0.5*sin(s*0.11))/cellA, qb = vec2(s - t*3.2 + 40.0, lat*0.97 + 0.4*sin(s*0.07 + 2.0) + 13.0)/cellB;
        float lane = smoothstep(0.38, 0.66, wNoise(vec2((s - t*2.5)*0.045, lat*0.42) + 3.0))*0.7 + smoothstep(0.5, 0.8, wNoise(vec2((s - t*3.2)*0.11, lat*1.1) + 9.0))*0.5 + 0.35*(1.0 - smoothstep(0.1, 0.7, depth));
        float dens = clamp((0.04 + 0.62*lane)*uLeafDens*mix(1.0, 0.6, run), 0.0, 0.9)*(1.0 - 0.75*riffle)*(1.0 - 0.85*run*tong*(1.0 - smoothstep(5.0, 9.0, tt)));
        vec3 la = mgRider(qa, dens, px/cellA, t*0.5), lb = mgRider(qb, dens*0.8, px/cellB, -t*0.4);
        vec3 leafLight = 0.3183*(uSunCol*(sunY*pch*0.8) + ambW*1.9);              // embers on the dark water
        vec3 lca = uRamp[int(min(la.x*4.0, 3.0))]*(0.55 + 0.6*la.y)*leafLight, lcb = uRamp[int(min(lb.x*4.0, 3.0))]*(0.55 + 0.6*lb.y)*leafLight;
        float farL = smoothstep(0.35, 0.8, px);
        vec3 leafMean = (uRamp[0] + uRamp[1] + uRamp[2] + uRamp[3])*0.21*leafLight;
        // ----- white water, only where something makes it. Foam is froth: a soft-edged patch (where it lies) times a fine
        // broken texture of bubbles carried on the flow; nothing of it is drawn out along the flow longer than a stride.
        float sf = s - t*4.2;
        float frothN = wNoise(vec2(sf*2.4 + lat*1.3, lat*5.4 - sf*0.6) + 51.0)*0.55 + wNoise(vec2(sf*5.8 - lat*2.9 + 3.0, lat*12.5 + sf*1.4))*0.45;
        float froth = mix(0.7, smoothstep(0.2, 0.7, frothN), 0.5*o2);
        float patchN = wNoise(vec2(sf*0.33 + lat*0.45, lat*1.3 - sf*0.09) + 9.0)*0.6 + wNoise(vec2(sf*0.9 - lat*0.8 + 5.0, lat*3.1 + sf*0.2))*0.4;
        float str = wNoise(vec2(sf*0.5, lat*4.4))*0.5 + frothN*0.5;
        float str2 = wNoise(vec2(sf*0.6, lat*5.5) + 3.0)*0.6 + wNoise(vec2(sf*1.7, lat*13.0) + 8.0)*0.4;
        float blobN = wNoise(vec2(sf*0.55 + lat*0.2, lat*0.95) + 23.0)*0.6 + wNoise(vec2(sf*1.4 - lat*0.5, lat*2.3) + 5.0)*0.4;   // rafts: two to one along the flow
        float curtain = (1.0 - smoothstep(0.008, 0.028, p))*(1.0 - 0.92*tongue)*mix(1.0, brk, run)*smoothstep(0.5, 0.8, lamp + 0.3*steep)*(0.55 + 0.45*froth);
        // the cascades: a white chute three or four metres long under every ledge, threads of foam on the dark pool below it
        float fall = 1.0 - smoothstep(0.04, 0.2 + 0.65*steep*(1.0 - 0.7*casc), p);
        float th = mix(0.3, 0.72, smoothstep(0.02, 0.2 + 0.5*steep, p)) + 0.28*tongue - 0.14*steep - 0.06*uFoam + 0.2*(0.8 - lamp);
        float apron = fall*smoothstep(th - 0.05, th + 0.2, mix(patchN, str2, 0.65))*(0.4 + 0.6*froth);
        float rapids = max(chute*smoothstep(0.22, 0.5, mix(patchN, str2, 0.6*o1))*(1.0 - 0.75*tongue)*(0.5 + 0.5*froth),
                           (1.0 - chute)*0.55*smoothstep(0.66, 0.82, str2*0.7 + patchN*0.3)*froth);
        float crestC = smoothstep(0.12, 0.3, trn)*exp(-tt*0.15)*smoothstep(0.42, 0.7, patchN)*(1.0 - 0.6*tongue)*lamp*(0.2 + 0.8*froth)*0.8;
        float foamC = max(max(max(curtain, apron), crestC), rapids);
        // the run: the boil in the hole under each breaking ledge; white caps on the waves that stand below the tongue (the
        // first always breaks, the second where the ledge is a big one); the V of broken water down the tongue's two
        // shoulders; and the foam torn from all of these, riding down the pool in rafts and flecks that thin as they go
        float boil = smoothstep(0.1, 0.5, tt)*(1.0 - smoothstep(1.0 + 1.8*lamp*patchN, 2.0 + 3.0*lamp*patchN, tt))*brk*smoothstep(0.5, 0.8, lamp + 0.25*patchN)*(0.5 + 0.5*froth);
        float cap = smoothstep(0.36 - 0.12*lamp, 0.6, trn + 0.2*(blobN - 0.5))*smoothstep(0.15, 0.6, tong)*smoothstep(0.5, 0.75, lamp + 0.3*patchN);
        float vW = gapw*(1.05 - 0.2*tt);
        float vee = exp(-(dl - vW)*(dl - vW)/0.14)*smoothstep(0.0, 0.4, tt)*(1.0 - smoothstep(2.8, 4.6, tt))*smoothstep(0.3, 0.6, lamp)*(0.35 + 0.65*smoothstep(0.3, 0.6, blobN));
        float shed = clamp((0.2 + 0.8*brk + 0.6*tong*smoothstep(1.5, 2.6, tt))*lamp*exp(-max(tt - 2.0, 0.0)*0.28)*smoothstep(0.5, 2.0, tt), 0.0, 1.0);
        float raft = smoothstep(0.8 - 0.3*shed, 0.93 - 0.27*shed, blobN)*smoothstep(0.05, 0.3, shed)*(0.45 + 0.55*froth);
        float foamR = max(max(curtain, boil), max(max(cap, vee), raft*0.9));
        float thread = smoothstep(0.78, 0.86, wNoise(vec2((s - t*3.4)*mix(0.2, 0.62, run), lat*2.4) + 21.0)*0.8 + 0.2*str)*(0.2 + 0.3*uFoam)*(1.0 - 0.5*lipG)*(0.35 + 0.65*froth)*mix(1.0, 0.7, run);
        float bub = smoothstep(0.66, 0.74, frothN)*smoothstep(0.45, 0.7, patchN)*o3*riffle*0.6;
        float lace = (1.0 - smoothstep(0.03, 0.3, depth))*smoothstep(0.45, 0.68, wNoise(vec2(s*0.8 - t*0.5, lat*1.7)))*(0.25 + 0.75*froth)*0.7;   // a broken line of froth where it laps the stones
        float brink = smoothstep(-9.0, 9.0, vWp.x)*smoothstep(0.4, 0.62, patchN)*(0.3 + 0.7*froth)*0.85;      // drawn white as it gathers speed for the lip
        // BESIDE THE GRAVEL BAR the stream runs wide and thin over the bar's own cobbles: a riffle. Short white dashes
        // across the flow where it breaks over the stones of the shelf and, thinner, out across the run beside the bar;
        // and along the scalloped edge the lines of froth the lapping leaves behind it (eased away where they fall under
        // a pixel and a half)
        float rifN = wNoise(vec2(sf*0.8 + lat*0.6, lat*2.4) + 61.0)*0.55 + wNoise(vec2(sf*2.1 - lat*1.2, lat*5.5) + 17.0)*0.45;
        float rif = smoothstep(0.5, 0.7, rifN)*(0.4 + 0.6*froth)*max(shelf*smoothstep(0.03, 0.12, depth), 0.55*barX*smoothstep(0.36, 0.6, patchN)*(1.0 - 0.7*tongue));
        float lapL = mix(0.6, 0.5 + 0.5*sin(depth*110.0 - t*1.4 + 3.0*wNoise(vWp.xz*0.9)), 1.0 - smoothstep(0.1, 0.32, px));
        float laceB = barK*smoothstep(0.004, 0.02, depth)*(1.0 - smoothstep(0.05, 0.12, depth))*smoothstep(0.3, 0.6, wNoise(vec2(s*1.1 - t*0.4, lat*2.3) + 7.0))*lapL*(0.45 + 0.55*froth);
        float foam = clamp(mix(foamR, foamC, casc)*wk + max(max(max(max(thread, lace), brink), bub*wk), max(rif, laceB)), 0.0, 1.0);
        // seen close, foam is a lace: white strands round dark holes of water; the holes close where it lies thick, and only
        // single strands are left where it thins. Two sizes of cell, both carried downstream.
        vec2 fq = vec2(sf*1.5 + lat*0.4, lat*3.4 - sf*0.25) + 0.7*vec2(r2.x, r1.x);
        vec3 fa = mgCobble(fq), fb = mgCobble(fq*2.7 + 11.0);
        float pw = px*3.4, cv = smoothstep(0.24, 0.85, foam), w1 = 0.04 + 0.4*cv, w2 = 0.34*cv*cv;
        float strand = max(1.0 - smoothstep(w1 - 0.07 - pw, w1 + 0.07 + pw, fa.z),
                           (1.0 - smoothstep(w2 - 0.1 - pw*2.7, w2 + 0.1 + pw*2.7, fb.z))*0.8*smoothstep(0.3, 0.6, cv))*smoothstep(0.0, 0.2, cv);
        foam = mix(foam*0.62, max(max(strand*(0.55 + 0.45*cv), curtain*wk), 0.85*max(cap, boil)*wk*run*smoothstep(0.5, 0.9, foam)), o2);
        // from far off the white water is what it is in the mean: a bar of white under each ledge and under each tongue in
        // the run, broken patches (most where it is steep) in the cascades
        float farR = lamp*max(0.8*brk*(1.0 - smoothstep(1.2, 3.6, tt)), 0.65*smoothstep(0.2, 0.6, tong)*smoothstep(0.8, 2.0, tt)*(1.0 - smoothstep(2.6, 6.5, tt)))*smoothstep(0.15, 0.5, patchN + 0.2);
        float farW = mix(0.1 + 0.62*steep, 0.07 + 0.8*chute*(1.0 - 0.6*tongue), casc);     // seen from above the cascades are steps of white on dark water
        float farC = clamp(farW*wk*smoothstep(0.4, 0.62, patchN + 0.2*steep)*1.4 + max(thread, brink)*0.6, 0.0, 1.0);
        foam = mix(foam, mix(clamp(farR*wk + max(thread, brink)*0.5 + 0.3*barX*smoothstep(0.42, 0.62, patchN), 0.0, 1.0), farC, casc), smoothstep(0.9, 2.4, px));
        foam = mix((0.06 + 0.1*steep*(1.0 - 0.4*casc))*wk, foam, mid);            // farther still: its mean
        float leafA = max(la.z, lb.z)*(1.0 - farL)*(1.0 - foam);
        c = mix(c, mix(lca, lcb, step(la.z, lb.z)), leafA);
        c = mix(c, leafMean, farL*dens*0.2*mid*(1.0 - foam));
        vec3 fc = vec3(0.72, 0.75, 0.77)*0.3183*(uSunCol*sunY*pch + mix(amb, ambW, 0.5)*uWhiteK)*(0.8 + 0.34*frothN)*(0.72 + 0.5*mix(blobN, str2, casc));
        c = mix(c, fc, foam);
        float alpha = aEdge*mix(mix(0.42 + 0.3*shelf, 0.97, smoothstep(0.05, 0.9, depth)), 1.0, max(foam, max(leafA, clamp(F*1.6, 0.0, 1.0))));
        gl_FragColor = vec4(c, alpha);
        #include <fog_fragment>
      }`,
  });
}

// The brook that comes down the side ravine: white where it drops, dark tea with drifting foam where it rests in a pool.
function cascadeMaterial(S, shade, floor) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uMgPatch: S.uPatch, uMgPatch2: S.uPatch2, uSunCol: S.uSunCol, uSunDir: S.uSunDir, uHemiSky: S.uHemiSky, uHemiGround: S.uHemiGround, uShade: { value: shade }, uFloorS: { value: floor } },
    vertexShader: /* glsl */`
      attribute vec3 aC;      // across (-1..1), metres along from the mouth, the fall of the bed here (0 level .. 1 sheer)
      varying vec3 vC; varying vec2 vW;
      #include <fog_pars_vertex>
      void main(){ vC = aC; vW = position.xz; vec4 mvPosition = viewMatrix*vec4(position, 1.0); gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uShade; uniform vec3 uSunCol, uSunDir, uHemiSky, uHemiGround, uFloorS;
      varying vec3 vC; varying vec2 vW;
      ${GLSL_PATCH}
      ${GLSL_WHASH}
      #include <fog_pars_fragment>
      void main(){
        float a = vC.x, steep = smoothstep(0.18, 0.7, vC.z), px = fwidth(vC.y);
        float run = vC.y*mix(0.9, 0.35, steep) + uTime*mix(1.3, 2.6, steep);            // the pattern runs down toward the mouth
        float n1 = wNoise(vec2(a*2.6, run)), n2 = wNoise(vec2(a*7.0 + 3.0, run*2.4)), nn = mix(0.5, n1*0.6 + n2*0.4, 1.0 - smoothstep(0.6, 2.5, px));
        float white = mix(smoothstep(0.58, 0.74, nn)*0.8, smoothstep(0.22, 0.5, nn), steep);
        float edge = 1.0 - smoothstep(0.62, 1.0, abs(a) + 0.25*(n1 - 0.5));
        vec3 amb = mix(uHemiGround, uHemiSky, 0.85);
        float sun = max(uSunDir.y, 0.0)*mgPatchAt(vW)*uShade;
        vec3 fc = vec3(0.76, 0.79, 0.8)*0.3183*(uSunCol*sun + amb*1.7)*(0.72 + 0.4*n2);
        vec3 tea = max(vec3(0.035, 0.03, 0.026), uFloorS) + uHemiSky*0.3183*0.1;
        gl_FragColor = vec4(mix(tea, fc, white), edge*mix(0.8, 1.0, white));
        #include <fog_fragment>
      }`,
  });
}

// The water at each boulder in the stream: a pillow of dark glassy water piled against its upstream face, breaking white
// in a torn band where it meets the rock; torn water round its two shoulders; a dark hole behind it; and two arms of
// standing crests trailing from the shoulders in a V. A small mesh of its own lies round every boulder (positions in
// boulder radii, +x downstream) and is lifted into that shape here. Where it is not lifted it is clear and the stream
// shows through: no ring of white round the stone.
const GLSL_COLLAR = /* glsl */`
  float mgCollar(vec2 q0, float seed, float tm, out vec4 o){
    vec2 q = clamp(q0, vec2(-1.95, -3.5), vec2(6.35, 3.5));          // (the collar's own extent, in boulder radii: its rings reach 1.95, its tail 6.35 long and 3.5 to a side)
    float rho = length(q) + 1e-3, up = smoothstep(-0.25, 0.55, -q.x/rho);
    float d = (rho - 1.06)/0.27, pil = exp(-d*d)*up*(1.0 + 0.12*sin(tm*2.3 + seed*30.0));
    float xd = max(q.x, 0.0), ac = abs(q.y) - (0.95 + 0.42*xd);
    float arm = exp(-ac*ac/(0.05 + 0.02*xd))*smoothstep(-0.3, 0.6, q.x)*(1.0 - smoothstep(3.0, 6.0, q.x))*(0.55 + 0.45*cos((q.x - 0.6)*2.6 + seed*6.0));
    float hole = exp(-((q.x - 1.5)*(q.x - 1.5) + q.y*q.y*1.6)/0.5);
    o = vec4(pil, arm, hole, up);
    return 0.36*pil + 0.13*arm - 0.16*hole;
  }
`;
function collarGeometry() {
  const pos = [], idx = [], rings = [0.8, 1.0, 1.2, 1.5, 1.95], NA = 14, A0 = 2.2, NX = 9, NZ = 6;
  for (let j = 0; j < rings.length; j++) for (let i = 0; i <= NA; i++) { const a = -A0 + 2 * A0 * i / NA; pos.push(-Math.cos(a) * rings[j], 0, Math.sin(a) * rings[j]); }
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < NA; i++) { const a0 = j * (NA + 1) + i, b0 = a0 + NA + 1; idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
  const base = pos.length / 3;
  for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) { const u = i / NX; pos.push(0.75 + 5.6 * u * (0.55 + 0.45 * u), 0, (j / NZ * 2 - 1) * (1.6 + 1.9 * u)); }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const a0 = base + i * (NZ + 1) + j, b0 = a0 + NZ + 1; idx.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0); }
  return { position: new THREE.Float32BufferAttribute(pos, 3), index: idx };
}
function foamMaterial(S, C) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uMgPatch: S.uPatch, uMgPatch2: S.uPatch2, uSunCol: S.uSunCol, uSunDir: S.uSunDir, uHemiSky: S.uHemiSky, uHemiGround: S.uHemiGround, tMgShade: S.tShade, uMgShBox: S.uShBox, uMgShSun: S.uShSun, uMgShK: S.uShK, 
      uFloorS: { value: C.floor }, uSkyC: { value: C.sky }, uCrestK: { value: C.crestK }, uWhiteK: { value: C.whiteK }, uShade: { value: C.shade } },
    vertexShader: /* glsl */`
      attribute vec4 iF;      // x, y of the water there, z, radius of the boulder
      attribute vec2 iG;      // seed, heading of the flow
      uniform float uTime;
      float mgWy(float x){ if (x >= 0.0) return -1.5; if (x >= -420.0) return -1.5 - x*0.0642857; if (x >= -560.0) { float t = (-420.0 - x)/140.0; return 25.5 + 20.5*(t + 0.04*sin(t*18.85)); } return 46.0 + (-560.0 - x)*0.012; }
      varying vec2 vP, vW, vI;
      ${GLSL_COLLAR}
      #include <fog_pars_vertex>
      void main(){
        vec2 q = position.xz;                                                     // in boulder radii: x downstream
        float ca = cos(iG.y), sa = sin(iG.y);
        vec4 co; float h = mgCollar(q, iG.x, uTime, co);
        vec3 P = iF.xyz + vec3(q.x*ca - q.y*sa, 0.0, q.x*sa + q.y*ca)*iF.w;
        P.y += mgWy(P.x) - mgWy(iF.x) + h*min(iF.w, 2.0);                          // the mesh lies on the falling water, lifted into the pillow and the arms
        vP = q; vW = P.xz; vI = vec2(iG.x, iF.w);
        vec4 mvPosition = viewMatrix*vec4(P, 1.0); gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uCrestK, uWhiteK, uShade; uniform vec3 uSunCol, uSunDir, uHemiSky, uHemiGround, uFloorS, uSkyC;
      varying vec2 vP, vW, vI;
      ${GLSL_PATCH}
      ${GLSL_SHADE}
      ${GLSL_WHASH}
      ${GLSL_COLLAR}
      #include <fog_pars_fragment>
      void main(){
        vec2 q = clamp(vP, vec2(-1.95, -3.5), vec2(6.35, 3.5)); float rho = length(q) + 1e-3, flow = uTime*3.4, seed = vI.x;
        vec4 co; float h = mgCollar(q, seed, uTime, co);
        float pil = co.x, arm = co.y, hole = co.z, up = co.w;
        vec2 m = q*vI.y;
        float n1 = wNoise(vec2(m.x*0.9 - flow, m.y*1.1) + seed*20.0), n2 = wNoise(vec2(m.x*2.5 - flow*1.6, m.y*2.7) + seed*9.0);
        float nn = 0.6*n1 + 0.4*n2, bil = 1.0 - abs(2.0*nn - 1.0);
        float fine = smoothstep(0.36, 0.6, wNoise(vec2(m.x*1.3 - flow*1.8, m.y*7.0) + seed*5.0)*0.6 + n2*0.4);
        // white: the torn band where the pillow breaks on the rock, a broken line at its foot, the tear round each shoulder,
        // the crests of the two arms, the boil where they close
        float brkP = smoothstep(0.84, 0.97, rho)*(1.0 - smoothstep(1.0, 1.1 + 0.24*n1, rho))*up*smoothstep(0.25, 0.6, nn + 0.3*up);
        float df = (rho - 1.44 - 0.14*n1)/0.08;
        float foot = exp(-df*df)*up*smoothstep(0.5, 0.75, n2)*0.6;
        float tear = smoothstep(0.7, 0.95, abs(q.y)/rho)*smoothstep(0.92, 1.02, rho)*(1.0 - smoothstep(1.15, 1.7, rho))*smoothstep(0.38, 0.62, nn);
        float armW = smoothstep(0.45, 0.85, arm + 0.3*nn)*arm*(0.25 + 0.75*fine);
        float xd = max(q.x, 0.0);
        float tail = exp(-q.y*q.y/(0.1 + 0.09*xd))*smoothstep(1.0, 1.8, q.x)*(1.0 - smoothstep(1.9, 3.8, q.x))*0.55*smoothstep(0.3, 0.6, nn)*(0.2 + 0.8*fine);
        float white = clamp(max(max(brkP, foot), max(max(tear, armW), tail)), 0.0, 1.0);
        // water: the glassy hump and the backs of the arms take the cold sky; the hole behind the stone is dark tea
        float body = clamp(max(pil*1.1, max(arm*0.75, hole*0.9)), 0.0, 1.0);
        vec3 amb = mix(uHemiGround, uHemiSky, 0.9);
        vec3 wc = uFloorS*(1.0 - 0.3*hole) + uSkyC*(uCrestK*(0.8*pil*smoothstep(0.95, 1.5, rho) + 0.55*arm)*(0.6 + 0.4*n2));
        vec3 fc = vec3(0.78, 0.8, 0.8)*0.3183*(uSunCol*max(uSunDir.y, 0.0)*mgSunShade(mgPatchAt(vW)*uShade, vec3(vW.x, -1e4, vW.y), 28.0) + amb*uWhiteK)*(0.76 + 0.34*bil);
        float a = max(white*0.95, 0.92*smoothstep(0.1, 0.45, body));
        gl_FragColor = vec4(mix(wc, fc, white), a);
        #include <fog_fragment>
      }`,
  });
}

// ---------- this world's own plant geometry, drawn with the kit's wind material and leaf atlas ----------
// vertex layout of kit/flora.js: position, normal, color (linear), uv (atlas cell), wind = (sway m, flutter, leaf mask, glow)
function floraBuilder() {
  const pos = [], nor = [], colr = [], wnd = [], uvs = [], idx = [];
  return {
    v(p, n, c, sway, fl, leaf, tu = 0.875, tv = 0.75) { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); colr.push(c[0], c[1], c[2]); wnd.push(sway, fl, leaf, 0); uvs.push(tu, tv); return pos.length / 3 - 1; },
    tri(a, b, c) { idx.push(a, b, c); }, quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
    // tapered tube through pts with radii rad; col(t, k) -> [r,g,b]
    tube(pts, rad, sides, col, sway) {
      let prev = null;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        const t = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
        const u = new THREE.Vector3(0.31, 0.12, 0.94).cross(t).normalize(), w = new THREE.Vector3().crossVectors(t, u), ring = [];
        for (let k = 0; k < sides; k++) {
          const an = k / sides * Math.PI * 2, dx = u.x * Math.cos(an) + w.x * Math.sin(an), dy = u.y * Math.cos(an) + w.y * Math.sin(an), dz = u.z * Math.cos(an) + w.z * Math.sin(an);
          ring.push(this.v([pts[i][0] + dx * rad[i], pts[i][1] + dy * rad[i], pts[i][2] + dz * rad[i]], [dx, dy, dz], col(i / (pts.length - 1), k), sway(i / (pts.length - 1)), 0, 0));
        }
        if (prev) for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; this.quad(prev[k], prev[k1], ring[k1], ring[k]); }
        prev = ring;
      }
      return prev;
    },
    build(userData) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setAttribute('wind', new THREE.Float32BufferAttribute(wnd, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      g.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      g.userData = { triangles: idx.length / 3, glowColor: null, ...userData };
      return g;
    },
  };
}


// Leaf cards shingled over each lobe: an outer shell and a darker, looser inner one, so a gap shows more leaves and never a smooth heart.
function quiltLobes(B, rng, cell, lobes, o, C, R, Ry, sw) {
  const arr = (c, k = 1) => [c.r * k, c.g * k, c.b * k], mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rv = new THREE.Vector3(), dv = new THREE.Vector3(), tng = new THREE.Vector3(), ax = new THREE.Vector3(), sd = new THREE.Vector3(), oc = new THREE.Vector3(), nr = new THREE.Vector3();
  for (const L of lobes) {
    const P = rng.pick(o.palettes), lo = arr(P[0]), mid = arr(P[1]), hi = arr(P[2]), tj = rng.range(0.85, 1.15), sway = sw(L.c[1]) + 0.05;
    for (let shell = 0; shell < 2; shell++) {
      const n = shell ? Math.round(o.cards * (o.inner ?? 0.38)) : o.cards, off = rng.range(0, 6.28), rad = shell ? 0.5 : 1, dim = shell ? 0.8 : 1, cover = shell ? 1.8 : 1.42;
      for (let k = 0; k < n; k++) {
        if (!shell && o.thin && rng.chance(o.thin)) continue;
        const yy = 1 - (k + 0.5) / n * cover, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), th = off + k * 2.39996 + rng.range(-0.3, 0.3);
        let d = [Math.cos(th) * rr + rng.range(-0.12, 0.12), yy + rng.range(-0.12, 0.12), Math.sin(th) * rr + rng.range(-0.12, 0.12)]; const dl = Math.hypot(d[0], d[1], d[2]) || 1; d = [d[0] / dl, d[1] / dl, d[2] / dl];
        const rs = rng.range(0.84, 1.02) * rad, p = [L.c[0] + d[0] * L.r[0] * rs, L.c[1] + d[1] * L.r[1] * rs, L.c[2] + d[2] * L.r[0] * rs];
        const sz = o.card * rng.range(0.8, 1.25) * 0.5 * (shell ? 1.2 : 1);
        rv.set(rng() - 0.5, rng() - 0.5, rng() - 0.5); dv.set(d[0], d[1], d[2]);
        tng.crossVectors(dv, rv).normalize();
        ax.set(d[0] * 0.5 + tng.x * 0.8, d[1] * 0.5 + tng.y * 0.8 - 0.2, d[2] * 0.5 + tng.z * 0.8).normalize();
        sd.crossVectors(ax, dv).normalize();
        oc.set(p[0] - C[0], (p[1] - C[1]) * 0.8, p[2] - C[2]); const ol = oc.length() || 1;
        nr.set(d[0] * 0.45 + oc.x / ol * 0.55 + rng.range(-0.22, 0.22), d[1] * 0.45 + oc.y / ol * 0.55 + rng.range(0.0, 0.3), d[2] * 0.45 + oc.z / ol * 0.55 + rng.range(-0.22, 0.22)).normalize();
        const s = clamp(0.5 + 0.55 * (p[1] - C[1]) / Ry, 0, 1), ao = clamp(0.62 + 0.45 * ol / R, 0, 1) * dim;
        const cc = (s < 0.5 ? mix(lo, mid, s * 2) : mix(mid, hi, (s - 0.5) * 2)).map((x) => x * ao * tj * rng.range(0.82, 1.18)), tip = mix(cc, hi.map((x) => x * dim), 0.3), bs = cc.map((x) => x * 0.82);
        const fx = rng.chance(0.5), ua = fx ? cell[2] : cell[0], ub = fx ? cell[0] : cell[2], N = [nr.x, nr.y, nr.z];
        const i0 = B.v([p[0] - ax.x * sz - sd.x * sz, p[1] - ax.y * sz - sd.y * sz, p[2] - ax.z * sz - sd.z * sz], N, bs, sway, 0.6, 1, ua, cell[3]);
        const i1 = B.v([p[0] - ax.x * sz + sd.x * sz, p[1] - ax.y * sz + sd.y * sz, p[2] - ax.z * sz + sd.z * sz], N, bs, sway, 0.6, 1, ub, cell[3]);
        const i2 = B.v([p[0] + ax.x * sz + sd.x * sz, p[1] + ax.y * sz + sd.y * sz, p[2] + ax.z * sz + sd.z * sz], N, tip, sway, 1.5, 1, ub, cell[1]);
        const i3 = B.v([p[0] + ax.x * sz - sd.x * sz, p[1] + ax.y * sz - sd.y * sz, p[2] + ax.z * sz - sd.z * sz], N, tip, sway, 1.5, 1, ua, cell[1]);
        B.quad(i0, i1, i2, i3);
      }
    }
  }
}

// A maple whose crown is a quilt of small leaf clusters: six lobes of shingled cards. Seen from above at 12 m it reads as leaves.
function quiltGeometry(rng, cell, o) {
  const B = floraBuilder(), H = o.H, R = o.R, Ry = H * 0.33, C = [0, H * 0.64, 0];
  const arr = (c, k = 1) => [c.r * k, c.g * k, c.b * k], sw = (y) => 0.3 * Math.pow(y / H, 2);
  B.tube([[0, -0.4, 0], [rng.range(-0.2, 0.2), H * 0.3, rng.range(-0.2, 0.2)], [rng.range(-0.4, 0.4), H * 0.62, rng.range(-0.4, 0.4)]], [H * 0.024, H * 0.017, H * 0.01], 5, (t, k) => arr(o.bark, k % 2 ? 0.7 : 1), (t) => sw(t * H * 0.62));
  const lobes = [{ c: [0, C[1] + Ry * 0.42, 0], r: [R * 0.6, Ry * 0.6] }], a0 = rng.range(0, 6.28);
  for (let k = 0; k < 5; k++) { const a = a0 + k * 1.2566 + rng.range(-0.25, 0.25), rr = R * rng.range(0.46, 0.56); lobes.push({ c: [Math.cos(a) * rr, C[1] + Ry * rng.range(-0.12, 0.12), Math.sin(a) * rr], r: [R * rng.range(0.47, 0.56), Ry * rng.range(0.55, 0.7)] }); }
  for (let k = 1; k <= Math.min(o.limbs || 0, 5); k++) {                          // limbs rising from the fork into the lobes
    const L = lobes[k], y0 = H * rng.range(0.3, 0.42), r0 = H * 0.011;
    B.tube([[0, y0, 0], [L.c[0] * 0.5, lerp(y0, L.c[1], 0.45), L.c[2] * 0.5], [L.c[0] * 0.9, L.c[1] - L.r[1] * 0.25, L.c[2] * 0.9]], [r0, r0 * 0.7, r0 * 0.3], 4, (t, kk) => arr(o.bark, kk % 2 ? 0.7 : 1), () => sw(L.c[1]) * 0.6);
  }
  quiltLobes(B, rng, cell, lobes, o, C, R, Ry, sw);
  return B.build({ height: H, radius: R, kind: o.kind || 'quilt' });
}

// Paper birch: a slim white trunk with its dark scars, a few rising limbs, and a light crown of small gold leaf clusters
// held high, so that from the stream we fly between trunks and under leaves.
function paperBirch(rng, cell, o) {
  const B = floraBuilder(), H = o.H, R = o.R, n = o.rings, sides = o.sides, white = [0.66, 0.63, 0.56], dark = [0.035, 0.032, 0.03], twig = [0.16, 0.12, 0.1];
  const lx = rng.range(-0.5, 0.5), lz = rng.range(-0.5, 0.5), pts = [], rad = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lx * t * t * 2.4 + 0.14 * Math.sin(t * 5 + lz * 9), t * H * 0.9 - 0.4, lz * t * t * 2.4 + 0.14 * Math.cos(t * 4 + lx * 9)]); rad.push(H * lerp(0.0165, 0.0045, Math.pow(t, 0.8)) * (i === 0 ? 1.3 : 1)); }
  const sw = (y) => 0.35 * Math.pow(clamp(y / H, 0, 1), 2), marks = pts.map(() => rng.int(0, sides - 1));
  B.tube(pts, rad, sides, (t, k) => { const i = Math.round(t * n); return (k === marks[i] && (i & 1) === 0) || (i === 0 && k % 2 === 0) ? dark : white.map((x) => x * rng.range(0.86, 1.06)); }, (t) => sw(t * H * 0.9));
  const lobes = [], a0 = rng.range(0, 6.28), nl = o.lobes;
  for (let k = 0; k < nl; k++) {
    const t = lerp(0.5, 0.84, k / Math.max(1, nl - 1)), i = Math.min(n - 1, Math.round(t * n)), p = pts[i], a = a0 + k * 2.4 + rng.range(-0.3, 0.3), out = R * rng.range(0.42, 0.62) * (1 - 0.3 * (t - 0.5) / 0.34);
    const c = [p[0] + Math.cos(a) * out, p[1] + H * rng.range(0.08, 0.13), p[2] + Math.sin(a) * out];
    B.tube([[p[0], p[1], p[2]], [p[0] + Math.cos(a) * out * 0.55, p[1] + H * 0.06, p[2] + Math.sin(a) * out * 0.55], c], [rad[i] * 0.55, rad[i] * 0.36, rad[i] * 0.14], o.limbSides, (tt) => (tt < 0.4 ? white.map((x) => x * 0.85) : twig), () => sw(p[1]));
    lobes.push({ c, r: [R * rng.range(0.4, 0.5), H * rng.range(0.085, 0.115)] });
  }
  lobes.push({ c: [pts[n][0], H * 0.92, pts[n][2]], r: [R * 0.4, H * 0.1] });
  quiltLobes(B, rng, cell, lobes, o, [0, H * 0.72, 0], R, H * 0.25, sw);
  return B.build({ height: H, radius: R, kind: 'birch' });
}

// The dead paper birch of the rare event: a straight white trunk, 24 m, broken at the top, with a few stubs on the
// side away from the stream so nothing hangs under it as it comes down over the water. Falls toward -Z about its foot.
function snagGeometry(rng) {
  const B = floraBuilder(), white = [0.78, 0.75, 0.68], dark = [0.05, 0.045, 0.04], tan = [0.46, 0.35, 0.24];
  const H = 26, n = 26, SIDES = 12, pts = [], rad = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([0.5 * Math.sin(t * 2.2) * t, t * H, 0.9 * t * t + 0.25 * Math.sin(t * 5)]); rad.push(lerp(1.05, 0.5, Math.pow(t, 0.9)) * (i === 0 ? 1.45 : i === 1 ? 1.2 : i === 2 ? 1.06 : 1)); }
  // broken limb stubs, all on the +Z half (nothing hangs under it as it comes down over the water); the trunk swells into a
  // collar under each
  const stubs = [];
  for (let j = 0; j < 6; j++) stubs.push({ t: rng.range(0.3, 0.95), a: rng.range(-1.1, 1.1), len: rng.range(1.5, 3.6), k: rng.range(0.34, 0.5) });
  // The trunk, ring by ring: never a clean cylinder. Flutes at the foot, burls and hollows all the way up, a collar under
  // every stub. Each vertex carries its own place on the bark (metres round, metres up) for the shader's dashes.
  const ph = rng.range(0, 6.28), rings = [];
  for (let i = 0; i <= n; i++) {
    const ring = [], y = pts[i][1];
    for (let k = 0; k <= SIDES; k++) {
      const an = k / SIDES * Math.PI * 2, kk = k % SIDES;
      let bump = 0.06 * Math.sin(kk * 1.9 + i * 0.83 + ph) + 0.045 * Math.sin(kk * 4.4 - i * 1.7 + ph * 2) + 0.03 * Math.sin(i * 2.9 + kk * 0.7);
      if (i < 3) bump += 0.12 * (3 - i) / 3 * Math.cos(kk * 2.6 + ph);                                  // the fluted foot
      for (const sb of stubs) { const dy = (y - sb.t * H) / 1.3, da = Math.atan2(Math.sin(an - (Math.PI / 2 - sb.a)), Math.cos(an - (Math.PI / 2 - sb.a))) / 0.75; bump += 0.2 * Math.exp(-dy * dy - da * da); }
      const r = rad[i] * (1 + bump), tone = 0.93 + 0.12 * Math.sin(kk * 3.3 + i * 1.3 + ph);
      ring.push(B.v([pts[i][0] + Math.cos(an) * r, y, pts[i][2] + Math.sin(an) * r], [Math.cos(an), 0.08, Math.sin(an)], white.map((x) => x * tone), 0, 0, 0, k / SIDES * 6.283 * rad[i], y));
    }
    if (i) for (let k = 0; k < SIDES; k++) B.quad(rings[i - 1][k], rings[i - 1][k + 1], ring[k + 1], ring[k]);
    rings.push(ring);
  }
  // the break: long splinters standing round a dark hollow, no two the same height
  const top = rings[n], cx = pts[n][0], cz = pts[n][2], jag = [];
  for (let k = 0; k < SIDES; k++) {
    const an = (k + 0.5) / SIDES * Math.PI * 2, hi = (k % 3 === 0 ? rng.range(1.6, 3.1) : k % 3 === 1 ? rng.range(0.25, 0.8) : rng.range(0.7, 1.7)), rr = rad[n] * rng.range(0.55, 0.9);
    jag.push(B.v([cx + Math.cos(an) * rr * 1.1 + 0.1 * hi, H + hi, cz + Math.sin(an) * rr * 1.1 + 0.16 * hi], [Math.cos(an), 0.3, Math.sin(an)], hi > 1.4 ? [0.66, 0.56, 0.42] : [0.56, 0.45, 0.32], 0, 0, 2, an * rad[n], H + hi));
  }
  const pit = B.v([cx, H - 0.8, cz], [0, 1, 0], dark, 0, 0, 2, 0, H);
  for (let k = 0; k < SIDES; k++) { B.tri(top[k], top[k + 1], jag[k]); B.tri(top[k + 1], top[k], pit); }      // each splinter a blade of its own, the hollow dark between them
  for (const sb of stubs) {
    const i = Math.min(n - 1, Math.floor(sb.t * n)), p = pts[i], r0 = rad[i] * sb.k, d = [Math.sin(sb.a) * 0.75, 0.55, Math.cos(sb.a) * 0.75], len = sb.len;
    B.tube([[p[0], p[1], p[2]], [p[0] + d[0] * len * 0.55, p[1] + d[1] * len * 0.6, p[2] + d[2] * len * 0.55], [p[0] + d[0] * len, p[1] + d[1] * len * 1.15, p[2] + d[2] * len]], [r0, r0 * 0.72, r0 * 0.42], 5, (tt) => (tt > 0.8 ? tan : white.map((x) => x * (0.9 - 0.25 * tt))), () => 0);
  }
  // curls of peeling paper standing off the bark all the way up, on every side: each a strip fast to the trunk along one
  // edge, lifting away and rolling back on itself (the shader shows its outer face white, its inner face the warm
  // under-bark)
  for (let j = 0; j < 64; j++) {
    const t = (j + rng()) / 64 * 0.94 + 0.03, f = t * n, i = Math.min(n - 1, Math.floor(f)), k = f - i, an = rng.range(0, 6.283), dir = rng.sign();
    const c0 = [lerp(pts[i][0], pts[i + 1][0], k), t * H, lerp(pts[i][2], pts[i + 1][2], k)], r = lerp(rad[i], rad[i + 1], k) * 1.06, hgt = rng.range(0.14, 0.4), len = rng.range(0.2, 0.5), curl = rng.range(2.0, 3.4), tone = rng.range(0.95, 1.08);
    let prev = null;
    for (let q = 0; q <= 4; q++) {
      const w = q / 4, th = w * w * curl, ca = Math.cos(an), sa = Math.sin(an);
      // along the bark, then away from it and round: (tangential, radial) of the strip at this step
      const tg = len * (Math.sin(th) / Math.max(curl, 0.5)) * 1.6, ro = len * (1 - Math.cos(th)) / Math.max(curl, 0.5) * 1.6 + 0.012;
      const px = c0[0] + ca * (r + ro) - sa * tg * dir, pz = c0[2] + sa * (r + ro) + ca * tg * dir, nx = ca * Math.cos(th) + sa * Math.sin(th) * dir, nz = sa * Math.cos(th) - ca * Math.sin(th) * dir, taper = 1 - 0.8 * w;
      const col = white.map((x) => Math.min(0.8, x * tone * (1.02 - 0.1 * w)));
      const lo = B.v([px, c0[1] - hgt * 0.5 * taper, pz], [nx, 0.1, nz], col, 0, 0, 1, an * r, c0[1]), hi = B.v([px, c0[1] + hgt * 0.5 * taper + 0.06 * w, pz], [nx, 0.1, nz], col, 0, 0, 1, an * r, c0[1]);
      if (prev) B.quad(prev[0], lo, hi, prev[1]);
      prev = [lo, hi];
    }
  }
  return B.build({ height: H, radius: 2.5, kind: 'snag' });
}

// The snag's own bark: cream paper birch that stays bright in the shade of the right bank (sky light, a little of the sun,
// a cold rim), white with its dark dashes along its whole length; warm under-bark only in small torn patches and on the
// inner face of each curl; the lit side cream, the underside the sky's slate.
function snagMaterial(S) {
  return new THREE.ShaderMaterial({
    fog: true, vertexColors: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uMgPatch: S.uPatch, uMgPatch2: S.uPatch2, uSunCol: S.uSunCol, uSunDir: S.uSunDir, uHemiSky: S.uHemiSky, uHemiGround: S.uHemiGround },
    vertexShader: /* glsl */`
      attribute vec4 wind;       // z: 0 the bark of the trunk and stubs, 1 a curl of paper, 2 the splintered wood of the break
      varying vec3 vCol, vN, vWp; varying vec3 vBk;
      #include <fog_pars_vertex>
      void main(){ vBk = vec3(uv, wind.z); vCol = color; vec4 w = modelMatrix*vec4(position, 1.0); vWp = w.xyz; vN = normalize(mat3(modelMatrix)*normal);
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uSunDir, uHemiSky, uHemiGround;
      varying vec3 vCol, vN, vWp; varying vec3 vBk;
      ${GLSL_PATCH}
      ${GLSL_WHASH}
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN), V = normalize(cameraPosition - vWp);
        if (!gl_FrontFacing) n = -n;
        float arc = vBk.x, hy = vBk.y, kind = vBk.z;                                        // metres round the trunk, metres up it
        float pxm = max(fwidth(hy) + 0.3*fwidth(arc), 1e-4);                              // metres of bark under a pixel
        // lenticels: thin dark dashes lying level, in rows a hand apart, each row with its own dashes of its own lengths
        float row = hy/0.21, rid = floor(row), rf = abs(fract(row) - 0.5);
        float cx = arc/0.42 + wHash(vec2(rid, 3.0))*9.0, cid = floor(cx), cf = abs(fract(cx) - 0.5), ch = wHash(vec2(cid, rid)), ch2 = wHash(vec2(cid + 7.0, rid));
        float dth = max(0.05 + 0.05*ch2, pxm*3.6);                                          // (a dash is never thinner than three quarters of a pixel)
        float dash = (1.0 - smoothstep(dth, dth + pxm*4.8, rf + 0.3*(ch2 - 0.5)))*(1.0 - smoothstep(0.08 + 0.3*ch2, 0.12 + 0.3*ch2, cf))*step(0.42, ch)*(1.0 - smoothstep(0.05, 0.17, pxm));
        float mean = 0.07*smoothstep(0.05, 0.17, pxm);                                    // far off the rows are a faint grey, never stripes
        // old branch scars: a few soft black brows. Where a scrap of paper has torn away: a small patch of warm under-bark
        // (never more than a hand or two across) inside the pale lip of the tear
        float scar = smoothstep(0.72, 0.82, wNoise(vec2(arc*0.9 + 5.0, hy*0.45)))*smoothstep(0.3, 0.5, wNoise(vec2(arc*2.6, hy*1.9 + 2.0)));
        float pn = wNoise(vec2(arc*3.3 + 3.0, hy*7.4))*0.6 + wNoise(vec2(arc*8.0, hy*17.0) + 7.0)*0.4;        // tears run level round the trunk, as the paper does
        float peel = smoothstep(0.735, 0.765, pn), lip = smoothstep(0.68, 0.735, pn)*(1.0 - peel);
        // the paper itself: level bands of faintly different white, a papery grain
        float band = 0.9 + 0.12*wNoise(vec2(arc*0.6, hy*5.5)) + 0.06*wNoise(vec2(arc*3.0, hy*14.0));
        vec3 alb = mix(vCol*band, vCol*vec3(0.72, 0.54, 0.4), peel*0.85);
        alb = mix(alb, min(vCol*1.12, vec3(0.8)), lip)*(1.0 - 0.8*dash*(1.0 - peel) - mean)*(1.0 - 0.8*scar);
        if (kind > 1.5) alb = vCol*(0.8 + 0.4*wNoise(vec2(arc*9.0, hy*1.2)));               // splinters: long-grained raw wood
        else if (kind > 0.5) alb = gl_FrontFacing ? vCol*(0.96 + 0.08*wNoise(vec2(arc*4.0, vWp.y*9.0))) : vCol*vec3(0.92, 0.76, 0.62);   // a curl: paper outside, the pale salmon of fresh under-paper inside
        float wrap = max(0.0, 0.3 + 0.7*dot(n, uSunDir));
        vec3 amb = mix(mix(uHemiGround, uHemiSky, 0.7)*0.5, uHemiSky, 0.5 + 0.5*n.y);      // the underside takes the sky's slate, not the bank's brown
        vec3 c = alb*0.3183*(uSunCol*(wrap*mgPatchAt(vWp.xz)*0.6) + amb*2.6);
        float fr = 1.0 - max(dot(n, V), 0.0);
        c += uHemiSky*(0.12*fr*fr);
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// What the snag sheds as it goes: chips of bark and dead leaves torn from the break and all down the trunk, and soft puffs of
// punk-wood dust. Each flake leaves the trunk at its own moment of the fall (iA.y, in the fall's own clock) from its own place
// along it (iA.x metres), is thrown clear, then taken downwind and sinks. Driven by one uniform: nothing is made in update().
function snagBurstMaterial(S) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uPx: S.uPx, uSunCol: S.uSunCol, uSunDir: S.uSunDir, uHemiSky: S.uHemiSky, uHemiGround: S.uHemiGround,
      uFoot: { value: new THREE.Vector3() }, uFallDir: { value: new THREE.Vector3(0, 0, -1) }, uWindDir: { value: new THREE.Vector3(1, 0, 0) }, uClock: { value: -1 } },
    vertexShader: /* glsl */`
      attribute vec4 iA;      // metres up the trunk, the moment it lets go (0..1 of the fall), kind (0 bark curl, 1 dust, 2 dead leaf), seed
      attribute vec4 iB;      // the throw: x, y, z (m/s), size
      attribute vec3 iCol;
      uniform float uPx, uClock; uniform vec3 uFoot, uFallDir, uWindDir;
      varying vec2 vQ; varying vec3 vCol; varying vec4 vK;
      #include <fog_pars_vertex>
      void main(){
        float k0 = iA.y, age = (uClock - k0)*3.0;                                // seconds since it let go
        float lean = 0.87*(1.0 - pow(1.0 - clamp(k0, 0.0, 1.0), 2.2));           // how far over the trunk was then
        vec3 P = uFoot + iA.x*(sin(lean)*uFallDir + vec3(0.0, cos(lean), 0.0));
        float t = max(age, 0.0), dust = step(0.5, iA.z)*step(iA.z, 1.5);
        vec3 side = cross(uWindDir, vec3(0.0, 1.0, 0.0));
        P += (iB.x*uWindDir + vec3(0.0, iB.y, 0.0) + iB.z*side)*(1.0 - exp(-t*1.6))/1.6;      // thrown, and slowed by the air
        P += uWindDir*(mix(9.0, 5.0, dust)*t*(1.0 - exp(-t*1.2)));                            // then the gust has it
        P.y -= mix(1.5, 0.25, dust)*t*t - 0.4*sin(t*5.0 + iA.w*40.0)*(1.0 - dust);             // sinking, fluttering
        float life = smoothstep(0.0, 0.12, age)*(1.0 - smoothstep(mix(1.5, 2.2, dust), mix(2.6, 3.4, dust), age));
        vec4 mvc = viewMatrix*vec4(P, 1.0);
        float dist = length(mvc.xyz);
        float size = max(iB.w*(1.0 + dust*1.3*t), (1.0 - dust)*2.0*uPx*dist)*life*smoothstep(mix(1.0, 9.0, dust), mix(6.0, 26.0, dust), dist);
        float sp = iA.w*31.0 + t*(3.0 + 9.0*iA.w)*(1.0 - dust), cs = cos(sp), sn = sin(sp);
        vec2 q = vec2(position.x*cs - position.y*sn, position.x*sn + position.y*cs);
        mvc.xy += q*size*vec2(1.0, mix(0.55 + 0.45*cos(t*7.0 + iA.w*20.0), 1.0, dust));         // a chip turns edge-on and back
        vec4 mvPosition = mvc;
        vQ = position.xy; vCol = iCol; vK = vec4(dust, life, iA.z, iA.w);
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uSunDir, uHemiSky, uHemiGround;
      varying vec2 vQ; varying vec3 vCol; varying vec4 vK;
      ${GLSL_WHASH}
      ${GLSL_LEAF}
      #include <fog_pars_fragment>
      void main(){
        float r = length(vQ), seed = vK.w, fw = max(fwidth(vQ.x) + fwidth(vQ.y), 1e-4);
        // a dead leaf has a leaf's outline; a flake of bark is a torn curl of paper, longer than wide, no two alike; dust is a soft puff
        vec2 ql = vQ*1.35 + vec2(0.0, 0.1);
        float dLeaf = mix(mgLeaf(ql), 0.8 - length(ql), smoothstep(0.12, 0.4, fw));
        float asp = 1.5 + 1.6*fract(seed*7.3), ang = seed*31.0, ca = cos(ang), sa = sin(ang);
        vec2 qb = vec2(vQ.x*ca + vQ.y*sa, -vQ.x*sa + vQ.y*ca)*vec2(1.0, asp);
        float torn = 0.3*(wNoise(qb*2.2 + seed*40.0) - 0.5) + 0.16*(wNoise(qb*6.5 + seed*9.0) - 0.5);
        float dBark = 0.74 - length(qb) + torn;
        float d = vK.z > 1.5 ? dLeaf : dBark;
        float chip = smoothstep(-fw*0.7, fw*0.7, d);
        float a = mix(chip, (1.0 - smoothstep(0.0, 1.0, r))*0.16, vK.x)*vK.y;
        if (a < 0.01) discard;
        // a curl of bark is a little roll: cream on its back, shaded along one edge, tan where the inner face shows
        float roll = clamp(qb.y*0.9 + 0.5, 0.0, 1.0);
        vec3 alb = vK.z > 1.5 ? vCol*(0.8 + 0.3*smoothstep(0.0, 0.3, dLeaf)) : mix(vCol*vec3(0.74, 0.56, 0.4), vCol, smoothstep(0.12, 0.42, roll))*(0.78 + 0.3*smoothstep(0.5, 1.0, roll));
        alb = mix(alb, vCol, vK.x);
        vec3 amb = mix(uHemiGround, uHemiSky, 0.75);
        gl_FragColor = vec4(alb*0.3183*(uSunCol*(0.3*max(uSunDir.y, 0.0)) + amb*2.4), a);
        #include <fog_fragment>
      }`,
  });
}

// The emergent white pine: a straight dark trunk, bare for the lower two fifths, then four whorls of long level limbs, each
// limb ending in a flat plume of needles, the whole crown flagged downwind (+X) by a century of north-westers, and a leader.
// Sky shows between the tiers, so it reads as a pine from four hundred metres and from forty.
function whitePine(rng, cell, o) {
  const B = floraBuilder(), H = o.H, bark = [o.bark.r, o.bark.g, o.bark.b], sw = (y) => 0.55 * Math.pow(clamp(y / H, 0, 1), 2);
  const n = 10, pts = [], rad = [], lx = rng.range(0.6, 1.1), lz = rng.range(-0.3, 0.3);
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lx * t * t * H * 0.035 + 0.2 * Math.sin(t * 5), t * H * 0.96 - 0.5, lz * t * t * H * 0.035]); rad.push(H * lerp(0.019, 0.0065, Math.pow(t, 0.9)) * (i === 0 ? 1.4 : 1)); }
  B.tube(pts, rad, 7, (t, k) => bark.map((x) => x * (k % 2 ? 0.62 : 1) * (0.85 + 0.3 * rng())), (t) => sw(t * H * 0.96));
  const at = (t) => { const f = clamp(t / 0.96, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k), lerp(pts[i][2], pts[i + 1][2], k)]; };
  const lobes = [], tiers = o.tiers;
  for (let j = 0; j < tiers; j++) {
    const f = j / (tiers - 1), t = lerp(0.5, 0.88, f), p = at(t), Rt = H * lerp(0.23, 0.12, Math.pow(f, 0.85));
    const nl = j < tiers - 1 ? rng.int(4, 5) : 3, a0 = rng.range(0, 6.28);
    for (let k = 0; k < nl; k++) {
      const a = a0 + k / nl * 6.283 + rng.range(-0.3, 0.3), flag = 1 + 0.42 * Math.cos(a), out = Rt * rng.range(0.78, 1.06) * flag, rise = Rt * rng.range(0.08, 0.2);
      const ca = Math.cos(a), sa = Math.sin(a), r0 = H * lerp(0.0055, 0.0032, f);
      B.tube([[p[0], p[1] - Rt * 0.1, p[2]], [p[0] + ca * out * 0.5, p[1] - Rt * 0.06, p[2] + sa * out * 0.5], [p[0] + ca * out * 0.92, p[1] + rise * 0.6, p[2] + sa * out * 0.92]], [r0, r0 * 0.7, r0 * 0.3], 4, (tt, kk) => bark.map((x) => x * (kk % 2 ? 0.6 : 0.9)), () => sw(p[1]) * 0.8);
      lobes.push({ c: [p[0] + ca * out * 0.68, p[1] + rise * 0.7 + H * 0.012, p[2] + sa * out * 0.68], r: [out * rng.range(0.4, 0.5), H * rng.range(0.022, 0.03)] });
    }
    lobes.push({ c: [p[0], p[1] + Rt * 0.1, p[2]], r: [Rt * 0.36, H * 0.03] });                // the heart of the whorl
  }
  const top = at(0.96); lobes.push({ c: [top[0], top[1] - H * 0.008, top[2]], r: [H * 0.05, H * 0.038] });   // the leader, close over the last whorl
  quiltLobes(B, rng, cell, lobes, { palettes: o.palettes, cards: o.cards, card: o.card, inner: 0.3 }, [0, H * 0.68, 0], H * 0.2, H * 0.27, sw);
  return B.build({ height: H, radius: H * 0.22, kind: 'pine' });
}

// A songbird for the flocks, built by the kit's bird builder to this world's own measure: short rounded wings, a long
// tail. Painted afterwards: a white bar along the inner trailing edge of each wing, white tail corners, a black necklace
// and a crest for the jays.
function songbird(pal, o) {
  const J = { ...F.BIRD_PRESETS.crows, len: 0.5, girth: 0.115, span: 0.33, chord: 0.31, wing: 'broad', tail: 0.27, tailW: 0.11, fingers: 0, ...pal };
  const g = F.birdGeometry(J, 'high'), pos = g.attributes.position, ca = g.attributes.color, an = g.attributes.aAnim, L = J.len, G = J.girth;
  const white = new THREE.Color(o.white || '#dfe5ee'), black = new THREE.Color('#0b0d12');
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i), side = an.getY(i), tw = an.getW(i);
    if (side !== 0) { const s = an.getX(i) / J.span; if (o.bar && an.getZ(i) > 0.5 && s > 0.16 && s < 0.5) ca.setXYZ(i, white.r, white.g, white.b); }
    else if (tw > 0.7) { if (o.tailTip && Math.abs(pos.getX(i)) > J.tailW * 0.3) ca.setXYZ(i, white.r, white.g, white.b); }
    else if (o.necklace && tw === 0 && Math.abs(z - 0.315 * L) < 0.02 * L) ca.setXYZ(i, black.r, black.g, black.b);
  }
  if (o.crest) {                                                                // three small faces swept back from the crown
    const zh = 0.43 * L, hy = 0.3 * G, hr = 0.58 * G, cc = new THREE.Color(pal.head);
    const A = [0, hy + hr * 2.6, zh - 0.17 * L], Lf = [-hr * 0.6, hy + hr * 0.5, zh - 0.05 * L], Rt = [hr * 0.6, hy + hr * 0.5, zh - 0.05 * L], Fr = [0, hy + hr * 1.0, zh + 0.05 * L];
    const tris = [Lf, A, Fr, Fr, A, Rt, Rt, A, Lf], n0 = pos.count, add = tris.length;
    for (const name of Object.keys(g.attributes)) {
      const old = g.attributes[name], k = old.itemSize, arr = new Float32Array((n0 + add) * k); arr.set(old.array);
      for (let i = 0; i < add; i++) {
        const v = name === 'position' ? tris[i] : name === 'color' ? [cc.r * (i % 3 === 1 ? 1.25 : 0.9), cc.g * (i % 3 === 1 ? 1.25 : 0.9), cc.b * (i % 3 === 1 ? 1.25 : 0.9)] : name === 'normal' ? [i < 3 ? -0.7 : i < 6 ? 0.7 : 0, 0.6, i < 6 ? 0.3 : -0.8] : null;
        if (v) for (let e = 0; e < k; e++) arr[(n0 + i) * k + e] = v[e];
      }
      g.setAttribute(name, new THREE.Float32BufferAttribute(arr, k));
    }
    const idx = Array.from(g.index.array); for (let i = 0; i < add; i++) idx.push(n0 + i);
    g.setIndex(idx);
  }
  return { geometry: g, preset: J };
}

// ---------- this world's own moose: a cow and her calf, built to be seen at twelve metres ----------
// Local frame: +X the way she faces, +Y up, hooves on y = 0. One skin lofted from tail to muzzle, so the shoulder hump,
// the short thick neck, the long drooping head with its swollen nose and the bell under the throat are one silhouette;
// long legs, dark above the knee and hock, pale below, black hooves. aAnim = (pivot x, pivot y, head weight, ear weight).
function mooseGeometry(o) {
  const pos = [], colr = [], anim = [], idx = [], calf = !!o.calf;
  const coat = o.coat, dark = o.dark, pale = o.pale, sock = o.sock, hoof = [0.012, 0.01, 0.009];
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const PX = 1.02, PY = 1.5;
  const headW = (x) => clamp((x - PX) / 0.62, 0, 1);
  // a skin through stations [x, y, z, half height, half width, pinch]; col(i, sy, cz, p) -> rgb; w(p) -> [head weight, ear weight]
  const loft = (st, sides, sub, col, w, ref = [0, 0, 1]) => {
    const n = (st.length - 1) * sub + 1, rings = [];
    const at = (f, e) => {                                                        // Catmull-Rom through the stations
      const i = Math.min(st.length - 2, Math.floor(f)), t = f - i, a = st[Math.max(0, i - 1)][e], b = st[i][e], c = st[i + 1][e], d = st[Math.min(st.length - 1, i + 2)][e];
      return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    };
    for (let r = 0; r < n; r++) {
      const f = r / sub, f0 = Math.max(0, f - 0.05), f1 = Math.min(st.length - 1, f + 0.05);
      const c = [at(f, 0), at(f, 1), at(f, 2)], hh = Math.max(0.004, at(f, 3)), hw = Math.max(0.004, at(f, 4)), pinch = at(f, 5);
      let t = [at(f1, 0) - at(f0, 0), at(f1, 1) - at(f0, 1), at(f1, 2) - at(f0, 2)]; const tl = Math.hypot(t[0], t[1], t[2]) || 1; t = [t[0] / tl, t[1] / tl, t[2] / tl];
      const dt = ref[0] * t[0] + ref[1] * t[1] + ref[2] * t[2];
      let b = [ref[0] - t[0] * dt, ref[1] - t[1] * dt, ref[2] - t[2] * dt]; const bl = Math.hypot(b[0], b[1], b[2]) || 1; b = [b[0] / bl, b[1] / bl, b[2] / bl];
      const up = [b[1] * t[2] - b[2] * t[1], b[2] * t[0] - b[0] * t[2], b[0] * t[1] - b[1] * t[0]];
      const ring = [];
      for (let k = 0; k < sides; k++) {
        const a = (k + 0.5) / sides * Math.PI * 2, sy = Math.sin(a), cz = Math.cos(a), ww = hw * cz * (1 - pinch * Math.max(sy, 0));
        const p = [c[0] + up[0] * hh * sy + b[0] * ww, c[1] + up[1] * hh * sy + b[1] * ww, c[2] + up[2] * hh * sy + b[2] * ww];
        const cc = col(f, sy, cz, p), wt = w(p);
        pos.push(p[0], p[1], p[2]); colr.push(cc[0], cc[1], cc[2]); anim.push(PX, PY, wt[0], wt[1]);
        ring.push(pos.length / 3 - 1);
      }
      rings.push(ring);
    }
    for (let r = 0; r < n - 1; r++) for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides, a = rings[r][k], b2 = rings[r][k1], c2 = rings[r + 1][k1], d = rings[r + 1][k]; idx.push(a, c2, b2, a, d, c2); }
    for (const [ring, flip] of [[rings[0], false], [rings[n - 1], true]]) {         // caps
      let cx = 0, cy = 0, cz2 = 0; for (const i of ring) { cx += pos[i * 3]; cy += pos[i * 3 + 1]; cz2 += pos[i * 3 + 2]; }
      const i0 = ring[0]; pos.push(cx / sides, cy / sides, cz2 / sides); colr.push(colr[i0 * 3], colr[i0 * 3 + 1], colr[i0 * 3 + 2]); anim.push(anim[i0 * 4], anim[i0 * 4 + 1], anim[i0 * 4 + 2], anim[i0 * 4 + 3]);
      const ci = pos.length / 3 - 1;
      for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; if (flip) idx.push(ci, ring[k1], ring[k]); else idx.push(ci, ring[k], ring[k1]); }
    }
  };
  // ----- body, neck and head: one skin
  const hump = calf ? 0.04 : 0.1, hd = calf ? 0.72 : 1, hx = (x) => 1.62 + (x - 1.62) * hd;
  const body = [
    [-1.31, 1.52, 0, 0.06, 0.05, 0], [-1.22, 1.47, 0, 0.27, 0.22, 0.1], [-0.96, 1.41, 0, 0.385, 0.31, 0.15], [-0.55, 1.385, 0, 0.415, 0.345, 0.1], [-0.1, 1.38, 0, 0.42, 0.36, 0.1],
    [0.35, 1.44, 0, 0.47 + hump * 0.3, 0.35, 0.28], [0.7, 1.53, 0, 0.53 + hump, 0.31, 0.5], [0.98, 1.52, 0, 0.47 + hump * 0.5, 0.25, 0.42], [1.16, 1.5, 0, 0.35, 0.185, 0.3],
    [1.4, 1.53, 0, 0.27, 0.15, 0.2], [1.62, 1.55, 0, 0.215, 0.13, 0.15],
    [hx(1.8), 1.52, 0, 0.175, 0.125, 0.25], [hx(2.0), 1.43, 0, 0.15, 0.1, 0.2], [hx(2.2), 1.31, 0, 0.14, 0.092, 0.1], [hx(2.37), 1.2, 0, 0.15, 0.1, 0], [hx(2.48), 1.12, 0, 0.11, 0.08, 0], [hx(2.53), 1.08, 0, 0.03, 0.03, 0],
  ];
  loft(body, 14, 3, (f, sy, cz, p) => {
    const under = smoothstep(0.1, -0.7, sy), head = smoothstep(1.7, 1.95, p[0]), nose = smoothstep(hx(2.2), hx(2.42), p[0]);
    let c = mix3(coat, dark, 0.75 * under + 0.35 * smoothstep(0.2, 0.8, p[0]) * (1 - smoothstep(0.5, 1, sy)));     // darker belly and shoulder
    c = mix3(c, mix3(coat, pale, 0.5), 0.55 * smoothstep(0.55, 1, sy) * (1 - head) * smoothstep(-0.4, 0.6, p[0]));        // the hump and back are grizzled
    c = mix3(c, mix3(coat, pale, 0.42), 0.6 * head * (1 - nose));                                                         // the long face is greyer
    return mix3(c, dark, 0.5 * nose);
  }, (p) => [headW(p[0]), 0]);
  // ----- the bell under the throat (cows carry a small one; calves none)
  if (!calf) loft([[1.6, 1.4, 0, 0.05, 0.1, 0], [1.64, 1.26, 0, 0.04, 0.085, 0], [1.67, 1.1, 0, 0.03, 0.06, 0], [1.68, 0.98, 0, 0.012, 0.015, 0]], 7, 2, () => mix3(coat, dark, 0.6), (p) => [headW(p[0]), 0], [1, 0, 0]);
  // ----- ears: long, held out and back
  for (const sg of [-1, 1]) loft([[hx(1.7), 1.66, 0.085 * sg, 0.022, 0.03, 0], [hx(1.66), 1.79, 0.17 * sg, 0.02, 0.065, 0], [hx(1.6), 1.93, 0.25 * sg, 0.008, 0.012, 0]], 6, 2,
    (f, sy) => mix3(coat, pale, sy * sg > 0 ? 0.15 : 0.65), (p) => [headW(p[0]), clamp((p[1] - 1.66) / 0.27, 0, 1)], [1, 0, 0]);
  // ----- legs: [x of the foot, z, stagger]; the knee and hock are knobs, the cannon bones long and thin
  const legCol = (yk) => (f, sy, cz, p) => (p[1] < 0.075 ? hoof : mix3(mix3(coat, dark, 0.55), sock, smoothstep(yk + 0.1, yk - 0.14, p[1])));
  const legs = calf ? [[0.8, 0.15, 0.1], [0.8, -0.15, -0.06], [-0.93, 0.16, -0.12], [-0.93, -0.16, 0.08]] : [[0.8, 0.19, 0.14], [0.8, -0.19, -0.05], [-0.93, 0.2, -0.16], [-0.93, -0.2, 0.1]];
  const lk = calf ? 0.82 : 1;                                                    // a calf's legs are thinner for their length
  for (const [fx, fz, sx] of legs) {
    if (fx > 0) loft([[fx - 0.03, 1.3, fz * 0.9, 0.2, 0.11, 0], [fx + sx * 0.3, 0.98, fz, 0.12 * lk, 0.085 * lk, 0], [fx + sx * 0.75, 0.66, fz, 0.072 * lk, 0.06 * lk, 0], [fx + sx * 0.8, 0.58, fz, 0.062 * lk, 0.054 * lk, 0],
      [fx + sx, 0.19, fz, 0.04 * lk, 0.037 * lk, 0], [fx + sx, 0.11, fz, 0.052 * lk, 0.046 * lk, 0], [fx + sx + 0.035, 0.0, fz, 0.07 * lk, 0.056 * lk, 0]], 7, 2, legCol(0.62), () => [0, 0], [0, 0, 1]);
    else loft([[fx + 0.02, 1.34, fz * 0.9, 0.25, 0.13, 0], [fx + 0.1 + sx * 0.3, 1.02, fz, 0.17 * lk, 0.1 * lk, 0], [fx - 0.07 + sx * 0.8, 0.72, fz, 0.078 * lk, 0.06 * lk, 0], [fx - 0.09 + sx * 0.85, 0.64, fz, 0.062 * lk, 0.052 * lk, 0],
      [fx - 0.01 + sx, 0.19, fz, 0.04 * lk, 0.037 * lk, 0], [fx + sx, 0.11, fz, 0.052 * lk, 0.046 * lk, 0], [fx + sx + 0.035, 0.0, fz, 0.07 * lk, 0.056 * lk, 0]], 7, 2, legCol(0.7), () => [0, 0], [0, 0, 1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setAttribute('aAnim', new THREE.Float32BufferAttribute(anim, 4));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  g.userData = { feet: legs.map(([fx, fz, sx]) => [fx + sx, fz]) };
  return g;
}

// The moose's coat: sun (through the break and the wall's shadow), the sky's light, a rim of sky along hump and back so
// she is never a black cut-out, coarse hair in the shader. The head and neck turn about the shoulder (uPose.x radians,
// nose down positive), the ears flick.
function mooseMaterial(S, o) {
  return new THREE.ShaderMaterial({
    fog: true, vertexColors: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uMgPatch: S.uPatch, uMgPatch2: S.uPatch2, uSunCol: S.uSunCol, uSunDir: S.uSunDir, uHemiSky: S.uHemiSky, uHemiGround: S.uHemiGround,
tMgShade: S.tShade, uMgShBox: S.uShBox, uMgShSun: S.uShSun, uMgShK: S.uShK, 
      uPose: { value: new THREE.Vector4(0, 0, o.seed, 0) }, uLightK: { value: new THREE.Vector3(o.sun, o.amb, o.rim) }, uRimC: { value: o.rimC } },
    vertexShader: /* glsl */`
      attribute vec4 aAnim;
      uniform float uTime; uniform vec4 uPose;
      varying vec3 vCol, vN, vWp, vL;
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position, n = normal;
        float a = uPose.x*aAnim.z, ca = cos(a), sa = sin(a);
        vec2 d = p.xy - aAnim.xy;
        p.xy = aAnim.xy + vec2(d.x*ca + d.y*sa, -d.x*sa + d.y*ca);
        n.xy = vec2(n.x*ca + n.y*sa, -n.x*sa + n.y*ca);
        float fl = max(0.0, sin(uTime*1.7 + uPose.z*9.0 + sign(p.z)*1.3) - 0.6)*2.5;      // an ear flicks, now and then
        p.x -= aAnim.w*fl*0.06; p.z *= 1.0 + 0.016*sin(uTime*1.9 + uPose.z*5.0)*step(aAnim.z, 0.01)*step(0.9, p.y);   // and she breathes
        vL = position; vCol = color;
        vec4 w = modelMatrix*vec4(p, 1.0); vWp = w.xyz; vN = normalize(mat3(modelMatrix)*n);
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunCol, uSunDir, uHemiSky, uHemiGround, uLightK, uRimC;
      varying vec3 vCol, vN, vWp, vL;
      ${GLSL_PATCH}
      ${GLSL_SHADE}
      ${GLSL_WHASH}
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN), V = normalize(cameraPosition - vWp);
        float hair = wNoise(vec2(vL.x*26.0 + vL.z*9.0, vL.y*11.0 - vL.x*5.0))*0.6 + wNoise(vec2(vL.x*61.0, vL.y*33.0 + vL.z*40.0))*0.4;
        vec3 alb = vCol*(0.72 + 0.56*hair);
        float ndl = max(dot(n, uSunDir), 0.0), wrap = max(0.0, 0.3 + 0.7*dot(n, uSunDir));
        vec3 amb = mix(uHemiGround*1.25, uHemiSky, 0.5 + 0.5*n.y);
        vec3 c = alb*0.3183*(uSunCol*(mix(wrap, ndl, 0.5)*mgSunShade(mgPatchAt(vWp.xz), vWp, 28.0)*uLightK.x) + amb*uLightK.y);
        float fr = 1.0 - max(dot(n, V), 0.0); fr *= fr;
        c += uRimC*(fr*fr*(0.25 + 0.75*smoothstep(-0.2, 0.7, n.y))*uLightK.z)*(0.6 + 0.8*hair);      // the sky along her back
        c *= 0.55 + 0.45*smoothstep(0.0, 0.5, vL.y);                                    // her own shadow round the hooves
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// what lies under an animal: a soft shadow on the gravel (kind 0) and the rings a wet hoof sends out (kind 1)
function underfootMaterial(S) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uHemiSky: S.uHemiSky },
    vertexShader: /* glsl */`
      attribute vec4 iP;      // x, y, z, heading
      attribute vec4 iQ;      // half length, half width, kind, seed
      varying vec2 vQ; varying vec2 vK;
      #include <fog_pars_vertex>
      void main(){
        float ca = cos(iP.w), sa = sin(iP.w);
        vec2 q = position.xz*iQ.xy;
        vec3 P = vec3(iP.x + q.x*ca - q.y*sa, iP.y, iP.z + q.x*sa + q.y*ca);
        vQ = position.xz; vK = iQ.zw;
        vec4 mvPosition = viewMatrix*vec4(P, 1.0); gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uHemiSky;
      varying vec2 vQ; varying vec2 vK;
      #include <fog_pars_fragment>
      void main(){
        float r = length(vQ);
        vec4 c;
        if (vK.x < 0.5) c = vec4(0.012, 0.012, 0.016, 0.62*(1.0 - smoothstep(0.25, 1.0, r)));
        else {
          float ph = fract(r*2.2 - uTime*0.55 + vK.y), ring = smoothstep(0.0, 0.18, ph)*(1.0 - smoothstep(0.18, 0.5, ph));
          float collar = 1.0 - smoothstep(0.1, 0.2, r);
          c = vec4(vec3(0.62, 0.66, 0.7)*0.3183*(uHemiSky*2.6 + 0.25), max(ring*0.55*(1.0 - smoothstep(0.3, 1.0, r)), collar*0.8)*smoothstep(0.05, 0.085, r));
        }
        gl_FragColor = c;
        #include <fog_fragment>
      }`,
  });
}

export default {
  id: 'maple-gale',
  name: 'The Leaf Wind',
  category: 'wilderness',
  weirdness: 0.05,
  media: ['air'],
  async build(ctx) {
    const R = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z), col = (h) => new THREE.Color(h);

    // ---------- what this visit is ----------
    const pick = R.fork('look')(), hour = vary.hour || 'any';
    const lookName = hour === 'golden' ? 'golden' : hour === 'dawn' ? 'dawn'
      : (hour === 'day' || hour === 'night') ? (pick < 0.65 ? 'slate' : 'squall')
        : (pick < 0.26 ? 'slate' : pick < 0.48 ? 'golden' : pick < 0.6 ? 'dawn' : pick < 0.74 ? 'slate' : pick < 0.82 ? 'dawn' : 'squall');
    const LK = LOOKS[lookName];
    const sp = R.fork('season')(), season = sp < 0.28 ? 'peak' : sp < 0.55 ? 'late' : sp < 0.77 ? 'peak' : 'early';
    const castR = R.fork('cast'), birdKind = castR.pick(['jays', 'jays', 'robins', 'ravens']), beast = castR() > 0.32 ? 'deer' : 'moose';
    const rare = !!vary.rare;
    const RX = makeRng(hashSeed('maple-gale-extra:' + (ctx.seed ?? 0)));         // the site's own later additions fork from this, in the site's order: pine, rim, ribbons, brookmist, snagburst
    // Every thing added since: a stream of its own, made from the world's seed and the thing's name. It draws nothing from
    // RX, from ctx.rng or from any other stream, so adding or removing one deals nothing else anew.
    const own = (name) => makeRng(hashSeed(name + ':' + (ctx.seed ?? 0)));
    const bendD = R.range(24, 31), lvl = (density - 1) * 0.7;

    const scene = new THREE.Scene();
    // The scene-linear grey that shows as a given display luma (0..255) under this look's grade: exposure and tint, the tone
    // curve, then the contrast (which takes 0.03 off every tone) and the shadow tint, all inverted. Dark water is set by it.
    const GRADE_CONTRAST = 1.06;
    const lumOf = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    const toneInv = (luma) => {
      const e = luma / 255, d = e <= 0.04045 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4);
      const a = (d - 0.5 * lumOf(col(LK.shadow)) - 0.5) / GRADE_CONTRAST + 0.5;
      let lo = 0, hi = 4;
      for (let i = 0; i < 40; i++) { const x = (lo + hi) / 2, f = (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081); if (f < a) lo = x; else hi = x; }
      return lo * 0.6 / (LK.exposure * lumOf(col(LK.tint)));
    };
    // the same for a colour of the palette: what the scene must hold, channel by channel, to show that colour at this luma
    // under this look's grade (its exposure and tint, saturation, contrast, and the tint it adds into the darks)
    const toneInvC = (hex, luma) => {
      const t = col(hex), e = luma / 255, d = e <= 0.04045 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4);
      t.multiplyScalar(d / Math.max(lumOf(t), 1e-5));
      const sh = col(LK.shadow), tn = col(LK.tint), w = 0.4 * (1 - smoothstep(0, 0.6, d));    // (four fifths of what the grade adds: the darks keep a breath of the look's own cast)
      const c1 = [t.r - w * sh.r, t.g - w * sh.g, t.b - w * sh.b].map((x) => (x - 0.5) / GRADE_CONTRAST + 0.5), l1 = 0.2126 * c1[0] + 0.7152 * c1[1] + 0.0722 * c1[2];
      const inv = (x1, tc) => {
        const a = Math.max(l1 + (x1 - l1) / LK.sat, 0.0008); let lo = 0, hi = 4;
        for (let i = 0; i < 40; i++) { const x = (lo + hi) / 2, f = (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081); if (f < a) lo = x; else hi = x; }
        return lo * 0.6 / (LK.exposure * tc);
      };
      return new THREE.Color(inv(c1[0], tn.r), inv(c1[1], tn.g), inv(c1[2], tn.b));
    };
    const peat = (luma, warm = 1) => new THREE.Vector3(1 + 0.13 * warm, 1.0, 1 - 0.16 * warm).multiplyScalar(toneInv(luma) / (1 + 0.016 * warm));      // dark tea, a little warm
    const sunDir = skyDirection(LK.el, LK.az);
    const sky = makeSky({ rng: R.fork('sky'), ...LK.sky, lightColor: LK.sun, lightIntensity: LK.sunI, ambientColor: LK.hemiSky, groundLight: LK.hemiGround, ambientIntensity: LK.hemiI, lightElevationMin: LK.el });
    scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(col(LK.fog), LK.fogD);
    const sunLight = new THREE.DirectionalLight(col(LK.sun), LK.sunI); sunLight.position.copy(sunDir).multiplyScalar(500); scene.add(sunLight);
    const hemi = new THREE.HemisphereLight(col(LK.hemiSky), col(LK.hemiGround), LK.hemiI); scene.add(hemi);

    const [cCrimson, cOrange, cGold, , , cCream, cHemlock] = PALETTE.map(col);
    const lateK = season === 'late' ? 1 : season === 'early' ? 0.55 : 0.75;
    const S = {
      uTime: { value: 0 }, uPx: { value: 0.0015 }, uLevel: { value: lvl }, uWakeAge: { value: 0 }, uS0: { value: new THREE.Vector2(-420, 0) },
      uPatch: { value: new THREE.Vector4(-550, 40, LK.patch[0], LK.patch[1]) },
      uPatch2: { value: new THREE.Vector3(2, -8, 62) },
      uWave: { value: new THREE.Vector4(0, 110, lookName === 'dawn' ? 0.35 : 0.6, 0) },
      uFront: { value: new THREE.Vector4(-1e4, 0, 1, 0) }, uBurst: { value: new THREE.Vector4(0, LK.patchGain || 0, LK.patchLift || 0, 0) },
      uPale: { value: cCream.clone().lerp(cGold, 0.15).multiplyScalar(0.75) },
      uSunCol: { value: col(LK.sun).multiplyScalar(LK.sunI) }, uSunDir: { value: sunDir.clone() },
      uHemiSky: { value: col(LK.hemiSky).multiplyScalar(LK.hemiI) }, uHemiGround: { value: col(LK.hemiGround).multiplyScalar(LK.hemiI) },
      ramp: [cCrimson.clone().multiplyScalar(0.85), cCrimson.clone().lerp(cOrange, 0.5), cOrange.clone().multiplyScalar(0.9), cGold.clone().multiplyScalar(0.85)],
      // fallen leaves are duller than flying ones: wine, rust, ochre, old gold
      litterRamp: [cCrimson.clone().multiplyScalar(0.42), cCrimson.clone().lerp(cOrange, 0.55).multiplyScalar(0.5), col('#8e6a30').multiplyScalar(0.8), cGold.clone().multiplyScalar(0.5)],
      uShade: { value: new THREE.Vector4(LK.gorge[0] - 60 * LK.gorge[1], LK.gorge[1], LK.gorge[2], 0) }, uSheen: { value: col(LK.hemiSky).multiplyScalar(0.9) },
      uFill: { value: new THREE.Vector3(...({ slate: [0.34, 0.4, 0.52], golden: [0.6, 0.56, 0.6], squall: [0.48, 0.52, 0.58], dawn: [0.42, 0.41, 0.58] })[lookName]) },
      uRockFill: { value: new THREE.Vector3(...({ slate: [0.4, 0.46, 0.58], golden: [0.5, 0.47, 0.5], squall: [1.0, 1.06, 1.16], dawn: [0.4, 0.39, 0.54] })[lookName]) },
      uLand: { value: new THREE.Vector4(bendD, lvl, 0.55 + 0.45 * lateK, 0) }, uBar: { value: new THREE.Vector4(0, 0, 4.5, 15.5) },
      // what the far crowns keep in the shade (warm: a shaded crown is deep red, never black)
      uDomeFill: { value: new THREE.Vector3(...({ slate: [0.3, 0.25, 0.22], golden: [0.3, 0.23, 0.2], squall: [0.34, 0.33, 0.33], dawn: [0.27, 0.23, 0.26] })[lookName]) },
      // the least light on the land: the sky's own colour at a set display luma under this look's grade (slate-blue in the slate look)
      // (by look: 34 in the two low-sun looks, just over the toe of the tone curve, under which the grade's contrast crushes
      // a tone to black; 42 in the squall and 46 in the slate look, whose light is flat and whose gorge floor lies in the
      // right wall's shade from end to end, so the floor is all the modelling the shaded rock has)
      uFloor: { value: (() => { const h = col(LK.hemiSky), k = toneInv(({ slate: 46, golden: 34, squall: 42, dawn: 34 })[lookName]) / lumOf(h); return new THREE.Vector3(h.r * k, h.g * k, h.b * k); })() },
      // (the sun's gain on the left wall above the right wall's shadow. Slate: 0.8 outside the break, a wall that faces the
      // sun under thin cloud; 2.0 inside it, the break's light at twice that, the step the lit crowns take beside it.
      // The other looks have no break: 0.85 throughout, the wall a tone under the open ground)
      uWall: { value: new THREE.Vector2(...(lookName === 'slate' ? [0.8, 2.0] : [0.85, 0.85])) },
      // the shade map (filled once the wood is planted; see "the shade map") and the fine wander of the waterline
      tShade: { value: null }, uShBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uShSun: { value: new THREE.Vector4(0, -1, 1, 0) }, uShK: { value: new THREE.Vector4(1, 1, 0, 0) },
      uEdge: { value: new THREE.Vector4(0, 0, 0, 0.045) },
      uWood: { value: new THREE.Vector3(72, 108, 9.5) }, crownRamp: [col('#000000'), col('#000000'), col('#000000'), col('#000000'), col('#000000')],
    };

    // THE SHADE MAP (see GLSL_SHADE): 768 x 176 texels over the gorge floor from the head of the gorge to the brink and 60 m
    // either side of the stream's two lines, 0.88 m to a texel: a trunk's shade, a metre and a half wide and soft, is two
    // texels. Made here empty, so every material has it from the start; filled in pieces once the wood is planted.
    const SHN = [768, 176], shBox = [-650, STREAM_Z - 60, 672, bendD + 124], shData = new Uint8Array(SHN[0] * SHN[1]);
    {
      const tex = new THREE.DataTexture(shData, SHN[0], SHN[1], THREE.RedFormat, THREE.UnsignedByteType);
      tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
      S.tShade.value = tex; S.uShBox.value.set(shBox[0], shBox[1], 1 / shBox[2], 1 / shBox[3]);
    }
    // the way this look's shadows fall, and their length for a metre of height: 1 / tan(the light's elevation)
    const shF = (() => { const hl = Math.hypot(sunDir.x, sunDir.z) || 1; return [-sunDir.x / hl, -sunDir.z / hl, hl / Math.max(sunDir.y, 0.05)]; })();
    // By look: [the most a lit gap's sun term is raised to (0: no sun, no shade), the sun left in full shade, the sun's
    // gain in the lit gaps, 1 where shade lives only inside the travelling break]. The squall has no sun. In the slate
    // look the deck leaves direct sun only inside the break. Why a gain: the floor of the gorge lies under the right
    // wall's soft shadow (uMgShade: 0.4 of the sun), so measured on the first pictures its direct sun was a quarter of
    // the sky's light on it and its shade showed as a tone 3% deeper. A gap is where the low sun comes through: there
    // the term is raised 3.4 times (3.25 at dawn, whose sun is redder and lower), which brings the floor's 0.4 to the
    // open sun and a third over (1.35; 1.3 at dawn; 1.6 inside the slate break, whose own gain on the crowns is 1.7),
    // and no further: a thing already in full sun (the left wall above the shadow, a fern) gains only that third. A
    // tenth of the sun is left in the deepest shade, so a dark bank under two crowns is violet-brown, not black.
    const SHK = ({ slate: [1.6, 0.1, 2.0, 1], golden: [1.35, 0.1, 3.4, 0], squall: [0, 1, 1, 0], dawn: [1.3, 0.1, 3.25, 0] })[lookName];
    S.uShSun.value.set(shF[0], shF[1], shF[2], SHK[0]); S.uShK.value.set(SHK[1], SHK[2], 0, SHK[3]);

    // ---------- the hero first: its anchors lay out the path ----------
    const hero = await buildHero(ctx, { palette: PALETTE, season, weather: lookName, gustLeaves: Math.round(33000 * lerp(0.86, 1.06, (density - 0.7) / 0.6) / (season === 'late' ? 1.12 : 1)), ribbonLeaves: 8000 });
    scene.add(hero.object);
    const A = hero.anchors;
    await ctx.yield();

    // ---------- the lie of the land ----------
    const GORGE_X0 = -650, GORGE_X1 = -545;      // the notch of the gorge opens in the upland at GORGE_X0 and is at its full width by GORGE_X1
    const zc = (x) => STREAM_Z + bendD * (1 - smoothstep(-540, -420, x));          // stream centre line
    const waterY = (x) => {                                                         // stream level
      if (x >= 0) return -1.5;
      if (x >= -420) return -1.5 - x * (27 / 420);
      if (x >= -560) { const t = (-420 - x) / 140; return 25.5 + 20.5 * (t + 0.04 * Math.sin(t * 18.85)); }
      return 46 + (-560 - x) * 0.012;
    };
    const halfW = (x) => 5.5 + 1.0 * noise.n2(x * 0.021, 4.4);                      // 9 to 13 m of water
    // The banks are not ruled lines: each wanders two or three metres in and out of the stream on its own (a bay, a point of
    // cobbles, a shelf standing into the current), from the head of the gorge to just short of the brink. Metres the foot
    // of this bank stands back from (+) or out into (-) the water at x: a rule in world coordinates.
    const bankW = (x, left) => {
      const w = 1.3 * noise.n2(x * 0.15 + (left ? 13.1 : 71.7), left ? 3.3 : 8.8) + 0.6 * noise.n2(x * 0.37 + (left ? 5.5 : 40.2), left ? 9.1 : 2.6);
      return (w > 0 ? 0.5 * w : 1.25 * w) * smoothstep(-650, -620, x) * (1 - smoothstep(-16, 0, x));
    };

    // camera path: level 11 m and more above the upland crowns, down into the head of the gorge, the run, the lip, the dive
    const zE = (STREAM_Z + bendD) / 0.8;                                            // the entry line runs straight at the maple
    const pp = [[-700, 80, zE], [-648, 80, zE * 648 / 700], [-596, 79.2, zE * 596 / 700]];
    pp.push([-560, 72.5, zc(-560) - 1], [-520, 59.5, zc(-520)], [-480, 45.5, zc(-480)], [-440, waterY(-440) + 5.6, zc(-440)]);
    for (const x of [-400, -340, -280, -220, -160, -120]) pp.push([x, waterY(x) + 5, STREAM_Z]);
    for (let i = 5; i < A.flyThrough.length; i++) { const p = A.flyThrough[i]; pp.push([p.x, p.y, p.z]); }
    const path = makePath(pp);
    const L = path.length;
    const tmpA = V3(), tmpB = V3(), tmpC = new THREE.Color(), tmpC2 = new THREE.Color();
    const deerU = 0.55, deerMid = path.posAtDist(deerU * L + 15, V3());              // the pale gravel bar on the left bank
    const barX0 = deerMid.x - 50, barX1 = deerMid.x + 52, barLat0 = 4.5, barLat1 = 15.5;
    S.uBar.value.set(barX0, barX1, 4.5, 15.5);
    // THE BAR'S WATERLINE wanders: bays and points of gravel 7 to 12 m long, a metre and more in and out (what the land's
    // mesh, 2.6 m to a cell, can carry; the scallops finer than that are drawn by the two shaders, see GLSL_EDGE). barWl is
    // the metres from the stream's centre line to the water's edge on the bar at world x: between hw + 0.45 and hw + 2.15
    // (a wander of 1.7 m from bay to point), so always inside the stream's ribbon, which reaches hw + 3.1. The same line
    // is in the height of the land, in the bar's mask (so in its colour and in every rule that asks "is this the bar")
    // and, through the land, in the stream. EDGE_W: the fine scallops are 4.5 cm of height, which on the beach's slope
    // of 7.5 cm to the metre is 0.6 m in and out; barShore is the line as it is drawn, both wanders together.
    const edgeR = own('baredge'), ePh = [edgeR.range(0, 6.28), edgeR.range(0, 6.28), edgeR.range(0, 6.28)], EDGE_W = 0.045;
    S.uEdge.value.set(ePh[0], ePh[1], ePh[2], EDGE_W);
    const barEdge = (x) => 0.55 * Math.sin(x * 0.52 + ePh[0] + 0.8 * Math.sin(x * 0.13 + ePh[1])) + 0.3 * Math.sin(x * 0.93 + ePh[2]);
    const barWl = (x) => halfW(x) + 1.3 + barEdge(x);
    const edgeFine = (x, z) => 0.51 * (Math.sin(x * 1.53 + ePh[0] + 0.9 * Math.sin(x * 0.37 + ePh[1])) + 0.6 * Math.sin(x * 2.71 + z * 0.9 + ePh[2]) + 0.35 * Math.sin(x * 4.9 - z * 1.7 + ePh[0] * 2));   // (GLSL_EDGE's mgEdge)
    const barShore = (x) => { const wl = barWl(x); return wl + (EDGE_W * edgeFine(x, STREAM_Z - wl) - 0.02) / 0.075; };
    const barAt = (x, z) => { const lat = STREAM_Z - z, wl = barWl(x); return smoothstep(barX0 - 8, barX0 + 6, x) * (1 - smoothstep(barX1 - 6, barX1 + 8, x)) * (1 - smoothstep(14, 16.5, lat)) * smoothstep(wl - 4.4, wl - 3.0, lat); };

    const upland = (x, z) => {
      const side = Math.abs(z - STREAM_Z);
      let u = 48.5 + 6.5 * noise.fbm2(x * 0.0035 + 11, z * 0.0035, 3) + 1.6 * noise.fbm2(x * 0.021, z * 0.021 + 5, 2) + 16 * smoothstep(110, 420, side) + 10 * smoothstep(-610, -410, x);
      const east = smoothstep(50, 250, x) * (1 - 0.72 * smoothstep(80, 210, side));
      return lerp(u, -57.2 + 2.5 * noise.fbm2(x * 0.012, z * 0.012 + 40, 2) + 9 * smoothstep(260, 420, x), east);
    };
    const gorge = (x, z, U) => {
      const dz = z - zc(x), d = Math.abs(dz), left = dz < 0, W = waterY(x), hw = halfW(x);
      const bar = barAt(x, z), hb = hw + bankW(x, left) * (1 - 0.8 * bar);
      const n1 = noise.n2(x * 0.013 + 3, left ? 7.7 : 1.3);
      const FW = (19 + 4.5 * n1) * lerp(0.36, 1, smoothstep(GORGE_X0, GORGE_X1, x)) + (left ? 26 * smoothstep(-90, -20, x) : 7 * smoothstep(-70, 0, x));
      const bumps = (0.45 * noise.fbm2(x * 0.09, z * 0.09, 2) + 0.3 * Math.max(0, noise.n2(x * 0.031 + 9, z * 0.031)) * smoothstep(hw + 3, hw + 9, d)) * smoothstep(hw, hw + 4, d) * (1 - bar);
      const floorAt = (dd) => {
        const f = W - 1.75 + 2.5 * smoothstep(hb - 1.6, hb + 2.8, dd) + 0.03 * Math.max(0, dd - hb - 3);
        if (!(bar > 0)) return f;
        // the bar is a low beach of gravel, not a bank: it rises 7.5 cm to the metre from its wandering waterline (with low
        // ridges of gravel across it), and shelves under the stream at 8.5 cm to the metre for two and a half metres, a
        // hand of water over its own cobbles, before it drops to the channel
        const t = dd - barWl(x), surf = W + 0.28 + lvl;
        const beach = t >= 0 ? surf + 0.02 + 0.075 * t + 0.05 * noise.n2(x * 0.3, z * 0.3 + 7) * smoothstep(0.6, 3, t) : surf + 0.085 * t - 1.5 * smoothstep(2.4, 4.2, -t);
        return lerp(f, beach, bar);
      };
      const ac = Math.abs(x - CASC_X);
      if (d <= FW) return Math.min(floorAt(d) + bumps - (left ? 0 : 0.6 * Math.exp(-ac * ac / 7) * smoothstep(hw + 0.5, hw + 3.5, d)), U);
      const f0 = floorAt(FW);
      if (U <= f0) return U;
      const RW = FW + 41 + 8 * noise.n2(x * 0.009 + 9, left ? 2.2 : 5.5);
      const q = clamp((d - FW) / (RW - FW), 0, 1);
      const s = Math.max(0, (q + 0.085 * noise.fbm2(x * 0.03 + (left ? 50 : 0), z * 0.03, 2)) * 3.3), fl = Math.floor(s), fr = s - fl;
      const stepped = Math.min(1, (fl + smoothstep(0.36, 0.7, fr)) / 3.3);           // risers and ledges
      const prof = Math.pow(clamp(lerp(q, stepped, 0.88), 0, 1), 0.8);
      const wall = Math.min(U, f0 + bumps * (1 - q) + (U - f0) * prof);
      if (left || ac > 70) return wall;
      // the side brook: it comes down a notch cut back through the upper ledges of the right wall, crosses the first tread in
      // a slot and falls over the first riser to the bank: a white ribbon on the dark wall, seen from far up the run
      const wallH = f0 + bumps * (1 - q) + (U - f0) * prof;
      const rf = wallH - 0.9 - (U - f0) * prof * 0.44 * smoothstep(9, 27, d - FW) * (1 - smoothstep(72, 112, d - FW));
      const w = 3.0 + 0.07 * (d - FW);
      return Math.min(wall, rf + 30 * smoothstep(w * 0.42, w * 3.4, ac + 1.6 * noise.n2(x * 0.07, z * 0.07 + 60)));
    };
    // the amphitheatre: a sheer headwall where the fall comes over (its brink stays at the lip), and round the sides four
    // strong benches stepping down to the pool, their widths wandering. Four: on the bowl's sides the wall is 38 m from
    // pool to rim on the plan and 109 m high, so each bench is a tread 6 to 7 m broad (10 m at the far end) over a riser
    // of 27 m: steps the size of the bowl itself, which the land's mesh (2.6 m and finer here) carries as broad level
    // floors, where six ledges were treads of 4 m that it carried as a ladder of thin lines.
    const AMPH_N = 4, amphWid = (x) => lerp(0.27, 0.74, smoothstep(13, 60, x));
    const amphWob = (x, z, p) => (0.55 * noise.fbm2(x * 0.021, z * 0.021 + 20, 2) + 0.22 * noise.n2(x * 0.07 + 3, z * 0.07)) * Math.min(1, 6.4 * p * (1 - p));
    const amphS = (x, z, re) => { const p = clamp((re - 1) / amphWid(x), 0, 1); return clamp(p * AMPH_N + amphWob(x, z, p), 0, AMPH_N); };
    const amph = (x, z, U) => {
      const re = Math.hypot((x - 90) / 74, (z - STREAM_Z) / 52);
      if (re <= 1) return POOL_Y + 0.5 - 5.5 * smoothstep(1.0, 0.72, re);
      const k = smoothstep(13, 38, x);
      let prof = 0;
      if (k < 1) {
        const p = clamp((re - 1) / 0.27 + 0.05 * noise.fbm2(x * 0.03, z * 0.03 + 20, 2), 0, 1);
        const s = p * 2.6, fl = Math.floor(s), fr = s - fl, stepped = Math.min(1, (fl + smoothstep(0.25, 0.75, fr)) / 2.6);
        prof = (1 - Math.pow(1 - clamp(lerp(p, stepped, 0.5), 0, 1), 2.6)) * (1 - k);
      }
      if (k > 0) {
        const p = clamp((re - 1) / amphWid(x), 0, 1);
        const s = amphS(x, z, re), fl = Math.floor(s), fr = s - fl;
        const stepped = Math.min(1, (fl + smoothstep(0.3, 0.6, fr)) / AMPH_N);      // tread, riser
        prof += clamp(lerp(p, stepped, 0.9), 0, 1) * k;
      }
      return lerp(POOL_Y + 0.5, U, prof);
    };
    const height = (x, z) => { const U = upland(x, z); return Math.min(gorge(x, z, U), amph(x, z, U)); };

    // ground colours (linear): dark cobble by the water, a pale bar for the deer, brown litter and moss under the trees.
    // Leaf-scale colour comes from the material (the flecks in sunPatch 'land') and from the litter instances.
    const cGravel = col('#827e74'), cGravelB = col('#5f5d58'), cPaleBar = col('#d6cfbc'), cBed = col('#3c382f');
    const cRust = col('#6e3c22'), cOchre = col('#8e6a30'), cBrown = col('#4c3626'), cMoss = col('#3a5530'), cScar = col('#7a3a26'), cFrost = col('#c9d2dc'), cUmber = col('#6e563c'), cLedge = col('#4c4d52'), cLedgeB = col('#3a3b40');
    const litterCol = (out, a, b) => {
      if (a < -0.25) out.copy(cBrown).lerp(cRust, 0.3 + b * 0.3); else if (a < 0.15) out.copy(cRust).lerp(cScar, 0.4 + b * 0.4); else if (a < 0.5) out.copy(cOchre).lerp(cRust, 0.5 + b * 0.5); else out.copy(cOchre).lerp(cBrown, 0.3 - 0.2 * b);
      return out.lerp(cUmber, 0.55).multiplyScalar(1.12);
    };
    const groundColor = (x, z, h, ny, out) => {
      const d = Math.abs(z - zc(x)), W = waterY(x);
      const n1 = noise.n2(x * 0.13, z * 0.13), n2 = noise.n2(x * 0.41 + 9, z * 0.41), n3 = noise.fbm2(x * 0.021, z * 0.021 + 3, 2);
      if (x > 12 && h < POOL_Y + 1.2) { out.copy(cBed).lerp(cGravelB, smoothstep(POOL_Y - 0.6, POOL_Y + 1.0, h) * 0.8); return out; }
      if (x < 14 && d < 30 && h < W + 3.2) {
        const bar = barAt(x, z), wet = 1 - smoothstep(W + 0.1 + lvl, W + 0.8 + lvl, h);
        out.copy(cGravel).lerp(cGravelB, 0.5 + 0.5 * n2).lerp(cPaleBar, bar * 0.92);
        const drift = smoothstep(-0.15, 0.4, n1 * 0.7 + n3 * 0.6) * smoothstep(W + 0.6, W + 1.3, h) * (1 - bar) * lateK;
        out.lerp(litterCol(tmpC, n2, n1), drift * 0.8);
        out.lerp(cMoss, smoothstep(0.3, 0.7, -n3 + 0.3 * n2) * 0.55 * (1 - bar) * (1 - drift));
        return out.multiplyScalar(lerp(1, 0.4, wet * (1 - 0.7 * bar)));
      }
      if (x > 12) {                                                                // the bowl's ledges: bare dark schist, leaves drifted against the back of each tread, moss where it seeps
        const re = Math.hypot((x - 90) / 74, (z - STREAM_Z) / 52), kb = smoothstep(1 + amphWid(x) + 0.12, 1 + amphWid(x) - 0.04, re) * smoothstep(12, 20, x);
        if (kb > 0) {
          const sA = amphS(x, z, re), frA = sA - Math.floor(sA), tr = frA >= 0.6 ? (frA - 0.6) / 0.7 : frA < 0.3 ? (frA + 0.4) / 0.7 : 1;   // across the tread: 0 its lip, 1 its back
          // (the tread is a broad pale floor from its lip to past its middle; at its back lies the talus off the riser
          // above, broken stone in patches: no dark band runs along the foot of the wall)
          const talus = smoothstep(0.72, 0.95, tr) * smoothstep(-0.35, 0.25, noise.n2(x * 0.23 + 60, z * 0.23));
          out.copy(cLedge).lerp(cLedgeB, 0.5 + 0.5 * n2).multiplyScalar((1.45 - 0.35 * smoothstep(0.35, 0.8, tr)) * (1 + talus * (0.1 + 0.3 * n2)));
          const drift = smoothstep(0.25, 0.7, n1 * 0.4 + n3 * 0.5 + 0.2 * noise.n2(x * 0.05 + 40, z * 0.05) + 0.75 * smoothstep(0.35, 0.9, tr)) * smoothstep(0.7, 0.92, ny) * (1 - 0.5 * smoothstep(0.9, 1, tr));
          out.lerp(litterCol(tmpC, n2, n1), drift * 0.85);
          out.lerp(cMoss, smoothstep(0.35, 0.7, -n3 + 0.4 * n2) * 0.5 * (1 - drift));
          if (lookName === 'dawn') out.lerp(cFrost, 0.2 * smoothstep(0.75, 0.95, ny));
          if (kb >= 1) return out;
          const keep = tmpC2.copy(out);
          litterCol(out, n1 + 0.5 * n3, n2); out.lerp(cMoss, smoothstep(0.2, 0.7, n3 - 0.4 * n1) * 0.55).multiplyScalar(0.62 + 0.16 * n2);
          return out.lerp(keep, kb);
        }
      }
      litterCol(out, n1 + 0.5 * n3, n2);
      out.lerp(cMoss, smoothstep(0.2, 0.7, n3 - 0.4 * n1) * 0.55);
      if (lookName === 'dawn') out.lerp(cFrost, 0.22 * smoothstep(0.75, 0.95, ny));
      return out.multiplyScalar((0.62 + 0.16 * n2) * (1 - 0.42 * smoothstep(80, 125, x)));          // under the closed wood beyond the bowl the floor is dark
    };
    await ctx.yield();

    const strata = T.makeStrata({ rng: R.fork('strata'), rock: '#5e5f62', rockB: '#454649', accent: '#66594c', dark: '#3c3c40', beds: 18, thickness: 3.4, base: -72, contrast: 0.9, seams: 0.2 });
    await ctx.yield();
    const amphFocus = [];                                                           // the ledges of the amphitheatre get the fine mesh too
    for (let k = 0; k < 10; k++) { const a = (k + 0.5) / 10 * Math.PI * 2, x = 90 + Math.cos(a) * 74 * 1.34, z = STREAM_Z + Math.sin(a) * 52 * 1.34; if (x > 24 && x < 170) amphFocus.push([x, z, 0.6]); }
    for (const k of [3, 9, 18, 30, 46, 66]) amphFocus.push([CASC_X, STREAM_Z + 21 + k, 0.45]);          // and the side ravine
    const terrain = await T.makeTerrainAsync({
      rng: R.fork('land'), noise, path, height, corridor: false, bounds: [-900, -340, 440, 372], cell: 2.6, near: 30, levels: 5, refine: 2, maxTriangles: 82000, focus: amphFocus,
      biome: 'meadow', palette: { rock: '#5c5d60', rockB: '#434447', rockSlope: [0.56, 0.78], strata: 0.66, strataScale: 3, bedRelief: 0.8, joints: 0.5, patch: '#6a5a40', patchAmount: 0.12, tufts: 0, pebbles: 0.75, cracks: 0.3, clouds: 0 },
      strata, color: groundColor, sunDir, shadow: lookName === 'slate' ? 0.5 : 0.56, ao: 0.34, skirt: 30, material: { bounce: lookName === 'slate' ? '#7888a8' : '#8a909c', bounceAmount: lookName === 'dawn' ? 7 : 6 },
    }, ctx.yield);
    sunPatch(terrain.material, S, 'land');
    // THE BENCHES, as the land is built: every corner of the land's mesh in the bowl carries its bench coordinate (whole
    // numbers on the treads, the fraction of the way up on each riser: the same stepped number its height is made from, so
    // between corners it follows the riser as it is meshed) and how far the land there is the bowl's stepped wall (0 in
    // the gorge and on the pool's floor, 1 round the sides). The rock of the bowl is drawn from these: see "THE BOWL".
    {
      const pa = terrain.geometry.attributes.position, nV = pa.count, bench = new Float32Array(nV * 2);
      for (let i = 0; i < nV; i++) {
        if ((i & 4095) === 4095) await ctx.yield();
        const x = pa.getX(i), z = pa.getZ(i); if (x < 13) continue;
        const re = Math.hypot((x - 90) / 74, (z - STREAM_Z) / 52); if (re <= 1) continue;
        const sA = amphS(x, z, re), fl = Math.floor(sA);
        bench[i * 2] = fl + smoothstep(0.3, 0.6, sA - fl); bench[i * 2 + 1] = smoothstep(13, 38, x);
      }
      terrain.geometry.setAttribute('aMgB', new THREE.BufferAttribute(bench, 2));
    }
    scene.add(terrain.object);
    const groundAt = (x, z) => terrain.surfaceAt(x, z);
    await ctx.yield();

    // ---------- water: the stream in spate, the horsetail, the pool ----------
    const Lw = Water.waterLight(sky);
    const skyZ = col(LK.sky.zenith).lerp(col(LK.sky.mid), 0.5).lerp(col(LK.sky.clouds.lit), 0.35), skyH = col(LK.sky.horizon).lerp(col(LK.sky.mid), 0.35);   // what still water mirrors: sky and cloud together
    const sunny = LK.patch[1] < 1 ? 0.75 : 1;
    const cDeep = col('#1c1610'), cBedStone = col('#9c7c54');
    const skyLane = skyH.clone().lerp(skyZ, 0.45), waterFloor = peat(25), runFloor = (() => { const c = toneInvC('#23262b', 27); return new THREE.Vector3(c.r * 0.9, c.g, c.b * 1.1); })();   // the run's channel: the palette's own dark, as this look's grade shows it
    // what the dark water takes from the sky: this look's own slate-blue (the sky's middle tone), as bright as the sky it mirrors
    const coolSky = (() => { const c = toneInvC('#55606c', 84); c.r *= 0.86; c.b *= 1.14; return c.multiplyScalar(lumOf(skyH.clone().lerp(skyZ, 0.3)) / Math.max(lumOf(c), 1e-4)); })();   // (the palette's cool, shown as itself whatever the look's grade adds)
    const surfY = (x) => waterY(x) + 0.28 + lvl;                                   // the mean plane of the stream's surface
    const streamLod = [], streamFar = [], farPos = [], farS = [], farD = [], farIdx = [];
    const skyCrest = skyH.clone().lerp(skyZ, 0.3), crestK = (toneInv(96) - toneInv(23)) / lumOf(skyCrest), whiteK = 2.7;
    {
      // Rows 0.7 m apart from the head of the cascades to the lip (the mesh itself carries the drops and the standing waves),
      // coarser above. Each vertex knows the depth of water over the bed under it, measured on the land as it is drawn, so
      // the waterline is the land's own: bays, points, stones. Built in pieces about a hundred metres long: those out of
      // sight are not drawn.
      const xs = []; for (let x = -770; x < -566; x += 2.5) xs.push(x); for (let x = -566; x < LIP_X + 0.3; x += 0.7) xs.push(x); xs.push(LIP_X + 0.3);
      const N = xs.length - 1, M = 16, rowS = new Float32Array(N + 1);
      for (let i = 0, sAcc = 0; i <= N; i++) { if (i) sAcc += Math.hypot(xs[i] - xs[i - 1], zc(xs[i]) - zc(xs[i - 1])); rowS[i] = sAcc; if (xs[i] <= -400) S.uS0.value.set(xs[i], sAcc); }
      const sMat = streamMaterial(S, { skyZ, skyH, wall: col('#3a332e').multiplyScalar(sunny), leafA: col('#b8481c').multiplyScalar(0.2 * sunny), leafB: col('#c88a28').multiplyScalar(0.21 * sunny), birch: col('#b8b2a4').multiplyScalar(0.42 * sunny),
        maple: col('#d02a1c').multiplyScalar(0.5), deep: cDeep, bed: cBedStone, floor: waterFloor, floorR: runFloor, cool: coolSky, laneK: (toneInv(60) - toneInv(23)) / lumOf(coolSky), sheenK: (toneInv(38) - toneInv(23)) / lumOf(coolSky), foam: lerp(0.2, 1, (density - 0.7) / 0.6), shade: LK.gorge[2] > 0.5 ? 0.4 : 1, leafDens: (season === 'late' ? 1.25 : season === 'early' ? 0.8 : 1) * lerp(0.85, 1.1, (density - 0.7) / 0.6) , crestK, whiteK });
      const cuts = [0]; for (let i = 1; i < N - 40; i++) if (xs[i] >= -566 && i - cuts[cuts.length - 1] >= 120) cuts.push(i); cuts.push(N);
      for (let c = 0; c < cuts.length - 1; c++) {
        const i0 = cuts[c], nr = cuts[c + 1] - i0 + 1, nv = nr * (M + 1);
        const pos = new Float32Array(nv * 3), aS = new Float32Array(nv * 4), aD = new Float32Array(nv), idx = [];
        for (let r = 0; r < nr; r++) {
          if ((r & 15) === 0) await ctx.yield();
          const x = xs[i0 + r], z = zc(x), y = surfY(x), hw = halfW(x), W2 = hw + 3.1;
          const slope = Math.max(0, (waterY(x - 1.5) - waterY(x + 1.5)) / 3);
          for (let j = 0; j <= M; j++) {
            const a = j / M * 2 - 1, k = r * (M + 1) + j, zz = z + W2 * a;
            pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = zz;
            aS[k * 4] = W2 * a; aS[k * 4 + 1] = rowS[i0 + r]; aS[k * 4 + 2] = slope; aS[k * 4 + 3] = hw;
            aD[k] = x > LIP_X - 0.4 ? 2 : y - groundAt(x, zz);
          }
          if (r < nr - 1) for (let j = 0; j < M; j++) { const a0 = r * (M + 1) + j, b0 = a0 + M + 1; idx.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 4)); g.setAttribute('aD', new THREE.BufferAttribute(aD, 1)); g.setIndex(idx);
        g.computeBoundingSphere(); g.boundingSphere.radius += 2.5;
        const stream = new THREE.Mesh(g, sMat); stream.renderOrder = 1; scene.add(stream);
        // the same piece for when it is more than 170 m off: every fourth row and every second column of the same corners
        // (the far pieces are gathered into one buffer, in order down the stream: the pieces far upstream of the lens are one
        // draw and those far downstream another, whatever their number)
        const rows = []; for (let r = 0; r < nr - 1; r += 4) rows.push(r); rows.push(nr - 1);
        const v0 = farPos.length / 3, MF = M / 2 + 1, f0 = farIdx.length;
        for (const r of rows) for (let j = 0; j <= M; j += 2) { const k = r * (M + 1) + j; farPos.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]); farS.push(aS[k * 4], aS[k * 4 + 1], aS[k * 4 + 2], aS[k * 4 + 3]); farD.push(aD[k]); }
        for (let q = 0; q < rows.length - 1; q++) for (let j = 0; j < MF - 1; j++) { const a0 = v0 + q * MF + j, b0 = a0 + MF; farIdx.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0); }
        streamLod.push({ near: stream, f0, f1: farIdx.length, x0: xs[i0], x1: xs[i0 + nr - 1] });
      }
      {
        const ix = new THREE.BufferAttribute(new Uint32Array(farIdx), 1), aP = new THREE.Float32BufferAttribute(farPos, 3), a4 = new THREE.Float32BufferAttribute(farS, 4), a1 = new THREE.Float32BufferAttribute(farD, 1);
        for (let k = 0; k < 2; k++) {
          const gf = new THREE.BufferGeometry();
          gf.setAttribute('position', aP); gf.setAttribute('aS', a4); gf.setAttribute('aD', a1); gf.setIndex(ix); gf.setDrawRange(0, 0); gf.boundingSphere = new THREE.Sphere(V3(-300, 20, STREAM_Z), 1);
          const mesh = new THREE.Mesh(gf, sMat); mesh.renderOrder = 1; mesh.visible = false; scene.add(mesh); streamFar.push(mesh);
        }
      }
      await ctx.yield();
    }
    {
      // the brook of the side ravine: a ribbon laid on the land from its head, down the five drops, across the bank to the stream
      const z0 = STREAM_Z + halfW(CASC_X) + 0.6, z1 = STREAM_Z + 19 + 4.5 * noise.n2(CASC_X * 0.013 + 3, 1.3) + 104, n = 170, pos = [], aC = [], idx = [];
      const ys = []; let run = -1e9;
      for (let i = 0; i <= n; i++) { const z = lerp(z0, z1, i / n); run = Math.max(run, Math.max(groundAt(CASC_X, z), groundAt(CASC_X - 1.2, z) - 0.3, groundAt(CASC_X + 1.2, z) - 0.3) + (i === 0 ? -0.2 : 0.3)); ys.push(run); }
      for (let i = 0; i <= n; i++) {
        const z = lerp(z0, z1, i / n), dzs = (z1 - z0) / n, sl = clamp((ys[Math.min(n, i + 1)] - ys[Math.max(0, i - 1)]) / (2 * dzs), 0, 1.2), hw2 = lerp(2.0, 2.9, smoothstep(0.1, 0.2, i / n)) * lerp(1, 0.6, smoothstep(0.3, 0.45, i / n));
        const wob = 0.9 * noise.n2(z * 0.09, 77);
        for (const a of [-1, 0, 1]) { pos.push(CASC_X + wob + a * hw2, ys[i] + (a === 0 ? 0.08 : 0), z); aC.push(a, (z - z0), sl); }
        if (i < n) { const k = i * 3; idx.push(k, k + 3, k + 1, k + 1, k + 3, k + 4, k + 1, k + 4, k + 2, k + 2, k + 4, k + 5); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(aC, 3)); g.setIndex(idx); g.computeBoundingSphere();
      const brook = new THREE.Mesh(g, cascadeMaterial(S, LK.gorge[2] > 0.5 ? 0.45 : 1, waterFloor)); brook.renderOrder = 1; scene.add(brook);
      await ctx.yield();
    }
    const fallTop = -1.22 + lvl;
    const fall = Water.makeWaterfall({ rng: R.fork('fall'), light: Lw, top: [LIP_X + 0.4, fallTop, STREAM_Z], height: fallTop - POOL_Y, width: 16, dir: [1, 0, 0], launch: 1.2,
      rainbow: 0, mistCount: Math.round(220 * lerp(0.7, 1, detail)), mistOpacity: 0.24, tint: '#5a4630', lipLength: 4, density: 0.62 });
    scene.add(fall.object);
    await ctx.yield();

    // the pool: mirror of the walls, foam, the spiral of leaves and its dark eye, the ducks' wakes, the ring's light
    const eye = V3(A.spiralEye.x, POOL_Y, A.spiralEye.z), seat = A.portalSeat.position;
    const portalCol = col(LK.portal);
    // the wood ducks fly down with us from the lip, left of the axis and a little below the lens; the wakes they pattered
    // across the pool lie where we see them from the lip: straight behind the birds
    const DUCK = { side: -2.6, up: -10.5, lead: 14, from: 0.852, to: 0.995 };
    const wr = R.fork('wakes'), wakes = [];
    {
      // from the lip (u 0.89) the birds, trailing 5 m behind their lead point, hang 57 degrees below the horizon and 15 to our left
      const c0 = path.posAtDist(0.89 * L, V3()), cx = c0.x + 35, cz = c0.z - 16;
      for (let i = 0; i < 8; i++) wakes.push(new THREE.Vector4(cx + ((i % 4) - 1.5) * 7.6 + wr.range(-1.5, 1.5) + Math.floor(i / 4) * 3.5, cz + (Math.floor(i / 4) - 0.5) * 11 + wr.range(-1.5, 1.5) - (i % 4) * 1.6, -2.62 + wr.range(-0.14, 0.14), wr.range(13, 18)));
    }
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(154, 110, 1, 1).rotateX(-Math.PI / 2), poolMaterial(S, portalCol.clone().multiplyScalar(0.5), eye, A.fallFoot, wakes,
      // (measured on the picture, the ring's glow and the bloom lay about 8 of luma over these: the body reads 30 to 40, the sheen to 50)
      { skyZ, skyH, floorLo: peat(19, 0.5), floorHi: peat(27, 0.5), sheenK: (toneInv(46) - toneInv(28)) / lumOf(skyLane), wakeC: new THREE.Vector3(wakes.reduce((t, w) => t + w.x, 0) / 8, wakes.reduce((t, w) => t + w.y, 0) / 8, 0), rock: col('#4a4f58'), leafA: col('#d8661c').multiplyScalar(sunny * (lookName === 'golden' ? 0.6 : 0.85)), leafB: col('#e89a20').multiplyScalar(sunny * (lookName === 'golden' ? 0.6 : 0.85)), body: col('#2c2218'), rim: lookName === 'squall' ? 0.42 : lookName === 'golden' ? 0.15 : 0.24 }));
    pool.position.set(90, POOL_Y, STREAM_Z); pool.renderOrder = 2; scene.add(pool);
    await ctx.yield();

    // small things on the banks are built in four reaches of the gorge and hidden while their reach is far from the lens
    let poolLeaves = null, rimWood = null, rimEdge = null, cobbleMeshes = null;
    // What stands beyond the brink is seen from the gorge only over the lip of the fall (x = LIP_X, the stream's own level
    // there: the banks beside it stand higher). Each thing there carries the slope of the sight line that clears the lip
    // and its own top with 2.5 m to spare; its list is sorted by that slope, and update() draws those the lens's own line
    // over the lip reaches. A rule in world coordinates: the lens's place, the lip's, the thing's.
    // And what the lens has left 60 m and more behind it on the way down the wind (we fly and look down +X as far as the
    // brink) is not drawn: each piece of the wood knows the x of its last tree.
    const pastOwn = [], pastKit = [];
    const xMaxOf = (m) => { let mx = -1e9; const a = m.instanceMatrix.array; for (let i = 0; i < m.count; i++) mx = Math.max(mx, a[i * 16 + 12]); m.userData.xMax = mx; return m; };
    const past = (m, cp) => cp.x < LIP_X && cp.x > m.userData.xMax + 60;
    const LIP_Y = -1.2, sightK = (x, top) => (LIP_Y - top - 2.5) / Math.max(x - LIP_X, 1), sightMeshes = [];
    const REACH = [[-640, -470], [-470, -310], [-310, -150], [-150, 10]], reachMeshes = REACH.map(() => []), pairMeshes = [[], []];   // (pairMeshes: drawn while either reach of the pair is)
    const reachOf = (x) => (x < -470 ? 0 : x < -310 ? 1 : x < -150 ? 2 : 3);

    // ---------- boulders with moss tops, white water round them ----------
    // a small deep-green cap of moss on each stone (rimed at dawn; a dusting of graupel in the squall), the flanks dark wet schist
    const mossCol = cHemlock.clone().lerp(col('#35552a'), 0.5).multiplyScalar(0.55);
    const squall = lookName === 'squall', rockK = squall ? 1.7 : 1;      // in the squall's flat light the stones are mid-grey wet schist, not holes
    const rockMat = sunPatch(T.makeRockMaterial({ terrain, top: lookName === 'dawn' ? mossCol.clone().lerp(cFrost, 0.4) : squall ? col('#aab2ba') : mossCol, topAmount: squall ? 0.72 : 0.8, topSlope: squall ? [0.8, 0.96] : [0.98, 1.16] }), S, 'terrain');    // (the kit adds up to 0.35 of noise to the slope, so a cap needs a bound over 1)
    // the boulders' own copy (same shader, so no new program): thick moss on every boulder top, as the design has it; the
    // cobbles and the gravel of the bar keep the thin cap
    const mossB = col('#3d5a26').lerp(cHemlock, 0.3).multiplyScalar(0.62);
    const rockMatB = sunPatch(T.makeRockMaterial({ terrain, top: lookName === 'dawn' ? mossB.clone().lerp(cFrost, 0.4) : squall ? col('#aab2ba') : mossB, topAmount: squall ? 0.72 : 0.88, topSlope: squall ? [0.8, 0.96] : [0.84, 1.06] }), S, 'terrain');
    await ctx.yield();
    const br = R.fork('boulders'), boulders = [], foamList = [];
    const flowAng = (x) => Math.atan2(zc(x + 1) - zc(x - 1), 2);
    // Boulders 2 to 5 m across stand in the current all the way down the gorge: one every 10 to 18 m of the flight line (a
    // rule in path distance with its own noise, the same from the head of the cascades to the brink), on alternate sides,
    // each as far from the line as its size needs and never on it; each with its pillow and its V. Where the pale bar
    // lies on its side of the water, the stone stands on the other.
    const xs = own('runstones');
    {
      const sA = path.nearestXZ(-585, zc(-585)).u * L, sB = path.nearestXZ(-16, STREAM_Z).u * L;
      let side = xs.sign();
      for (let sb = sA + xs.range(0, 8); sb < sB; sb += xs.range(10, 18), side = -side) {
        path.posAtDist(sb, tmpA);
        const x = tmpA.x, c = zc(x), hw = halfW(x), W = waterY(x) + lvl, r0 = 1.0 + 1.5 * Math.pow(xs(), 1.7), k = xs(), yaw = xs.range(0, 6.28), seed = xs();
        let done = false;
        for (let tries = 0; tries < 5 && !done; tries++) {
          const r = Math.max(1.0, r0 * Math.pow(0.82, tries)), y = W - 0.12 * r, dy = tmpA.y - y;
          const lo = Math.max(r + 1.4, Math.sqrt(Math.max(0, (4.7 + 1.1 * r) * (4.7 + 1.1 * r) - dy * dy))), hi = hw + 0.4;
          if (lo > hi) continue;
          const lat = lo + (hi - lo) * 0.7 * k;
          for (const sd of [side, -side]) {
            const z = c + sd * lat;
            if (done || barAt(x, z) > 0.15 || barAt(x, c + sd * (lat + r)) > 0.15 || Math.hypot(x, z) < 17.5) continue;
            const pn = path.nearestXZ(x, z);
            if (Math.hypot(pn.dist, pn.y - y) - r * 1.1 < 4.5) continue;
            boulders.push({ x, y, z, r, near: false, pd: pn.dist, inStream: true, yaw });
            foamList.push([x, surfY(x) + 0.05, z, r * 1.08, seed, flowAng(x)]);
            done = true;
          }
        }
      }
    }
    await ctx.yield();
    // The stones of chance, on the banks and a few in the water: 90 of them, fifteen to the hundred metres of the gorge's
    // 600 (its own count: it does not move with the number of the rule's stones). Half are tried in the water, and of
    // those about a third are kept (most of the stones in the water are the rule's): that thinning is drawn from the
    // rule stones' own stream, after its last stone, so this stream draws the same five numbers for every stone tried.
    const nChance = Math.round(90 * lerp(0.75, 1, detail));
    for (let i = 0, nPut = 0; i < 1400 && nPut < nChance; i++) {
      if ((i & 63) === 63) await ctx.yield();
      const x = br.range(-600, 5), c = zc(x), hw = halfW(x), sgn = br.sign(), wet = br.chance(0.5), inStream = wet && xs.chance(0.35);
      const lat = inStream ? br.range(3.2, hw + 1.2) : br.range(hw + 1, 19), z = c + sgn * lat, r = inStream ? br.range(0.9, 2.1) : br.range(0.7, 2.6);
      if (barAt(x, z) > 0.15 || Math.hypot(x, z) < 17.5) continue;
      let ok = true; for (const b of boulders) if (Math.hypot(b.x - x, b.z - z) < (b.r + r) * (inStream && b.inStream ? 2.6 : 1.25)) { ok = false; break; }
      if (!ok) continue;
      const W = waterY(x) + lvl, y = inStream ? W - 0.12 * r : height(x, z) + 0.22 * r;
      const pn = path.nearestXZ(x, z);
      if (Math.hypot(pn.dist, pn.y - y) - r * 1.1 < 4.5) continue;
      boulders.push({ x, y, z, r, near: false, pd: pn.dist, inStream, yaw: br.range(0, 6.28) }); nPut++;
      if (inStream) foamList.push([x, surfY(x) + 0.05, z, r * br.range(1.02, 1.14), br(), flowAng(x)]);
    }
    [...boulders].sort((p, q) => p.pd - q.pd).slice(0, 12).forEach((b) => { b.near = true; });   // the nearest to the lens get the detailed mesh
    for (let i = 0; i < 46; i++) {                                                  // talus at the foot of the amphitheatre
      const a = br.range(0, 6.283), re = br.range(0.985, 1.07), x = 90 + Math.cos(a) * 74 * re, z = STREAM_Z + Math.sin(a) * 52 * re, r = br.range(1.0, 3.0);
      if (x < 30) continue;
      boulders.push({ x, y: Math.max(height(x, z), POOL_Y - 0.5) + 0.2 * r, z, r, near: false, pd: 99, inStream: false, yaw: br.range(0, 6.28) });
    }
    await ctx.yield();
    {
      const geoN = T.rockGeometry({ rng: br, kind: 'boulder', radius: 1, detail: 3 }); await ctx.yield();
      const geoM = T.rockGeometry({ rng: br, kind: 'boulder', radius: 1, detail: 2 }); await ctx.yield();
      const geoF = T.rockGeometry({ rng: br, kind: 'boulder', radius: 1, detail: 1 }); await ctx.yield();
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
      const sets = [[geoF, boulders.filter((b) => !b.near && b.pd >= 11), -1]];
      for (let ri = 0; ri < REACH.length; ri++) sets.push([geoN, boulders.filter((b) => b.near && reachOf(b.x) === ri), ri], [geoM, boulders.filter((b) => !b.near && b.pd < 11 && reachOf(b.x) === ri), ri]);
      for (const [geo, list, ri] of sets) {
        if (!list.length) continue;
        const mesh = new THREE.InstancedMesh(geo, rockMatB, list.length); if (ri >= 0) reachMeshes[ri].push(mesh);
        list.forEach((b, i) => {
          e.set(br.range(-0.25, 0.25), b.yaw, br.range(-0.25, 0.25)); q.setFromEuler(e);
          const proud = b.inStream && b.x < -412 ? 1 : 0;                           // in the cascades the stones stand half a metre and more out of the water, paler where the spray keeps them clean
          mesh.setMatrixAt(i, m.compose(tmpA.set(b.x, b.y + proud * 0.32 * b.r, b.z), q, tmpB.set(b.r * br.range(1.0, 1.2), b.r * (b.inStream ? br.range(1.0, 1.25) : br.range(0.72, 0.9)), b.r * br.range(0.9, 1.1))));
          mesh.setColorAt(i, c.setScalar((b.inStream ? br.range(0.72, 1.0) : br.range(0.75, 1.15)) * rockK * (1 + 0.3 * proud)));
        });
        mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere();
        scene.add(mesh);
        await ctx.yield();
      }
    }
    await ctx.yield();
    {                                                                               // cobbles and drift stones on the bars, banks and ledges
      const n = Math.round(1000 * detail), geo = T.rockGeometry({ rng: br, kind: 'rock', radius: 1, detail: 0 });
      const capC = Math.ceil(n * 0.5), meshes = REACH.map(() => new THREE.InstancedMesh(geo, rockMat, capC + 780)), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();   // (room for the stones of the waterline, added below: one draw for both)
      cobbleMeshes = meshes;
      let k = 0;
      for (let i = 0; i < n * 5 && k < n; i++) {
        if ((i & 127) === 0) await ctx.yield();
        const x = br.range(-640, 8), hw = halfW(x), z = zc(x) + br.sign() * (hw + 0.2 + Math.pow(br(), 1.4) * 15), r = 0.12 + 0.46 * Math.pow(br(), 2.2);
        if (Math.hypot(x, z) < 13) continue;
        const y = groundAt(x, z); if (y < waterY(x) + lvl - 0.2) continue;
        e.set(br.range(0, 6.28), br.range(0, 6.28), br.range(0, 6.28)); q.setFromEuler(e);
        const mesh = meshes[reachOf(x)], ki = mesh.userData.n || 0; if (ki >= capC) continue;
        mesh.setMatrixAt(ki, m.compose(tmpA.set(x, y + r * 0.2, z), q, tmpB.set(r * br.range(1, 1.5), r * br.range(0.55, 0.8), r)));
        mesh.setColorAt(ki, c.setScalar(br.range(0.75, 1.45) * rockK)); mesh.userData.n = ki + 1; k++;
      }
      await ctx.yield();
      for (let i = 0; i < Math.round(190 * detail); i++) {                           // the bar is river gravel: pale stones over the silt
        const x = br.range(barX0 + 4, barX1 - 4), z = STREAM_Z - br.range(barLat0 + 0.4, barLat1 - 0.4), r = 0.1 + 0.3 * Math.pow(br(), 1.8), y = groundAt(x, z);
        e.set(br.range(0, 6.28), br.range(0, 6.28), br.range(0, 6.28)); q.setFromEuler(e);
        const mesh = meshes[reachOf(x)], ki = mesh.userData.n || 0; if (ki >= capC || y < waterY(x) + lvl - 0.1) continue;
        mesh.setMatrixAt(ki, m.compose(tmpA.set(x, y + r * 0.15, z), q, tmpB.set(r * br.range(1, 1.5), r * br.range(0.5, 0.75), r)));
        mesh.setColorAt(ki, c.setScalar(br.range(0.9, 1.5) * rockK)); mesh.userData.n = ki + 1;
      }
      meshes.forEach((mesh, i) => { mesh.count = mesh.userData.n || 0; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); scene.add(mesh); reachMeshes[i].push(mesh); });
    }
    {
      // the pillow, the hole and the V of every boulder in the water: one small lifted mesh each, drawn with its reach
      const cg = collarGeometry(), cMat = foamMaterial(S, { floor: runFloor, sky: coolSky, crestK, whiteK: whiteK * 0.9, shade: LK.gorge[2] > 0.5 ? 0.4 : 1 });
      for (let ri = 0; ri < 2; ri++) {
        const list = foamList.filter((f) => (reachOf(f[0]) >> 1) === ri); if (!list.length) continue;
        const g = new THREE.InstancedBufferGeometry();
        g.setIndex(cg.index); g.setAttribute('position', cg.position);
        const iF = new Float32Array(list.length * 4), iG = new Float32Array(list.length * 2);
        list.forEach((f, i) => { iF.set([f[0], f[1], f[2], f[3]], i * 4); iG.set([f[4], f[5]], i * 2); });
        g.setAttribute('iF', new THREE.InstancedBufferAttribute(iF, 4)); g.setAttribute('iG', new THREE.InstancedBufferAttribute(iG, 2));
        g.instanceCount = list.length;
        const foam = new THREE.Mesh(g, cMat); foam.frustumCulled = false; foam.renderOrder = 3; scene.add(foam); pairMeshes[ri].push(foam);
      }
    }
    await ctx.yield();

    // ---------- leaves on the river, in the spiral, loose on the pool, and lying in drifts on the banks ----------
    {
      const fr = R.fork('floaters'), late = season === 'late' ? 1.6 : season === 'early' ? 0.75 : 1;
      const nRiver = Math.round(1800 * detail * density), nSpiral = Math.round(5200 * lerp(1, detail, 0.5) * Math.min(late, 1.3)), nLoose = Math.round(1500 * detail * late), nLitter = Math.round(17500 * detail * Math.min(late, 1.3));
      const c = new THREE.Color(), groups = [[], [], [], [], [], []];                // 0: on the water; 1-4: litter of the four reaches
      let grp = groups[0];
      const brown = cOrange.clone().lerp(col(PALETTE[3]), 0.6);
      const leafCol = (wet) => {
        const t = fr();
        if (t < 0.34) c.copy(cCrimson).multiplyScalar(fr.range(0.6, 1)); else if (t < 0.56) c.copy(cCrimson).lerp(cOrange, 0.45); else if (t < 0.78) c.copy(cOrange).multiplyScalar(0.9);
        else if (t < 0.93) c.copy(cGold).multiplyScalar(0.85); else c.copy(brown);
        return c.multiplyScalar(fr.range(0.7, 1.05) * wet);
      };
      const put = (a, b, cc, size, kind, p1, p2, p3, wet) => { leafCol(wet); grp.push(a, b, cc, size, kind, p1, p2, p3, c.r, c.g, c.b); };
      for (let i = 0; i < nRiver; i++) put(fr.range(0, 441), fr.gauss() * 2.4, fr(), fr.range(0.13, 0.2), 0, fr.range(3.5, 6.5), fr.range(-1.2, 1.2), 0, 0.85);
      await ctx.yield();
      grp = groups[5];                                                           // the pool's own leaves: drawn once the pool is near
      for (let i = 0; i < nSpiral; i++) put(Math.floor(fr() * 2) * Math.PI + Math.PI / 4, fr(), fr.gauss() * 0.9, fr.range(0.15, 0.24), 1, fr.range(0.012, 0.02), fr.range(-0.3, 0.3), fr.gauss() * 0.22, 0.9);
      await ctx.yield();
      for (let i = 0; i < nLoose; i++) {
        const a = fr.range(0, 6.283), re = Math.sqrt(fr()) * 0.9;
        put(90 + Math.cos(a) * 74 * re, STREAM_Z + Math.sin(a) * 52 * re, fr(), fr.range(0.14, 0.22), 2, fr.range(0.4, 2.5), fr.range(-0.2, 0.2), 0, 0.85);
      }
      for (let i = 0, tries = 0; i < nLitter && tries < nLitter * 6; tries++) {
        if ((tries & 63) === 0) await ctx.yield();
        // drifts: most leaves lie in clumps in the lee of things, the rest are strewn
        const x = fr.range(-640, 9), c0 = zc(x), hw = halfW(x), sgn = fr.sign(), wide = sgn < 0 && x > -95 && fr.chance(0.6), lat = hw + 0.5 + (wide ? fr() * 46 : Math.pow(fr(), 1.5) * 17), z = c0 + sgn * lat;
        if (barAt(x, z) > 0.3 && fr.chance(0.8)) continue;
        if (noise.n2(x * 0.16 + 31, z * 0.16) < -0.15 && fr.chance(0.75)) continue;
        if (Math.hypot(x - 0.5, z + 1) < 12) continue;
        const y = groundAt(x, z); if (y < waterY(x) + lvl + 0.35) continue;
        grp = groups[1 + reachOf(x)];
        put(x, y, z, fr.range(0.13, 0.22), 3, fr.range(0, 6.28), fr.chance(0.35) ? fr.range(0.3, 1) : 0, fr(), 1); i++;
      }
      // Leaves stranded along the bar's waterline: the wrack the stream leaves as it laps, thickest in the bays, a line
      // that follows every scallop of the edge (barShore: the line as it is drawn). Their own stream: the litter above is
      // drawn exactly as before them. 340 leaves on a hundred metres of shore, wet and dark, lying flat.
      {
        const sr = own('strand'), nStrand = Math.round(340 * detail);
        for (let i = 0; i < nStrand; i++) {
          const x = sr.range(barX0 - 2, barX1 + 2), bay = smoothstep(-0.5, 0.6, barEdge(x)), keep = sr.chance(0.3 + 0.7 * bay);
          const lat = barShore(x) + 0.1 + Math.abs(sr.gauss()) * (0.25 + 0.3 * bay), z = STREAM_Z - lat, size = sr.range(0.12, 0.2), rot = sr.range(0, 6.28), t = sr(), k = sr.range(0.7, 1.0), ph = sr();
          if (!keep || barAt(x, z) < 0.5) continue;
          const y = groundAt(x, z); if (y < waterY(x) + lvl + 0.28) continue;
          if (t < 0.4) c.copy(cCrimson); else if (t < 0.7) c.copy(cCrimson).lerp(cOrange, 0.5); else if (t < 0.9) c.copy(cGold).multiplyScalar(0.85); else c.copy(brown);
          c.multiplyScalar(k);
          groups[1 + reachOf(x)].push(x, y, z, size, 3, rot, 0, ph, c.r, c.g, c.b);
        }
      }
      const fMat = floaterMaterial(S, eye);
      for (let gi = 0; gi < groups.length; gi++) {
        await ctx.yield();
        const G = groups[gi], k = G.length / 11; if (!k) continue;
        const iA = new Float32Array(k * 4), iB = new Float32Array(k * 4), iCol = new Float32Array(k * 3);
        for (let i = 0; i < k; i++) { for (let e = 0; e < 4; e++) { iA[i * 4 + e] = G[i * 11 + e]; iB[i * 4 + e] = G[i * 11 + 4 + e]; } for (let e = 0; e < 3; e++) iCol[i * 3 + e] = G[i * 11 + 8 + e]; }
        const g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute([-1.62, -1.02, 0, 1.62, -1.02, 0, 0, 2.22, 0], 3));
        g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3));
        g.instanceCount = k;
        const mesh = new THREE.Mesh(g, fMat); mesh.frustumCulled = false; scene.add(mesh);
        if (gi === 5) poolLeaves = mesh; else if (gi > 0) reachMeshes[gi - 1].push(mesh);
      }
    }
    await ctx.yield();

    // ---------- the wood ----------
    const wind = flora.makeWind({ direction: [1, 0.12], strength: LK.wind, speed: 1.5, gustScale: 0.03, gustiness: 0.75 });
    await ctx.yield();
    const leafOpts = { wind, backlight: 1.2, backlightTint: '#ffae58', wrap: 0.8, ambient: 2.2, leafAmbient: 1.9, sheen: 0.5, detail: 0.4 };
    if (flora.prepareLeafTexture) await flora.prepareLeafTexture(leafOpts, ctx.yield);   // the leaf atlas, in short steps (where the kit offers it)
    const leafMat = sunPatch(flora.windMaterial(leafOpts), S, 'flora');
    await ctx.yield();
    const gr = R.fork('treeGeo');
    const early = season === 'early', lateS = season === 'late', full = lateS ? 0.62 : 1;
    const palSugar = early ? { leaf: '#b8962a', leafLight: '#e8c84a', leafDark: '#3c4a16', gold: '#d8b030', crimson: '#c05a1c' } : { leaf: '#d8501c', leafLight: '#ffb23a', leafDark: '#5a1608', gold: '#f0a020', crimson: '#b0200f' };
    const palRed = { leaf: '#b81a14', leafLight: '#f0502a', leafDark: '#4a0a08', gold: '#d83a1c', crimson: '#8c0f0c' };
    const palGold = lateS ? { leaf: '#b8742a', leafLight: '#e0a850', leafDark: '#5a3410', gold: '#c88a30', crimson: '#a0561c' } : { leaf: '#e0a020', leafLight: '#ffe070', leafDark: '#7a4a0c', gold: '#f0c038', crimson: '#c8641a' };
    const palHem = { leaf: '#34594a', leafLight: '#6c9068', leafDark: '#1c3329', bark: '#5a483c', barkDark: '#2c221c' };
    const cellC = flora.LEAF_CELLS.cluster;
    const birchPal = (early ? [['#565a14', '#b4ae2a', '#e4dc5c'], ['#6a5a12', '#d0ac24', '#f4dc60']] : lateS ? [['#6a4a12', '#c4962c', '#e6c660']] : [['#7a5a10', '#e2b020', '#ffe268'], ['#86560e', '#e69a1c', '#ffd254']]).map((P) => P.map((h) => col(h)));
    const BIRCH = [{ rings: 5, sides: 5, limbSides: 3, lobes: 4, cards: 12, card: 1.5, inner: 0.25 }, { rings: 8, sides: 6, limbSides: 3, lobes: 5, cards: 22, card: 1.1, inner: 0.3 }, { rings: 12, sides: 8, limbSides: 4, lobes: 5, cards: 30, card: 0.95, inner: 0.3 }];
    // every broadleaf here is this world's own: crowns quilted from small leaf clusters at three levels of detail
    const qp = (p) => [col(p.leafDark), col(p.leaf), col(p.leafLight)], qx = (hex, lite) => [col(hex).multiplyScalar(0.4), col(hex), col(lite)];
    const palsSugar = [qp(palSugar), qp(palSugar), qx(palSugar.crimson, palSugar.leaf), qx(palSugar.gold, '#ffe07a')];
    const palsRed = [qp(palRed), qp(palRed), qx(palRed.crimson, palRed.leaf), qx(palRed.gold, palRed.leafLight)];
    const palsGold = [qp(palGold), qp(palGold), qx(palGold.gold, '#ffe890'), qx(palGold.crimson, palGold.leaf)];
    const MAPLE = [{ cards: 20, card: 1.45, inner: 0.25, limbs: 0 }, { cards: 30, card: 0.95, inner: 0.3, limbs: 3 }, { cards: 54, card: 0.68, inner: 0.3, limbs: 5 }];
    const mapleOf = (d, H, pals, thin) => quiltGeometry(gr, cellC, { ...MAPLE[d], H, R: 4.7, thin, bark: col('#33271f'), palettes: pals, kind: 'maple' });
    const makeSet = async (d) => {
      const set = [];
      set.push(mapleOf(d, 11.5, palsSugar, lateS ? 0.42 : 0.04)); await ctx.yield();
      set.push(mapleOf(d, 10.5, palsRed, lateS ? 0.28 : 0.04)); await ctx.yield();
      set.push(mapleOf(d, 11, palsGold, 0.04)); await ctx.yield();
      set.push(paperBirch(gr, cellC, { ...BIRCH[d], H: 14, R: 3.9, thin: lateS ? 0.35 : 0.06, palettes: birchPal })); await ctx.yield();
      set.push(flora.coniferGeometry({ rng: gr, detail: d, height: 18, droop: 1.15, slim: 1.05, ...palHem })); await ctx.yield();
      if (lateS) { set.push(flora.mapleGeometry({ rng: gr, detail: d, height: 11.5, foliage: false })); await ctx.yield(); }
      return set;
    };
    const setNear = await makeSet(2);
    const setMid = await makeSet(1), setFar = await makeSet(0);
    const GS = setMid.map((g) => ({ h: g.userData.height || 12, r: g.userData.radius || 4 }));
    // the crowns we skim at the entry: this world's own quilted maples (sugar, red, gold)
    const QS = { h: 19, r: 6.8 };
    const quiltOf = (pals) => quiltGeometry(gr, cellC, { H: QS.h, R: QS.r, card: 1.55, cards: 32, thin: lateS ? 0.3 : 0, bark: col('#3a2e28'), palettes: pals });
    const quiltSet = [];
    for (const pals of [palsSugar, palsRed, palsGold]) { quiltSet.push(quiltOf(pals)); await ctx.yield(); }

    // the emergent white pine at the head of the gorge: dark, whole, left of the axis, with the sky round it
    // (in a look whose break of sun has a gain on the crowns, patchGain, the pine's own colours are divided by that gain,
    // one plus patchGain: inside the break it takes the sun a crown takes in a look without the gain, and no more;
    // outside the break it is darker still. "stands dark above the canopy")
    const pineK0 = (lookName === 'squall' ? 1.7 : 1) / (1 + (LK.patchGain || 0));
    const pineGeo = whitePine(RX.fork('pine'), flora.LEAF_CELLS.needle, { H: 46, tiers: 5, cards: 30, card: 2.6, bark: col('#3c2c24'),
      palettes: [[col('#11241e').multiplyScalar(pineK0), col('#1f3c30').multiplyScalar(pineK0), col('#2c5040').multiplyScalar(pineK0)], [col('#0f201c').multiplyScalar(pineK0), col('#1b362c').multiplyScalar(pineK0), col('#28483a').multiplyScalar(pineK0)]] });
    await ctx.yield();
    const pineS = 0.12 * L + 60, pineP = path.posAtDist(pineS, V3()), pineT = path.tangentAtDist(pineS, V3()); pineT.y = 0; pineT.normalize();
    const pineLat = 29, pineX = pineP.x + pineT.z * pineLat, pineZ = pineP.z - pineT.x * pineLat;
    const pineG = groundAt(pineX, pineZ) - 0.4, pineK = clamp((path.posAtDist(0.12 * L, V3()).y + 12.5 - pineG) / 46, 0.6, 1.15);       // its top stands 12 m over the entry line
    const pine = new THREE.Mesh(pineGeo, leafMat); pine.position.set(pineX, pineG, pineZ); R.range(0, 6.28); pine.scale.setScalar(pineK); scene.add(pine);
    await ctx.yield();

    // the snag for the rare event: right bank, falls across the stream ahead of us
    const snagS = 0.62 * L + 36, snagP = path.posAtDist(snagS, V3()); snagP.z += 10.5; snagP.y = height(snagP.x, snagP.z);   // (its old place: kept as a small clearing, so the wood is laid out as before)
    // it stands 40 m ahead of the lens at u 0.62 and 9.5 m to the right, and falls across the stream and a little downstream
    const snagFS = 0.62 * L + 35, snagF = path.posAtDist(snagFS, V3()), snagT = path.tangentAtDist(snagFS, V3()); snagT.y = 0; snagT.normalize();
    snagF.x += -snagT.z * 9.5; snagF.z += snagT.x * 9.5; snagF.y = height(snagF.x, snagF.z);
    const snagD = V3(snagT.z * 0.819 + snagT.x * 0.574, 0, -snagT.x * 0.819 + snagT.z * 0.574);          // the way it falls: 35 degrees downstream of straight across

    const tr = R.fork('trees'), mainPts = [], nearPts = [], quiltPts = [], domePts = [], placed = [];
    const p0 = path.start, cT = A.crownCentre, nDome = Math.round(640 * detail), NEARCAP = 24, S_UP = 150, nQuilt = Math.round(138 * lerp(0.8, 1, detail));
    const far = (x, z, r) => { for (const q of placed) { const dx = q.x - x, dz = q.z - z, m = r + q.r; if (dx * dx + dz * dz < m * m) return false; } return true; };

    // paper birch in groups of three to five on the banks of the run: the colonnade, crowns arching over the stream
    const gB = GS[3];
    const addBirch = (x, z, left) => {
      const d = Math.abs(z - zc(x)), hw = halfW(x);
      if (d < hw + 2.4 || (z > STREAM_Z && x > CASC_X - 56 && x < CASC_X + 13) || barAt(x, z) > 0.05 || Math.hypot(x - 2, z + 2) < 27 || Math.hypot(x - snagP.x, z - snagP.z) < 7 || Math.hypot(x - pineX, z - pineZ) < 10) return;
      if (left && x > -420 && x > -430 * (1 - d / 18) - 15) return;                  // the heart of the maple is never behind a trunk
      const pn = path.nearestXZ(x, z), pd = pn.dist; if (pd < 7.4) return;
      const h = height(x, z); if (h > waterY(x) + 5.5 || pn.y - h > 8.5) return;
      const s = Math.min(tr.range(1.15, 1.5), (pd - 4.2) / gB.r); if (s < 0.88) return;
      if (!far(x, z, 1.3)) return;
      placed.push({ x, z, r: 1.3 });
      const pt = { x, y: h, z, s, rot: tr.range(0, 6.28), d: pd, pd, u: pn.u, v: 3 };
      if (pd < 10.5 && nearPts.length < NEARCAP) nearPts.push(pt); else mainPts.push(pt);
    };
    {
      const sOfX = (x) => path.nearestXZ(x, x < -440 ? zc(x) : STREAM_Z).u * L, sRun0 = sOfX(-505), sRun1 = sOfX(-24);
      for (const side of [1, -1]) {
        let sg = sRun0 + (side > 0 ? 4 : 20) + tr.range(0, 8);
        while (sg < sRun1) {
          path.posAtDist(sg, tmpA); path.tangentAtDist(sg, tmpB);
          const tl = Math.hypot(tmpB.x, tmpB.z) || 1, tx = tmpB.x / tl, tz = tmpB.z / tl, px = tmpA.x, pz = tmpA.z;
          const n = tr.chance(0.4) ? 4 : 3, onBar = side < 0 && px > barX0 - 10 && px < barX1 + 10;
          let lat0 = side > 0 ? tr.range(8.6, 9.8) : tr.range(9.0, 10.5);
          if (side < 0) lat0 = Math.max(lat0, onBar ? tr.range(17.5, 19) : 0, px > -420 ? 18 * (1 - (-px - 15) / 430) + 1.2 : 0);
          const gap = tr.range(2.4, 3.6);
          for (let k = 0; k < n; k++) {
            const al = (k - (n - 1) / 2) * gap + tr.range(-0.8, 0.8), lat = lat0 + (k === 0 ? 0 : tr.range(0, 3.4));
            addBirch(px + tx * al - tz * lat * side, pz + tz * al + tx * lat * side, side < 0);
          }
          sg += tr.range(25, 34);
        }
      }
    }
    await ctx.yield();

    // one candidate: returns 1 if a tree was planted, 2 for a far dome, 0 if the spot was refused
    const plant = (x, z, big) => {
      const pn = path.nearestXZ(x, z), pd = pn.dist, sT = pn.u * L, isDome = pd > 135;
      if (isDome && domePts.length >= nDome) return 0;
      const h = height(x, z);
      if (x > 14 && h < POOL_Y + 1.0) return 0;
      const c0 = zc(x), dz = z - c0, d = Math.abs(dz), left = dz < 0, W = waterY(x), hw = halfW(x);
      const inGorge = x < 13 && x > -575;
      if (d < hw + (inGorge ? 2.6 : 0.5) && x < 13) return 0;
      if (barAt(x, z) > 0.05 || Math.hypot(x - 2, z + 2) < 27) return 0;
      if (dz > 0 && d < 150 && (Math.abs(x - CASC_X) < 4.5 + 0.03 * d || (d < 36 && x > CASC_X - 56 && x < CASC_X + 13))) return 0;   // the brook's own bed, and the open bank from which its fall is seen
      if (inGorge && left && d < 27 && x > -420 + 13.65 * (d - 4.5)) return 0;       // no crown on the left bank may ever stand across the maple
      if (x > -625 && x < -425 && d < 11 + 7 * smoothstep(-610, -500, x)) return 0;  // the head of the gorge is open ledges and white water: the V we fly into
      if (Math.hypot(x - pineX, z - pineZ) < 12 || Math.hypot(x - snagP.x, z - snagP.z) < 9) return 0;
      const sl = Math.hypot(height(x + 1.6, z) - height(x - 1.6, z), height(x, z + 1.6) - height(x, z - 1.6)) / 3.2;
      if (sl > (isDome ? 1.4 : 0.9)) return 0;
      const onFloor = inGorge && h < W + 4.5 && d < 30, onWall = inGorge && !onFloor && d < 80 && h < upland(x, z) - 2;
      // species: 0 sugar maple, 1 red maple, 2 gold (beech / yellow birch tones), 3 birch, 4 hemlock, 5 bare
      const t = tr(); let v;
      if (onFloor) v = t < 0.2 ? 3 : t < 0.66 ? 1 : 4;
      else if (onWall) v = left ? (t < 0.5 ? 0 : t < 0.75 ? 2 : t < 0.9 ? 3 : 4) : (t < 0.58 ? 4 : t < 0.78 ? 3 : t < 0.9 ? 2 : 0);
      else v = t < 0.46 ? 0 : t < 0.58 ? 1 : t < 0.78 ? 2 : t < 0.9 ? 3 : 4;
      if (lateS && v === 0 && tr.chance(0.4)) v = 5;
      if (isDome) {
        const r = tr.range(4.6, 7.4);
        if (!far(x, z, r * 0.8)) return 0;
        placed.push({ x, z, r: r * 0.8 }); domePts.push({ x, y: h + r * tr.range(1.2, 1.9), z, r, v: v === 5 ? 2 : v });
        return 2;
      }
      if (sT < 250 && pd < 34 && (v === 3 || v === 4)) v = t < 0.5 ? 0 : 2;          // under the entry line everything is quilted maple
      const quilt = sT < 250 && pd < 64 && v <= 2 && !onFloor && quiltPts.length < nQuilt;
      if (!quilt && sT > S_UP - 20 && sT < 335 && pd < 16) return 0;
      const g = quilt ? QS : GS[v];
      let s = quilt ? tr.range(0.84, 1.14) : (v === 3 ? tr.range(1.1, 1.45) : v === 4 ? tr.range(0.95, 1.3) : tr.range(1.45, 1.9)) * (big ? 1.05 : 1);
      if (sT < S_UP) {                                                               // over the upland the crowns lie 11 m and more beneath us, rising gently to the sides
        const maxTop = pn.y - 11 + Math.max(0, pd - 14) * 0.45;
        if (h + g.h * s > maxTop) { s = (maxTop - tr.range(0, 1.5) - h) / g.h; if (s < (quilt ? 0.5 : 0.7)) return 0; }
      } else if (pd < g.r * s + 6.5 && h + g.h * s > pn.y - 6.3) {                   // not under us: it must arch overhead from a bank, or shrink beneath us
        const overhead = onFloor && pd >= 8.5 && h + g.h * s * 0.42 > pn.y + 2.2;
        if (overhead) { s = Math.min(s, (pd - 3.6) / g.r); if (s < 0.8) return 0; }
        else { s = Math.min(s, (pn.y - 6.3 - tr.range(0, 1.6) - h) / g.h); if (s < (quilt ? 0.5 : 0.72)) return 0; }
      }
      if (x < -30) {                                                                // keep the sight line from the entry to the maple open
        const k = (x - p0.x) / (cT.x - p0.x), lz = lerp(p0.z, cT.z, k), ly = lerp(p0.y, cT.y + 4, k);
        if (k > 0.03 && Math.abs(z - lz) < g.r * s + 5 && h + g.h * s > ly - 2.5) { s = Math.min(s, (ly - 2.5 - h) / g.h); if (s < (quilt ? 0.5 : 0.72)) return 0; }
      }
      const sp = quilt ? g.r * s * 0.6 : Math.max(3.0, g.r * s * (big ? 0.5 : 0.56)) + (pd > 60 ? 1.5 : 0);
      if (!far(x, z, sp)) return 0;
      placed.push({ x, z, r: sp });
      const pt = { x, y: h, z, s, rot: tr.range(0, 6.28), d: pd, pd, u: pn.u, v };
      if (quilt) quiltPts.push(pt);
      else if (inGorge && pd < 10.5 && nearPts.length < NEARCAP) nearPts.push(pt);
      else mainPts.push(pt);
      return 1;
    };
    const along = (s, lat) => { path.posAtDist(s, tmpA); path.tangentAtDist(s, tmpB); return [tmpA.x - tmpB.z * lat, tmpA.z + tmpB.x * lat]; };
    const kT = lerp(0.8, 1, detail);
    for (let i = 0, n = 0; i < 1400 && n < 110 * kT; i++) { if ((i & 31) === 0) await ctx.yield(); const [x, z] = along(tr.range(-40, 235), Math.pow(tr(), 0.8) * 34 * tr.sign()); if (plant(x, z, true) === 1) n++; }   // the quilt right under the entry line
    await ctx.yield();
    for (let i = 0, n = 0; i < 2000 && n < 140 * kT; i++) { if ((i & 31) === 0) await ctx.yield(); const [x, z] = along(tr.range(-45, 240), tr.range(20, 78) * tr.sign()); if (plant(x, z, true) === 1) n++; }          // the closed canopy either side of it
    await ctx.yield();
    for (let i = 0, n = 0; i < 2000 && n < 118 * kT; i++) { if ((i & 31) === 0) await ctx.yield(); const [x, z] = along(tr.range(150, L - 185), tr.range(8, 74) * tr.sign()); if (plant(x, z, false) === 1) n++; }   // the gorge
    await ctx.yield();
    for (let i = 0, n = 0; i < 3600; i++) { if ((i & 31) === 0) await ctx.yield(); const x = tr.range(-880, 420), z = tr.range(-320, 352), r = n < 80 * kT || path.nearestXZ(x, z).dist > 135 ? plant(x, z, false) : 0; if (r === 1) n++; }
    await ctx.yield();
    const rimPts = [];
    {
      const rr = RX.fork('rim'), nRim = Math.round(1050 * lerp(0.7, 1, detail));
      for (let i = 0; i < 5600 && rimPts.length < nRim; i++) {
        if ((i & 63) === 0) await ctx.yield();
        const x = rr.range(96, 345), z = STREAM_Z + rr.range(-140, 140), r = rr.range(4.2, 6.8), t = rr();
        if (Math.hypot((x - 90) / 74, (z - STREAM_Z) / 52) < 1 + amphWid(x) + 0.05 || !far(x, z, r * 0.6)) continue;
        const h = height(x, z); if (h < POOL_Y + 2.5) continue;
        placed.push({ x, z, r: r * 0.6 });
        rimPts.push({ x, y: h + r * rr.range(0.9, 1.5), z, r, v: t < 0.4 ? 0 : t < 0.6 ? 1 : t < 0.84 ? 2 : t < 0.92 ? 3 : 4 });
      }
    }
    await ctx.yield();
    // Black hemlock, and a yellow birch here and there, on the ledges of the shaded wall behind the side fall (the design's
    // "eastern hemlock, black-green, owns the shaded wall"): dark spires for the white fall and the flying leaves to be seen
    // against. A rule in world coordinates: the right wall from 80 m upstream of the brook's notch to x = -172, on every
    // tread flat enough to root in; upstream of the notch only the upper ledges (44 m and more from the stream, which is
    // above every sight line from the water to the fall), so the fall is still seen from far up the run.
    {
      const wr = own('wallwood'), nWall = Math.round(30 * kT);
      for (let i = 0, n = 0; i < 1200 && n < nWall; i++) {
        if ((i & 31) === 0) await ctx.yield();
        const x = wr.range(CASC_X - 80, -172), dzw = wr.range(21, 76), z = zc(x) + dzw, t = wr(), sc = wr.range(0.52, 0.86), rot = wr.range(0, 6.28);
        if (Math.abs(x - CASC_X) < 12 || (x < CASC_X && dzw < 44)) continue;
        const h = height(x, z); if (h < waterY(x) + 6.5 || h > upland(x, z) - 2.5) continue;
        const sl = Math.hypot(height(x + 1.6, z) - height(x - 1.6, z), height(x, z + 1.6) - height(x, z - 1.6)) / 3.2;
        if (sl > 0.6 || !far(x, z, 3.4)) continue;
        const pn = path.nearestXZ(x, z);
        placed.push({ x, z, r: 3.4 });
        mainPts.push({ x, y: h, z, s: t < 0.76 ? sc : sc * 1.5, rot, d: pn.dist, pd: pn.dist, u: pn.u, v: t < 0.76 ? 4 : 2 });
        n++;
      }
    }
    await ctx.yield();
    // nothing stands within reach of the snag's foot or under its fall
    for (const list of [nearPts, mainPts]) for (let i = list.length - 1; i >= 0; i--) {
      const q = list[i], dx = q.x - snagF.x, dz = q.z - snagF.z, al = dx * snagD.x + dz * snagD.z, ac = Math.abs(dx * snagD.z - dz * snagD.x);
      if (Math.hypot(dx, dz) < 6.5 || (al > 0 && al < 27 && ac < 4.5)) list.splice(i, 1);
    }
    await ctx.yield();
    // ---------- the banks: wet stones breaking the waterline at every stride, shelves of schist standing into the current ----------
    // Rules in world coordinates, the same from the head of the gorge to the brink. Every 0.9 m down each bank a stone is
    // set at the land's own waterline (found on the land as it is drawn), a little in or out of the water: most a hand to
    // a forearm across, one in seven a boulder's child. And every 18 to 30 m, on alternate banks, a shelf of the schist
    // itself: a slab dipping downstream, its upstream end proud of the bank, its foot in the water, moss on its top.
    {
      const xb = own('bankstones');
      const geoS = T.rockGeometry({ rng: xb, kind: 'rock', radius: 1, detail: 0 }); await ctx.yield();
      const geoL = T.rockGeometry({ rng: xb, kind: 'slab', radius: 1, detail: 2 }); await ctx.yield();
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
      const waterline = (x, side) => {               // metres from the centre line to where the drawn land meets the water on this side
        const cz = zc(x), wl = surfY(x); let lo = Math.max(1.5, halfW(x) - 3.4), hi = halfW(x) + 3.4;
        if (groundAt(x, cz + side * lo) > wl) return -1;
        for (let it = 0; it < 7; it++) { const mid = (lo + hi) / 2; if (groundAt(x, cz + side * mid) < wl) lo = mid; else hi = mid; }
        return (lo + hi) / 2;
      };
      const NCH = 8, stones = Array.from({ length: NCH }, () => []);
      let n = 0;
      for (let x = -640; x < 7; x += 0.9) for (const side of [-1, 1]) {
        if ((n++ & 31) === 0) await ctx.yield();
        const xx = x + xb.range(-0.4, 0.4), big = xb.chance(0.14), r = big ? xb.range(0.55, 1.05) : 0.14 + 0.4 * Math.pow(xb(), 2.0), off = xb.range(-0.9, 0.7) - (big ? 0.3 : 0);
        const rx = xb.range(0, 6.28), ry = xb.range(0, 6.28), rz = xb.range(0, 6.28), sx = xb.range(1, 1.5), sy = xb.range(0.55, 0.85), tone = xb.range(0.9, 1.55);
        const wl = waterline(xx, side); if (wl < 0) continue;
        const z = zc(xx) + side * (wl + off), g = groundAt(xx, z), wet = g < surfY(xx) + 0.25;
        if (g + r * sy * 0.95 < surfY(xx) + 0.06 || barAt(xx, z) > 0.4 || Math.hypot(xx, z) < 13) continue;       // it must break the water
        stones[clamp(Math.floor((xx + 640) / 81.25), 0, NCH - 1)].push([xx, g + r * 0.2, z, r, rx, ry, rz, sx, sy, tone * (wet ? 0.82 : 1.1)]);
      }
      geoS.dispose();                                                             // (the stones are drawn with the cobbles of their reach: the same stone, one draw)
      stones.forEach((list, ci) => {
        const mesh = cobbleMeshes[ci >> 1];
        for (const st of list) {
          const i = mesh.count; if (i >= mesh.instanceMatrix.count) break;
          e.set(st[4], st[5], st[6]); q.setFromEuler(e);
          mesh.setMatrixAt(i, m.compose(tmpA.set(st[0], st[1], st[2]), q, tmpB.set(st[3] * st[7], st[3] * st[8], st[3])));
          mesh.setColorAt(i, c.setScalar(st[9] * rockK)); mesh.count = i + 1;
        }
      });
      for (const mesh of cobbleMeshes) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); }
      await ctx.yield();
      const slabs = [[], []], trunks = [...nearPts, ...mainPts];
      let side = xb.sign();
      for (let x = -600 + xb.range(0, 15); x < -20; x += xb.range(18, 30), side = -side) {
        const r = xb.range(1.8, 2.8), yaw = xb.range(-0.45, 0.45), dip = xb.range(0.12, 0.3), roll = xb.range(-0.1, 0.16), thick = xb.range(0.5, 0.78), tone = xb.range(0.72, 1.0), out = xb.range(0.25, 0.6);
        const wl = waterline(x, side); if (wl < 0) continue;
        const z = zc(x) + side * (wl + out * r);
        if (barAt(x, z) > 0.2 || Math.abs(x - CASC_X) < 9) continue;
        let clear = true; for (const t of trunks) if (Math.abs(t.x - x) < 1.4 * r + 0.8 && Math.abs(t.z - z) < r + 0.8) { clear = false; break; }
        if (!clear) continue;
        slabs[reachOf(x) >> 1].push([x, surfY(x) + 0.02, z, r, yaw, dip, roll * side, thick, tone]);
      }
      slabs.forEach((list, ri) => {
        if (!list.length) return;
        const mesh = new THREE.InstancedMesh(geoL, rockMatB, list.length);
        list.forEach((sl, i) => {
          e.set(sl[6], sl[4], -sl[5], 'YZX'); q.setFromEuler(e);
          mesh.setMatrixAt(i, m.compose(tmpA.set(sl[0], sl[1], sl[2]), q, tmpB.set(sl[3], sl[3] * sl[7], sl[3])));
          mesh.setColorAt(i, c.setScalar(sl[8] * rockK));
        });
        mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere();
        scene.add(mesh); pairMeshes[ri].push(mesh);
      });
    }
    await ctx.yield();
    // ---------- the gust's two ribbons: where they run ----------
    // Ribbon A is the great one, at head height: down the left bank through the birch groups from the head of the run until
    // the bar comes into view, then down the right bank from the bar to the maple. It is laid dead through one trunk of each
    // group it meets, so it parts round the trunk and closes in a curl behind it. Ribbon B is thinner and rides low along the
    // right margin of the stream, lifting over each boulder in its way. The middle of the water, the birds ahead of the lens
    // and the animals on the bar are left clear.
    {
      const RDS = hero.gust.ribStep, nRib = Math.ceil(L / RDS) + 2, ribA = new Float32Array(nRib * 4), ribB = new Float32Array(nRib * 4);
      const frame = (s) => { path.posAtDist(clamp(s, 0, L), tmpA); path.tangentAtDist(clamp(s, 0, L), tmpB); const tl = Math.hypot(tmpB.x, tmpB.z) || 1; return [tmpA.x, tmpA.y, tmpA.z, -tmpB.z / tl, tmpB.x / tl]; };
      const latOf = (x, z, s) => { const f = frame(s); return (x - f[0]) * f[3] + (z - f[2]) * f[4]; };
      const sBar0 = path.nearestXZ(barX0, STREAM_Z).u * L;
      const spanAL = [0.255 * L, sBar0 - 32], spanAR = [0.585 * L, 0.785 * L], spanB = [0.27 * L, 0.775 * L];
      const xr = RX.fork('ribbons');
      const trunks = [...nearPts, ...mainPts].filter((q) => q.v === 3 && q.pd < 13).map((q) => ({ q, s: q.u * L, lat: latOf(q.x, q.z, q.u * L) }));
      const line = (cands, s0, s1, gap) => {                                        // nearest the water first, none nearer than gap to another
        const out = [];
        for (const c of [...cands].sort((a, b) => Math.abs(a.lat) - Math.abs(b.lat))) if (c.s > s0 && c.s < s1 && out.every((o) => Math.abs(o.s - c.s) >= gap)) out.push(c);
        return out.sort((a, b) => a.s - b.s);
      };
      // The ribbon must have a trunk to part round all the way down its bank. Wherever, along its whole span, the bank has
      // none within its reach for more than 46 m of path, a birch is planted there, one every thirty metres or so of the bare
      // stretch (a rule in path distance, the same from one end of the span to the other; the open bank under the side fall,
      // the bar, the snag's ground and the sight line to the great maple are kept clear as everywhere else)
      const plantGaps = (side, s0, s1) => {
        const have = trunks.filter((c) => c.lat * side > 7.2 && c.lat * side < 11.5 && c.s > s0 && c.s < s1).map((c) => c.s).sort((a, b) => a - b);
        const marks = [s0, ...have, s1];
        for (let i = 0; i < marks.length - 1; i++) {
          const gap = marks[i + 1] - marks[i]; if (gap <= 46) continue;
          const n = Math.floor(gap / 30);
          for (let k = 1; k <= n; k++) {
            const sT = marks[i] + gap * k / (n + 1), f = frame(sT), lat = side * xr.range(8.4, 9.4), x = f[0] + f[3] * lat, z = f[2] + f[4] * lat, h = height(x, z), d = Math.abs(z - zc(x));
            if (d < halfW(x) + 2.4 || h > waterY(x) + 5.5 || barAt(x, z) > 0.05 || !far(x, z, 1.3)) continue;
            if ((side > 0 && x > CASC_X - 56 && x < CASC_X + 13) || (side < 0 && x > -420 && x > -430 * (1 - d / 18) - 15)) continue;
            if (Math.hypot(x - snagF.x, z - snagF.z) < 7 || Math.hypot(x - snagP.x, z - snagP.z) < 7 || Math.hypot(x - 2, z + 2) < 27) continue;
            const q = { x, y: h, z, s: xr.range(1.2, 1.4), rot: xr.range(0, 6.28), d: Math.abs(lat), pd: Math.abs(lat), u: sT / L, v: 3 };
            nearPts.push(q); placed.push({ x, z, r: 1.3 });
            trunks.push({ q, s: sT, lat });
          }
        }
      };
      plantGaps(-1, spanAL[0], spanAL[1]); plantGaps(1, spanAR[0], spanAR[1]);
      const cpAL = line(trunks.filter((c) => c.lat < -7.2 && c.lat > -11.5), spanAL[0] - 10, spanAL[1] + 30, 21);
      const cpAR = line(trunks.filter((c) => c.lat > 7.2 && c.lat < 11.5), spanAR[0] - 10, spanAR[1] + 20, 21);
      for (const c of [...cpAL, ...cpAR]) c.q.rib = true;
      const stones = boulders.filter((b) => (b.inStream || b.pd < 9) && b.r > 0.95).map((b) => { const s = path.nearestXZ(b.x, b.z).u * L; return { b, s, lat: latOf(b.x, b.z, s) }; }).filter((c) => c.lat > (c.s < 0.48 * L ? 4.7 : 3.3) && c.lat < 7.6);   // clear of the songbirds while they escort
      const cpB = line(stones, spanB[0] - 10, spanB[1] + 20, 15);
      for (const c of cpB) c.b.rib = true;
      const through = (cps, s, rest) => {                                           // eased from one control point to the next
        if (!cps.length) return rest;
        if (s <= cps[0].s) return lerp(rest, cps[0].lat, smoothstep(cps[0].s - 14, cps[0].s, s));
        for (let i = 0; i < cps.length - 1; i++) if (s <= cps[i + 1].s) return lerp(cps[i].lat, cps[i + 1].lat, smoothstep(cps[i].s, cps[i + 1].s, s));
        return lerp(cps[cps.length - 1].lat, rest, smoothstep(0, 14, s - cps[cps.length - 1].s));
      };
      for (let i = 0; i < nRib; i++) {
        if ((i & 31) === 0) await ctx.yield();
        const s = i * RDS, f = frame(s);
        const dL = smoothstep(spanAL[0], spanAL[0] + 26, s) * (1 - smoothstep(spanAL[1] - 28, spanAL[1], s)), dR = smoothstep(spanAR[0], spanAR[0] + 24, s) * (1 - smoothstep(spanAR[1] - 26, spanAR[1], s));
        const right = s > (spanAL[1] + spanAR[0]) / 2;
        const lat = right ? through(cpAR, s, 9.2) : through(cpAL, s, -8.8), gx = f[0] + f[3] * lat, gz = f[2] + f[4] * lat;
        const hgt = Math.max((right ? 1.1 : 0.6) + 0.45 * Math.sin(s * 0.052 + (right ? 2 : 0)), groundAt(gx, gz) + 2.4 - f[1]);     // at the height of the lens: seen against the walls, not against the litter
        ribA.set([lat, hgt, right ? dR : dL, 0.9], i * 4);
        const dB = smoothstep(spanB[0], spanB[0] + 24, s) * (1 - smoothstep(spanB[1] - 26, spanB[1], s)) * (1 - 0.5 * smoothstep(0.455 * L, 0.48 * L, s) * (1 - smoothstep(0.58 * L, 0.61 * L, s)));
        const latB = through(cpB, s, 6.2), bx = f[0] + f[3] * latB, bz = f[2] + f[4] * latB;
        let hB = Math.max(waterY(bx) + lvl + 0.28, groundAt(bx, bz)) + 1.45 + 0.25 * Math.sin(s * 0.09) - f[1];
        for (const c of cpB) { const k = Math.exp(-((s - c.s) * (s - c.s)) / 11); if (k > 0.01) hB = Math.max(hB, lerp(hB, c.b.y + c.b.r * 1.3 + 0.75 - f[1], k)); }
        ribB.set([latB, hB, dB, 0.3], i * 4);
      }
      hero.gust.setRibbons({ n: nRib, a: ribA, b: ribB });
    }
    await ctx.yield();
    // ---------- the shade map: what the wood casts on the floor of the gorge ----------
    // One map of the gorge seen from above (SHN texels over shBox, made empty with the materials). Every tree of the wood
    // that is planted is thrown onto the plane a metre over the stream, along the way this look's sun falls, by its
    // height over that plane / tan(the sun's elevation): the crown as an ellipse (as wide as the crown, as long as its
    // depth is thrown), soft over the outer quarter, with holes where the light comes through the leaves; the trunk as
    // a soft streak a metre wide from the foot's shade to the crown's. Where shades overlap the light left is their
    // product. The map multiplies the direct sun only (GLSL_SHADE: land, litter, stream, ferns and sedge, animals,
    // floating leaves); a point above the plane looks its shade up where its own ray to the sun meets the plane.
    // Nothing is placed by it and it is made once: only the look-up breathes, with the wind.
    if (SHK[0] > 0) {                                                              // (a look without a sun casts none: the squall's map stays empty)
      const NX = SHN[0], NZ = SHN[1], T = new Float32Array(NX * NZ).fill(1), kx = NX / shBox[2], kz = NZ / shBox[3], F0 = shF[0], F1 = shF[1], cot = shF[2];
      const planeY = (x) => waterY(x) + 1, thin = lateS ? 0.7 : 1;
      const crown = (cx, cy, cz, r, ry, a, hole) => {
        const hc = Math.max(cy - planeY(cx), 0), sx = cx + F0 * hc * cot, sz = cz + F1 * hc * cot, al = Math.hypot(r, ry * cot), ext = Math.max(r, al);
        if (sx + ext < shBox[0] || sx - ext > shBox[0] + shBox[2] || sz + ext < shBox[1] || sz - ext > shBox[1] + shBox[3]) return false;
        const i0 = Math.max(0, Math.floor((sx - ext - shBox[0]) * kx)), i1 = Math.min(NX - 1, Math.ceil((sx + ext - shBox[0]) * kx));
        const j0 = Math.max(0, Math.floor((sz - ext - shBox[1]) * kz)), j1 = Math.min(NZ - 1, Math.ceil((sz + ext - shBox[1]) * kz));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const wx = shBox[0] + (i + 0.5) / kx, wz = shBox[1] + (j + 0.5) / kz, dx = wx - sx, dz = wz - sz;
          const u = (dx * F0 + dz * F1) / al, v = (dz * F0 - dx * F1) / r, rho2 = u * u + v * v;
          if (rho2 >= 1) continue;
          const o = a * (1 - smoothstep(0.72, 1, Math.sqrt(rho2))) * (1 - hole * smoothstep(-0.2, 0.2, noise.n2(wx * 0.42 + 31, wz * 0.42 + 7)));
          T[j * NX + i] *= 1 - o;
        }
        return true;
      };
      const trunk = (bx, by, bz, cy) => {
        const h0 = Math.max(by - planeY(bx), 0), h1 = Math.max(cy - planeY(bx), h0);
        const x0 = bx + F0 * h0 * cot, z0 = bz + F1 * h0 * cot, x1 = bx + F0 * h1 * cot, z1 = bz + F1 * h1 * cot, len2 = Math.max((x1 - x0) * (x1 - x0) + (z1 - z0) * (z1 - z0), 1e-3);
        const i0 = Math.max(0, Math.floor((Math.min(x0, x1) - 1.5 - shBox[0]) * kx)), i1 = Math.min(NX - 1, Math.ceil((Math.max(x0, x1) + 1.5 - shBox[0]) * kx));
        const j0 = Math.max(0, Math.floor((Math.min(z0, z1) - 1.5 - shBox[1]) * kz)), j1 = Math.min(NZ - 1, Math.ceil((Math.max(z0, z1) + 1.5 - shBox[1]) * kz));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const wx = shBox[0] + (i + 0.5) / kx, wz = shBox[1] + (j + 0.5) / kz, t = clamp(((wx - x0) * (x1 - x0) + (wz - z0) * (z1 - z0)) / len2, 0, 1);
          const d = Math.hypot(wx - lerp(x0, x1, t), wz - lerp(z0, z1, t));
          if (d < 1.2) T[j * NX + i] *= 1 - 0.85 * (1 - smoothstep(0.35, 1.2, d));
        }
      };
      let n = 0;
      const tree = async (p, g, quilt) => {
        if ((n++ & 63) === 63) await ctx.yield();
        const v = quilt ? 0 : p.v, H = g.h * p.s, R0 = g.r * p.s;
        // (the crown's centre, radius and depth by its kind: broadleaf, birch (a light crown), hemlock (a deep cone, dense), bare)
        const cy = p.y + H * (v === 3 ? 0.72 : v === 4 ? 0.5 : 0.64), r = R0 * (v === 4 ? 0.8 : 0.92), ry = H * (v === 3 ? 0.24 : v === 4 ? 0.42 : 0.3);
        if (crown(p.x, cy, p.z, r, ry, (v === 3 ? 0.62 : v === 4 ? 0.92 : v === 5 ? 0.22 : 0.86) * (v === 4 ? 1 : thin), v === 4 ? 0.3 : v === 3 ? 0.75 : 0.6)) trunk(p.x, p.y, p.z, cy);
      };
      for (const p of nearPts) await tree(p, GS[p.v], false);
      for (const p of mainPts) await tree(p, GS[p.v], false);
      for (const p of quiltPts) await tree(p, QS, true);
      await ctx.yield();
      { const rT = (A.crownTop.y - A.crownCentre.y) * 1.25; if (crown(cT.x, cT.y, cT.z, rT, rT * 0.8, 0.7, 0.5)) trunk(0, groundAt(0, 0), 0, cT.y); }   // the great maple
      { const hP = 46 * pineK; if (crown(pineX, pineG + hP * 0.62, pineZ, 6.5 * pineK, hP * 0.3, 0.9, 0.3)) trunk(pineX, pineG, pineZ, pineG + hP * 0.62); }   // the pine
      await ctx.yield();
      for (let i = 0; i < T.length; i++) shData[i] = Math.round(255 * (1 - T[i]));
      S.tShade.value.needsUpdate = true;
    }
    await ctx.yield();
    // ---------- the crown bursts: which trees throw a plume into the stream as the front reaches them ----------
    // "Each tree bursts as the front reaches it: the crown heaves, flashes its pale undersides and throws a plume of leaves
    // into the stream." Every plant heaves and flashes and every broadleaf crown near the flight line thins by a third (the
    // wind material, sunPatch 'flora'); the plumes are thrown by one broadleaf tree every nine or ten metres of the way, from
    // where the gorge has opened to its full width (GORGE_X1: the edge of the upland, a place) to fifty metres short of the
    // great maple, each in its own leaf colours. A plume is thrown
    // ahead of the front and gathered into a line over the water on its own side of the flight line, so none crosses it. The
    // side the gaze is turned to is left clear: no right-bank plume in the air between us and the side fall, no left-bank
    // plume near the animals on the bar; on the last of the straight the plumes keep out to their own bank, off the sight
    // line to the great maple.
    const treeS = path.nearestXZ(0, STREAM_Z).u * L;
    const burstTrees = [];
    {
      const xb = own('bursts'), sA = path.nearestXZ(GORGE_X1, zc(GORGE_X1)).u * L, sB = treeS - 50;
      const frameAt = (s) => { path.posAtDist(clamp(s, 0, L), tmpA); path.tangentAtDist(clamp(s, 0, L), tmpB); const tl = Math.hypot(tmpB.x, tmpB.z) || 1; return [tmpA.x, tmpA.y, tmpA.z, tmpB.x / tl, tmpB.z / tl]; };
      // Which trees may burst: a rule of where the tree stands in the world.
      // Right bank: none from 190 m upstream of the side fall (the fall is seen as a white ribbon on the wall from that far
      // up the run, and a plume there would fly in the air between us and it) to 12 m past it (the width of its notch).
      // Left bank: none beside the animals' bar, over the bar's whole length as its own mask has it (8 m past either end),
      // so no plume is thrown across the deer or the moose; and none within 150 m of the way of the great maple, where the
      // left bank is the side the tree's own cloud of leaves comes off.
      const allow = (x, s, side) => (side < 0 ? (x < barX0 - 8 || x > barX1 + 8) && s <= treeS - 150 : x < CASC_X - 190 || x > CASC_X + 12);
      const cands = [];
      const consider = (p, g, quilt) => {
        if (p.v > 3) return;
        const s = p.u * L; if (s < sA - 5 || s > sB + 5 || p.pd < 7.2 || p.pd > 30) return;
        const f = frameAt(s), lat = (p.x - f[0]) * -f[4] + (p.z - f[2]) * f[3], side = lat < 0 ? -1 : 1;
        if (!allow(p.x, s, side)) return;
        cands.push({ p, s, lat, side, g, quilt, used: false });
      };
      for (const p of nearPts) consider(p, GS[p.v], false);
      for (const p of mainPts) consider(p, GS[p.v], false);
      for (const p of quiltPts) consider(p, QS, true);
      const chosen = [];
      const pick = (sT, tol) => {
        let best = null, bc = 1e9;
        for (const c of cands) { if (c.used || Math.abs(c.s - sT) > tol || chosen.some((o) => Math.abs(o.s - c.s) < 5)) continue; const cost = Math.abs(c.s - sT) + 0.3 * Math.abs(Math.abs(c.lat) - 12); if (cost < bc) { bc = cost; best = c; } }
        if (best) { best.used = true; chosen.push(best); }
        return best;
      };
      // one every ten metres of the way, from the edge of the upland to the last tree before the great maple: the nearest
      // standing broadleaf to each mark (none is planted for this, so the wood is as it was). A rule in path distance only:
      // since the front rides 25 m ahead of us and a plume lives for forty to sixty metres of its travel, two or three
      // trees ahead of the lens are in mid-burst wherever we are on the way down
      for (let s = sA; s <= sB; s += 10) if (!chosen.some((c) => Math.abs(c.s - s) < 5)) pick(s, 5) || pick(s, 8.5);
      const mul = (c, k) => c.clone().multiplyScalar(k);
      const colsOf = [[col(palSugar.leaf), mul(col(palSugar.leafLight), 0.8), col(palSugar.crimson), mul(col(palSugar.gold), 0.9)], [col(palRed.leaf), mul(col(palRed.leafLight), 0.9), col(palRed.crimson)],
        [mul(col(palGold.leaf), 0.9), mul(col(palGold.gold), 0.85), mul(col(palGold.leafLight), 0.75)], [mul(birchPal[0][1], 0.9), mul(birchPal[0][2], 0.75), mul(birchPal[birchPal.length - 1][1], 0.8)]];
      const cUnder = col('#f2dcae');                 // seen from above on the descent, a plume shows the pale undersides of its leaves: its own colours, paler
      const nLeaf = 900 * lerp(0.6, 1, detail) * lerp(0.9, 1.08, (density - 0.7) / 0.6);
      for (const c of chosen) {
        const p = c.p, g = c.g, birch = !c.quilt && p.v === 3, f = frameAt(c.s);
        const cy = p.y + g.h * p.s * (birch ? 0.72 : 0.64), r = g.r * p.s * 0.92, ry = g.h * p.s * (birch ? 0.24 : 0.3);
        // the stream line its leaves join: over the water on its own side of the flight line. We look straight downwind, so
        // a plume along its own bank would lie on the row of crowns: in the gorge the line is close to the axis and above
        // the lens, which draws the plume out of the crown across the open sky; on the descent, where the crowns are below
        // us by six metres and more, the gust's stream runs at our own height: the burst is torn out of the crown in one
        // breath (tight) and thrown up into it on the tree's own side (never at the lens), so it stands as a spray from the
        // crown to the line of the far hills, a mass three metres through (fan), in the crown's own colours
        const dyc = cy - f[1], below = dyc < 0;
        const up = smoothstep(4, 9, -dyc), lt = c.side * (below ? lerp(xb.range(2.6, 5.4) + 0.9 * up, Math.abs(c.lat), 0.55) : lerp(xb.range(1.4, 3.0), xb.range(4.2, 5.6), smoothstep(treeS - 190, treeS - 130, c.s)));
        const ht = (below ? lerp(clamp(dyc + 5.5, -17.0, -2.8), clamp(dyc + 14.0, -6.0, 0.8), up) : clamp(dyc * 0.7, 4.6, 7.2)) + xb.range(-0.3, 0.3);
        burstTrees.push({ c: [p.x, cy, p.z], r, ry, s: c.s, t: [f[3], f[4]], lat: lt, hgt: ht, n: Math.round(nLeaf * clamp(r / 5.5, 0.8, 1.25) * (below ? 1 + 0.6 * up : 1)), cols: below ? colsOf[p.v].map((k) => k.clone().lerp(cUnder, 0.06).multiplyScalar(1.12)) : colsOf[p.v], size: below ? lerp(1.35, 1.05, up) : 1, tight: below ? 0.42 : 1, fan: below ? [lerp(1.5, 1.0, up), lerp(1.0, 0.75, up)] : null });
      }
    }
    await ctx.yield();
    await hero.setBursts(burstTrees, own('burstLeaves'));
    await ctx.yield();
    // three bands of detail: beside the run, close trees carry the full crown and swap to the light one at a distance
    // (a hemlock of the far wood that stands east of the brink, round the bowl, is not in the far wood's list: it stands
    // once, in the ledge wood below, as the dark hemlock with drooping tiers)
    const bowlSide = (p) => p.v === 4 && p.x > 13 && p.x < 215 && Math.abs(p.z - STREAM_Z) < 120;
    const runPts = mainPts.filter((p) => p.d < 34), farPts = mainPts.filter((p) => p.d >= 34 && !bowlSide(p)), bowlHem = mainPts.filter((p) => p.d >= 34 && bowlSide(p));
    const scat = (name, points, variants, chunks, cull) => flora.makeScatter({ rng: R.fork(name), points, variants, material: leafMat, chunks, cullDistance: cull, sink: 0.02, tilt: 0.04, tint: 0.2, hue: 0.07 });
    const forest = scat('forest', farPts, setFar, 9, 285); await ctx.yield();
    const runWood = scat('runwood', runPts, setMid, 14, Infinity); await ctx.yield();
    const runWoodFar = scat('runwood', runPts, setFar, 14, Infinity); await ctx.yield();
    const nearWood = scat('nearwood', nearPts, setNear, 8, Infinity); await ctx.yield();
    const nearWoodFar = scat('nearwood', nearPts, setFar, 8, Infinity); await ctx.yield();
    const quiltWood = flora.makeScatter({ rng: R.fork('quilt'), points: quiltPts, variants: quiltSet, material: leafMat, chunks: 7, cullDistance: 300, sink: 0.02, tilt: 0.03, tint: 0.2, hue: 0.07 });
    await ctx.yield();
    scene.add(runWood.object, runWoodFar.object, nearWoodFar.object);
    const lodPairs = [[runWood, runWoodFar, 105, 245], [nearWood, nearWoodFar, 62, 245]].map(([A0, B0, D, cull]) => {
      const cen = (m) => { m.updateWorldMatrix(true, false); const bs = m.boundingSphere || m.geometry.boundingSphere; return bs ? { c: bs.center.clone().applyMatrix4(m.matrixWorld), r: bs.radius } : { c: V3(), r: 1e4 }; };
      return { a: A0.meshes, b: B0.meshes, ca: A0.meshes.map(cen), cb: B0.meshes.map(cen), D, cull, same: A0.meshes.length === B0.meshes.length };
    });
    const lodUpdate = (cp) => {
      for (const P of lodPairs) {
        for (let i = 0; i < P.a.length; i++) { const k = P.ca[i], d = Math.hypot(k.c.x - cp.x, k.c.y - cp.y, k.c.z - cp.z) - k.r, nearOn = d < P.D; P.a[i].visible = nearOn && !past(P.a[i], cp); if (P.same) P.b[i].visible = !nearOn && d < P.cull && !past(P.b[i], cp); }
        if (!P.same) for (let i = 0; i < P.b.length; i++) { const k = P.cb[i], d = Math.hypot(k.c.x - cp.x, k.c.y - cp.y, k.c.z - cp.z) - k.r; P.b[i].visible = d >= P.D && d < P.cull && !past(P.b[i], cp); }
      }
    };
    scene.add(forest.object, nearWood.object, quiltWood.object);
    for (const sc of [forest, quiltWood, runWood, runWoodFar, nearWood, nearWoodFar]) sc.meshes.forEach(xMaxOf);
    pastKit.push(...forest.meshes, ...quiltWood.meshes);
    await ctx.yield();
    // yellow birch, beech-gold maple and hemlock gripping the ledges of the amphitheatre: small trees, each on its own tread
    const ledgePts = [];
    {
      const lr = R.fork('ledges');
      // (84 small trees: a clump of three to five to every forty metres of the three treads round the bowl's sides)
      for (let i = 0; i < 700 && ledgePts.length < 84; i++) {
        if ((i & 31) === 31) await ctx.yield();
        const a = lr.range(0, 6.283), j = lr.int(1, AMPH_N - 1);
        let x = 0, z = 0, p = j / AMPH_N;
        for (let it = 0; it < 5; it++) {                                            // the middle of tread j along this bearing
          const re = 1 + amphWid(x || 90) * p; x = 90 + Math.cos(a) * 74 * re; z = STREAM_Z + Math.sin(a) * 52 * re;
          p = clamp((j - 0.05 - amphWob(x, z, p)) / AMPH_N, 0.02, 0.98);
        }
        if (x < 30 || x > 205) continue;
        const h = groundAt(x, z), U = upland(x, z);
        if (U - h < 6 || h < POOL_Y + 4) continue;
        const sl = Math.max(Math.abs(groundAt(x + 1.2, z) - groundAt(x - 1.2, z)), Math.abs(groundAt(x, z + 1.2) - groundAt(x, z - 1.2))) / 2.4;
        if (sl > 0.75 || !far(x, z, 6.2)) continue;
        placed.push({ x, z, r: 6.2 });                                             // bare rock between one clump and the next
        const nc = lr.int(3, 5);
        for (let c = 0; c < nc; c++) {                                             // three to five small trees rooted in the same crack
          // (strung along the tread, three to six metres apart, so the group reads as trees with trunks and not as one ball)
          const a2 = lr.range(0, 6.283), r2 = c === 0 ? 0 : lr.range(1.5, 3.9), tl = Math.hypot(Math.sin(a) * 74, Math.cos(a) * 52) || 1, tx = -Math.sin(a) * 74 / tl, tz = Math.cos(a) * 52 / tl;
          if (c !== 0 && Math.abs(groundAt(x + Math.cos(a2) * r2, z + Math.sin(a2) * r2) - h) > 1.3) continue;
          const t = lr(), v = t < 0.45 ? 3 : t < 0.72 ? 2 : 4, sc = (v === 3 ? lr.range(0.42, 0.62) : v === 2 ? lr.range(0.5, 0.74) : lr.range(0.3, 0.44)) * (c === 0 ? 1.1 : 0.85), rot = lr.range(0, 6.28);
          const al = (c % 2 ? 1 : -1) * Math.ceil(c / 2) * r2 * 1.25, ac = Math.sin(a2) * 0.9, cx = x + tx * al + tz * ac, cz = z + tz * al - tx * ac, ch = c === 0 ? h : groundAt(cx, cz);
          if (Math.abs(ch - h) > 2.4) continue;
          ledgePts.push({ x: cx, y: ch, z: cz, s: sc * (v === 4 ? 1.9 : 1.5), rot, d: 60, pd: 60, u: 0.9, v });
        }
      }
    }
    // Round the bowl (a rule in world coordinates: east of the brink) every hemlock is this dark one with drooping tiers:
    // those on the ledges, and those the wood itself planted there (bowlHem), which were left out of the far wood's list
    // before that wood was built and stand here only: each tree stands once.
    const hemD = flora.coniferGeometry({ rng: own('hemlock'), detail: 1, height: 18, droop: 1.2, slim: 1.0, leaf: squall ? '#35604e' : '#27473a', leafLight: squall ? '#5c8a74' : '#4a765e', leafDark: squall ? '#1c3329' : '#142a22', bark: '#4a3a30', barkDark: '#241b16' });
    await ctx.yield();
    for (const p of bowlHem) ledgePts.push({ x: p.x, y: p.y, z: p.z, s: p.s, rot: p.rot, d: 60, pd: 60, u: 0.9, v: 4 });
    const ledgeSet = setFar.map((g, i) => (i === 4 ? hemD : g));
    for (const p of ledgePts) p.kt = sightK(p.x, p.y + (ledgeSet[p.v].userData.height || 14) * p.s * 1.1);
    ledgePts.sort((a, b) => a.kt - b.kt);
    const ledgeWood = scat('ledgewood', ledgePts, ledgeSet, 1, 430);
    for (const m of ledgeWood.meshes) {
      const kt = Float32Array.from(ledgePts.filter((p) => ledgeSet[p.v] === m.geometry).map((p) => p.kt));
      if (kt.length === m.count) { m.userData.kt = kt; sightMeshes.push(m); }
    }
    scene.add(ledgeWood.object);
    await ctx.yield();
    // (the kit's addContact visits every vertex of the land for every tree in one go: handed over twenty trees at a time, in
    // order down the gorge, it is the same shadow in short steps)
    {
      const spots = [...nearPts, ...mainPts.filter((p) => p.pd < 60)].sort((a, b) => a.x - b.x).map((p) => [p.x, p.z, 1.6 * p.s]);
      for (let i = 0; i < spots.length; i += 20) { terrain.addContact(spots.slice(i, i + 20), { radius: 1, reach: 2.2, strength: 0.5 }); await ctx.yield(); }
    }
    await ctx.yield();

    // far canopy: crowns in the leaf colours, so the upland and the rims read as forest out to the haze. Each is a clump
    // of three soft lobes (one lobe beyond 140 m of the stream, a plainer one beyond 240 m), leaf-textured and ragged-edged in the shader, lit
    // on top and shaded beneath; none is black (the hemlocks are the kit conifers' green). Drawn in pieces by place, so
    // the ones behind us are not drawn.
    {
      const xc = own('crowngeo');
      const crownGeometry = (lobes, trunk) => {
        const pos = [], nor = [], bark = [];
        for (const Lb of lobes) {
          const g = Lb.ico ? new THREE.IcosahedronGeometry(1, 0) : new THREE.OctahedronGeometry(1, 0), pa = g.getAttribute('position'), ry = xc.range(0, 6.28), cy = Math.cos(ry), sy = Math.sin(ry);
          for (let i = 0; i < pa.count; i++) {
            const x0 = pa.getX(i), y0 = pa.getY(i), z0 = pa.getZ(i), k = 1 + 0.2 * Math.sin(x0 * 5.1 + y0 * 3.3 + ry) + 0.12 * Math.cos(z0 * 6.7 + ry * 2);   // lumps (by the corner's own place, so the faces stay joined)
            const x = Lb.c[0] + (x0 * cy - z0 * sy) * k * Lb.r[0], y = Lb.c[1] + y0 * k * Lb.r[1], z = Lb.c[2] + (x0 * sy + z0 * cy) * k * Lb.r[0];
            pos.push(x, y, z); tmpA.set(x, y * 0.8 + 0.3, z).normalize(); nor.push(tmpA.x, tmpA.y, tmpA.z); bark.push(0);            // soft normals from the heart of the whole crown
          }
          g.dispose();
        }
        if (trunk) {                                                               // a five-sided bole from the ground (trunk.y0, in crown radii) up into the crown
          for (let k = 0; k < 5; k++) {
            const a0 = k / 5 * 6.283, a1 = (k + 1) / 5 * 6.283, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), rb = trunk.r, rt = trunk.r * 0.6, yb = trunk.y0, yt = -0.3;
            for (const [cx, sx, y, r] of [[c0, s0, yb, rb], [c0, s0, yt, rt], [c1, s1, yb, rb], [c1, s1, yb, rb], [c0, s0, yt, rt], [c1, s1, yt, rt], [c0, s0, yb, rb], [c1, s1, yb, rb], [c0, s0, yt, rt], [c1, s1, yb, rb], [c1, s1, yt, rt], [c0, s0, yt, rt]]) { pos.push(cx * r, y, sx * r); nor.push(cx, 0.2, sx); bark.push(1); }   // (both windings: seen from any side)
          }
        }
        const cg = new THREE.BufferGeometry();
        cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); cg.setAttribute('aMgBark', new THREE.Float32BufferAttribute(bark, 1)); cg.computeBoundingSphere();
        return cg;
      };
      const a1 = xc.range(0, 6.28);
      const geoA = crownGeometry([{ ico: true, c: [0, 0, 0], r: [1, 1] }, { c: [0.66 * Math.cos(a1), -0.16, 0.66 * Math.sin(a1)], r: [0.62, 0.6] }, { c: [0.6 * Math.cos(a1 + 2.5), 0.22, 0.6 * Math.sin(a1 + 2.5)], r: [0.58, 0.56] }]);
      const geoB = crownGeometry([{ ico: true, c: [0, 0, 0], r: [1, 1] }]), geoC = crownGeometry([{ c: [0, 0, 0], r: [1.08, 1.05] }]);
      const dm = sunPatch(new THREE.MeshLambertMaterial({ color: 0xffffff }), S, 'dome');
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
      const dcol = [col(palSugar.leaf), col(palRed.leaf), col(palGold.leaf), col('#d8a428'), col('#1c3026')];
      [col(palSugar.leaf), col(palRed.leaf), col(palGold.leaf), col('#d8a428'), col('#1c3026')].forEach((k, i) => S.crownRamp[i].copy(k).multiplyScalar(i === 4 ? 0.8 : 0.7));
      // the kit of one piece: every crown of a list in one instanced draw, with its own bounds for the frustum test
      const piece = (geo, list, rim) => {
        const mesh = new THREE.InstancedMesh(geo, dm, Math.max(1, list.length));
        list.forEach((d, i) => { mesh.setMatrixAt(i, d.m); mesh.setColorAt(i, d.c); });
        mesh.count = list.length; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere();
        mesh.name = 'dome'; scene.add(mesh); if (!rim) pastOwn.push(xMaxOf(mesh)); return mesh;
      };
      const pieceOf = (x) => (x < -430 ? 0 : x < -60 ? 1 : 2);
      const domeLists = [[], [], []], domeFar = [[], []];
      domePts.forEach((p) => {
        e.set(tr.range(-0.2, 0.2), tr.range(0, 6.28), tr.range(-0.2, 0.2)); q.setFromEuler(e);
        const mm = new THREE.Matrix4().compose(tmpA.set(p.x, p.y, p.z), q, tmpB.set(p.r, p.r * tr.range(0.95, 1.5), p.r));
        c.copy(dcol[p.v]).multiplyScalar(tr.range(0.5, 0.85)); if (p.v !== 4 && tr.chance(0.3)) c.lerp(dcol[tr.int(0, 3)], 0.5);
        (path.nearestXZ(p.x, p.z).dist > 260 ? domeFar[p.x < -300 ? 0 : 1] : domeLists[pieceOf(p.x)]).push({ m: mm, c: c.clone().multiplyScalar(p.v === 4 ? 1.25 : 1.1) });
      });
      await ctx.yield();
      // the far rim of the bowl and the valley beyond it: crowns touching, drawn once the lip is near
      // Each is a clump of five lobes set at different heights (a crown seen from the lip is twenty or thirty pixels across:
      // its outline must be clumps of leaves, not one ball). The front of the wood, the 22 m nearest the bowl's own edge (a
      // rule in world coordinates), stands on boles with the dark floor of the wood seen between them, and one stretch
      // in five of it is a gap; the rest are closed canopy behind.
      const a2 = xc.range(0, 6.28), rimLobes = [{ ico: true, c: [0, 0, 0], r: [0.9, 0.86] }, { c: [0.62 * Math.cos(a2), 0.3, 0.62 * Math.sin(a2)], r: [0.56, 0.52] }, { c: [0.66 * Math.cos(a2 + 1.9), -0.2, 0.66 * Math.sin(a2 + 1.9)], r: [0.6, 0.5] },
        { c: [0.6 * Math.cos(a2 + 3.9), 0.12, 0.6 * Math.sin(a2 + 3.9)], r: [0.54, 0.56] }, { c: [0.1, 0.72, -0.08], r: [0.5, 0.42] }];
      const geoR = crownGeometry(rimLobes), geoRT = crownGeometry(rimLobes, { r: 0.085, y0: -2.9 });
      const xt = own('rimtone'), rimBack = [], rimFront = [];
      rimPts.forEach((p) => {
        e.set(tr.range(-0.2, 0.2), tr.range(0, 6.28), tr.range(-0.2, 0.2)); q.setFromEuler(e);
        const tall = tr.range(1.0, 1.5);
        c.copy(dcol[p.v]).multiplyScalar(tr.range(0.5, 0.85)); if (p.v !== 4 && tr.chance(0.3)) c.lerp(dcol[tr.int(0, 3)], 0.5);
        const tone = xt.range(0.66, 1.3), lift = xt.range(1.05, 1.5), warm = xt.range(-0.08, 0.08);
        c.multiplyScalar((p.v === 4 ? 1.25 : 1.1) * tone); c.r *= 1 + warm; c.b *= 1 - warm;       // neighbours differ in tone within their hue
        const edge = Math.hypot((p.x - 90) / 74, (p.z - STREAM_Z) / 52) - (1 + amphWid(p.x) + 0.05), front = edge < 0.34;
        if (front && noise.n2(p.x * 0.07 + 5, p.z * 0.07) > 0.42) return;                           // a gap in the front of the wood
        const y = front ? p.y + p.r * lift : p.y;
        (front ? rimFront : rimBack).push({ kt: sightK(p.x, y + p.r * (front ? 1.0 : tall) * 1.3), m: new THREE.Matrix4().compose(tmpA.set(p.x, y, p.z), q, tmpB.set(p.r, p.r * (front ? 1.0 : tall), p.r)), c: c.clone() });
      });
      // drawn in the order the sight line over the lip finds them: the crowns on the valley floor beyond the bowl lie below
      // it until we are near the brink (see sightK), and are left out of the draw until then
      rimBack.sort((a, b) => a.kt - b.kt); rimFront.sort((a, b) => a.kt - b.kt);
      rimWood = piece(geoR, rimBack, true); rimWood.name = 'rim-wood'; rimWood.userData.kt = Float32Array.from(rimBack.map((d) => d.kt));
      rimEdge = piece(geoRT, rimFront, true); rimEdge.name = 'rim-edge'; rimEdge.userData.kt = Float32Array.from(rimFront.map((d) => d.kt));
      sightMeshes.push(rimWood, rimEdge);
      await ctx.yield();
      // The closed wood of the upland flanks, from the entry to the head of the run: a crown every seventeen metres or so on
      // the land between 84 and 335 m either side of the stream (a rule in world coordinates), over the wood painted on
      // the floor there, so the flanks are canopy out to the skyline and no strip of bare ground shows between the rows.
      {
        // (to x = -330: by there the lens is on the floor of the gorge, 25 m and more under the rims, and the walls stand
        // between it and the flanks; from -905, the 200 m of wood behind the entry that the portal's first look takes in)
        const xf = own('flankwood'), STEP = 17, listC = [];   // (drawn with the far crowns of their own stretch, the same crown: both sides of the stream in one piece)
        let n = 0;
        for (let x = -905; x < -330; x += STEP) for (const side of [-1, 1]) for (let lat = 84; lat < 335; lat += STEP) {
          if ((n++ & 63) === 0) await ctx.yield();
          const px = x + xf.range(-6, 6), pz = zc(px) + side * (lat + xf.range(-6, 6)), r = xf.range(5.2, 8.2), up = xf.range(1.0, 1.55), tall = xf.range(0.95, 1.45), t = xf(), k = xf.range(0.6, 0.92), mixK = xf(), yaw = xf.range(0, 6.28), t1 = xf.range(-0.2, 0.2), t2 = xf.range(-0.2, 0.2);
          if (path.nearestXZ(px, pz).dist < 82 || !far(px, pz, r * 0.62)) continue;
          const h = height(px, pz);
          const v = t < 0.42 ? 0 : t < 0.58 ? 1 : t < 0.8 ? 2 : t < 0.9 ? 3 : 4;
          e.set(t1, yaw, t2); q.setFromEuler(e);
          c.copy(dcol[v]).multiplyScalar(v === 4 ? k * 1.25 : k * 1.1); if (v !== 4 && mixK < 0.3) c.lerp(dcol[Math.floor(mixK * 13.3) % 4], 0.5);
          (lat < 140 ? domeLists[pieceOf(px)] : lat < 240 ? domeFar[0] : listC).push({ m: new THREE.Matrix4().compose(tmpA.set(px, h + r * up, pz), q, tmpB.set(r, r * tall, r)), c: c.clone() });
        }
        if (listC.length) piece(geoC, listC);
      }
      for (const list of domeLists) if (list.length) piece(geoA, list);
      for (const list of domeFar) if (list.length) piece(geoB, list);
    }
    await ctx.yield();

    // understorey on the banks and ledges, from the head of the gorge to the lip: straw-gold and evergreen ferns, maroon
    // hobblebush, pale striped maple, and beds of dry sedge between the cobbles
    const coverDensity = (x, z) => {
      if (x > 8 || x < -640) return 0;
      const d = Math.abs(z - zc(x)), hw = halfW(x); if (d < hw + 1.5 || d > (x > -95 && z < zc(x) ? 50 : 25)) return 0;
      if (Math.hypot(x, z) < 11.5 || (z > STREAM_Z && Math.abs(x - CASC_X) < 3.2)) return 0;
      if (beast === 'moose' && Math.hypot(x - beastC.x, z - beastC.z) < 9) return 0;
      if (rime && height(x, z) > waterY(x) + lvl + 4) return 0;                    // rimed ferns keep to the bank floor: on the dark wall they read as scraps of paper
      return (height(x, z) < waterY(x) + lvl + 0.55 ? 0 : 1) * (1 - 0.9 * barAt(x, z));
    };
    const beastC = path.posAtDist(0.54 * L + 7.5, V3()); beastC.z -= 9.5;                // where the cow and calf will stand, on the bar
    const rime = lookName === 'dawn';
    const fernRng = R.fork('ferns'), fernSet = [];
    for (const [leaf, leafLight, leafDark] of [[rime ? '#4f5848' : '#9a7c34', rime ? '#76816f' : '#c8ac58', rime ? '#30362b' : '#5a441c'], [rime ? '#555a46' : '#a4853a', rime ? '#7a8470' : '#d0b460', rime ? '#343828' : '#66501e'], [rime ? '#274a30' : '#2c5a34', rime ? '#5c7566' : '#5c8a4a', '#12301c']]) {
      fernSet.push(flora.fernGeometry({ rng: gr, leaf, leafLight, leafDark })); await ctx.yield();
    }
    // NO UPRIGHT FROND ON A STEEP FACE. A rule of the slope of the ground where the plant stands, in world coordinates:
    // a fern or a shrub the scatter has dealt onto ground steeper than 42 degrees (a slope of 0.9: the middle of the
    // range over which the land's material turns from ground to rock, so a face that is drawn as rock; the risers of
    // the walls are 60 degrees and more, the banks' own faces under 40) does not stand there. It goes down or up the fall line to the nearest level ground (under
    // 24 degrees: a ledge's tread, or the wall's foot) and gathers there with the others off the same face, in clumps of
    // three to six (the clump's size drawn from its own stream); a third of the clumps sit at the lip of their tread and
    // hang over it; the land under each clump is darkened (the kit's contact shade). Every plant dealt is still there:
    // the count does not fall, and a plant on level ground is not touched (same place, same size, same turn: the points
    // are the kit's own scatter, drawn from the same fork as before, and handed back to it).
    const wallR = own('wallcover'), clumpSpots = [];
    const slopeAt = (x, z) => Math.hypot(groundAt(x + 1, z) - groundAt(x - 1, z), groundAt(x, z + 1) - groundAt(x, z - 1)) / 2;
    const seatOk = (x, z) => slopeAt(x, z) < 0.45 && groundAt(x, z) > waterY(x) + lvl + 0.55 && Math.abs(z - zc(x)) > halfW(x) + 1.5 && path.nearestXZ(x, z).dist > 7.5 && barAt(x, z) < 0.05;
    const offWall = async (pts, spread) => {
      const clumps = [];
      let n = 0;
      for (const p of pts) {
        if (slopeAt(p.x, p.z) <= 0.9) continue;
        if ((n++ & 15) === 15) await ctx.yield();
        const gx = groundAt(p.x + 1, p.z) - groundAt(p.x - 1, p.z), gz = groundAt(p.x, p.z + 1) - groundAt(p.x, p.z - 1), gl = Math.hypot(gx, gz) || 1, ux = gx / gl, uz = gz / gl;   // the way uphill
        let sx = 0, sz = 0, found = false;
        for (let k = 1; k <= 14 && !found; k++) for (const sg of [-1, 1]) { const x = p.x + sg * ux * k * 0.6, z = p.z + sg * uz * k * 0.6; if (seatOk(x, z)) { sx = x; sz = z; found = true; break; } }
        for (let k = 15; k <= 44 && !found; k++) { const x = p.x - ux * k * 0.6, z = p.z - uz * k * 0.6; if (seatOk(x, z)) { sx = x; sz = z; found = true; } }   // (on down to the wall's foot)
        if (!found) { const sd = p.z < zc(p.x) ? -1 : 1; sx = p.x; sz = zc(p.x) + sd * (halfW(p.x) + 5.5); }                    // (the bank itself, beside the water)
        let best = null, bd = 7;
        for (const c of clumps) { if (c.list.length >= c.cap) continue; const d = Math.hypot(c.x - sx, c.z - sz); if (d < bd) { bd = d; best = c; } }
        if (!best) { best = { x: sx, z: sz, ux, uz, cap: wallR.int(3, 6), lip: wallR.chance(0.35), list: [] }; clumps.push(best); }
        best.list.push(p);
      }
      // a clump of one or two joins the nearest clump that has room for it (within 30 m); alone on its face, it stays small
      for (const c of clumps) {
        if (!c.list.length || c.list.length >= 3) continue;
        let best = null, bd = 30;
        for (const o of clumps) { if (o === c || !o.list.length || o.list.length + c.list.length > 6) continue; const d = Math.hypot(o.x - c.x, o.z - c.z); if (d < bd) { bd = d; best = o; } }
        if (best) { best.list.push(...c.list); c.list = []; }
      }
      for (const c of clumps) {
        if (!c.list.length) continue;
        let cx = c.x, cz = c.z;
        if (c.lip) for (let k = 0; k < 12; k++) { const x = cx - c.ux * 0.35, z = cz - c.uz * 0.35; if (slopeAt(x, z) > 0.8 || !seatOk(cx, cz)) break; cx = x; cz = z; }   // out to the edge of the tread
        c.list.forEach((p, i) => {
          let x = cx, z = cz;
          if (i > 0) for (let t = 0; t < 4; t++) {                                  // the rest sit round the first, along the tread more than across it
            const a = wallR.range(0, 6.28), r = wallR.range(0.5, 1.15) * spread, qx = cx + (-c.uz * Math.cos(a) + c.ux * 0.45 * Math.sin(a)) * r, qz = cz + (c.ux * Math.cos(a) + c.uz * 0.45 * Math.sin(a)) * r;
            x = qx; z = qz; if (slopeAt(qx, qz) < 0.9) break;
            x = cx + (qx - cx) * 0.3; z = cz + (qz - cz) * 0.3;
          }
          p.x = x; p.z = z; p.y = groundAt(x, z); p.d = path.nearestXZ(x, z).dist;   // (p.u is kept: the plant stays in its own piece of the draw)
        });
        clumpSpots.push([cx, cz, 0.9 * spread]);
      }
      await ctx.yield();
    };
    const fernOpts = { path, heightAt: groundAt, count: Math.round(540 * detail * density), radius: 24, corridor: 5.5, clear: 0, falloff: 0.6,
      uRange: [0.13, 0.86], density: coverDensity, scale: rime ? [0.6, 1.05] : [0.7, 1.35] };                                    // (frosted ferns lie low: grey-green in the bank's own tones, rime on the tips only)
    const fernPts = flora.scatterPoints({ ...fernOpts, rng: fernRng.fork('pts') });
    await ctx.yield();
    await offWall(fernPts, 1);
    const ferns = flora.makeScatter({ ...fernOpts, rng: fernRng, points: fernPts, material: leafMat, sink: 0.02, tilt: 0.12, chunks: 8, cullDistance: 115, variants: fernSet });
    await ctx.yield();
    const shrubRng = R.fork('shrubs');
    const bushA = flora.bushGeometry({ rng: gr, detail: 0, size: 1.5, leaf: '#6a1c22', leafLight: '#a83a30', leafDark: '#2c0c10' }); await ctx.yield();
    const bushB = flora.bushGeometry({ rng: gr, detail: 0, size: 1.9, leaf: '#d8c860', leafLight: '#f4ea98', leafDark: '#7a6a28' }); await ctx.yield();
    const shrubOpts = { path, heightAt: groundAt, count: Math.round(110 * detail), radius: 25, corridor: 7.5, clear: 0, falloff: 0.5, uRange: [0.14, 0.85], density: coverDensity, scale: [0.9, 1.6], spacing: 2.2 };
    const shrubPts = flora.scatterPoints({ ...shrubOpts, rng: shrubRng.fork('pts') });
    await ctx.yield();
    await offWall(shrubPts, 1.7);
    const shrubs = flora.makeScatter({ ...shrubOpts, rng: shrubRng, points: shrubPts, material: leafMat, sink: 0.03, chunks: 6, cullDistance: 125, variants: [bushA, bushB] });
    await ctx.yield();
    const sedgeOpts = { path, heightAt: groundAt, wind, map: leafMat.map, width: [0.8, 1.5], height: [0.35, 0.8], flowers: 0,
      root: rime ? '#565e50' : '#5c4c26', tip: rime ? '#b2bcb4' : '#c2a456', dry: rime ? '#9a9a84' : '#d6bc6a', dryAmount: 0.4, tint: 0.2 };   // (rimed sedge and fern: grey-green in the bank's own tones, frost on the tips only; white tufts read as scraps of paper on the dark wall foot)
    const sedge = await flora.makeGrassAsync({ ...sedgeOpts, rng: R.fork('sedge'), count: Math.round(6500 * detail * density), radius: 24, bias: 0.9, uRange: [0.13, 0.86], chunks: 6, fade: [60, 95],
      density: (x, z) => coverDensity(x, z) * smoothstep(-0.5, 0.2, noise.n2(x * 0.11 + 3, z * 0.11)), materialOptions: { ambient: rime ? 1.3 : 1.6, leafAmbient: rime ? 1.3 : 1.6 } }, ctx.yield);
    sunPatch(sedge.material, S, 'flora');
    await ctx.yield();
    // the terrace under the great maple, out to the foot of the left wall: sedge, fern and hobblebush over the leaf litter
    const terrace = (x, z) => (x > -95 && x < 6 && z < zc(x) - 16 ? coverDensity(x, z) : 0);
    const sedge2 = await flora.makeGrassAsync({ ...sedgeOpts, rng: R.fork('sedge2'), material: sedge.material, count: Math.round(2600 * detail * density), radius: 52, bias: 0.4, uRange: [0.7, 0.86], chunks: 2, fade: [60, 95],
      density: (x, z) => terrace(x, z) * smoothstep(-0.6, 0.1, noise.n2(x * 0.11 + 3, z * 0.11)) }, ctx.yield);
    await ctx.yield();
    const fern2Rng = R.fork('ferns2'), fern2Opts = { path, heightAt: groundAt, count: Math.round(150 * detail), radius: 52, corridor: 16, clear: 0, falloff: 0.1, uRange: [0.7, 0.86], density: terrace, scale: [0.8, 1.5] };
    const fern2Pts = flora.scatterPoints({ ...fern2Opts, rng: fern2Rng.fork('pts') });
    await offWall(fern2Pts, 1);
    const ferns2 = flora.makeScatter({ ...fern2Opts, rng: fern2Rng, points: fern2Pts, material: leafMat, sink: 0.02, tilt: 0.12, chunks: 2, cullDistance: 130, variants: fernSet });
    await ctx.yield();
    const shrub2Rng = R.fork('shrubs2'), shrub2Opts = { path, heightAt: groundAt, count: Math.round(34 * detail), radius: 52, corridor: 16, clear: 0, falloff: 0.1, uRange: [0.7, 0.86], density: terrace, scale: [0.9, 1.6], spacing: 2.4 };
    const shrub2Pts = flora.scatterPoints({ ...shrub2Opts, rng: shrub2Rng.fork('pts') });
    await offWall(shrub2Pts, 1.7);
    const shrubs2 = flora.makeScatter({ ...shrub2Opts, rng: shrub2Rng, points: shrub2Pts, material: leafMat, sink: 0.03, chunks: 2, cullDistance: 140, variants: [bushA, bushB] });
    // the dark foot of every clump, handed to the kit twenty at a time (it visits every vertex of the land for each)
    for (let i = 0; i < clumpSpots.length; i += 20) { terrain.addContact(clumpSpots.slice(i, i + 20), { radius: 1, reach: 2.4, strength: 0.55 }); await ctx.yield(); }
    scene.add(sedge2.object, ferns2.object, shrubs2.object);
    await ctx.yield();
    scene.add(ferns.object, shrubs.object, sedge.object);
    for (const m of [...ferns.meshes, ...shrubs.meshes]) pastKit.push(xMaxOf(m));
    await ctx.yield();

    // ---------- wildlife ----------
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene, { sunIntensity: LK.sunI * LK.faunaSun }) });
    const BIRDS = {
      // jays and robins are this world's own songbird: 0.6 m across the spread wings at size 0.8, 0.7 m at 0.95, held 4.5 to 6 m ahead (about a tenth of the frame)
      jays: { count: 7, size: 0.95, lead: 6.0, pal: { body: '#2a62d0', belly: '#d5dbe4', wingC: '#2f6ae0', tip: '#10141e', head: '#3a70dc', tailC: '#2858c0', trail: '#2048a4', beak: '#14171c' }, paint: { bar: true, tailTip: true, necklace: true, crest: true } },
      robins: { count: 11, size: 0.76, lead: 6.2, pal: { body: '#4c4238', belly: '#cc521c', wingC: '#3e362e', tip: '#1c1814', head: '#2a2420', tailC: '#342c26', trail: '#5a5046', beak: '#d8a020' }, paint: {} },
      ravens: { count: 2, size: 1.7, lead: 8.5, pal: { body: '#0d0e12', belly: '#121318', wingC: '#0b0c10', tip: '#050506', head: '#0d0e12', tailC: '#0b0c10', trail: '#16171c', beak: '#08080a' } },
    };
    const BK = BIRDS[birdKind];
    // swept into the stream just ahead of the lens and held there against the dark right wall, down the cascades and into the run
    const bird = BK.paint ? songbird(BK.pal, BK.paint) : null;
    await ctx.yield();
    const dress = (fl) => {                                                      // the kit's flock, wearing this world's bird
      if (!bird) return fl;
      const g = fl.geometry; g.setIndex(bird.geometry.index); for (const k of Object.keys(bird.geometry.attributes)) g.setAttribute(k, bird.geometry.attributes[k]);
      fl.uniforms.uWing.value.x = bird.preset.span; fl.uniforms.uWing.value.z = 0.55; fl.uniforms.uWing.value.w = bird.preset.len * 0.07;
      return fl;
    };
    // THE GUARD at the head of both flocks' blocks below. Each block reads, by name, what the kit made of a flock: the instance arrays iA and iB,
    // aAnim, position (on jay and robin seeds this world's songbird's, put on by dress above), the uniforms uWander, uFlap, uWing, uNear and
    // uScale, the route, the count and the object (the escort's block also the culling sphere, bounds). If one of them is absent, the count is
    // not over 0, the route has no pointAt or no length (for the escort: the sphere no radius), or iA or iB is not four numbers a bird long, the
    // flock is left out of the world: it is taken out of its parent, one warning is written and the block is not run. (Taken out, not hidden:
    // the kit's update sets `visible` anew every frame; it goes on updating a flock that stands in no scene, which draws nothing.)
    const flockRead = (fl, name, sphere) => {
      const at = fl && fl.geometry && fl.geometry.attributes, U = fl && fl.uniforms, n = fl && fl.count;
      const ok = !!(at && U && n > 0 && fl.object && fl.route && typeof fl.route.pointAt === 'function' && fl.route.length > 0 && (!sphere || (fl.bounds && fl.bounds.radius > 0))
        && at.iA && at.iB && at.aAnim && at.position && at.iA.array && at.iB.array && at.iA.array.length === n * 4 && at.iB.array.length === n * 4
        && U.uWander && U.uFlap && U.uWing && U.uNear && U.uScale);
      if (!ok) { console.warn('maple-gale: the ' + name + ' flock is left out (a name this world reads of the kit\'s flock is absent, or an array is not of the count\'s length)'); if (fl && fl.object && fl.object.parent) fl.object.parent.remove(fl.object); }
      return ok;
    };
    const escort =                                                               // (the name only: the call's two lines are as they were)
    fauna.add(dress(F.makeFlock({ rng: R.fork('escort'), species: 'crows', count: BK.count, size: BK.size, ...BK.pal, glide: 0.1, flap: birdKind === 'ravens' ? 2.6 : 5.2,
      along: { path, side: birdKind === 'ravens' ? -2.4 : 1.3, up: birdKind === 'ravens' ? -0.8 : -0.3, lead: BK.lead, from: 0.17, to: birdKind === 'ravens' ? 0.41 : 0.47, drift: 0.4 }, spread: birdKind === 'ravens' ? [2.4, 1.0, 3] : birdKind === 'jays' ? [1.5, 1.0, 1.6] : [1.9, 1.2, 1.9], wander: [0.4, 0.3, 0.4, 0.7] })));
    if (flockRead(escort, 'escort', true)) {
      // The escort is kept off the lens by place, bird by bird, here at the build, once, from what the kit dealt this flock. With the lens at metre
      // d of our line the kit's timetable has the flock's lead point at the course's metre ((d / L - from) / (to - from)) * Lr + lead, give or take
      // the drift on the clock, plus the treadmill the flock rides while the world waits behind its portal (0 or more by the time a bird is
      // drawn); a bird rides its lag (iA's third number) behind the lead point. So with the lens at d a bird can stand at any metre of the course
      // from the timetable's less the drift and its lag up to the course's end: those metres, from the course's first on, are what the walk below
      // holds. (The kit also draws a bird, at a part of its size, over the 2.64 m BEFORE the course's first metre, on the line produced back
      // from the course's start: its end fade is read that far ahead of the bird. Those metres are not walked here.) Its box there is the
      // course's point plus its dealt offsets (iA's x and height, iB's fourth number z) widened by the wander at its extreme, whatever the hash
      // gives: 1.5 times the wander's first figure along x, its second in height, its third along z.
      const at = escort.geometry.attributes, iA = at.iA.array, iB = at.iB.array, U = escort.uniforms, wan = U.uWander.value, amp = U.uFlap.value.y, n = escort.count, Lr = escort.route.length, p = V3(), q = V3();
      const from = 0.17, to = birdKind === 'ravens' ? 0.41 : 0.47, drift = 0.4, lead = BK.lead;      // the call's own figures
      // the bird's reach at size 1, by the same bound as the crossing flock's lines below (the wing's turn about its shoulder, the kit's wing law)
      let reach = 0, most = 0, wide = 0, back = 0, wrote = false;
      for (let i = 0; i < at.position.count; i++) {
        const side = at.aAnim.getY(i), d = Math.abs(side) > 0.5 ? at.aAnim.getX(i) : 0;
        reach = Math.max(reach, Math.hypot(at.position.getX(i) - side * d, at.position.getY(i), at.position.getZ(i)) + d * (1 + Math.hypot(0.22, 0.25) * amp) + U.uWing.value.w * amp + 0.06 * U.uWing.value.x * at.aAnim.getW(i));
      }
      // Both lines are walked by table, a twentieth of a metre a step. So that nothing slips between two table points (each line is within half a
      // step of one, a chord being no longer than its arc) the clear air is taken a step wider and the timetable half a step of each table lower.
      // The clear air asked of a bird's box: 2.0 m and its reach at its dealt size (iB's first number), or the kit's own guard (uNear.y) where
      // that is more. G is, for each bird, the longest lag that passes: it starts at the bird's own lag.
      const h = 0.05, ex = 1.5 * wan.x, ey = wan.y, ez = wan.z, round = Math.hypot(ex, ey, ez), slack = (Lr / ((to - from) * L) + 1) * h / 2, clear = [], skin = [], G = [];
      for (let i = 0; i < n; i++) {
        skin.push(reach * iB[i * 4] * U.uScale.value); clear.push(Math.max(U.uNear.value.y, 2.0 + skin[i]) + h); G.push(iA[i * 4 + 2]);
        most = Math.max(most, clear[i]); wide = Math.max(wide, Math.hypot(iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3])); back = Math.max(back, iA[i * 4 + 2]);
      }
      const A = Math.ceil(Lr / h), course = new Float64Array((A + 1) * 3), far = wide + round + most;
      for (let a = 0; a <= A; a++) { escort.route.pointAt(a * h, p); course[a * 3] = p.x; course[a * 3 + 1] = p.y; course[a * 3 + 2] = p.z; }
      await ctx.yield();
      // Every lens place on our line against every course point a bird could stand at with the lens there, from the course's end downward. Where
      // a bird's box at a course point is nearer the lens place than its clear air, its lag may be no longer than the timetable's lowest metre
      // there less that point's metre: G is the least of those. A pair too far apart for any bird's box passes over the course points (and, where
      // a whole lens place is so, the lens places) that are within half that room: they are too far as well.
      // The walk is made 512 lens places at a call, with a hand-back between two calls, so that it is no one long step of the build: walk(b)
      // walks from lens place b on and gives the next place to walk, or -1 when the walk is at its end. The places and their order are those of
      // one loop from 0 to the line's end; it changes no number.
      const walk = (b) => { for (let k = 0; k < 512 && b * h <= L; k++, b++) {
        const low = ((b * h / L - from) / (to - from)) * Lr + lead - drift - slack;
        let top = -Infinity, room = Infinity; for (let i = 0; i < n; i++) top = Math.max(top, G[i]);
        const lo = Math.max(0, Math.ceil((low - top) / h));
        if (lo > A) return -1;                                                     // from here on no bird is on the course with the lens there
        path.posAtDist(b * h, p);
        for (let a = A; a >= lo; a--) {
          const dx = p.x - course[a * 3], dy = p.y - course[a * 3 + 1], dz = p.z - course[a * 3 + 2], out = Math.sqrt(dx * dx + dy * dy + dz * dz) - far;
          if (out > 0) { room = Math.min(room, out / 2); a -= Math.floor(out / (2 * h)); continue; }
          room = 0;
          const v = low - a * h;
          for (let i = 0; i < n; i++) {
            if (v >= G[i]) continue;
            const gx = Math.max(Math.abs(dx - iA[i * 4]) - ex, 0), gy = Math.max(Math.abs(dy - iA[i * 4 + 1]) - ey, 0), gz = Math.max(Math.abs(dz - iB[i * 4 + 3]) - ez, 0);
            if (gx * gx + gy * gy + gz * gz < clear[i] * clear[i]) G[i] = v;
          }
        }
        if (room > 0 && room < Infinity) b += Math.floor(room / h);
      } return b * h <= L ? b : -1; };
      for (let b = walk(0); b >= 0; b = walk(b)) await ctx.yield();
      // how near bird i, riding at lag c, comes to another bird: station to station (the lag along the course and the dealt offsets together), the
      // least at every metre of the course
      const apart = (i, c) => {
        let least = Infinity;
        for (let j = 0; j < n; j++) {
          if (j === i) continue;
          for (let m = 0; m <= Lr; m++) {
            escort.route.pointAt(m, p); escort.route.pointAt(m + c - iA[j * 4 + 2], q);
            least = Math.min(least, Math.hypot(p.x + iA[i * 4] - q.x - iA[j * 4], p.y + iA[i * 4 + 1] - q.y - iA[j * 4 + 1], p.z + iB[i * 4 + 3] - q.z - iB[j * 4 + 3]));
          }
        }
        return least;
      };
      // A bird whose lag is no longer than its G is not touched. A bird whose lag is longer has that one number written to G (it rides further
      // forward by the least that passes); from there it goes on, a hundredth of a metre a step, while another bird's station is nearer than
      // 0.41 m (the designer's figure: the middle, over the jay flocks of forty seeds, of live's distance between a flock's nearest two
      // stations; one figure for every kind); and it goes no further ahead of the lead point than the kit's culling sphere, whose radius and
      // set-back are laid at the build from the largest dealt lag and not laid again (its centre rides with the flock), has room for (its radius
      // less half that lag, the bird's dealt offset, the wander's bound and the bird's reach): a bird stopped there is named in the object's
      // userData.held as [bird, dealt lag, G, lag written].
      // The attribute is marked for upload only when a lag was written, so a flock with no bird moved is as the kit made it. (A hand-back before
      // each moved bird's search and at every fourth step of it, for the same reason as in the walk; the steps and their order are unchanged.)
      const held = [];
      for (let i = 0; i < n; i++) {
        if (!(G[i] < iA[i * 4 + 2])) continue;
        const spare = escort.bounds.radius - back / 2 - Math.hypot(iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3]) - round - skin[i];
        await ctx.yield();
        let c = G[i]; for (let k = 0; c > -spare && apart(i, c) < 0.41; c -= 0.01) if ((++k & 3) === 0) await ctx.yield();
        if (c <= -spare) { c = -spare; held.push([i, iA[i * 4 + 2], G[i], c]); }
        iA[i * 4 + 2] = c; wrote = true;
      }
      if (wrote) at.iA.needsUpdate = true;
      if (held.length) escort.object.userData.held = held;
    }
    await ctx.yield();
    // the loose flock crossing the gorge head as we arrive, flung downwind. Its course passes over our own line 80 m from the start, and while the
    // world is seen through a portal the kit flies the flock round that course on the clock, so at some entry clocks the flock is still coming over
    // the line as the lens gets there. It is kept off the lens by place: the course is laid with its middle point at the line's own height
    // (height 0; the call's rise still slopes it 3 m from end to end) and the whole flock is then lifted, once, here at the build, by the least
    // that holds every bird's box of wander clear of our line, read from what this flock was dealt. The spread in height is 3 m, and the wander
    // in height 1 m (the crows' own wander is [4, 2, 4, 0.4]: a rowing bird holds its height).
    const crossing = fauna.add(dress(F.makeFlock({ rng: R.fork('crossing'), species: 'crows', count: birdKind === 'ravens' ? 5 : 14, size: BK.size * (bird ? 1.6 : 1.15), ...BK.pal, glide: 0.2,
      cross: { path, u: 0.02, lead: 44, angle: 44, side: -1, height: 0, span: 230, window: 0.14, rise: -3 }, spread: [15, 3, 24], wander: [4, 1, 4, 0.4] })));
    if (flockRead(crossing, 'crossing'))                                         // the guard: a flock that cannot be read is left out, and the block below is not run
    {
      // A bird's station is the course's point at its metre plus its dealt offsets in the world's axes: the kit's instance attribute iA holds x and
      // the height (a bell-curve draw of 0.45 times the spread in height, so the lowest bird differs seed by seed), iB's fourth number z. About its
      // station it wanders, whatever the hash gives, at most 1.5 times the wander's first figure along x, its second in height, its third along z.
      const at = crossing.geometry.attributes, iA = at.iA.array, iB = at.iB.array, U = crossing.uniforms, wan = U.uWander.value, amp = U.uFlap.value.y, p = V3();
      // the bird's reach at size 1: no vertex of the model this flock wears stands further from the bird's place, whatever the wing does. A wing
      // vertex turns about its shoulder (the shoulder point plus its span metre); to that the kit's wing law (birds.js 135 to 156) adds the trailing
      // edge's flick and the outer wing's sweep (0.22 and 0.25 of the beat's amplitude a span metre), the body's bob and the tail's flick
      let reach = 0, most = 0, wide = 0, lift = 0;
      for (let i = 0; i < at.position.count; i++) {
        const side = at.aAnim.getY(i), d = Math.abs(side) > 0.5 ? at.aAnim.getX(i) : 0;
        reach = Math.max(reach, Math.hypot(at.position.getX(i) - side * d, at.position.getY(i), at.position.getZ(i)) + d * (1 + Math.hypot(0.22, 0.25) * amp) + U.uWing.value.w * amp + 0.06 * U.uWing.value.x * at.aAnim.getW(i));
      }
      // the clear air asked about each bird's place: the kit's own guard for this flock's bird (uNear.y, the kit's (0.5 + 0.5) * size * 2.2: inside
      // it the kit shrinks a bird near the lens), or 2.0 m and the bird's reach at its dealt size (iB's first number) where that is more
      const clear = [], step = 1, ex = 1.5 * wan.x + step, ez = wan.z + step;
      for (let i = 0; i < crossing.count; i++) { clear.push(Math.max(U.uNear.value.y, 2.0 + reach * iB[i * 4] * U.uScale.value)); most = Math.max(most, clear[i]); wide = Math.max(wide, Math.abs(iA[i * 4]), Math.abs(iB[i * 4 + 3])); }
      // every whole metre of the course from its first against every whole metre of the route's line: where a point of the line is nearer a bird's
      // box in plan than the clear air, the box's floor (the station less the wander in height) must stand so far over it that the box is the
      // clear air away. So that nothing slips between two table points, the box is taken a step wider in plan (the course and the line are each
      // within half a step of a table point, but for the last part of a metre of each; and the 2.64 m before the course's first metre, where the
      // kit already draws a bird small, are not in the table: both of the course's ends lie some 80 m to the side of our line), and the highest of
      // the line's three points is held against the lowest of the course's three. The lift is the greatest need found (the flock is never laid
      // lower than the call lays it).
      const line = [], course = [], far = wide + Math.max(ex, ez) + most;
      for (let d = 0; d <= L; d += step) { path.posAtDist(d, p); line.push(p.x, p.y, p.z); }
      for (let s = 0; s <= crossing.route.length; s += step) { crossing.route.pointAt(s, p); course.push(p.x, p.y, p.z); }
      for (let a = 0; a < course.length; a += 3) for (let b = 0; b < line.length; b += 3) {
        const dx = line[b] - course[a], dz = line[b + 2] - course[a + 2], out = Math.max(Math.abs(dx), Math.abs(dz)) - far;
        if (out >= 0) { b += 3 * Math.floor(out / (2 * step)); continue; }               // too far for any bird's box, and for the next points too: two table points are a step apart (half as many are passed over)
        const top = Math.max(line[b + 1], line[Math.max(b - 2, 1)], line[Math.min(b + 4, line.length - 2)]), low = Math.min(course[a + 1], course[Math.max(a - 2, 1)], course[Math.min(a + 4, course.length - 2)]);
        for (let i = 0; i < crossing.count; i++) {
          const touch = top - low + wan.y - iA[i * 4 + 1];                                // the lift at which this bird's box would rest on the line here
          if (touch + clear[i] <= lift) continue;                                         // even straight over the line this bird asks no more than is already found
          const gx = Math.max(Math.abs(dx - iA[i * 4]) - ex, 0), gz = Math.max(Math.abs(dz - iB[i * 4 + 3]) - ez, 0), g2 = clear[i] * clear[i] - gx * gx - gz * gz;
          if (g2 > 0) lift = Math.max(lift, touch + Math.sqrt(g2));
        }
      }
      // the lift is the group's own place. The kit draws, guards and culls the flock through the group's matrix (the true places); its timetable,
      // its treadmill before the portal and its end fades read only the metre along the course, which a lift does not change
      crossing.object.position.y = lift; crossing.object.updateMatrixWorld();
    }
    await ctx.yield();
    // deer bolting down their pale bar (in front of us at u 0.50-0.58), or a cow moose and her calf dark in the white shallows
    const beastLight = F.lightFrom(scene, { sunIntensity: LK.sunI * LK.faunaSun * (LK.gorge[2] > 0.5 ? 0.3 : 0.55), skyIntensity: LK.hemiI * (squall ? 1.0 : 0.55), groundIntensity: LK.hemiI * (squall ? 0.6 : 0.4) });
    let beastAt, beastPose = null, holdR = 0, snagFlakes = null; const beastMeshes = [];
    if (beast === 'deer') {
      // THE DEER'S WAY keeps clear of the wandering waterline by a margin in space. It is a straight line down the bar that
      // bears 3 degrees off the stream's (as before, it leaves the water as it goes). Walked along its own length at 1 m
      // steps over the bar, the line is set just far enough from the stream that at every step it is 2.0 m landward of
      // the shore as drawn (barShore): 1.5 m for the three deer's own places either side of the line (their spread is a
      // metre, drawn about the line with a deviation of half that: three deviations) and 0.5 m for a hoof and the wet band.
      const dS = deerU * L + 19, dP = path.posAtDist(dS, V3()), dLat0 = STREAM_Z - dP.z, tan3 = Math.tan(3 * Math.PI / 180);
      let deerLat = 0;
      for (let a = -62; a <= 62; a += 1) { const x = dP.x + a; if (x > barX0 - 8 && x < barX1 + 8) deerLat = Math.max(deerLat, barShore(x) + 2.0 - a * tan3); }
      const herd = fauna.add(F.makeHerd({ rng: R.fork('deer'), species: 'deer', count: 3, size: 1.45, sizes: [1.12, 0.94, 0.9], varieties: 0.34, coat: '#352a22', belly: '#5e5448', legs: '#2a221b', sock: '#231c17', accent: '#f2eee4', horn: '#cfc4a8', pattern: 'none', tints: ['#ffffff', '#e8e0d8'], rim: 0.12,
        mode: 'migrate', gait: 'run', heightAt: groundAt, cross: { path, u: deerU, lead: 19, angle: 3, side: -1, offset: -(deerLat - dLat0), span: 124, window: 0.13, bow: 0, height: 0 }, spread: [1.0, 11] }), { light: beastLight });
      // (the deer stand in the wood's shade and its gaps like the ground under them: the same map on their sun term. The
      // kit's creature material is a plain shader: its sun line is given the factor here, once, before it is first drawn)
      {
        const hm = herd.material, line = 'vec3 lit = hemi + uSunColor * dif * cau;';
        if (hm && hm.isShaderMaterial && hm.fragmentShader.includes(line)) {
          Object.assign(hm.uniforms, { uMgPatch: S.uPatch, uMgPatch2: S.uPatch2, tMgShade: S.tShade, uMgShBox: S.uShBox, uMgShSun: S.uShSun, uMgShK: S.uShK });
          hm.fragmentShader = hm.fragmentShader.replace(line, 'vec3 lit = hemi + uSunColor * dif * cau * mgSunShade(1.0, vWorld, 28.0);').replace('void main', GLSL_PATCH + GLSL_SHADE + '\nvoid main');
          hm.needsUpdate = true;
        }
      }
      const g = V3(); beastAt = (time, u) => { herd.positionAt(time, u, g); g.y += 1.1; return g; };
      holdR = 3.6;
    } else {
      // The cow and her calf at the water's edge of the pale bar on our left, 7 m ahead of the lens at u 0.54. She stands
      // flank to us, fore hooves ankle-deep, and lifts her dripping head from the water as we come; the calf stands a
      // body-length clear of her, higher on the gravel, looking our way. This world's own moose (the kit's deer stretched
      // into one read as a horse): hump, bell, long drooping head, legs pale only below the knee.
      const mS = 0.54 * L + 7.0, c = path.posAtDist(mS, V3()), tg = path.tangentAtDist(mS, V3()); tg.y = 0; tg.normalize();
      const surfAt = (x) => waterY(x) + 0.28 + lvl, warm = lookName === 'golden' || lookName === 'dawn';
      const ambK = ({ slate: 3.0, golden: 2.5, squall: 1.5, dawn: 2.0 })[lookName], sunK = LK.gorge[2] > 0.5 ? 0.3 : 0.6;
      const rimC = warm ? col(LK.sun).multiplyScalar(0.5) : col(LK.hemiSky).multiplyScalar(0.55 * LK.hemiI);
      const lin = (h, k = 1) => { const q = col(h); return [q.r * k, q.g * k, q.b * k]; };
      const decals = [];
      // (each stands by the shore as it is drawn at its own place, barShore: `in` metres landward of it. The cow straddles
      // the edge, a third of a metre into the shallows, so her fore hooves are in a hand of water on the shelving beach;
      // the calf is 4.3 m up the gravel: clear of the wander's whole reach, 1.7 m of bay and point and 0.6 m of scallop)
      const stand = (geo, mat, inl, ahead, turn, sc) => {
        const x0 = c.x + tg.x * ahead, dl = -(barShore(x0) + inl - (STREAM_Z - c.z));
        const x = x0 - tg.z * dl, z = c.z + tg.z * ahead + tg.x * dl;
        const ca = Math.cos(turn), sa = Math.sin(turn), dx = tg.x * ca - tg.z * sa, dz = tg.z * ca + tg.x * sa;            // the way it faces: turn > 0 swings the nose toward the stream
        const foot = (k) => Math.max(groundAt(x + dx * k * sc, z + dz * k * sc), surfAt(x + dx * k * sc) - 0.16);
        const yF = foot(0.85), yR = foot(-0.93), mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, yR + (yF - yR) * 0.93 / 1.78, z); mesh.rotation.set(0, Math.atan2(-dz, dx), Math.atan2(yF - yR, 1.78 * sc)); mesh.scale.setScalar(sc);
        scene.add(mesh); beastMeshes.push(mesh);
        decals.push([x, groundAt(x, z) + 0.05, z, Math.atan2(dz, dx), 1.55 * sc, 0.78 * sc, 0, 0]);
        for (const [fx, fz] of geo.userData.feet) {                                 // a ring of ripples where a hoof stands in the water
          const wx = x + (dx * fx - dz * fz) * sc, wz = z + (dz * fx + dx * fz) * sc;
          if (groundAt(wx, wz) < surfAt(wx) - 0.03) decals.push([wx, surfAt(wx) + 0.03, wz, 0, 0.62, 0.62, 1, decals.length * 0.37]);
        }
        return mesh;
      };
      const cowMat = mooseMaterial(S, { seed: 0.3, sun: sunK, amb: ambK, rim: 1, rimC });
      const calfMat = mooseMaterial(S, { seed: 0.8, sun: sunK, amb: ambK * 1.08, rim: 0.9, rimC });
      const cow = stand(mooseGeometry({ coat: lin('#6b5444'), dark: lin('#35271f'), pale: lin('#a89a8a'), sock: lin('#b8ab9a') }), cowMat, -0.3, 0, 0.38, 1.2);
      await ctx.yield();
      stand(mooseGeometry({ calf: true, coat: lin('#7c5a44'), dark: lin('#42301f'), pale: lin('#b09880'), sock: lin('#b8a690') }), calfMat, 4.3, -2.2, 2.5, 0.8);
      await ctx.yield();
      {
        const g = new THREE.InstancedBufferGeometry(), base = new THREE.PlaneGeometry(2, 2, 1, 1).rotateX(-Math.PI / 2);
        g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
        const iP = new Float32Array(decals.length * 4), iQ = new Float32Array(decals.length * 4);
        decals.forEach((d, i) => { iP.set(d.slice(0, 4), i * 4); iQ.set(d.slice(4), i * 4); });
        g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 4)); g.instanceCount = decals.length;
        const under = new THREE.Mesh(g, underfootMaterial(S)); under.frustumCulled = false; under.renderOrder = 4; scene.add(under); beastMeshes.push(under);
      }
      const g = V3(cow.position.x - tg.x * 0.2 - tg.z * -1.6, cow.position.y + 1.5, cow.position.z - tg.z * 0.2 + tg.x * -1.6);   // the gaze rests between them, nearer the cow
      beastAt = () => g;
      // she drinks; as we come down the run she lifts her head, water falling from her muzzle, and watches us pass
      beastPose = (time, u) => {
        cowMat.uniforms.uPose.value.x = lerp(0.92, -0.06, smoothstep(0.475, 0.515, u)) + 0.04 * Math.sin(time * 0.9) + (u <= 0 ? 0.45 * (Math.sin(time * 0.35) - 1) : 0);
        calfMat.uniforms.uPose.value.x = 0.05 + 0.12 * Math.sin(time * 0.7 + 1);
      };
      holdR = 6.2;
    }
    await ctx.yield();
    // a great blue heron put up from the shallows below the bar: it flies down the stream ahead of us on slow wings, low over
    // the water, and swings away before the great maple
    fauna.add(F.makeFlock({ rng: R.fork('heron'), species: 'flamingos', form: 'loose', count: 1, size: 1.75, body: '#7d90a8', belly: '#a8b4c0', wingC: '#6c80a0', trail: '#2a3442', tip: '#1c222b', head: '#e6eaec', neckC: '#b4b8b8', tailC: '#566880', beak: '#d8a030', legC: '#3a332c',
      flap: 2.3, glide: 0.1, along: { path, side: -0.9, up: -1.5, lead: 7, from: 0.555, to: 0.695, drift: 0.3 }, spread: [0.1, 0.1, 0.1], wander: [0.4, 0.25, 0.3, 0.5] }));
    await ctx.yield();
    // wood ducks flushed from the pool: from the lip they fly down with us on the left, just below the lens, dark over their own wakes
    fauna.add(F.makeFlock({ rng: R.fork('ducks'), species: 'geese', form: 'loose', count: 8, size: 1.5, body: '#33261f', belly: '#cdbb94', wingC: '#27324a', head: '#173f2e', neckC: '#173f2e', tailC: '#1f1814', tip: '#e6e2d6',
      flap: 6.5, glide: 0, along: { path, side: DUCK.side, up: DUCK.up, lead: DUCK.lead, from: DUCK.from, to: DUCK.to, drift: 0.6 }, spread: [2.6, 1.0, 5.5], wander: [0.3, 0.25, 0.4, 0.6] }));
    await ctx.yield();

    // ---------- far ridges, scud under the deck, weather ----------
    // The far hills STAND STILL: one ring of three ranges, fixed in the world round the middle of the gorge (follow 0, and
    // its place is set once, here; nothing moves it with the lens). They are the low rounded hills of the Green
    // Mountains: the nearest range 1400 m out, the farthest 3200 m, 60 m to 150 m from foot to top with their foot at
    // -90, paled by the haze ("Thin blue-grey haze pales the far ridges by 2 km"). They lie low behind the canopy and
    // behind the brink. 3200 m and the ring's own skirt keep every range within the 4200 m the world is drawn to,
    // from both ends of the way. 220 segments: 5280 triangles.
    // Their skyline is drawn from the world's own noise in two octaves (the kit's four make teeth narrower than a
    // segment of the ring): long backs and saddles, old hills.
    const ridges = T.makeHorizonRidges({ rng: R.fork('ridges'), noise: { n2: (x, y) => noise.n2(x + 211, y + 97), fbm2: (x, y, o, l, g) => noise.fbm2(x + 211, y + 97, Math.min(o ?? 2, 2), l, g) },
      fog: scene.fog, layers: 3, radius: [1400, 3200], height: [60, 150], base: -90, segments: 220, follow: 0, jagged: 0.08, colorNear: '#4a3428', sunDir, sunColor: LK.sun, rim: 0.2 });
    ridges.object.position.set(-300, -90, STREAM_Z); ridges.object.updateMatrixWorld(true);
    scene.add(ridges.object);
    await ctx.yield();
    let scud = null, snow = null, mist = null;
    if (LK.clouds) {
      scud = makeCloudField({ rng: R.fork('scud'), sky, count: LK.clouds.count, altitude: 270, altitudeJitter: 60, size: [260, 520], height: 0.34, puffs: 30, wind: [26, 0, 4.5], center: [150, 0, 0], extent: [3000, 2200], opacity: 0.72 });
      scene.add(scud.object);
      await ctx.yield();
    }
    if (LK.snow) {
      snow = fx.makeParticles({ rng: R.fork('snow'), preset: 'snow', time: S.uTime, count: Math.round(3400 * detail), box: [64, 40, 64], velocity: [27, -3.4, 2], velocityRandom: [6, 1.6, 3], turbulence: [0.8, 0.4, 0.8], size: [0.03, 0.075], opacity: 0.6 });
      scene.add(snow.object);
      await ctx.yield();
    }
    if (LK.mist) {
      mist = fx.makeMist({ rng: R.fork('mist'), time: S.uTime, count: 60, area: [540, 6, 44], center: [-285, 0, STREAM_Z], size: [14, 30], color: '#e4e2f0', opacity: 0.15, drift: [1.6, 0, 0.2], heightAt: (x) => waterY(x) + 1.2, lift: 1.6 });
      scene.add(mist.object);
      await ctx.yield();
    }
    // white mist from the foot of the fall drifts out over the near water
    // (it is driven sixty metres out and more: from the lip it lies under us at the bottom of the reveal, over the churn)
    const fallMist = fx.makeMist({ rng: R.fork('fallmist'), time: S.uTime, count: LK.mist ? 84 : 76, area: [LK.mist ? 84 : 54, 8, LK.mist ? 60 : 30], center: [A.fallFoot.x + (LK.mist ? 44 : 36), POOL_Y + 6, STREAM_Z + 3],
      size: [5, 12], color: lookName === 'dawn' ? '#f4dccf' : lookName === 'golden' ? '#f2dcc0' : '#dfe4ea', opacity: LK.mist ? 0.1 : 0.12, drift: [2.4, 0, 0.3] });
    scene.add(fallMist.object);
    await ctx.yield();
    // spray where the side brook lands
    const brookMist = fx.makeMist({ rng: RX.fork('brookmist'), time: S.uTime, count: 12, area: [7, 5, 7], center: [CASC_X, waterY(CASC_X) + 3.4, STREAM_Z + 19 + 4.5 * noise.n2(CASC_X * 0.013 + 3, 1.3) + 5],
      size: [3, 6.5], color: lookName === 'dawn' ? '#f4dccf' : lookName === 'golden' ? '#f2dcc0' : '#dfe4ea', opacity: 0.2, drift: [0.8, 0, -0.3] });
    scene.add(brookMist.object);
    await ctx.yield();

    // the dead birch snag on the right bank (it falls only on the rare visit)
    const snagPivot = new THREE.Group(); snagPivot.position.copy(snagF); snagPivot.position.y -= 0.7;
    snagPivot.rotation.order = 'YXZ'; snagPivot.rotation.y = Math.atan2(-snagD.x, -snagD.z);          // its own -Z is the way it falls
    snagPivot.scale.setScalar(rare ? 1 : 0.5);                                                       // on an ordinary visit a smaller dead birch, creaking
    const snag = new THREE.Mesh(snagGeometry(R.fork('snag')), snagMaterial(S));
    snagPivot.add(snag); scene.add(snagPivot);
    // the fall, in u: it snaps at snagU0 and swings fast, hangs at 50 degrees as we pass under it (the trunk crosses our line
    // 7 m beyond its foot, 6 m over the lens), then tears free and comes down behind us
    const snagU0 = 0.578, snagUC = (snagFS + 9.5 * 0.7) / L + 0.004, snagBurst = snagBurstMaterial(S);
    if (rare) {
      const n = Math.round(520 * lerp(0.7, 1, detail)), xb = RX.fork('snagburst'), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iCol = new Float32Array(n * 3), c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        const dust = i < 30 ? 1 : 0, atFoot = xb.chance(0.42), crack = !atFoot && xb.chance(0.4), k0 = atFoot ? xb.range(0, 0.1) : crack ? xb.range(0.27, 0.44) : Math.pow(xb(), 0.8) * 1.15, up = atFoot ? xb.range(0, 3.5) : crack ? xb.range(7, 25) : xb.range(1, 25);   // a second crack as it leans: the puff of bark at u 0.62
        const t = xb();
        iA.set([up, k0, dust ? 1 : t >= 0.75 ? 2 : 0, xb()], i * 4);                    // dust, a dead leaf, or a curl of bark
        iB.set([xb.range(-2, 5), atFoot ? xb.range(1, 8) : xb.range(-1, 4), xb.range(-4, 4), dust ? xb.range(0.9, 1.9) : t >= 0.75 ? xb.range(0.22, 0.4) : 0.16 + 0.34 * Math.pow(xb(), 1.6)], i * 4);
        if (dust) c.set('#cdbfa6'); else if (t < 0.55) c.set('#e6dcc6'); else if (t < 0.75) c.set('#8a6a48'); else c.copy(t < 0.9 ? cOrange : cCrimson).multiplyScalar(0.8);
        c.multiplyScalar(xb.range(0.75, 1.05)); iCol.set([c.r, c.g, c.b], i * 3);
      }
      const g = new THREE.InstancedBufferGeometry(), base = new THREE.PlaneGeometry(2, 2, 1, 1);
      g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3)); g.instanceCount = n;
      snagBurst.uniforms.uFoot.value.copy(snagF); snagBurst.uniforms.uFallDir.value.copy(snagD); snagBurst.uniforms.uWindDir.value.copy(snagT);
      const burst = new THREE.Mesh(g, snagBurst); burst.frustumCulled = false; burst.renderOrder = 5; scene.add(burst); snagFlakes = burst;
    }

    // what the leaf streams part round: boulders, near trunks, the pine, the snag
    const obs = [{ x: pineX, z: pineZ, r: 1.7, y0: -1e3, y1: 1e3 }, { x: snagF.x, z: snagF.z, r: 1.3, y0: -1e3, y1: 1e3 }];
    for (const b of boulders) if (b.inStream || b.pd < 12) obs.push({ x: b.x, z: b.z, r: b.r * 1.15, y0: -1e3, y1: b.y + b.r * 1.3, rib: !!b.rib });
    for (const p of nearPts) obs.push({ x: p.x, z: p.z, r: p.rib ? 1.45 : 1.05, y0: -1e3, y1: 1e3, rib: !!p.rib });       // a ribbon's own trunk opens a wider gap in it
    for (const p of mainPts) if (p.pd < 30) obs.push({ x: p.x, z: p.z, r: p.rib ? 1.45 : p.y + GS[p.v].h * p.s < path.nearestXZ(p.x, p.z).y - 4 ? GS[p.v].r * p.s * 0.6 : 1.05, y0: -1e3, y1: p.y + GS[p.v].h * p.s, rib: !!p.rib });
    for (const p of quiltPts) if (p.pd < 30) obs.push({ x: p.x, z: p.z, r: QS.r * p.s * 0.6, y0: -1e3, y1: p.y + QS.h * p.s });
    hero.setPath(path); hero.setObstacles(obs);
    hero.gust.setFloor(-3.5);
    await ctx.yield();

    if (ctx.renderer && sky.prewarm) { try { await sky.prewarm(ctx.renderer, null, scene); } catch (e) { /* headless */ } }

    // ---------- the flight ----------
    const mapleAim = V3(A.crownCentre.x, A.crownCentre.y, A.crownCentre.z), eyeAim = V3(eye.x, POOL_Y + 2, eye.z), cascAim = V3(CASC_X, waterY(CASC_X) + 8.5, STREAM_Z + 30);
    const buf = new THREE.Vector2(), pv = V3();
    const patchLead = lookName === 'slate' ? 150 : 0;                              // the design's: centred 150 m ahead of us
    const pvT = V3(), heroFloor = lookName === 'slate' ? 0.46 : LK.patch[1];
    function update(dt, time, camera, u) {
      const uu = u ?? 0, camS = uu * L;
      S.uTime.value = time; S.uShK.value.z = time;                               // (the shade breathes with the wind: GLSL_SHADE)
      const hpx = ctx.renderer && ctx.renderer.getDrawingBufferSize ? (ctx.renderer.getDrawingBufferSize(buf).y || 1080) : 1080;
      S.uPx.value = 2 / (((camera && camera.projectionMatrix.elements[5]) || 1.66) * hpx);
      // the break of sun rides 150 m ahead of us, breathing, and comes to rest on the pool (its breath along the way: 6 m
      // in the slate look, a twentieth of the break's own 110 m radius, so its edge is seen to move on the walls without
      // the break leaving its place ahead; 20 m in the looks whose break is centred on us and is wide open)
      path.posAtDist(Math.min(camS + patchLead + (patchLead ? 6 : 20) * Math.sin(time * 0.31), L), pv);
      S.uPatch.value.x = pv.x; S.uPatch.value.y = pv.z + 12 * Math.sin(time * 0.23 + 1);
      hero.setPatch(S.uPatch.value.x, S.uPatch.value.y, S.uPatch.value.z, heroFloor, S.uPatch2.value.x, S.uPatch2.value.y, S.uPatch2.value.z);   // (flying leaves keep their embers outside the break)
      // gust fronts overtake us through the canopy as pale waves of turned leaves
      path.posAtDist(camS, pv); S.uWave.value.x = pv.x + 25 + 13 * time;
      // the front itself, 25 m ahead of us: each crown flashes pale and lets go as it passes. Over the open upland the gust
      // has nothing to squeeze it; the flash comes on with the notch of the gorge, from where it opens to where it is at
      // its full width (the land's own two places, GORGE_X0 and GORGE_X1): a rule of where the front is in the world
      { const fS = Math.min(camS + hero.frontLead, L); path.posAtDist(fS, pv); path.tangentAtDist(fS, pvT); const tl = Math.hypot(pvT.x, pvT.z) || 1;
        S.uFront.value.set(pv.x, pv.z, pvT.x / tl, pvT.z / tl); S.uBurst.value.x = smoothstep(GORGE_X0, GORGE_X1, pv.x); }
      hero.setProgress(uu); hero.setStrip((camS - (treeS - 62)) / 21);          // stripping from 62 m short, bare 20 m short, the cloud ahead of us at the pass
      // out past the lip the gust has nothing left to push against: the streams open round the flight line and thin ahead of us
      const open = smoothstep(0.85, 0.9, uu);
      hero.gust.setClear(lerp(3.2 * smoothstep(0.3, 0.38, uu), 5.5, open)); hero.gust.setLead(lerp(25, 12, open)); hero.gust.setAhead(lerp(0.26, 0.16, open));
      // the air is thick with leaves over the crowns, calmer down the run (there the gust is its two ribbons, with packets of
      // loose leaves between them and the wood and the water seen through), and fills again as the great maple lets go
      hero.gust.setAmount(lerp(0.9, 0.24, smoothstep(0.13, 0.27, uu)) + 0.76 * smoothstep(0.7, 0.8, uu));
      // the streams part round the deer or the moose while they are the subject, so no leaf crosses in front of them
      { const k = smoothstep(0.455, 0.48, uu) * (1 - smoothstep(0.6, 0.64, uu)), kc = smoothstep(0.3, 0.34, uu) * (1 - smoothstep(0.44, 0.455, uu));
        if (k > 0 && camera) {
          const b = beastAt(time, uu); pv.setFromMatrixPosition(camera.matrixWorld);
          hero.setHold(0, b.x, b.z, holdR * k, b.y - 5, b.y + 6);
          hero.setHold(1, lerp(pv.x, b.x, 0.56), lerp(pv.z, b.z, 0.56), holdR * 0.72 * k * smoothstep(8, 13, Math.hypot(b.x - pv.x, b.z - pv.z)), b.y - 5, b.y + 6);   // and the line we see them along
        } else if (kc > 0 && camera) {                                           // before them, the side fall: the air between us and it is clear
          pv.setFromMatrixPosition(camera.matrixWorld);
          hero.setHold(0, lerp(pv.x, cascAim.x, 0.3), lerp(pv.z, cascAim.z, 0.3), 5.5 * kc, -1e3, 1e3);
          hero.setHold(1, lerp(pv.x, cascAim.x, 0.62), lerp(pv.z, cascAim.z, 0.62), 8 * kc, -1e3, 1e3);
        } else { hero.setHold(0, 0, 0, 0); hero.setHold(1, 0, 0, 0); } }
      S.uWakeAge.value = 14 * smoothstep(0.86, 1.0, uu);
      if (camera) { pv.setFromMatrixPosition(camera.matrixWorld); lodUpdate(pv); if (poolLeaves) poolLeaves.visible = pv.x > -330; if (rimWood) rimWood.visible = pv.x > -230; if (rimEdge) rimEdge.visible = true; for (let i = 0; i < 4; i++) { const on = pv.x > REACH[i][0] - 150 && pv.x < REACH[i][1] + 70; for (const m of reachMeshes[i]) m.visible = on; if (cobbleMeshes) cobbleMeshes[i].visible = on; } for (let i = 0; i < 2; i++) { const on = pv.x > REACH[i * 2][0] - 150 && pv.x < REACH[i * 2 + 1][1] + 70; for (const m of pairMeshes[i]) m.visible = on; } { // the stream: the pieces within 170 m as they are; those farther upstream in one coarse draw, those farther downstream in another
          let uA = -1, uB = -1, dA = -1, dB = -1;
          for (let i = 0; i < streamLod.length; i++) { const sl = streamLod[i], off = pv.x < sl.x0 ? sl.x0 - pv.x : pv.x > sl.x1 ? pv.x - sl.x1 : 0, fr = off > 170; sl.near.visible = !fr; if (fr) { if (sl.x1 < pv.x) { if (uA < 0) uA = i; uB = i; } else { if (dA < 0) dA = i; dB = i; } } }
          for (let k = 0; k < 2; k++) {
            const a = k ? dA : uA, b = k ? dB : uB, mesh = streamFar[k]; mesh.visible = a >= 0;
            if (a >= 0) { const A0 = streamLod[a], B0 = streamLod[b], xm = (A0.x0 + B0.x1) / 2; mesh.geometry.setDrawRange(A0.f0, B0.f1 - A0.f0); mesh.geometry.boundingSphere.center.set(xm, waterY(xm), zc(xm)); mesh.geometry.boundingSphere.radius = (B0.x1 - A0.x0) / 2 + 60; }
          } } }
      if (beastPose) beastPose(time, uu);
      hero.update(dt, time, camera);
      sky.update(dt, time, camera); fall.update(dt, time, camera);
      terrain.update(dt, time);
      forest.update(dt, time, camera); ledgeWood.update(dt, time, camera);
      if (camera) {
        // the bowl and what stands round it: the fall, the pool and its mist are drawn always (the leaves on the pool from
        // x -330 on, with the reaches above); the trees and crowns round the bowl as the line over the lip reaches them
        pv.setFromMatrixPosition(camera.matrixWorld);
        const kc = pv.x < LIP_X - 8 ? (pv.y - LIP_Y) / (LIP_X - pv.x) : 1e3;
        for (const m of pastOwn) m.visible = !past(m, pv);
        for (const m of sightMeshes) { const kt = m.userData.kt; let n = m.userData.kn | 0; while (n < kt.length && kt[n] < kc) n++; while (n > 0 && kt[n - 1] >= kc) n--; m.userData.kn = n; m.count = n; if (!n) m.visible = false; }
      } runWood.update(dt, time); runWoodFar.update(dt, time); nearWood.update(dt, time); nearWoodFar.update(dt, time); quiltWood.update(dt, time, camera); ferns.update(dt, time, camera); shrubs.update(dt, time, camera); sedge.update(dt, time, camera); sedge2.update(dt, time, camera); ferns2.update(dt, time, camera); shrubs2.update(dt, time, camera);
      if (camera) for (const m of pastKit) if (past(m, pv)) m.visible = false;
      fauna.update(dt, time, camera, uu);
      if (scud) scud.update(dt, time, camera);
      if (snow) snow.update(dt, time, camera);
      if (mist) mist.update(dt, time, camera);
      fallMist.update(dt, time, camera);
      brookMist.update(dt, time, camera);
      // the snag creaks in the wind; on the rare visit it snaps and comes down across the stream: we pass under it while it is
      // still 35 degrees over and 11 m up, and it hits the water behind us
      let ang = 0.03 * Math.sin(time * 1.7) + 0.016 * Math.sin(time * 2.9);
      if (rare) {
        const k = (uu - snagU0) / (snagUC - snagU0), kc = clamp(k, 0, 1), drop = clamp((uu - snagUC) / 0.035, 0, 1);
        ang = ang * (1 - kc) + 0.87 * (1 - Math.pow(1 - kc, 2.2)) + (k > 0 && drop < 1 ? 0.012 * Math.sin(time * 9) * kc * (1 - drop) : 0) + 0.7 * drop * drop;
        snagBurst.uniforms.uClock.value = uu > 0 ? k : -1;
      }
      snagPivot.rotation.x = -ang;
    }

    return {
      scene, path, duration: 40, title: LK.title,
      // unhurried over the crowns, the full gust down the run, eased past the maple as it strips, held in the open air over the pool
      pace: (u) => 0.62 + 0.68 * smoothstep(0.1, 0.26, u) - 0.2 * smoothstep(0.72, 0.8, u) - 0.48 * smoothstep(0.8, 0.86, u) + 0.33 * smoothstep(0.885, 0.93, u),
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 22, sway: 1.5, bank: 1.3 },
      pois: [
        { at: mapleAim, from: 0.0, to: 0.33, weight: 0.5 },
        { at: cascAim, from: 0.3, to: 0.475, weight: 0.55 },                      // the side ravine and its brook, on our right
        { at: beastAt, from: beast === 'deer' ? 0.44 : 0.455, to: beast === 'deer' ? 0.6 : 0.572, weight: 0.75 },   // the cow stands still: once we are past her the gaze is let go
        { at: mapleAim, from: beast === 'deer' ? 0.585 : 0.556, to: 0.875, weight: 0.62 },
        { at: eyeAim, from: 0.845, to: 0.975, weight: 0.55 },
      ],
      // (blendDistance: this world's grade holds to the last forty metres, so the dark pool is shown with the contrast it was set for)
      portal: { shape: 'circle', radius: 7, color: LK.portal, glow: 1, tilt: true, revealDistance: 240, blendDistance: 40 },
      post: { exposure: LK.exposure, bloom: { strength: LK.bloom, radius: 0.6, threshold: 0.92 },
        grade: { saturation: LK.sat, contrast: GRADE_CONTRAST, tint: LK.tint, shadowTint: LK.shadow, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update,
      dispose() {
        if (sky.dispose) sky.dispose();
        hero.dispose();
        for (const g of [...setNear, ...setMid, ...setFar, ...quiltSet, hemD]) g.dispose();
      },
    };
  },
};
