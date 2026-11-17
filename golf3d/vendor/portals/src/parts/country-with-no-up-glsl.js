// THE COUNTRY WITH NO UP: what every part of this world shares.
//   - the places (hall, landing ground, hoop) and the Sphere's track (how far down it, from the metres of our road)
//   - COMMON: GLSL for every material: hash and value noise, the light the fog carries (fogLight), and slabFog():
//     the luminous mist lies only between y 0 and uFogP.z above the plane, so each ray is fogged by the length it
//     spends inside that slab (inside the plane sight ends in a few hundred metres, from above the country is clear)
//   - the uniforms all of it reads (makeShared): one object per uniform, shared by every material
// PLANE SPACE: every shader works with the plane at y 0 and the eye at uEye. The world may stand the plane lower than
// world y 0 (uLift, only while it is seen through a portal from below the level of its glass), added at the very end.
import * as THREE from 'three';

export const HALL = { x: 0, z: 140, r: 80, court: 130 };
export const FIELD = { x: 0, z: -238, r: 150 };
export const HOOP = new THREE.Vector3(0, 185, -558), HOOP_R = 88, SPHERE_R = 80;
export const REST = new THREE.Vector3(0, 0, -238);                       // the Sphere's centre when it is half-way through
export const TRACK = REST.clone().sub(HOOP).normalize();                 // down the track (30 degrees below level, toward +z)
export const TRACK_LEN = HOOP.distanceTo(REST);
export const POINT = new THREE.Vector3(-700, 420, -1500);                // the country of one point

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// cubic Hermite through (x0,y0) (x1,y1) with end slopes m0, m1
const herm = (x0, y0, m0, x1, y1, m1, x) => {
  const h = x1 - x0, t = (x - x0) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1;
};
// Distance the Sphere has come down its track, told from d, the metres of our own road behind us, and four places on
// that road which the world finds on its path (k.leave, k.touch, k.half, k.end, in metres of road): it sits in the hoop
// until `leave`, its lowest point meets the glass at `touch` (still falling at three quarters of our own speed), it is
// half-way through at `half`, and it sinks the little that is left (15 m) all the way to `end`.
const S_TOUCH = TRACK_LEN - SPHERE_R / Math.abs(TRACK.y), S_END = TRACK_LEN + 15 / Math.abs(TRACK.y);
export function sphereS(d, k) {
  if (d <= k.leave) return 0;
  if (d < k.touch) return herm(k.leave, 0, 0, k.touch, S_TOUCH, 0.75, d);
  if (d < k.half) return herm(k.touch, S_TOUCH, 0.75, k.half, TRACK_LEN, 0.067, d);
  if (d < k.end) return herm(k.half, TRACK_LEN, 0.067, k.end, S_END, 0, d);
  return S_END;
}
// the Sphere's centre when it has come s metres down its track
export function spherePos(s, out = new THREE.Vector3()) { return out.copy(HOOP).addScaledVector(TRACK, s); }
// radius of the circle the Sphere cuts in the plane
export function circleR(y) { return Math.sqrt(Math.max(0, SPHERE_R * SPHERE_R - y * y)); }
export { sm as smooth };

// edge hues: 0 aqua (soldiers, workmen), 1 violet (gentlemen), 2 amber (walls), 3 pearl (women), 4 pearl-gold
// (priests, the circle), 5 lilac-white (nobles), 6 vermilion (the one square), 7 the dark glass face
export const PALETTE = ['#49D6C6', '#A98BFF', '#F2B24E', '#EDEBFA', '#FFE2A8', '#DCD0FF', '#FF4A2E', '#0B0F2A'];

