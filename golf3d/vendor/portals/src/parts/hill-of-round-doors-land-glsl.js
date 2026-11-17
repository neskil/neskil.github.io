// hill-of-round-doors, the land builder's part: THE SHADER TEXT THE LAND'S OWN MATERIALS SHARE, and the one table of
// uniforms behind it. The land's ground, blades, flowers, hedges, walls and far downs are lit by the same plain law
// as the scene's own two lights give a matt surface (the sun's light by the cosine, the sky's and the ground's fill
// by the normal's height, all over pi), so that a turf lip or a tree's foot made by another builder in look.turf's
// colour under the scene's lights meets the ground in the same tone. Nothing here reads the lens except the air by
// distance and a sheen that depends on the angle of view.
// The hashes and the value noise are the kit's own snippets (src/kit/fx.js), imported, not copied.
import { GLSL_HASH, GLSL_VALUE_NOISE, GLSL_FBM } from '../kit/fx.js';

export const LAND_NOISE = GLSL_HASH + GLSL_VALUE_NOISE + GLSL_FBM;

// What every land material declares. uShade is the baked map of what stands between a place and the sun (red: how
// much of the sun reaches the ground there; green: how open the sky is over it; blue: lamplight falling on it), laid
// over the box uShadeBox (x0, z0, 1 / width, 1 / depth).
export const LAND_PARS = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFogCol, uAirCol, uLampCol, uTurf;
uniform float uFogDen, uTime, uLit, uDew, uFarSeed;
uniform vec2 uWind;
uniform sampler2D uShade; uniform vec4 uShadeBox;
vec3 landShade(vec2 xz){ vec2 uv = (xz - uShadeBox.xy) * uShadeBox.zw; return texture2D(uShade, clamp(uv, 0., 1.)).rgb; }
// a matt surface under the scene's sun and fill: alb its colour, n its normal, sun how much of the sun reaches it,
// open how much of the sky
vec3 landLight(vec3 alb, vec3 n, float sun, float open){
  vec3 irr = uSunCol * max(dot(n, uSunDir), 0.) * sun + mix(uGndCol, uSkyCol, .5 + .5 * n.y) * open;
  return alb * irr * .31831;
}
// grass is glossy: it throws back a little of the sky, most at a low angle of view, so shade and distance are cooler
// and paler (v: the unit vector from the place to the eye)
vec3 landSheen(vec3 n, vec3 v, float open){ float g = 1. - max(dot(n, v), 0.); g *= g; return uSkyCol * (open * (.012 + .045 * g * g)); }
// the sward's own colour: short turf, and long grass yellower and paler (longK 0 short to 1 long; var a patch's own number)
vec3 landSward(float longK, float var){ return mix(uTurf * (.88 + .24 * var), uTurf * vec3(1.36, 1.16, .6) * (.9 + .2 * var), longK); }
// the air by distance: over the far country (air 0..1: how far a place is the far country's) the thin blue of
// distance, then everywhere the scene's own haze (the same law as the scene's fog)
vec3 landFog(vec3 c, float depth, float air){
  c = mix(c, uAirCol, (1. - exp(-depth * .0004)) * air * .8);
  float f = 1. - exp(-uFogDen * uFogDen * depth * depth); return mix(c, uFogCol, clamp(f, 0., 1.));
}
// slow cloud shadows drifting downwind over the land, by place and the world's clock: how much of the sun a place
// gets, 1 in the open sun down to a little over half under a cloud, in soft patches a furlong across
float landCloud(vec2 xz){
  vec2 q = xz - uWind * uTime * 1.8;
  return 1. - .44 * smoothstep(.45, .66, vnoise(q * .0062 + 11.) * .7 + vnoise(q * .017 + 3.) * .3);
}
// the wind over the land: gusts running downwind as long fronts, 0..1, by place and the world's clock
float landGust(vec2 xz){
  vec2 q = xz - uWind * uTime * 2.2;
  float a = vnoise(vec2(dot(q, uWind) * .045, dot(q, vec2(-uWind.y, uWind.x)) * .016));
  float b = vnoise(q * .11 + 7.3);
  return clamp(a * .75 + b * .35, 0., 1.);
}
`;

// The table of uniforms: one object, the same values for every land material (made once by the land part).
export function landUniforms(THREE, look, fog) {
  return {
    uSunDir: { value: look.sun.clone() }, uSunCol: { value: look.sunLight.clone() }, uSkyCol: { value: look.skyLight.clone() },
    uGndCol: { value: look.groundLight.clone() }, uFogCol: { value: fog.color.clone() }, uFogDen: { value: fog.density },
    uAirCol: { value: look.air.clone() }, uLampCol: { value: look.lamp.clone() }, uTurf: { value: look.turf.clone() }, uTime: { value: 0 },
    uLit: { value: look.lit }, uDew: { value: look.dew }, uWind: { value: new THREE.Vector2(look.wind[0], look.wind[1]) },
    uShade: { value: null }, uShadeBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uFarSeed: { value: look.farSeed },
  };
}

// THE FAR COUNTRY (the plain beyond the village and the downs): fields in a skewed, wavy lattice, one field to a cell.
// The lattice is plain arithmetic, written once here for the shader and for the builder (farHedge), so that the
// hedgerow trees stand on the painted hedges.
export const FAR = { size: 92, c: 0.8, s: 0.6, warp: 0.3, a: [1.31, 0.7, 0.73, 2.1], b: [1.17, 4.2, 0.61, 1.3], hay: 0.56, corn: 0.8, mown: 0.93 };
const n3 = (v) => v.toFixed(3);
// the field a place lies in: out.gx, out.gy its cell, out.e how far the place is from the field's nearest edge (a
// hedge) in metres, out.across true where that edge runs along the lattice's second axis
export function farField(x, z, out) {
  let qx = (FAR.c * x - FAR.s * z) / FAR.size, qy = (FAR.s * x + FAR.c * z) / FAR.size;
  const wx = FAR.warp * (Math.sin(qy * FAR.a[0] + FAR.a[1]) + 0.5 * Math.sin(qx * FAR.a[2] + FAR.a[3]));
  const wy = FAR.warp * (Math.sin(qx * FAR.b[0] + FAR.b[1]) + 0.5 * Math.sin(qy * FAR.b[2] + FAR.b[3]));
  qx += wx; qy += wy;
  const gx = Math.floor(qx), gy = Math.floor(qy), fx = qx - gx, fy = qy - gy, ex = Math.min(fx, 1 - fx), ey = Math.min(fy, 1 - fy);
  out.gx = gx; out.gy = gy; out.e = Math.min(ex, ey) * FAR.size; out.across = ex < ey;
  return out;
}
// the place of a point of the lattice (qx, qy in cells; a whole number in either is a field edge): the lattice's own
// arithmetic turned round (the waves are undone in a few rounds)
export function farPoint(qx, qy, out) {
  let ax = qx, ay = qy;
  for (let i = 0; i < 7; i++) {
    const wx = FAR.warp * (Math.sin(ay * FAR.a[0] + FAR.a[1]) + 0.5 * Math.sin(ax * FAR.a[2] + FAR.a[3]));
    const wy = FAR.warp * (Math.sin(ax * FAR.b[0] + FAR.b[1]) + 0.5 * Math.sin(ay * FAR.b[2] + FAR.b[3]));
    ax = qx - wx; ay = qy - wy;
  }
  out.x = FAR.size * (FAR.c * ax + FAR.s * ay); out.z = FAR.size * (-FAR.s * ax + FAR.c * ay);
  return out;
}
// a field's own number, 0..1, from its cell: plain arithmetic of small whole numbers, the same here and in the
// shader (farKind there). seed is the visit's own draw. Under FAR.hay the field is pasture, grazed short; from
// FAR.hay to FAR.mown it stands long (hay, and in the far country corn from FAR.corn); over FAR.mown it is just mown.
export function farKind(gx, gy, seed) { const v = gx * 0.3719 + gy * 0.6113 + 0.1731 * gx * gy + seed; return v - Math.floor(v); }
// The far country's colour by place: pasture in several greens, hay standing pale, a few fields of corn turning and
// a few just mown, a dark hedge along every field's edge, woods on the steeper ground and in broad patches. steep
// is 1 - the normal's height; px the pixel's footprint in metres (what is finer than the pixel is mixed in, not drawn).
export const LAND_FAR = /* glsl */`
vec2 farCell(vec2 p){
  vec2 q = vec2(${n3(FAR.c)} * p.x - ${n3(FAR.s)} * p.y, ${n3(FAR.s)} * p.x + ${n3(FAR.c)} * p.y) / ${n3(FAR.size)};
  return q + ${n3(FAR.warp)} * vec2(sin(q.y * ${n3(FAR.a[0])} + ${n3(FAR.a[1])}) + .5 * sin(q.x * ${n3(FAR.a[2])} + ${n3(FAR.a[3])}),
    sin(q.x * ${n3(FAR.b[0])} + ${n3(FAR.b[1])}) + .5 * sin(q.y * ${n3(FAR.b[2])} + ${n3(FAR.b[3])}));
}
float farKind(vec2 g){ return fract(g.x * .3719 + g.y * .6113 + .1731 * g.x * g.y + uFarSeed); }
vec3 landFar(vec2 p, float steep, float px){
  vec2 q = farCell(p), g = floor(q), f = fract(q);
  float h = farKind(g), h2 = hash12(g + 41.), h3 = hash12(g + 87.);
  vec3 c = uTurf * mix(vec3(.8, .95, 1.), vec3(1.16, 1.06, .78), h2);
  c = mix(c, uTurf * vec3(1.5, 1.24, .6), step(${n3(FAR.hay)}, h));
  c = mix(c, uTurf * vec3(2.05, 1.5, .62), step(${n3(FAR.corn)}, h));
  c = mix(c, uTurf * vec3(1.7, 1.46, .9), step(${n3(FAR.mown)}, h));
  // the field's own grain (mowing lines, drill rows) while it is wider than the pixel
  float rows = sin(dot(p, vec2(cos(h3 * 6.283), sin(h3 * 6.283))) * 1.4);
  c *= 1. + .07 * rows * step(${n3(FAR.hay)}, h) * (1. - smoothstep(1., 3., px));
  c *= .88 + .24 * vnoise(p * .045);
  float e = min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)) * ${n3(FAR.size)};
  float w = 2.2 + 1.6 * h2 + 5.5 * smoothstep(.5, .8, vnoise(p * .06 + 31.));
  float hedge = 1. - smoothstep(w - px, w + px + .6, e);
  c = mix(c, uTurf * vec3(.3, .42, .34), hedge * .9 * (1. - smoothstep(10., 40., px)));
  float wood = smoothstep(.56, .66, vnoise(p * .0052 + 3.) * .7 + steep * 1.6 + vnoise(p * .021) * .16);
  c = mix(c, uTurf * vec3(.27, .42, .33) * (.75 + .5 * vnoise(p * .09)), wood);
  return c;
}
`;

// What a drystone face is drawn with (the banks behind the gardens, the field walls).
export const LAND_STONE = /* glsl */`
// a drystone face: courses of flat stones some forty centimetres high and of uneven lengths, c.x metres along the
// face and c.y metres up; x: 1 on a stone and 0 in a joint (joints no finer than the pixel px), y: the stone's own number
vec2 stoneFace(vec2 c, float px){
  float row = floor(c.y / .42), x = c.x / .95 + .5 * mod(row, 2.) + 3.7 * hash11(row + 3.);
  x += .27 * sin(x * 2.1 + row * 1.7);
  vec2 g = vec2(floor(x), row), f = vec2(fract(x), fract(c.y / .42));
  float j = min(min(f.x, 1. - f.x) * .95, min(f.y, 1. - f.y) * .42), w = .03 + px;
  return vec2(smoothstep(w * .4, w * 1.6, j), hash12(g + 2.));
}
`;
