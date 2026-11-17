// hill-of-round-doors, the homes: the materials. One lit material draws every solid thing of the homes (walls, doors,
// turf lips, garden things, plants, hens): a MeshStandardMaterial, so that it takes the scene's own sun, fill and
// fog, with the surface's pattern (brick, stone, boards, turf, glass ...) drawn from the vertex's `surf` and
// filtered by the pixel's footprint, a sway by the wind for what the wind moves, and the windows' own glow by uLit.
import { GLSL_HASH, GLSL_VALUE_NOISE } from '../kit/fx.js';

// hillPattern: the albedo of a surface kind at pattern coordinates uv (metres); fw: the pixel's footprint in metres;
// base: the vertex colour; out: roughness and the light the surface gives off by itself (before uLit).
export const PATTERN_GLSL = GLSL_HASH + GLSL_VALUE_NOISE + /* glsl */`
float hillJoint(float d, float w, float fw, float cell, float mean){
  float m = 1. - smoothstep(w, w + max(fw, .006), d);
  return mix(mean, m, 1. - smoothstep(cell * .12, cell * .5, fw));
}
// the sward seen near, as the land's own turf draws it (its turfDetail, hill-of-round-doors-land-turf.js: the same
// patches at the same places): x the tone of the tufts, y the blade tips that catch the light; px: the pixel's footprint
vec2 hillTurf(vec2 q, float px){
  float a = vnoise(q * 3.1), b = vnoise(q * 9.7 + 3.1), c = vnoise(q * 31. + 7.7);
  float kb = 1. - smoothstep(.04, .14, px), kc = 1. - smoothstep(.012, .045, px);
  float eb = clamp(px * 9.7, .05, .5), ec = clamp(px * 31., .06, .5);
  float tone = mix(.5, mix(a, a * .45 + .55 * smoothstep(.5 - eb, .5 + eb, b), kb), 1. - smoothstep(.12, .45, px));
  return vec2(tone, smoothstep(.6 - ec, .6 + ec, c) * kc);
}
vec3 hillPattern(float kind, vec2 uv, float par, vec3 wp, vec3 base, float fw, float time, vec3 sky, vec3 glow, out float rough, out vec3 emit){
  vec3 c = base; rough = .88; emit = vec3(0.);
  float near = 1. - smoothstep(.06, .3, fw);
  if (kind < .5) {                                   // paint
    c *= .96 + .08 * vnoise(uv * 3.1); rough = .55;
  } else if (kind < 1.5) {                           // brick, running bond
    vec2 b = uv / vec2(.66, .22); float row = floor(b.y); b.x += .5 * mod(row, 2.);
    vec2 id = floor(b), f = fract(b);
    float d = min(min(f.x, 1. - f.x) * .66, min(f.y, 1. - f.y) * .22);
    float h = hash12(id + 3.7), h2 = hash12(id * 1.7 + 11.3);
    vec3 tint = mix(vec3(.8, .74, .7), vec3(1.16, 1.06, .98), h); tint = mix(tint, vec3(.52, .46, .5), step(.87, h2));
    c *= mix(vec3(1.), tint, near);
    c *= 1. - .22 * near * smoothstep(.75, 1., f.y);                    // the shade under the course above
    c = mix(c, vec3(.66, .61, .52), .9 * hillJoint(d, .016, fw, .22, .18));
  } else if (kind < 2.5) {                           // stone in courses
    float s = par > 0. ? par : 1., rh = .46 * s; float row = floor(uv.y / rh);
    float wr = (.6 + .55 * hash11(row * 7.13 + 2.)) * s;
    vec2 b = vec2(uv.x / wr + hash11(row * 3.1 + 5.) * 5., uv.y / rh); vec2 id = floor(b), f = fract(b);
    float d = min(min(f.x, 1. - f.x) * wr, min(f.y, 1. - f.y) * rh);
    float h = hash12(id + 1.9), h2 = hash12(id * 2.3 + 7.1);
    vec3 tint = mix(vec3(.74, .74, .76), vec3(1.14, 1.1, 1.02), h); tint *= mix(vec3(1.), vec3(1.08, .96, .84), h2);
    c *= mix(vec3(1.), tint, near) * (.93 + .14 * vnoise(uv * 6.));
    c *= 1. - .25 * near * smoothstep(.8, 1., f.y);
    c = mix(c, c * vec3(.42, .4, .38), hillJoint(d, .02 * s, fw, rh, .14));
  } else if (kind < 3.5) {                           // boards along v
    float bw = par > 0. ? par : .42; float b = uv.x / bw, id = floor(b), f = fract(b);
    float d = min(f, 1. - f) * bw;
    c *= (.9 + .2 * hash11(id + 1.3) * near) * (.93 + .14 * near * vnoise(vec2(uv.x * 16., uv.y * 1.2 + id * 7.)));
    c *= 1. - .62 * hillJoint(d, .014, fw, bw, .07);
    rough = par > 1. && par < 2. ? .2 : .62;          // the broad boards of the green door are glossy paint
  } else if (kind < 4.5) {                           // turf: the ground's own mown sward by place (the land's law for
    // a mound: tones by place, tufts, lit tips, laid on the ground's plane or on the upright planes of a face), so
    // that a lip or a roof of turf meets the ground beside it in one tone and one pattern
    vec2 p = wp.xz; vec3 dx = dFdx(wp), dy = dFdy(wp); float pa = length(dx), pb = length(dy), px = min(max(pa, pb), min(pa, pb) * 2.5);
    vec3 gn = normalize(cross(dx, dy) + 1e-9); float steep = 1. - smoothstep(.45, .72, abs(gn.y)), ax = abs(gn.x), az = abs(gn.z);
    c *= (.88 + .24 * vnoise(p * .23)) * mix(vec3(1.), vec3(.84, .98, .94), smoothstep(.55, .8, vnoise(p * .055 + 17.)));
    c *= mix(vec3(.9, .96, 1.02), vec3(1.1, 1.04, .92), vnoise(p * .0125 + 40.));
    vec2 det = hillTurf(p, px);
    if (steep > 0.) det = mix(det, mix(hillTurf(wp.xy + 11.3, px), hillTurf(wp.zy + 4.7, px), smoothstep(.35, .65, ax / max(ax + az, 1e-3))), steep);
    c *= (.74 + .52 * det.x) * mix(1., .7 + .55 * det.x, steep);
    c = mix(c, c * vec3(1.45, 1.4, 1.1) + base * vec3(.1, .09, 0.), det.y * .6); rough = .95;
  } else if (kind < 5.5) {                           // plaster
    c *= (.93 + .1 * vnoise(uv * 4.)) * (.96 + .08 * vnoise(vec2(uv.x * 9., uv.y * .7))); rough = .9;
  } else if (kind < 6.5) {                           // a window pane and the room behind it
    vec2 q = uv - vec2(.18 * sin(par * 9.), -.25);
    float lamp = exp(-dot(q, q) * 1.5), curtain = smoothstep(.5, .8, abs(uv.x) + .1 * sin(uv.y * 7. + par * 5.));
    c = mix(mix(vec3(.035, .05, .07), sky * .3, .5), vec3(.36, .31, .24), curtain * .5);
    emit = glow * (.6 + 1.5 * lamp) * (1. - .5 * curtain) * (.95 + .05 * sin(time * 5.3 + par * 40.) * step(par, 1.5));
    rough = .18;
  } else if (kind < 7.5) {                           // brass
    c *= .9 + .2 * vnoise(uv * 9.); rough = .22;
  } else if (kind < 8.5) {                           // leaf and petal
    c *= .88 + .24 * vnoise(wp.xz * 2.7 + wp.y * 1.3); rough = .8;
  } else if (kind < 9.5) {                           // flagstones
    // (written here from the plain idea of cells: one jittered point in each square cell, the nearest and the second
    // nearest of the 3 by 3 cells round the pixel by the square's own distance, the joint where the two are near
    // equal; it follows no listing)
    vec2 g = uv / 1.15, id = floor(g), f = fract(g);
    float best = 9., second = 9., hid = 0.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 n = vec2(float(i), float(j)), p = n + .5 + .34 * (hash22(id + n) - .5) * 2. - f; float dd = max(abs(p.x), abs(p.y));
      if (dd < best) { second = best; best = dd; hid = hash12(id + n + 4.4); } else if (dd < second) second = dd;
    }
    c *= mix(vec3(1.), mix(vec3(.78), vec3(1.14, 1.1, 1.02), hid), near) * (.94 + .12 * vnoise(uv * 5.));
    c = mix(c, c * vec3(.4, .43, .34), hillJoint((second - best) * .55, .03, fw, 1.15, .1));
  } else if (kind < 10.5) {                          // dug earth
    c *= .78 + .44 * vnoise(wp.xz * 5.); rough = .97;
  } else if (kind < 11.5) {                          // floor tiles, two colours laid chequerwise (base tints both)
    vec2 g = uv / .78, id = floor(g), f = fract(g); float ch = mod(id.x + id.y, 2.);
    float d = min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)) * .78;
    c *= mix(vec3(.6, .09, .06), vec3(.95, .86, .66), ch) * (.9 + .2 * hash12(id + 2.2) * near);
    c = mix(c, c * .35, hillJoint(d, .014, fw, .78, .05)); rough = .42;
  } else if (kind < 12.5) {                          // a woven runner: uv.x across (par: half its breadth), uv.y along
    float e = abs(uv.x) / max(par, .01), band = step(.74, e) * (1. - step(.86, e)) + step(.93, e);
    float pr = max(par, .01); vec2 g = vec2(uv.x / (pr * .37), uv.y / (pr * .74)); vec2 f = abs(fract(g) - .5);
    float dia = 1. - smoothstep(.3, .3 + max(fw * 2., .02), f.x + f.y);
    c = mix(c, vec3(.74, .52, .22), dia * (1. - step(.7, e)) * .45); c = mix(c, vec3(.86, .76, .5), band);
    c *= .9 + .2 * vnoise(uv * 14.); rough = .96;
  } else {                                           // a flame behind lamp glass, or embers: gives off light always
    if (par < -.5) { emit = sky * (1.25 + .25 * uv.y); c *= .1; rough = .2; }     // a pane of evening sky, seen from within
    else { emit = glow * (2.6 + 1.4 * vnoise(vec2(time * 3.1 + par * 17., uv.y * 2.))); c *= .2; rough = .5; }
  }
  return c;
}
`;