function blackTex() {
  const t = new THREE.DataTexture(new Uint8Array(4), 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType); t.needsUpdate = true; return t;
}
export function makeShared() {
  const col = (h) => new THREE.Color(h);
  return {
    uEye: { value: new THREE.Vector3(0, 1, 480) }, uLift: { value: 0 }, uTime: { value: 0 }, uMap: { value: 0 },
    uPx: { value: 400 },                                           // pixels per radian of the camera drawing
    uCircle: { value: new THREE.Vector4(0, -376, 0, 0) },          // centre x, z, radius, light 0..1
    uSphere: { value: new THREE.Vector4(0, 185, -558, SPHERE_R) },
    uFogP: { value: new THREE.Vector4(0.008, 0.25, 7, 1) },        // density per metre, breathing, slab top, light gain
    uFogA: { value: col('#0E3A4E') }, uFogB: { value: col('#2A2463') },
    uGl: { value: [new THREE.Vector4(0, 140, 150, 1), new THREE.Vector4(-330, 120, 260, 1), new THREE.Vector4(330, 120, 260, 1), new THREE.Vector4(0, 420, 230, 1)] },
    uGlC: { value: [col('#F2B24E'), col('#A98BFF'), col('#A98BFF'), col('#49D6C6')] },
    uPal: { value: PALETTE.map(col) },
    uAge: { value: new THREE.Vector4(0, -1e5, 0, 0) },             // x: 1 = the age after colour was forbidden; y: z of the painting's front (rare)
    uHour: { value: new THREE.Vector4(1, 1, 0, 0) },               // x: how bright the houses' rooms are, y: wall gain
    uSq: { value: new THREE.Vector4(0, -50, 0, 0) },               // the vermilion square, at home in its house: where it is, 1 when it is in the world
    uRain: { value: new THREE.Vector4(0, 0, 0, 0) },               // x: amount, y: band phase offset, z: band direction x, w: -
    // the town's own light, blurred: r walls, g aqua edges, b violet, a pearl (the world bakes it from the plan)
    uGlow: { value: blackTex() }, uGlowR: { value: new THREE.Vector4(-1320, -1320, 1 / 2640, 0) },   // x0, z0, 1 / size, gain
  };
}

export const COMMON = /* glsl */`
precision highp float;
uniform vec3 uEye; uniform float uLift, uTime, uMap, uPx;
uniform vec4 uCircle, uSphere, uFogP, uAge, uHour, uRain, uSq;
uniform vec3 uFogA, uFogB, uPal[8];
uniform vec4 uGl[4]; uniform vec3 uGlC[4];
uniform sampler2D uGlow; uniform vec4 uGlowR;
float cH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
float cH1(float n){ n = fract(n*0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float cN(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(cH(i), cH(i + vec2(1.,0.)), f.x), mix(cH(i + vec2(0.,1.)), cH(i + vec2(1.,1.)), f.x), f.y);
}
// edge colour of a class, with the age: after colour was forbidden every edge is pearl-grey (the gold of the priests
// and the one vermilion square keep theirs); on the rare day the painting runs north as a front
vec3 edgeCol(float id, vec2 p){
  vec3 c = uPal[int(clamp(id, 0., 7.) + .5)];
  float keep = step(5.5, id) + step(3.5, id)*step(id, 4.5);
  float grey = uAge.x*(1. - smoothstep(-40., 40., p.y - uAge.y + 30.*(cN(p*0.02) - .5)));
  vec3 g = vec3(0.62, 0.68, 0.80)*(0.55 + 0.45*dot(c, vec3(.3, .5, .2)));
  return mix(c, g, grey*(1. - clamp(keep, 0., 1.)));
}
// the town's own light gathered over some 20 m: warm where houses stand close, aqua along the soldiers' roads
vec3 townGlow(vec2 p){
  vec4 g = textureLod(uGlow, (p - uGlowR.xy)*uGlowR.z, 0.);
  g *= g*(1.6 - 0.6*g);                                   // the strongest hue of a district leads: light gathered, not summed to white
  vec3 c = g.r*uPal[2] + g.g*uPal[0] + g.b*uPal[1] + g.a*uPal[3]*0.45;
  c /= 1. + 0.55*dot(c, vec3(.3, .5, .2));
  float grey = uAge.x*(1. - smoothstep(-40., 40., p.y - uAge.y));
  return mix(c, vec3(0.62, 0.68, 0.80)*dot(c, vec3(.3, .5, .2)), grey)*uGlowR.w;
}
// the light the mist carries at a place: cool and dim over empty glass, lifted by the districts under it and by the circle
vec3 fogLight(vec2 p){
  float m = cN(p*0.0031 + vec2(uTime*0.011, -uTime*0.007));
  vec3 c = mix(uFogA, uFogB, smoothstep(.3, .7, m));
  c = mix(c, vec3(dot(c, vec3(.4, .5, .6)))*vec3(.75, .9, 1.25), 0.8*uAge.x);
  float r = length(p - vec2(0., -100.));
  c *= 0.22 + 0.78*(1. - smoothstep(520., 1350., r));
  for (int i = 0; i < 4; i++) { vec2 d = p - uGl[i].xy; c += uGlC[i]*uGl[i].w*exp(-dot(d, d)/(uGl[i].z*uGl[i].z)); }
  float e = max(length(p - uCircle.xy) - uCircle.z, 0.);
  c += uPal[4]*uCircle.w*0.10*exp(-e/45.);
  c += townGlow(p)*0.03;
  return c*uFogP.w;
}
// rgb: light scattered toward the eye on the way to P; a: how much of P is left. dir must be a unit vector, L the distance
vec4 slabFogRay(vec3 dir, float L){
  if (uMap > 0.5) return vec4(0., 0., 0., 1.);
  float dy = abs(dir.y) < 1e-4 ? (dir.y < 0. ? -1e-4 : 1e-4) : dir.y;
  float t0 = (0. - uEye.y)/dy, t1 = (uFogP.z - uEye.y)/dy;
  float tA = max(min(t0, t1), 0.), tB = min(max(t0, t1), L);
  float len = max(tB - tA, 0.);
  vec2 s1 = uEye.xz + dir.xz*(tA + min(len, 70.)*0.5), s2 = uEye.xz + dir.xz*(tA + min(len, 420.)*0.62);
  float breath = 1. + uFogP.y*(2.*cN(s1*0.006 + vec2(uTime*0.03, -uTime*0.021)) - 1.);
  float od = uFogP.x*breath, T = exp(-od*len), T1 = exp(-od*min(len, 110.));
  return vec4(fogLight(s1)*(1. - T1) + fogLight(s2)*(T1 - T), T);
}
vec4 slabFog(vec3 P){ vec3 d = P - uEye; float L = length(d); return slabFogRay(d/max(L, 1e-3), L); }
// THE GLASS AS A MIRROR, one law for every point and every eye (Schlick's): how much of what stands over it the glass
// mirrors, from s, the sine of the angle between the line of sight and the glass at the point seen: all of it where
// the sight grazes the glass, 3 in a hundred seen from straight above. Space, the horizon's band and the bodies' own
// reflections all take it.
float mirrorK(float s){ float om = 1. - clamp(s, 0., 1.); return 0.03 + 0.97*om*om*om*om*om; }
// THE COUNTRY'S FAR EDGE, a rule of the place: the country is whole within 700 m of its middle (0, -100) and gone by
// 1150 m (the plan's own fullness: its houses thin over the same ring), and its lights dim over that ring with it:
// 1 inside, 0 beyond. Everything lit that lies on the glass takes it; what is left beyond is the far mist's low glow.
float edgeDim(vec2 p){ return 1. - smoothstep(700., 1150., length(p - vec2(0., -100.))); }
// the circle's own light on anything lying in the plane
float circleLight(vec2 p){ float e = max(length(p - uCircle.xy) - uCircle.z, 0.); return uCircle.w*exp(-e/36.)/(1. + e*0.02); }
`;

