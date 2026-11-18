// valley-inside-the-works, THE SHED: its four materials.
//   surface  brick, stone, granite, boards, planks and painted iron: a MeshStandardMaterial lit by the scene's own
//            lights and crossed by the plan's bars of light; the kind of surface is aP.z, drawn by pattern in the shader,
//            every fine pattern filtered by the pixel's footprint (the last kinds, sugar and mint, are the head wall's
//            jewels and its striped boiled sweets).
//            It is made twice: `solid` for all that stands as built, and `column` (with the SHED_TALL define) for the
//            instanced columns, whose upper part rides up by aTall and whose shaft is painted as a cane where aCane says.
//   lace     flat iron work drawn in the shader on plain panels and blended by its filtered cover: lattice webs,
//            truss members, railings, gratings, brackets (so that no bar is ever thinner than a pixel and shimmers).
//   glass    the roof lights and the windows: unlit; through every pane the sky beyond (blue, with sunlit cumulus
//            drifting by the clock and the sun's own glare), behind dark glazing bars; the head wall's wheel windows
//            are of swirled sugar glass, two colours in a spiral that glow by the day and turn slowly by the clock.
// The lit kinds take the plan's bars of light twice: the sun's own part through barMaterial, and a warm bounce from
// the lit meadow that is strong where a bar comes down and faint between the bars.
// What reads the lens here: the footprint filter (fwidth); the sky beyond the glass, drawn by the direction looked
// along (the eye's own ray from cameraPosition through the pane), as any sky is, round whichever eye looks; and the
// flutes' tilt of the normal, where viewMatrix carries the world's upright axis into view space (the tilt is the
// same from any eye). Nothing is placed, hidden or timed by the lens.
import { barMaterial } from './valley-inside-the-works-plan.js';
import { COMMON, SURFACE_FUNCS, IRON_FUNCS, SURFACE_MAIN, SURFACE_NORMAL } from './valley-inside-the-works-shed-glsl.js';
import { LACE_FUNCS, LACE_MAIN, GLASS_VERT, GLASS_PANES, GLASS_SKY, GLASS_FRAG_HEAD, GLASS_FRAG_MAIN } from './valley-inside-the-works-shed-glsl2.js';

export const KIND = { brick: 0, ashlar: 1, granite: 2, boards: 3, planks: 4, iron: 5, flute: 6, plain: 7, sugar: 8, mint: 9 };
export const LACE = { web: 0, truss: 1, rail: 2, grate: 3, bracket: 4 };
export const PANE = { roof: 0, wall: 1, wheel: 2 };

