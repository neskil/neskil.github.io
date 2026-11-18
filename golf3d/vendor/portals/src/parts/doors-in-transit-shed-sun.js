// doors-in-transit: THE LOW SUN IN THE HALL, one function of world place and the sun's direction that the floor, the
// doors and the works' iron all use, so that the same bars of light and shade rake across everything.
//   shedSunShade(p, S): 1 where the sun falls on the place p, less in shade. S points toward the sun (it stands low
//   behind an end screen). The sun reaches a place either through the great half-round screen of the sun's end (crossed
//   by the soft shadows of its bars) or through the roof's glass (crossed by the long shadows of the ribs, one at
//   every step of the plan's ribs); the brick of the end wall and of the side walls shades the rest.
// GLSL: put SHED_SUN_GLSL once in a fragment shader's head, then call shedSunShade(worldPlace, sunDir).
// The two uniforms below are shared objects: the shed sets them when it is built (the sun's direction it was given; the
// bars' strength, 0 on the rainy hour), and any material may point a uniform of its own at them.
import { SHED } from './doors-in-transit-plan.js';

export const shedSunUniform = { value: null };      // a THREE.Vector3: the unit direction toward the sun
export const shedBarsUniform = { value: 1 };        // 0..1: how strongly the bars show (the hour deals it)
// the end screens: half-round, springing from the walls' top (the shed builds them from the same numbers)
export const FAN = { cy: SHED.spring, r: 62 };
// a number written into shader text (the plan's own numbers, never typed twice)
const G = (v) => Number(v).toFixed(4), HALF = (SHED.x1 - SHED.x0) / 2, RIB0 = SHED.z0 + SHED.ribStep / 2;

export const SHED_SUN_GLSL = /* glsl */`
float shedRoofY(float x){ float s = min(1., abs(x) / ${G(HALF)});
  return ${G(SHED.spring)} + ${G(SHED.crown - SHED.spring)} * (.85 * pow(max(1e-4, 1. - pow(max(s, 1e-4), 2.6)), 1. / 2.6) + .15 * (1. - s)); }
float shedSunShade(vec3 p, vec3 S){
  float lit = 0., ky = 1. / max(S.y, .05), e = S.z < 0. ? -1. : 1.;
  // through the great screen of the sun's end: a half-round of light, crossed by the shadows of its bars
  float te = (e * ${G(SHED.z1)} - p.z) / (abs(S.z) < 1e-3 ? e * 1e-3 : S.z), xh = p.x + S.x * te, yh = p.y + S.y * te, soft = 2.5 + te * .02;
  if (te > 0.) {
    vec2 fp = vec2(xh, yh - ${G(FAN.cy)}); float r = length(fp), a = atan(fp.y, abs(fp.x) < 1e-4 ? 1e-4 : fp.x), sec = a / (3.14159265 / 24.);
    float inFan = smoothstep(-soft, soft, ${G(FAN.r)} - r) * smoothstep(${G(FAN.cy)} - soft, ${G(FAN.cy)} + soft, yh);
    float dsec = abs(fract(sec / 4. + .5) - .5) * 4. * (3.14159265 / 24.) * r, dring = abs(fract((r - 14.) / 12. + .5) - .5) * 12.;
    float barsh = max(1. - smoothstep(.5, 2.4, dsec), 1. - smoothstep(.4, 2., dring));
    lit = inFan * (1. - .5 * barsh);
  }
  // through the roof: where the ray toward the sun leaves the glass; a rib shades what lies just behind it
  float yr = 80., xr = p.x;
  xr = p.x + S.x * ky * max(yr - p.y, 0.); yr = shedRoofY(xr);
  xr = p.x + S.x * ky * max(yr - p.y, 0.); yr = shedRoofY(xr);
  xr = p.x + S.x * ky * max(yr - p.y, 0.); yr = shedRoofY(xr);
  float zr = p.z + S.z * ky * max(yr - p.y, 0.), urib = fract((zr - ${G(RIB0)}) / ${G(SHED.ribStep)}) * ${G(SHED.ribStep)};
  float ribsh = smoothstep(${G(SHED.ribStep - 7)}, ${G(SHED.ribStep - 4)}, urib) * (1. - smoothstep(${G(SHED.ribStep - 0.6)}, ${G(SHED.ribStep)}, urib));
  float viaRoof = (1. - smoothstep(${G(SHED.z1 - 4)}, ${G(SHED.z1)}, abs(zr))) * (1. - smoothstep(${G(HALF - 6)}, ${G(HALF)}, abs(xr)));
  return max(lit, viaRoof * (1. - .55 * ribsh));
}
`;