// Space: no sky. Blue-black with slow, large mottling in two sizes and two hues (depth, not a flat card), and round the
// whole horizon a band of teal and violet glow some four degrees tall (horizon: above the level it is the sky's own,
// below it the far glass carries it), so that nothing lying in the plane ever meets flat black. d: unit direction.
export const SKY = /* glsl */`
vec3 horizon(vec3 d){
  vec2 a = d.xz/max(length(d.xz), 1e-3);
  float m = cN(a*1.9 + vec2(3.1, uTime*0.004)), m2 = cN(a*5.3 + 11.);
  vec3 c = mix(vec3(0.05, 0.42, 0.50), vec3(0.34, 0.20, 0.70), smoothstep(0.25, 0.75, m));
  c = mix(c, vec3(dot(c, vec3(.3, .5, .2)))*vec3(.8, .95, 1.3), 0.75*uAge.x);
  float band = d.y >= 0. ? exp(-d.y/0.07) : exp(d.y/0.08);
  return c*band*(0.13 + 0.08*m2);
}
vec3 skyCol(vec3 d){
  float h = clamp(d.y, -1., 1.);
  vec3 c = mix(vec3(0.0075, 0.0125, 0.0380), vec3(0.0028, 0.0038, 0.0115), smoothstep(0., 0.7, abs(h)));
  vec2 q = d.xz/(abs(h) + 0.4);
  float m1 = cN(q*1.1 + vec2(uTime*0.003, 0.)), m2 = cN(q*2.7 - vec2(0., uTime*0.002)), m3 = cN(q*0.55 + 5.);
  c *= 0.55 + 0.9*m1 + 0.45*m2;
  c += vec3(0.0100, 0.0060, 0.0300)*smoothstep(0.42, 0.85, m3) + vec3(0.0020, 0.0100, 0.0140)*smoothstep(0.5, 0.9, 2.*m1*m2);
  return c + horizon(d);
}
`;