// what the hour deals: the gain of the roof's light as the boat's sugar mirrors it, the lift of the cream boards by
// the glass's own light, and the light thrown back from the lit meadow onto everything of the shed (so that no shade
// goes black)
const HOURS = {
  day: { glass: 1.55, lift: 0.34, bounce: 0.12 }, golden: { glass: 1.5, lift: 0.3, bounce: 0.13 },
  dawn: { glass: 1.45, lift: 0.3, bounce: 0.11 }, night: { glass: 1.6, lift: 0.3, bounce: 0.08 },
};
// THE SKY BEYOND THE GLASS, by the hour (linear colours, held under white so that the blue stays blue in the picture):
// its blue overhead (top), a hand above the horizon (mid) and at the horizon (low); the cumulus' sunlit and shaded
// colours; k = [the cloud's threshold (lower: more cloud), the softness of its edge, the sun's own glare, the sugar
// windows' brightness]. The fourth hour is a day of broken cloud with blue gaps.
const SKIES = {
  day: { top: [0.06, 0.17, 0.58], mid: [0.13, 0.32, 0.72], low: [0.66, 0.68, 0.64], cloud: [1.16, 1.13, 1.07], dark: [0.5, 0.57, 0.7], k: [0.54, 0.16, 1, 1] },
  golden: { top: [0.045, 0.12, 0.48], mid: [0.15, 0.28, 0.6], low: [0.95, 0.66, 0.38], cloud: [1.25, 0.86, 0.4], dark: [0.48, 0.4, 0.5], k: [0.55, 0.16, 1, 1] },
  dawn: { top: [0.2, 0.36, 0.7], mid: [0.42, 0.5, 0.75], low: [0.95, 0.58, 0.56], cloud: [1.15, 0.72, 0.68], dark: [0.55, 0.46, 0.62], k: [0.54, 0.18, 0.8, 1] },
  night: { top: [0.08, 0.2, 0.56], mid: [0.16, 0.34, 0.68], low: [0.6, 0.64, 0.66], cloud: [0.98, 0.99, 1.0], dark: [0.42, 0.46, 0.55], k: [0.45, 0.14, 0.35, 1] },
};
export function makeMaterials(THREE, o) {
  const look = o.look, H = HOURS[look.hour] || HOURS.day;
  const bounce = look.sun.clone().multiply(new THREE.Color(0.62, 0.6, 0.42)).multiplyScalar(H.bounce);
  const uniforms = {
    uShedTime: { value: 0 }, uShedSky: { value: look.sky.clone() }, uShedSun: { value: look.sun.clone() },
    uShedBounce: { value: bounce }, uShedLift: { value: H.lift },
    uShedPaint: { value: new THREE.Color(0.4, 0.52, 0.48) }, uShedRail: { value: new THREE.Color(0.14, 0.24, 0.24) },
    uShedGlassBar: { value: new THREE.Color(0.07, 0.1, 0.095) }, uShedGlassGain: { value: H.glass },
    uShedLight: { value: o.lightDir.clone().normalize() },
  };
  const S = SKIES[look.hour] || SKIES.day, rgb = (c) => new THREE.Color(c[0], c[1], c[2]);
  Object.assign(uniforms, {
    uShedSkyTop: { value: rgb(S.top) }, uShedSkyMid: { value: rgb(S.mid) }, uShedSkyLow: { value: rgb(S.low) },
    uShedCloud: { value: rgb(S.cloud) }, uShedCloudDark: { value: rgb(S.dark) }, uShedSkyK: { value: new THREE.Vector4(S.k[0], S.k[1], S.k[2], S.k[3]) },
  });
  const HEAD = 'varying vec4 vP;\nuniform float uShedTime, uShedLift; uniform vec3 uShedSky, uShedSun, uShedBounce, uShedPaint, uShedRail;\n'
    + 'float shedRough = 0.85, shedTilt = 0.0; vec3 shedGlow = vec3(0.0);\n' + COMMON;
  const vertex = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aP;\nvarying vec4 vP;\n#ifdef SHED_TALL\nattribute float aTall;\nattribute float aCane;\nvarying float vCane;\n#endif')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvP = aP;\n#ifdef SHED_TALL\ntransformed.y += aP.w * aTall; vP.y = transformed.y; vCane = aCane;\n#endif');
  };
  const surface = (name, defines) => {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
    mat.defines = Object.assign({}, mat.defines || {}, defines || {});
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      vertex(shader);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + HEAD + SURFACE_FUNCS + IRON_FUNCS)
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + SURFACE_MAIN)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = shedRough;')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + SURFACE_NORMAL)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * shedGlow;');
    };
    mat.customProgramCacheKey = () => 'valley-shed-surface:' + name;
    return barMaterial(mat);
  };
  const solid = surface('solid'), column = surface('column', { SHED_TALL: '' });
  const lace = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, depthWrite: false });
  lace.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    vertex(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + HEAD + LACE_FUNCS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + LACE_MAIN)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uShedBounce * 0.6 * mix(0.15, 4.5, lightBar(vValleyBar));');
  };
  lace.customProgramCacheKey = () => 'valley-shed-lace';
  barMaterial(lace);
  const glass = new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uniforms),
    vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG_HEAD + COMMON + GLASS_PANES + GLASS_SKY + GLASS_FRAG_MAIN,
    fog: true, vertexColors: true, side: THREE.DoubleSide,
  });
  return { solid, column, lace, glass, uniforms, all: [solid, column, lace, glass] };
}