// The one lit material of the homes. uniforms: uTime (the clock, for sway and flicker), uLit (how far windows are
// alight, from the look), uWind (the wind's way over the ground), uSky, uGlow (the colour of lamplight), and the
// green door's place, facing and spill (a glow of this material's own on what stands before the door: no light).
export function makeSolidMaterial(THREE, look) {
  const uniforms = {
    uTime: { value: 0 }, uLit: { value: look.lit }, uWind: { value: new THREE.Vector2(0.94, 0.34) },
    uSky: { value: new THREE.Color().copy(look.skyColor) }, uGlow: { value: new THREE.Color(1.0, 0.56, 0.2) },
    // the green door's place and facing, and how far the hall's glow spills out at it (0 while the leaf is shut)
    uDoorAt: { value: new THREE.Vector3(0, -9999, 0) }, uDoorN: { value: new THREE.Vector3(0, 0, 1) }, uSpill: { value: 0 },
  };
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, side: THREE.DoubleSide });
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 surf; attribute float sway; varying vec4 vSurf; varying vec3 vWp; uniform float uTime; uniform vec2 uWind;')
      .replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
        vSurf = surf;
        { float ph = dot(position.xz, vec2(.21, .17));
          float g = sin(uTime * 1.3 + ph) * .6 + sin(uTime * 2.9 + ph * 2.3 + position.y * 1.7) * .4;
          transformed.xz += uWind * (sway * (.3 + .7 * g)); }
        vWp = transformed;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vSurf; varying vec3 vWp; uniform float uTime, uLit, uSpill; uniform vec3 uSky, uGlow, uDoorAt, uDoorN;\n' + PATTERN_GLSL)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        float hFw = max(fwidth(vSurf.y), fwidth(vSurf.z)) + 1e-4;
        float hRough; vec3 hEmit;
        diffuseColor.rgb = hillPattern(floor(vSurf.x + .5), vSurf.yz, vSurf.w, vWp, diffuseColor.rgb, hFw, uTime, uSky, uGlow, hRough, hEmit);`)
      // (a blade or a petal is thin: seen from behind it is lit as from before, not as a wall's back)
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nif (abs(vSurf.x - 8.) < .5 && !gl_FrontFacing) normal = -normal;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = hRough;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = abs(vSurf.x - 7.) < .5 ? .5 : 0.;')
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        { // the last home's panes (par over 1.5) glow steadily whatever the hour; the others by the look
          // (and a lantern's flame burns at any hour)
          float hOn = (abs(vSurf.x - 6.) < .5 && vSurf.w > 1.5) || vSurf.x > 12.5 ? max(uLit, .85) : uLit;
          totalEmissiveRadiance += hEmit * (hOn * 3.);
          // the hall's firelight spilling out at the green door while its leaf stands open (uSpill follows the leaf's
          // angle): a fan of warm light over the threshold, the steps, the path and the garden before the door,
          // strongest on the door's own line, breathing slowly as a fire does (under twice a second)
          vec3 hd = vWp - uDoorAt; float hAlong = dot(hd, uDoorN), hR2 = dot(hd, hd);
          float hFan = .3 + .7 * hAlong * hAlong / max(hR2, .01), hFire = .76 + .24 * vnoise(vec2(uTime * 2.6, 7.7));
          totalEmissiveRadiance += diffuseColor.rgb * vec3(1., .62, .26) * (uSpill * hFire * hFan * smoothstep(-.9, .3, hAlong) * 5.5 / (1. + hR2 * .13)); }`);
  };
  material.customProgramCacheKey = () => 'hill-homes-solid';
  return { material, uniforms };
}
