// THE SHIP AND THE SHED'S LIGHT (parts of the world "airship-shed-dawn")
// Our own airship and our own shed, after no one named ship, builder, line, shed or country. Nothing is lettered and there is no
// number, flag, emblem or marking on hull, fins, cars, doors or shed. No fire, no accident, no hint of either.
//   frame      1 unit is 1 metre. Floor y 0, x east, z south; the doors are the north end (the plane z = SHED.ZD).
//   the ship   buildHero() returns a Group in the SHIP'S OWN FRAME: long axis on the line x 0, y SHIP.CY, nose at z SHIP.NOSE,
//              stern at z SHIP.STERN. The world moves the group north (z less) as the ship is walked out; the light is told
//              where it stands through the uniform uShipZ.
//   hull       245 m long, 41 m through: thirty-six flat fabric panels round (hullRadius), a ring every 5 m and a lighter
//              stringer down the middle of every panel showing through the dope, a band of small lit windows low on each
//              forward flank, the keel walk's small lights along the belly, a mooring cone, a row of hoods on the ridge
//   fins       four in a cross at the stern, tips 21 m from the axis, each with a control surface that swings through a slow test
//   cars       four engine cars hung low on the flanks in two pairs, each a four-bladed pusher propeller 6 m across, turning over
//   car        a control car under the forward body, its windows lit
//   light      no three.js lights. makeShedLight() gives one family of ShaderMaterials sharing uniforms:
//              THE COLD (pre-dawn blue from the roof glazing, from above), THE LAMPS (two rows of hung lamps, the nearest of each
//              row found by arithmetic, and two work lamps on stands on the floor where the tail lies at the start), THE DAWN (sunlight that reaches a point inside only if the line from it to the sun
//              passes through the door opening as it stands, uDoorW, and misses the hull, taken as a spheroid). The same test
//              in closed form along the eye's ray gives the shafts in the dusty air; mirrored in a surface it gives the
//              reflection of the opening. asSky() is the world's own sky; asHorizon(), its lowest band, colours the far haze.
//              THE SHAFTS AND THE REFLECTIONS READ THE EYE'S BEARING AS LIGHT DOES (section 153, 4) and the haze is air between
//              the eye and a thing (section 153, 5); nothing here is placed, timed, hidden or thinned by the lens.
//              leaves() is the same surface program with one thing more: a card is cut to a ragged spray of leaves by a
//              pattern fixed in the world, filtered by the pixel's footprint (leafCards() builds the cards).
// buildHero(ctx, { light }) -> { object, anchors, triangles, light, update(dt, time), dispose() }
import * as THREE from 'three';
import * as INT from '../kit/interior.js';

export const SHED = { ZD: -138, ZB: 207, HW: 50, HH: 68, WH: 14, DW: 34, DH: 50, LX: 41, LY: 24, LZ0: -123, LDZ: 30, LN: 11 };
export const SHIP = { LEN: 245, R: 20.5, CY: 26.5, NOSE: -100, STERN: 145, TM: 0.38 };
const TAU = Math.PI * 2;
const lin = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);

// the hull's radius at a station z of the ship's own frame: a blunt bow, the fullest body 93 m behind the nose, a long pointed tail
export function hullRadius(z) {
  const t = (z - SHIP.NOSE) / SHIP.LEN; if (t <= 0 || t >= 1) return 0;
  if (t < SHIP.TM) { const q = (SHIP.TM - t) / SHIP.TM; return SHIP.R * Math.sqrt(Math.max(0, 1 - Math.pow(q, 2.1))); }
  const q = (t - SHIP.TM) / (1 - SHIP.TM); return SHIP.R * Math.pow(Math.max(0, 1 - Math.pow(q, 2.3)), 0.9);
}
// the inner line of the shed's vault: its height over the floor at x
export function roofY(x) { const a = Math.min(1, Math.abs(x) / SHED.HW); return SHED.WH + (SHED.HH - SHED.WH) * Math.pow(Math.max(0, 1 - Math.pow(a, 2.6)), 0.714); }

// surf ids: the kit's 0 plain, 1 wood, 2 fabric, 3 stone, and ours
export const SID = { PLAIN: 0, WOOD: 1, FABRIC: 2, STONE: 3, FLOOR: 4, SHELL: 5, STEEL: 6, HULL: 7, DOOR: 8, GROUND: 9, GABLE: 10, BRICK: 11, FIN: 12, LEAF: 13 };
export const sf = (id, gloss = 0.2, metal = 0, emissive = 0, sway = 0) => INT.surf(id, gloss, metal, emissive, sway);

// a box from a to c, w wide and h deep, added to the builder b
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
export function strut(b, a, c, w, h, up, color, surf) {
  _a.set(a[0], a[1], a[2]); _b.set(c[0], c[1], c[2]); _z.subVectors(_b, _a); const len = _z.length(); if (len < 1e-4) return;
  _z.multiplyScalar(1 / len); _y.set(up[0], up[1], up[2]); _x.crossVectors(_y, _z); if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0); _x.normalize(); _y.crossVectors(_z, _x);
  _m.makeBasis(_x, _y, _z); _m.setPosition((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2);
  b.add(new THREE.BoxGeometry(w, h, len), { m: _m, c: color, surf });
}

const GLSL_UNI = /* glsl */`
uniform float uTime, uDoorW, uShipZ, uFogDen, uShaft, uLampK, uWet, uMist;
uniform vec3 uSunDir, uSunCol, uCold, uLampCol, uWarmWin;
`;
const GLSL_FN = /* glsl */`
const float ZD = -138.0, ZB = 207.0, HW = 50.0, HH = 68.0, DH = 50.0, CY = 26.5, HR = 20.5;
float asHash(vec3 p){ p = fract(p * 0.3183099 + vec3(0.1, 0.17, 0.23)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float asNoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(asHash(i), asHash(i + vec3(1,0,0)), f.x), mix(asHash(i + vec3(0,1,0)), asHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(asHash(i + vec3(0,0,1)), asHash(i + vec3(1,0,1)), f.x), mix(asHash(i + vec3(0,1,1)), asHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float asRoofY(float x){ float a = clamp(abs(x) / HW, 0.0, 1.0); return 14.0 + (HH - 14.0) * pow(max(1.0 - pow(a, 2.6), 0.0), 0.714); }
// 1 inside the shed, 0 in the open
float asInside(vec3 p){ return step(ZD, p.z) * step(p.z, ZB) * step(abs(p.x), HW) * step(p.y, asRoofY(p.x)); }
// THE SKY, first light. d is a unit direction. The sun stands low; gold round it, deep blue overhead, and opposite it the
// dusky band of the earth's shadow under a rose belt.
vec3 asHorizon(vec3 d){
  vec2 sx = normalize(uSunDir.xz); float az = dot(d.xz / max(length(d.xz), 1e-4), sx);
  return mix(vec3(0.30, 0.235, 0.33), vec3(1.3, 0.64, 0.27), pow(max(az * 0.5 + 0.5, 0.0), 2.4));
}
vec3 asSkyBase(vec3 d){
  float h = clamp(d.y, 0.0, 1.0);
  vec2 sx = normalize(uSunDir.xz); float az = dot(d.xz / max(length(d.xz), 1e-4), sx);
  vec3 hor = asHorizon(d);
  vec3 c = mix(hor, vec3(0.17, 0.25, 0.44), smoothstep(0.0, 0.24, h)); c = mix(c, vec3(0.04, 0.078, 0.2), smoothstep(0.1, 0.8, h));
  float sd = max(dot(d, uSunDir), 0.0);
  c += vec3(0.95, 0.42, 0.18) * (pow(sd, 5.0) * 0.5 + pow(sd, 22.0) * 0.38);
  float opp = pow(max(-az, 0.0), 1.5), b = (h - 0.105) / 0.055;
  c += vec3(0.28, 0.12, 0.15) * opp * exp(-b * b);
  c = mix(c, vec3(0.095, 0.125, 0.215), opp * (1.0 - smoothstep(0.0, 0.075, h)) * 0.75);
  return c;
}
vec3 asSky(vec3 d){
  float sd = max(dot(d, uSunDir), 0.0);
  vec3 c = asSkyBase(d) + uSunCol * (pow(sd, 2600.0) * 9.0 + pow(sd, 420.0) * 0.6);
  return mix(c, asHorizon(d) * 0.5, 1.0 - smoothstep(-0.05, 0.0, d.y));
}
// a point carried along the sun's line onto the plane of the doors
vec2 asDoorProj(vec3 p){ float t = (ZD - p.z) / min(uSunDir.z, -1e-3); return p.xy + uSunDir.xy * t; }
// 0 where the hull stands between p and the light that travels against dir
float asHullShade(vec3 p, vec3 dir){
  vec3 c = vec3(0.0, CY, uShipZ + 22.5); const float k = HR / 122.5;
  vec3 o = (p - c) * vec3(1.0, 1.0, k), d = dir * vec3(1.0, 1.0, k);
  float t = -dot(o, d) / max(dot(d, d), 1e-6); if (t < 0.0) return 1.0;
  return smoothstep(HR - 1.2, HR + 1.2, length(o + d * t));
}
// how much of the sun reaches p: all of it in the open; inside, only through the opening as it stands and past the hull
float asSunVis(vec3 p, float hull){
  if (asInside(p) < 0.5) return 1.0;
  vec2 q = asDoorProj(p); float pen = 0.5 + 0.012 * (p.z - ZD);
  float vis = smoothstep(-pen, pen, uDoorW - abs(q.x)) * smoothstep(-pen, pen, DH - q.y);
  return vis * mix(asHullShade(p, uSunDir), 1.0, hull);
}
// the sky as a surface at p sees it along r through the opening (indoors)
vec3 asDoorSky(vec3 p, vec3 r, float soft){
  if (r.z > -0.02) return vec3(0.0);
  float t = max((ZD - p.z) / r.z, 0.0); vec3 h = p + r * t; float e = 0.6 + soft * t;
  float w = smoothstep(-e, e, uDoorW - abs(h.x)) * smoothstep(-e, e, DH - h.y) * smoothstep(-e, e, h.y + 2.0);
  if (w < 0.002) return vec3(0.0);
  return asSky(normalize(vec3(r.x, abs(r.y) + 0.01, r.z))) * w * asHullShade(p, r);
}
// the metres of the eye's ray, from c to p, that lie in the dawn inside the shed (closed form): south of the doors, between the
// side walls and before the back wall, within the column of light the opening lets in. (It is not cut at the vault.)
float asShaftLen(vec3 c, vec3 p, out vec2 qm){
  qm = vec2(0.0);
  vec3 D = p - c; float L = length(D); if (L < 1e-3) return 0.0;
  float t0 = 0.0, t1 = 1.0;
  if (abs(D.z) > 1e-4) { float tz = (ZD - c.z) / D.z; if (D.z > 0.0) t0 = max(t0, tz); else t1 = min(t1, tz); } else if (c.z < ZD) return 0.0;
  if (abs(D.z) > 1e-4) { float tz = (ZB - c.z) / D.z; if (D.z > 0.0) t1 = min(t1, tz); else t0 = max(t0, tz); } else if (c.z > ZB) return 0.0;
  if (abs(D.x) > 1e-4) { float ta = (-HW - c.x) / D.x, tb = (HW - c.x) / D.x; t0 = max(t0, min(ta, tb)); t1 = min(t1, max(ta, tb)); } else if (abs(c.x) > HW) return 0.0;
  if (t1 <= t0) return 0.0;
  vec2 qc = asDoorProj(c), qd = asDoorProj(p) - qc;
  if (abs(qd.x) > 1e-5) { float ta = (-uDoorW - qc.x) / qd.x, tb = (uDoorW - qc.x) / qd.x; t0 = max(t0, min(ta, tb)); t1 = min(t1, max(ta, tb)); } else if (abs(qc.x) > uDoorW) return 0.0;
  if (abs(qd.y) > 1e-5) { float ta = -qc.y / qd.y, tb = (DH - qc.y) / qd.y; t0 = max(t0, min(ta, tb)); t1 = min(t1, max(ta, tb)); } else if (qc.y < 0.0 || qc.y > DH) return 0.0;
  if (t1 <= t0) return 0.0;
  float lit = t1 - t0; qm = qc + qd * (t0 + t1) * 0.5;
  // less the hull's shadow: a tube round the hull's line as the sun sees it, from its shoulder back
  vec2 oc = qc - asDoorProj(vec3(0.0, CY, uShipZ + 22.5)); float A = dot(qd, qd), B = dot(oc, qd), Cc = dot(oc, oc) - (HR - 1.5) * (HR - 1.5), disc = B * B - A * Cc;
  if (disc > 0.0 && A > 1e-8) {
    float s = sqrt(disc), d0 = max(t0, (-B - s) / A), d1 = min(t1, (-B + s) / A), zc = uShipZ - 70.0;
    if (abs(D.z) > 1e-4) { float tz = (zc - c.z) / D.z; if (D.z > 0.0) d0 = max(d0, tz); else d1 = min(d1, tz); } else if (c.z < zc) d1 = d0;
    lit -= max(d1 - d0, 0.0);
  }
  return max(lit, 0.0) * L;
}
// the air between the eye and a thing: thin dust indoors, a low mist in the open, and the shafts of the dawn
vec3 asAir(vec3 col, vec3 p){
  vec3 c = cameraPosition, D = p - c; float L = max(length(D), 1e-3); vec3 dir = D / L;
  float ip = asInside(p), ic = asInside(c), fin = ip * ic;
  if (ip + ic > 0.5 && fin < 0.5 && abs(D.z) > 1e-4) fin = ic > 0.5 ? clamp((ZD - c.z) / D.z, 0.0, 1.0) : 1.0 - clamp((ZD - c.z) / D.z, 0.0, 1.0);
  float Lin = L * fin, Lout = L - Lin;
  // the mist lies low: its thickness along the ray, in closed form
  float y0 = c.y, y1 = p.y, dy = (y1 - y0) / 6.0, e0 = exp(-max(y0, 0.0) / 6.0), e1 = exp(-max(y1, 0.0) / 6.0);
  // (the mist lies in patches, and wisps of it drift over the grass on a light air, the way the air runs over the grass: to the
  // east and a little south. This is air between the eye and a thing:
  // a long way through the mist passes through many wisps and takes their mean, so the wisps tell less the longer the ray)
  vec2 mw = p.xz - uTime * vec2(2.6, 1.1); float wisp = mix(0.5, 0.4 * asNoise(vec3(mw * 0.045, 5.0)) + 0.6 * asNoise(vec3(mw * 0.13, 9.0)), 1.0 - smoothstep(500.0, 1500.0, L));
  float mist = uMist * Lout * (abs(dy) > 0.02 ? (e0 - e1) / dy : e0) * (0.5 + 1.0 * asNoise(vec3(p.x * 0.011, p.z * 0.011, 3.0))) * (0.3 + 1.4 * wisp);
  float tin = uFogDen * Lin, tout = max(mist, 0.0) + 0.00028 * Lout;
  vec3 hz = asHorizon(dir) * 0.62; float sd = max(dot(dir, uSunDir), 0.0); hz += uSunCol * (pow(sd, 8.0) * 0.14 + pow(sd, 60.0) * 0.3);
  vec3 fogc = (uCold * 0.42 * tin + hz * tout) / max(tin + tout, 1e-5);
  col = mix(col, fogc, 1.0 - exp(-(tin + tout)));
  vec2 qm; float sl = asShaftLen(c, p, qm);
  if (sl > 0.0) {
    // (the dust rolls slowly across the shafts: some 0.7 m a second)
    float streak = 0.38 + 1.2 * asNoise(vec3(qm * 0.2 + uTime * vec2(0.14, 0.06), uTime * 0.18)) * (0.45 + 1.1 * asNoise(vec3(qm * 0.63 + 3.0 + uTime * vec2(0.42, 0.18), uTime * 0.45)));
    col += uSunCol * uShaft * (1.0 - exp(-sl * 0.011)) * streak * (0.34 + 0.55 * pow(sd, 5.0) + 0.5 * pow(sd, 40.0));
  }
  return col;
}
`;
// albedo detail by surface id, the luminous surfaces (roof glazing, windows), and the lighting
const GLSL_SURF = /* glsl */`
vec3 asBrick(vec2 uv, vec2 fw, vec3 alb){
  float row = floor(uv.y / 0.3), bu = uv.x / 0.9 + 0.5 * mod(row, 2.0); vec2 f = vec2(fract(bu), fract(uv.y / 0.3));
  float h = asHash(vec3(floor(bu), row, 3.0));
  float body = smoothstep(0.0, 0.05, f.x) * (1.0 - smoothstep(0.95, 1.0, f.x)) * smoothstep(0.0, 0.14, f.y) * (1.0 - smoothstep(0.86, 1.0, f.y));
  // (a brick tells only close to: by the time a pixel's footprint is a twentieth of a course the wall is its mean, mottled;
  // the mean share of brick to joint is 0.95 times 0.86, some 0.82)
  float lb = smoothstep(0.008, 0.05, max(fw.x / 0.9, fw.y / 0.3)); h = mix(h, 0.5, lb); body = mix(body, 0.82, lb);
  return mix(vec3(0.17, 0.16, 0.15), alb * (0.8 + 0.4 * h), body) * (0.82 + 0.34 * asNoise(vec3(uv * 0.11, 1.0))) * (0.92 + 0.16 * asNoise(vec3(uv * vec2(0.9, 1.6), 5.0)));
}
// the roof's two long bands of glazing and its ridge strip, as a share 0..1 at x
float asRoofGlass(float ax){ return smoothstep(15.5, 16.5, ax) * (1.0 - smoothstep(25.5, 26.5, ax)) + (1.0 - smoothstep(2.2, 3.0, ax)); }
// (the same bands as a dull mirror gives them back: soft at the edges)
float asRoofGlassSoft(float ax){ return smoothstep(12.5, 19.5, ax) * (1.0 - smoothstep(22.5, 29.5, ax)) + 0.7 * (1.0 - smoothstep(0.5, 6.5, ax)); }
vec3 asDetail(float id, vec3 wp, vec3 lp, vec3 V, vec3 alb, float ins, inout vec3 n, inout float gloss, inout vec3 em){
  // the pixel's footprint on the surface (its shorter side, in metres) times 576: the fine detail of every surface below is
  // filtered by this and by nothing else of the eye. On a picture 720 high it is about the metres to the surface.
  // (every screen derivative is taken here, once, outside the branches below)
  float dist = min(length(dFdx(wp)), length(dFdy(wp))) * 576.0; vec3 fww = fwidth(wp);
  if (id < 0.5) { alb *= 0.82 + 0.3 * asNoise(wp * 1.3); }
  else if (id < 1.5) { alb *= 0.7 + 0.42 * asNoise(vec3(wp.x * 2.4, wp.y * 0.3, wp.z * 2.4)) + 0.14 * (asNoise(wp * 9.0) - 0.5); }
  else if (id < 2.5) { alb *= 0.76 + 0.3 * asNoise(wp * 4.0) + 0.2 * asNoise(wp * 0.9); }
  else if (id < 3.5) { alb *= 0.8 + 0.25 * asNoise(wp * 1.7) + 0.1 * (asHash(floor(wp * 5.0)) - 0.5); }
  else if (id < 4.5) {
    // the floor: concrete in bays of 12 m scored into slabs of 4 m (the joints are faint); rubbed pale and smooth where the
    // files walk and down the ship's own line; cracked, stained, oil where the engine cars have stood; two docking rails a side;
    // a trench for the gas main under chequered steel plates 24 m out to either side, and a gutter under a grating by each wall
    vec2 g = wp.xz, f = fract(g / 12.0), e = min(f, 1.0 - f) * 12.0, f4 = fract(g / 4.0), e4 = min(f4, 1.0 - f4) * 4.0;
    float fp = dist / 576.0, nearK = 1.0 - smoothstep(30.0, 90.0, dist);
    float j = smoothstep(0.04, 0.16, min(e.x, e.y)), h = asHash(vec3(floor(g / 12.0), 3.0));
    float j4 = 1.0 - (1.0 - smoothstep(0.012, 0.03 + fp, min(e4.x, e4.y))) * min(1.0, 0.035 / (fp + 1e-4));
    float wear = asNoise(vec3(g * 0.06, 1.0)), st = smoothstep(0.6, 0.8, asNoise(vec3(g * 0.035 + 7.0, 2.0)));
    alb *= (0.94 + 0.1 * h) * (0.72 + 0.5 * wear) * mix(0.78, 1.0, j) * mix(0.9, 1.0, j4) * (1.0 - 0.42 * st);
    alb *= (0.9 + 0.2 * asNoise(vec3(g * 1.3, 4.0)) * nearK) * (0.975 + 0.05 * asHash(vec3(floor(g / 4.0), 6.0)) * (1.0 - smoothstep(60.0, 200.0, dist)));
    float xa = (abs(wp.x) - 30.5) / 2.4, xc = wp.x / 3.2, walk = exp(-xa * xa) + 0.7 * exp(-xc * xc);
    alb *= 1.0 + 0.2 * walk * (0.5 + 0.5 * wear);
    float cr = abs(asNoise(vec3(g * 0.31, 6.0)) + 0.5 * asNoise(vec3(g * 0.9, 8.0)) - 0.75);
    alb *= 1.0 - 0.2 * (1.0 - smoothstep(0.002, 0.006 + fp * 0.3, cr)) * min(1.0, 0.03 / (fp + 1e-4)) * smoothstep(0.55, 0.7, wear);
    vec2 oc = vec2(abs(wp.x) - 18.7, min(abs(wp.z), abs(wp.z + 48.0))); float oil = exp(-dot(oc, oc) / 7.0) * (0.35 + 0.65 * asNoise(vec3(g * 0.8, 3.0)));
    alb *= 1.0 - 0.55 * oil;
    float rx = min(abs(abs(wp.x) - 29.0), abs(abs(wp.x) - 32.0)), fw = fww.x, rail = (1.0 - smoothstep(0.035 + fw * 0.5, 0.07 + fw, rx)) * min(1.0, 0.09 / (fw + 1e-4));
    alb = mix(alb, vec3(0.2, 0.21, 0.22), rail);
    gloss = mix(clamp(gloss + uWet * (0.5 * wear + 0.25 * st) + 0.2 * walk + 0.35 * oil, 0.0, 0.9), 0.85, rail);
    // the trench plates (0.7 m to either side of the line 24 m out, a plate every 2 m, chequered) and the gutters' gratings
    float tx = abs(abs(wp.x) - 24.0), plate = 1.0 - smoothstep(0.699 - fw, 0.701 + fw, tx), pj = smoothstep(0.02, 0.05 + fp, abs(fract(wp.z / 2.0) - 0.5) * 2.0);
    float chq = mix(0.5, step(0.5, fract(dot(g, vec2(4.0, 4.0)))) * 0.5 + step(0.5, fract(dot(g, vec2(4.0, -4.0)))) * 0.5, 1.0 - smoothstep(4.0, 18.0, dist));
    alb = mix(alb, vec3(0.115, 0.12, 0.125) * (0.75 + 0.5 * chq) * mix(0.6, 1.0, pj) * (0.8 + 0.4 * wear), plate); gloss = mix(gloss, 0.55, plate);
    float gx = abs(abs(wp.x) - 45.5), grate = 1.0 - smoothstep(0.299 - fw, 0.301 + fw, gx), bars = mix(0.5, smoothstep(0.25, 0.4, abs(fract(wp.z / 0.12) - 0.5) * 2.0), 1.0 - smoothstep(3.0, 14.0, dist));
    alb = mix(alb, vec3(0.05, 0.052, 0.055) * (0.5 + bars), grate); gloss = mix(gloss, 0.3, grate);
  }
  else if (id < 5.5) {
    // the shed's shell: brick to 14 m with tall windows, sheeting above, two bands of glazing and a ridge strip in the roof
    float ax = abs(wp.x), cz = abs(fract(wp.z / 0.9) - 0.5) * 2.0, rl = asRoofGlass(ax) * step(14.0, wp.y);
    // (the sheeting's ribs fade to their mean by the pixel's footprint across them: gone when it spans 0.4 m along z)
    cz = mix(cz, 0.5, smoothstep(0.1, 0.4, fww.z));
    if (ins > 0.5) {
      if (wp.y < 14.0) {
        alb = asBrick(vec2(wp.z, wp.y), fww.zy, vec3(0.25, 0.145, 0.115));
        float wz = (fract((wp.z - ZD) / 15.0) - 0.5) * 15.0, top = 10.4 + 1.7 * sqrt(max(1.0 - wz * wz / 9.0, 0.0));
        float win = (1.0 - smoothstep(2.85, 3.0, abs(wz))) * smoothstep(3.6, 3.75, wp.y) * (1.0 - smoothstep(top - 0.1, top + 0.05, wp.y));
        float bars = smoothstep(0.05, 0.11, abs(fract(wz + 0.5) - 0.5)) * smoothstep(0.03, 0.08, abs(fract(wp.y / 1.4) - 0.5));
        em += uCold * 2.6 * win * (0.2 + 0.8 * bars) * (0.72 + 0.4 * asNoise(vec3(wp.z * 0.3, wp.y * 0.3, 2.0)));
        alb *= (1.0 - win) * mix(0.55, 1.0, smoothstep(0.0, 2.5, wp.y));
      } else {
        alb = vec3(0.135, 0.16, 0.165) * (0.78 + 0.28 * cz) * (0.8 + 0.36 * asNoise(vec3(wp.z * 0.07, wp.y * 0.07, 4.0)));
        float bar = smoothstep(0.04, 0.12, abs(fract(wp.z / 2.5) - 0.5)) * smoothstep(0.03, 0.1, abs(fract(ax / 3.3) - 0.5));
        alb *= 2.1; float dirt = 0.62 + 0.5 * asNoise(vec3(wp.z * 0.05, ax * 0.2, 6.0));
        em += uCold * 3.6 * rl * (0.1 + 0.9 * bar) * dirt; alb *= 1.0 - rl;
      }
    } else {
      alb = vec3(0.33, 0.36, 0.35) * (0.86 + 0.14 * cz) * (0.8 + 0.32 * asNoise(vec3(wp.z * 0.05, wp.y * 0.05, 4.0)));
      alb = mix(alb, vec3(0.03, 0.045, 0.07), rl); gloss = mix(gloss, 0.8, rl);
      if (wp.y < 14.0) alb = asBrick(vec2(wp.z, wp.y), fww.zy, vec3(0.33, 0.19, 0.14));
    }
  }
  else if (id < 6.5) { float w = asNoise(wp * 0.8); alb *= 0.74 + 0.42 * w; gloss = clamp(gloss + 0.12 * (w - 0.5), 0.02, 0.95); }
  else if (id < 7.5) {
    // THE HULL: doped fabric, thirty-six flat panels round, a ring every 5 m and a heavier one every 15 m showing through
    float ang = atan(lp.x, CY - lp.y + 1e-4), pa = ang / 6.2831853 * 36.0, fa = fract(pa + 0.5) - 0.5, zr = lp.z / 5.0, fz = fract(zr) - 0.5;
    float far = smoothstep(90.0, 320.0, dist), mid2 = 1.0 - smoothstep(60.0, 240.0, dist), mainR = 1.0 - step(0.5, abs(mod(floor(zr + 0.5), 3.0)));
    // (a line keeps its darkness per pixel: fpa and fpz are the pixel's footprint in panels and in ring bays)
    float fpa = dist / 576.0 / 3.6 + 1e-4, fpz = dist / 576.0 / 5.0 + 1e-4;
    float ga = 0.5 - abs(fa), gz = 0.5 - abs(fz);
    // the frame shows through the cloth as creases and puckers more than as lines: a fine dark thread down each girder and
    // round each ring, and a paler tape laced over it
    float girder = (1.0 - smoothstep(0.011, 0.011 + fpa, ga)) * min(1.0, 0.04 / fpa), tape = (1.0 - smoothstep(0.03, 0.07 + fpa, ga)) * min(1.0, 0.2 / fpa);
    float ringl = (1.0 - smoothstep(0.007 + 0.005 * mainR, 0.013 + 0.005 * mainR + fpz, gz)) * min(1.0, 0.04 / fpz), rtape = (1.0 - smoothstep(0.02, 0.05 + fpz, gz)) * min(1.0, 0.2 / fpz);
    // the dope's own tone drifts along the ship; here and there a bay of cloth has been doped afresh and stands a little paler
    alb *= 0.87 + 0.22 * asNoise(vec3(lp.z * 0.045, ang * 3.0, 2.0));
    alb *= 0.985 + 0.03 * asHash(vec3(floor(pa + 0.5), floor(zr / 3.0), 9.0)) * (1.0 - far);
    alb *= 1.0 + 0.045 * step(0.93, asHash(vec3(floor(pa + 0.5), floor(zr), 5.0))) * (1.0 - far);
    // weather: streaks that run down the girth from the back, grime under the belly
    float cs = -cos(ang), streak = asNoise(vec3(lp.z * 1.9, ang * 0.7, 7.0)) * 0.6 + asNoise(vec3(lp.z * 5.3, ang * 1.1, 4.0)) * 0.4;
    alb *= 1.0 - 0.13 * smoothstep(0.3, 0.85, streak) * smoothstep(-0.5, 0.6, cs) * (1.0 - 0.6 * far);
    float low = 1.0 - smoothstep(-0.9, 0.55, cs);
    alb *= mix(1.0, 0.8, low) * (0.93 + 0.1 * asNoise(vec3(lp.z * 0.9, ang * 1.2, 5.0)));
    // the weave of the doped cloth, close to; the tapes; the threads
    alb *= 0.95 + 0.1 * asNoise(vec3(lp.z * 7.0, ang * 140.0, 3.0)) * (1.0 - smoothstep(8.0, 40.0, dist));
    alb *= 1.0 + 0.07 * max(tape, rtape * (0.6 + 0.4 * mainR)) * (1.0 - far);
    // (close to, the thread along a girder is a lacing, stitch by stitch; and where a girder crosses a ring a small patch is doped on)
    girder *= mix(1.0, 0.5 + 0.5 * step(0.5, fract(lp.z * 4.0)), 1.0 - smoothstep(6.0, 22.0, dist));
    alb *= 1.0 - 0.15 * girder - (0.09 + 0.09 * mainR) * ringl;
    alb *= 1.0 + 0.1 * (1.0 - smoothstep(0.035, 0.06 + fpa, ga)) * (1.0 - smoothstep(0.025, 0.045 + fpz, gz)) * min(1.0, 0.1 / max(fpa, fpz)) * (1.0 - far);
    // a lighter stringer midway between each pair of girders, and the cloth's own seams, four widths to a ring bay
    float mid = (1.0 - smoothstep(0.008, 0.008 + fpa, abs(fa))) * min(1.0, 0.03 / fpa);
    float seam = (1.0 - smoothstep(0.012, 0.012 + fpz * 4.0, 0.5 - abs(fract(zr * 4.0) - 0.5))) * min(1.0, 0.03 / fpz);
    alb *= 1.0 - 0.05 * mid - 0.035 * seam * (1.0 - ringl);
    // each panel is hollow between its girders, and a little hollow again to either side of the stringer; along the length it
    // is drawn tight at each ring and lies slack between; and the cloth is never quite flat: it ripples
    vec3 t = vec3(cos(ang), sin(ang), 0.0);
    // (the ripples run slowly aft along the ship, a shiver in the cloth: a pattern on the clock that moves no body)
    float rip1 = asNoise(vec3(lp.z * 0.8 - uTime * 0.45, ang * 16.0, 1.0 + uTime * 0.2)) - 0.5, rip2 = asNoise(vec3(lp.z * 1.7 - uTime * 0.7, ang * 9.0, 6.0 + uTime * 0.26)) - 0.5;
    n = normalize(n - t * (fa * 0.2 + (fract(pa * 2.0) - 0.5) * 0.06 * (1.0 - far) + rip1 * 0.17 * mid2) - vec3(0.0, 0.0, fz * 0.08 * (1.0 - far) + rip2 * 0.11 * mid2));
    gloss = clamp(gloss + 0.12 * (asNoise(vec3(lp.z * 0.3, ang * 5.0, 8.0)) - 0.5), 0.05, 0.95);
    // the promenade windows: a band low on each forward flank
    float band = smoothstep(0.955, 0.975, abs(ang)) * (1.0 - smoothstep(1.085, 1.105, abs(ang))) * smoothstep(-78.0, -77.6, lp.z) * (1.0 - smoothstep(-38.4, -38.0, lp.z));
    // (panes 1.25 m apart between slim posts, a transom across each; the lamps within light the upper pane more than the lower,
    // and a pane here and there is curtained)
    float fq = dist / 576.0 / 1.25, pz = fract(lp.z / 1.25), pv = (abs(ang) - 0.955) / 0.15;
    float pane = smoothstep(0.09, 0.13 + fq, pz) * (1.0 - smoothstep(0.87 - fq, 0.91, pz)) * mix(1.0, smoothstep(0.015, 0.045, abs(pv - 0.6)), min(1.0, 0.04 / (fq + 1e-4)));
    float ph = asHash(vec3(floor(lp.z / 1.25), step(0.0, lp.x), 4.0));
    em += uWarmWin * band * pane * 0.62 * (0.45 + 0.75 * smoothstep(0.15, 0.9, pv)) * mix(0.3, 1.0, step(0.14, ph)) * (0.75 + 0.5 * ph) * (0.85 + 0.15 * asNoise(vec3(lp.z * 2.0, lp.y * 2.0, uTime * 0.3)));
    alb *= 1.0 - band * pane * 0.5;
    // the keel walk's small lights: one every 10 m low on each side of the belly, some of them lit
    float fpw = dist / 576.0;
    float kw = (1.0 - smoothstep(0.012, 0.014 + fpw / 20.0, abs(abs(ang) - 0.33))) * (1.0 - smoothstep(0.3, 0.34 + fpw, abs(fract(lp.z / 10.0) - 0.5) * 10.0)) * smoothstep(-72.0, -70.0, lp.z) * (1.0 - smoothstep(94.0, 96.0, lp.z));
    kw *= min(1.0, 0.6 / (fpw + 1e-4)) * step(0.35, asHash(vec3(floor(lp.z / 10.0), step(0.0, lp.x), 8.0)));
    em += uWarmWin * 0.7 * kw; alb *= 1.0 - 0.5 * kw;
  }
  else if (id < 8.5) {
    // a door leaf: framed sheet with a band of small panes (its own frame: x across the leaf, y up)
    float cx = abs(fract(lp.x / 0.8) - 0.5) * 2.0; cx = mix(cx, 0.5, smoothstep(0.09, 0.36, fww.x));
    vec2 fr = abs(fract(vec2(lp.x / 6.0, lp.y / 8.0)) - 0.5); float frame = max(smoothstep(0.455, 0.485, fr.x), smoothstep(0.465, 0.488, fr.y));
    float band = smoothstep(29.5, 29.8, lp.y) * (1.0 - smoothstep(33.2, 33.5, lp.y));
    float pane = smoothstep(0.06, 0.13, abs(fract(lp.x / 1.5) - 0.5)) * smoothstep(0.05, 0.11, abs(fract((lp.y - 29.5) / 1.85) - 0.5)) * band;
    if (ins > 0.5) { alb = vec3(0.2, 0.225, 0.22) * (0.8 + 0.2 * cx) * mix(1.0, 1.6, frame); em += asHorizon(vec3(0.0, 0.0, -1.0)) * 0.3 * pane; alb *= 1.0 - pane; }
    else {
      // outside: painted sheet, weathered, on a frame of posts and girders with a cross in every bay
      vec2 cq = fract(vec2(lp.x / 6.0, lp.y / 8.0)) - 0.5; float xb = min(abs(cq.x * 6.0 - cq.y * 8.0), abs(cq.x * 6.0 + cq.y * 8.0)) * 0.6;
      float xbr = (1.0 - smoothstep(0.1, 0.22, xb)) * (1.0 - smoothstep(60.0, 220.0, dist));
      alb = vec3(0.15, 0.2, 0.19) * (0.86 + 0.14 * cx) * (0.72 + 0.5 * asNoise(vec3(lp.x * 0.08, lp.y * 0.05, 3.0))) * (0.85 + 0.3 * asNoise(vec3(lp.x * 0.9, lp.y * 0.12, 5.0)));
      alb = mix(alb, vec3(0.07, 0.085, 0.085), max(frame, xbr * 0.8)); alb *= mix(0.6, 1.0, smoothstep(0.0, 6.0, lp.y));
      alb = mix(alb, vec3(0.03, 0.04, 0.06), pane); gloss = mix(gloss, 0.85, pane); }
  }
  else if (id < 9.5) {
    // the field: a concrete apron before the doors with the rails running out, then grass heavy with dew
    vec2 g = wp.xz, f = fract(g / 10.0), e = min(f, 1.0 - f) * 10.0;
    float ap = (1.0 - smoothstep(58.0, 61.0, abs(wp.x))) * smoothstep(-226.0, -222.0, wp.z) * (1.0 - smoothstep(ZD + 0.5, ZD + 1.5, wp.z));
    float j = smoothstep(0.05, 0.2, min(e.x, e.y)), nearK = 1.0 - smoothstep(40.0, 170.0, dist);
    vec3 conc = vec3(0.29, 0.28, 0.265) * (0.96 + 0.06 * asHash(vec3(floor(g / 10.0), 2.0))) * (0.72 + 0.46 * asNoise(vec3(g * 0.07, 1.0))) * mix(0.7, 1.0, mix(1.0, j, nearK));
    conc *= mix(1.0, 0.9 + 0.2 * asHash(vec3(floor(g / 5.0), 6.0)), 1.0 - smoothstep(120.0, 420.0, dist));
    float rx = min(abs(abs(wp.x) - 29.0), abs(abs(wp.x) - 32.0)), fw = fww.x, rail = (1.0 - smoothstep(0.035 + fw * 0.5, 0.07 + fw, rx)) * min(1.0, 0.09 / (fw + 1e-4));
    // (the apron's bays are scored into slabs of 5 m; it is cracked, and the dew lies on it in damp patches, darker and a little glossier)
    vec2 f5 = fract(g / 5.0), e5 = min(f5, 1.0 - f5) * 5.0; float fpg = dist / 576.0;
    conc *= mix(0.92, 1.0, 1.0 - (1.0 - smoothstep(0.012, 0.03 + fpg, min(e5.x, e5.y))) * min(1.0, 0.035 / (fpg + 1e-4)));
    float crg = abs(asNoise(vec3(g * 0.27, 6.0)) + 0.5 * asNoise(vec3(g * 0.8, 8.0)) - 0.75);
    conc *= 1.0 - 0.2 * (1.0 - smoothstep(0.002, 0.006 + fpg * 0.3, crg)) * min(1.0, 0.03 / (fpg + 1e-4)) * smoothstep(0.5, 0.7, asNoise(vec3(g * 0.07, 1.0)));
    float dn = asNoise(vec3(g * 0.045 + 3.0, 5.0)) + 0.16 * (asNoise(vec3(g * 0.21, 12.0)) - 0.5) + 0.07 * (asNoise(vec3(g * 0.9, 14.0)) - 0.5), damp = smoothstep(0.44, 0.64, dn); conc *= 1.0 - 0.32 * damp;
    conc = mix(conc, vec3(0.3, 0.31, 0.32), rail);
    float n1 = asNoise(vec3(g * 0.045, 3.0)), n2 = mix(0.5, asNoise(vec3(g * 0.6, 7.0)), nearK), n3 = mix(0.5, asNoise(vec3(g * 3.1, 9.0)), 1.0 - smoothstep(15.0, 70.0, dist));
    float n4 = mix(0.5, asNoise(vec3(g.x * 13.0, g.y * 13.0, 11.0)), 1.0 - smoothstep(10.0, 45.0, dist));
    vec3 grass = mix(vec3(0.045, 0.08, 0.03), vec3(0.105, 0.125, 0.045), n1) * (0.7 + 0.5 * n2) * (0.78 + 0.44 * n3) * (0.8 + 0.4 * n4);
    // the meadow is mown in swaths 14 m to the pair, one way and back
    float swath = smoothstep(-0.3, 0.3, sin(dot(g, vec2(0.342, 0.94)) * 0.449)), farK = 1.0 - smoothstep(200.0, 700.0, dist);
    grass *= 1.0 + (0.16 * swath - 0.08) * farK;
    // where the hay is cut it lies in windrows along the swaths, one every 7 m: a pale line of straw, and beside it, on the side
    // away from the low sun, its long shadow. (Filtered by the pixel's footprint across the rows: gone when it spans half
    // the way from one row to the next. Where the hay still stands there are none, and the rows lie in some fields and not in others.)
    { float sw = dot(g, vec2(0.342, 0.94)), fsw = fww.x * 0.342 + fww.z * 0.94 + 1e-4, wob = 0.7 * (asNoise(vec3(g * 0.05, 23.0)) - 0.5);
      float cut = (1.0 - smoothstep(0.42, 0.72, asNoise(vec3(g * 0.0065, 13.0)))) * (1.0 - smoothstep(1.2, 3.5, fsw));
      float dr = abs(fract((sw + wob) / 7.0 + 0.5) - 0.5) * 7.0, ds = abs(fract((sw + wob - 1.6) / 7.0 + 0.5) - 0.5) * 7.0;
      float row = (1.0 - smoothstep(0.25, 0.5 + fsw, dr)) * min(1.0, 0.8 / fsw) * (0.55 + 0.45 * asNoise(vec3(g * 0.7, 27.0)));
      float shd = (1.0 - smoothstep(0.7, 1.4 + fsw, ds)) * min(1.0, 2.2 / fsw);
      cut *= smoothstep(0.35, 0.6, asNoise(vec3(g * 0.012, 31.0)));
      grass *= 1.0 - 0.2 * shd * (1.0 - row) * cut;
      grass = mix(grass, vec3(0.2, 0.17, 0.085), 0.5 * row * cut); }
    // the hay stands longer in broad patches, paler and yellower; and where wheels have gone through the dew two dark lines lie.
    // Each pair of lines runs out from the hard ground and fades into the hay 10 m and more short of its hedge; the two lines
    // of a pair keep their gauge of 1.6 m and wander together
    grass *= mix(vec3(1.0), vec3(1.32, 1.14, 0.66), smoothstep(0.42, 0.72, asNoise(vec3(g * 0.0065, 13.0))));
    // it grows in tussocks a few metres across (seen out to 500 m), and it is in flower: drifts of ox-eye, buttercup and
    // poppy, each flower a dot close to, the drift a wash of their colour far off
    grass *= 0.84 + 0.32 * mix(0.5, asNoise(vec3(g * 0.35, 33.0)), 1.0 - smoothstep(150.0, 500.0, dist));
    { float fdr = smoothstep(0.5, 0.78, asNoise(vec3(g * 0.017, 41.0))) * (0.4 + 0.6 * asNoise(vec3(g * 0.09, 43.0)));
      float fh = asHash(vec3(floor(g * 3.0), 9.0)), fk = asHash(vec3(floor(g * 3.0), 19.0)), fnear = 1.0 - smoothstep(30.0, 100.0, dist);
      vec3 fcol = fk < 0.5 ? vec3(0.34, 0.33, 0.28) : (fk < 0.82 ? vec3(0.4, 0.3, 0.035) : vec3(0.32, 0.035, 0.02));
      float fdot = 1.0 - smoothstep(0.17, 0.27 + dist / 190.0, length(fract(g * 3.0) - 0.5));
      grass = mix(grass, fcol, step(1.0 - 0.18 * fdr, fh) * fdot * fnear);
      grass = mix(grass, vec3(0.35, 0.27, 0.15), 0.04 * fdr * (1.0 - fnear)); }
    vec2 ta = g - vec2(58.0, -224.0), tb = vec2(110.0, -110.0); float tk = clamp(dot(ta, tb) / dot(tb, tb), 0.0, 1.0);
    vec2 tc = g - vec2(-84.0, -276.0), td = vec2(-120.0, -32.0); float tl = clamp(dot(tc, td) / dot(td, td), 0.0, 1.0);
    float fpt = dist / 576.0;
    float trA = abs((ta.x * tb.y - ta.y * tb.x) / 155.56 + 1.2 * (asNoise(vec3(g * 0.02, 4.0)) - 0.5)), trB = abs((tc.x * td.y - tc.y * td.x) / 124.19 + 1.2 * (asNoise(vec3(g * 0.02, 9.0)) - 0.5));
    float trk = max((1.0 - smoothstep(0.14, 0.24 + fpt, abs(trA - 0.8))) * smoothstep(0.0, 0.04, tk) * (1.0 - smoothstep(0.7, 0.98, tk)),
      (1.0 - smoothstep(0.14, 0.24 + fpt, abs(trB - 0.8))) * smoothstep(0.0, 0.04, tl) * (1.0 - smoothstep(0.7, 0.98, tl)));
    grass *= 1.0 - 0.3 * trk * min(1.0, 0.5 / (fpt + 1e-4));
    // a haul way of rolled gravel from the apron to the mooring mast, and a ring of it round the mast's foot
    vec2 hw = g - vec2(-10.0, -224.0), hb = vec2(-50.0, -50.0); float hk = clamp(dot(hw, hb) / dot(hb, hb), 0.0, 1.0);
    float dgr = min(length(hw - hb * hk) - 4.5, abs(length(g - vec2(-60.0, -274.0)) - 24.0) - 2.6) + 0.5 * (asNoise(vec3(g * 0.33, 3.0)) - 0.5) + 0.5 * (asNoise(vec3(g * 1.3, 5.0)) - 0.5);
    float gv = (1.0 - smoothstep(-0.5, 0.7, dgr)) * (1.0 - ap);
    vec3 grav = vec3(0.3, 0.265, 0.21) * (0.78 + 0.3 * n2) * (0.8 + 0.4 * n3) * (0.86 + 0.28 * mix(0.5, asHash(vec3(floor(g * 9.0), 2.0)), 1.0 - smoothstep(6.0, 28.0, dist)));
    // the mooring circle: in the gravel ring round the mast's foot a rail track on sleepers, on which a ship's stern car runs as
    // she swings to the wind (201 sleepers round, 0.75 m apart)
    { vec2 mc = g - vec2(-60.0, -274.0); float mr = length(mc), ma = atan(mc.y, mc.x + 1e-5), fpr = dist / 576.0;
      float slp = (1.0 - smoothstep(0.14, 0.2 + fpr * 2.0, abs(fract(ma * 201.0 / 6.2831853) - 0.5) * 0.75)) * (1.0 - smoothstep(1.15, 1.25 + fpr, abs(mr - 24.0))) * min(1.0, 0.3 / (fpr + 1e-4));
      float rl2 = (1.0 - smoothstep(0.04, 0.07 + fpr, abs(abs(mr - 24.0) - 0.72))) * min(1.0, 0.09 / (fpr + 1e-4));
      grav = mix(grav, vec3(0.085, 0.07, 0.055), slp * 0.85); grav = mix(grav, vec3(0.34, 0.35, 0.37), rl2); }
    grass = mix(grass, grav, gv);
    alb = mix(grass, conc, ap); gloss = mix(0.3, min(0.3 + 0.5 * rail + 0.3 * damp, 0.8), ap); ap = max(ap, gv);
    // the grass stands upright and takes the low sun on its blades: most of all seen against the light, and, less, seen with
    // the light behind the eye (the blades' lit faces are then the ones seen). A light air runs over it in slow waves
    // (some 3 m a second), turning the blades' sheen: a pattern on the clock that moves no body
    vec2 aw = g - uTime * vec2(2.8, 1.2); float air = 0.6 * asNoise(vec3(aw * 0.04, 17.0)) + 0.4 * asNoise(vec3(aw * 0.11, 21.0));
    em += grass * uSunCol * asSunVis(wp, 0.0) * (0.22 + 0.3 * pow(max(dot(-V, uSunDir), 0.0), 2.0) + 0.2 * max(dot(V, uSunDir), 0.0)) * (0.72 + 0.56 * air) * (1.0 - ap);
    // dew: sparks that run toward the sun
    float spk = step(0.93, asHash(vec3(floor(g * 4.0), 1.0))) * (1.0 - ap) * (1.0 - smoothstep(40.0, 150.0, dist));
    em += uSunCol * spk * pow(max(dot(reflect(-V, vec3(0.0, 1.0, 0.0)), uSunDir), 0.0), 26.0) * (0.5 + 0.5 * sin(uTime * 2.6 + asHash(vec3(floor(g * 4.0), 5.0)) * 40.0)) * 2.2;
  }
  else if (id < 10.5) {
    // the north gable round the opening: sheeting, and glazing over the lintel
    float fan = smoothstep(53.3, 53.8, wp.y);
    vec2 fr = abs(fract(vec2(wp.x / 3.6, wp.y / 2.9)) - 0.5); float bar = smoothstep(0.03, 0.075, fr.x) * smoothstep(0.035, 0.085, fr.y);
    float lap = abs(fract(wp.y / 0.9) - 0.5) * 2.0; lap = mix(lap, 0.5, smoothstep(0.1, 0.4, fww.y));
    if (ins > 0.5) { alb = vec3(0.2, 0.225, 0.22) * (0.78 + 0.34 * asNoise(vec3(wp.x * 0.1, wp.y * 0.1, 8.0))) * (0.8 + 0.2 * lap) * (1.0 - fan);
      // (inside, the gable's frame stands before its sheeting: posts 4 m apart, girts 6 m apart, a cross in every bay)
      vec2 gq = fract(vec2(wp.x / 4.0, wp.y / 6.0)) - 0.5; float gfr = max(smoothstep(0.44, 0.47, abs(gq.x)), smoothstep(0.455, 0.475, abs(gq.y))) * (1.0 - smoothstep(120.0, 400.0, dist));
      float gxb = (1.0 - smoothstep(0.08, 0.2, min(abs(gq.x * 4.0 - gq.y * 6.0), abs(gq.x * 4.0 + gq.y * 6.0)) * 0.55)) * (1.0 - smoothstep(60.0, 220.0, dist));
      alb = mix(alb, vec3(0.07, 0.085, 0.085), max(gfr, gxb * 0.8) * (1.0 - fan)); em += vec3(0.2, 0.27, 0.42) * 1.25 * fan * (0.08 + 0.92 * bar) * (0.7 + 0.4 * asNoise(vec3(wp.x * 0.07, wp.y * 0.11, 3.0))); }
    else { alb = vec3(0.36, 0.39, 0.38) * (0.86 + 0.14 * lap) * (0.82 + 0.3 * asNoise(vec3(wp.x * 0.06, wp.y * 0.06, 3.0))); alb = mix(alb, vec3(0.03, 0.04, 0.06), fan * bar); gloss = mix(gloss, 0.85, fan * bar); }
  }
  else if (id < 11.5) { bool bx = abs(n.x) > 0.6, bz = abs(n.z) > 0.6; alb = asBrick(bx ? wp.zy : (bz ? wp.xy : wp.xz), bx ? fww.zy : (bz ? fww.xy : fww.xz), alb); }
  else if (id < 12.5) {
    // a fin: fabric drawn over ribs that stand straight out from the hull, side by side 2.6 m apart; the spars along the
    // chord hardly show
    float rho = length(lp.xy - vec2(0.0, CY)), fz = abs(fract(lp.z / 2.6) - 0.5), fr = abs(fract(rho / 6.2) - 0.5), far = smoothstep(90.0, 320.0, dist);
    alb *= (0.99 + 0.02 * asHash(vec3(floor(lp.z / 2.6), 0.0, 3.0)) * (1.0 - far)) * (0.9 + 0.16 * asNoise(vec3(lp.z * 0.06, rho * 0.1, 2.0)));
    float fpf = dist / 576.0 / 2.8 + 1e-4, mid2 = 1.0 - smoothstep(60.0, 240.0, dist);
    // (the ribs show through as creases; a fine thread along each and a paler tape over it; a spar is a fainter thread)
    float rb = (1.0 - smoothstep(0.012, 0.012 + fpf, 0.5 - fz)) * min(1.0, 0.045 / fpf), sp = (1.0 - smoothstep(0.006, 0.006 + fpf, 0.5 - fr)) * min(1.0, 0.045 / fpf);
    float tp = (1.0 - smoothstep(0.03, 0.08 + fpf, 0.5 - fz)) * min(1.0, 0.25 / fpf);
    alb *= (1.0 + 0.04 * tp * (1.0 - far)) * (1.0 - 0.1 * rb - 0.02 * sp);
    // a lighter rib midway, weather streaks along the chord (long and faint: each some 10 m by 1 m), the cloth's weave close to
    alb *= 1.0 - 0.045 * (1.0 - smoothstep(0.012, 0.012 + fpf, fz)) * min(1.0, 0.04 / fpf);
    alb *= 1.0 - 0.07 * smoothstep(0.4, 0.8, asNoise(vec3(lp.z * 0.09, rho * 1.1, 7.0)) * 0.6 + asNoise(vec3(lp.z * 0.21, rho * 2.4, 4.0)) * 0.4) * (1.0 - 0.6 * far);
    alb *= 0.95 + 0.1 * asNoise(vec3(lp.z * 7.0, rho * 7.0, 3.0)) * (1.0 - smoothstep(8.0, 40.0, dist));
    // the cloth is hollow between one rib and the next, and ripples a little
    vec3 rd = vec3(normalize(lp.xy - vec2(0.0, CY) + 1e-4), 0.0);
    float rp1 = asNoise(vec3(lp.z * 1.4, rho * 1.1, 1.0)) - 0.5, rp2 = asNoise(vec3(lp.z * 0.9, rho * 1.9, 6.0)) - 0.5;
    n = normalize(n - vec3(0.0, 0.0, (fract(lp.z / 2.6) - 0.5) * 0.34) * (1.0 - far) - (vec3(0.0, 0.0, rp1) + rd * rp2) * 0.16 * mid2);
    gloss = clamp(gloss + 0.12 * (asNoise(vec3(lp.z * 0.3, rho * 0.4, 8.0)) - 0.5), 0.05, 0.95);
  }
  else {
    // leaves: sprays light and dark, the crown's face broken into clumps; against the low sun the edge of a crown glows
    float nk = 1.0 - smoothstep(120.0, 420.0, dist);
    alb *= 0.6 + 0.8 * mix(0.5, asNoise(wp * 0.55), nk) + 0.5 * (mix(0.5, asNoise(wp * 2.3), 1.0 - smoothstep(30.0, 140.0, dist)) - 0.5);
    n = normalize(n + (vec3(asNoise(wp * 1.3 + 3.0), asNoise(wp * 1.3 + 11.0), asNoise(wp * 1.3 + 19.0)) - 0.5) * 0.7 * nk);
    float rim = pow(max(1.0 - abs(dot(n, V)), 0.0), 3.0), ag = max(dot(-V, uSunDir), 0.0);
    // (the leaves tremble in the light air: the sun's light on them and the glints at their edges come and go together, a pattern
    // on the clock, close to only)
    float trm = mix(1.0, 0.45 + 1.1 * asNoise(wp * 2.3 + uTime * vec3(1.1, 2.6, 0.9)), 1.0 - smoothstep(60.0, 260.0, dist));
    em += vec3(0.5, 0.42, 0.12) * uSunCol * rim * ag * ag * 0.16 * trm;
    // (light gets in among leaves: a crown's lit side is lit some way round)
    em += alb * uSunCol * asSunVis(wp, 0.0) * 0.4 * smoothstep(-0.5, 0.6, dot(n, uSunDir)) * trm;
  }
  return alb;
}
vec3 asLampPos(vec3 p, float side){ float k = clamp(floor((p.z + 123.0) / 30.0 + 0.5), 0.0, 10.0); return vec3(41.0 * side, 24.0, -123.0 + 30.0 * k); }
vec3 asLight(vec3 wp, vec3 n, vec3 V, vec3 alb, float gloss, float metal, float ins, float hull){
  float up = n.y * 0.5 + 0.5;
  // THE COLD: pre-dawn blue from the roof glazing; darker under the ship and in the corners of the floor
  float under = (1.0 - smoothstep(5.0, 23.0, abs(wp.x))) * (1.0 - smoothstep(12.0, 28.0, wp.y)) * smoothstep(uShipZ - 104.0, uShipZ - 88.0, wp.z) * (1.0 - smoothstep(uShipZ + 118.0, uShipZ + 146.0, wp.z));
  float corner = mix(0.5, 1.0, smoothstep(0.0, 10.0, HW - abs(wp.x)));
  vec3 ambIn = uCold * (0.13 + 0.87 * pow(max(up, 0.0), 1.4)) * (1.0 - 0.62 * under * (1.0 - hull)) * mix(1.0, corner, smoothstep(0.3, 0.7, n.y));
  // the open sky
  vec3 ambOut = mix(vec3(0.05, 0.058, 0.07), vec3(0.2, 0.26, 0.42), pow(max(up, 0.0), 1.2)) + asHorizon(vec3(n.x + 1e-4, 0.0, n.z)) * 0.3 * (1.0 - abs(n.y));
  // what the floor throws back up at what hangs over it
  ambIn += (uCold * 0.22 + uLampCol * 0.07 * uLampK) * (1.0 - up);
  // and the dawn thrown back by the lit floor and the bright field, on everything near the doors, more as they open
  ambIn += uSunCol * 0.085 * exp(-max(wp.z - ZD, 0.0) / 80.0) * (uDoorW / 34.0) * (1.25 - up);
  vec3 lit = mix(ambOut, ambIn, ins);
  // the sky's own light let in through the opening, on what faces it
  vec3 fd = vec3(0.0, 26.0, ZD) - wp; float d2 = dot(fd, fd); fd /= sqrt(max(d2, 1e-3));
  float om = 2.0 * uDoorW * DH * max(-fd.z, 0.0) / (d2 + 500.0);
  lit += vec3(0.78, 0.5, 0.4) * om * 1.1 * clamp(dot(n, fd) * 0.7 + 0.3, 0.0, 1.0) * ins * mix(asHullShade(wp, fd), 1.0, hull);
  // THE LAMPS: the nearest of each row
  float sgn = wp.x < 0.0 ? -1.0 : 1.0;
  vec3 l1 = asLampPos(wp, sgn) - wp, l2 = asLampPos(wp, -sgn) - wp; float d1 = dot(l1, l1), e2 = dot(l2, l2); l1 /= sqrt(max(d1, 1e-3)); l2 /= sqrt(max(e2, 1e-3));
  // (each lamp hangs under a shade: beneath it a pool of light some 12 m across lies on the floor, fading out by 15 m from its middle)
  float i1 = uLampK * 380.0 / (d1 + 45.0) * smoothstep(-0.3, 0.45, l1.y) * (1.0 + 2.0 * smoothstep(0.84, 0.97, l1.y)) * ins, i2 = uLampK * 380.0 / (e2 + 45.0) * smoothstep(-0.3, 0.45, l2.y) * ins * mix(asHullShade(wp, l2), 1.0, hull);
  vec3 warm = uLampCol * (i1 * clamp(dot(n, l1) * 0.8 + 0.2, 0.0, 1.0) + i2 * clamp(dot(n, l2) * 0.8 + 0.2, 0.0, 1.0));
  // two work lamps on stands on the floor where the tail lies at the start (they stay as the ship moves off): the one on this side of the ship's line
  vec3 l3 = vec3(9.0 * sgn, 3.1, 102.0) - wp; float d3 = dot(l3, l3); l3 /= sqrt(max(d3, 1e-3));
  float i3 = uLampK * 230.0 / (d3 + 20.0) * ins;
  warm += uLampCol * i3 * clamp(dot(n, l3) * 0.8 + 0.2, 0.0, 1.0);
  // THE DAWN
  float sv = asSunVis(wp, hull), nl = max(dot(n, uSunDir), 0.0);
  vec3 col = alb * (lit + warm + uSunCol * sv * nl) * (1.0 - 0.6 * metal);
  // what the surface mirrors: the cold roof, the sky through the opening, the lamps, the sun; in the open the sky, or the
  // hull's own sunlit silver where the hull stands in the mirrored line
  vec3 R = reflect(-V, n); float nv = max(dot(n, V), 0.0), fr = pow(clamp(1.0 - nv, 0.0, 1.0), 5.0);
  vec3 f0 = mix(vec3(0.04), alb, metal), F = f0 + (1.0 - f0) * fr;
  // (the roof's glazing shows in it as long bands: where the mirrored line meets the level of the roof lights, 60 m up, unless
  // the hull stands between;
  // the hull's silver dope mirrors them more than its gloss alone would)
  float tR = (60.0 - wp.y) / max(R.y, 0.08), gx = abs(wp.x + R.x * tR), glz = mix(0.4, mix(asRoofGlass(gx), asRoofGlassSoft(gx), hull), smoothstep(0.5, 0.9, gloss + 0.3 * hull)) * smoothstep(0.02, 0.2, R.y);
  vec3 env = ins > 0.5 ? uCold * (0.2 + 0.8 * smoothstep(0.0, 0.9, R.y) + 2.8 * glz) * 0.8 * mix(asHullShade(wp, R), 1.0, hull) + asDoorSky(wp, R, 0.03 + 0.2 * (1.0 - gloss)) : mix(vec3(0.5, 0.38, 0.27), asSky(normalize(vec3(R.x, abs(R.y) + 0.02, R.z))) * 0.7, mix(asHullShade(wp, R), 1.0, hull));
  col += F * gloss * env;
  col += (f0 + 0.15) * gloss * (uSunCol * sv * 1.3 * pow(max(dot(R, uSunDir), 0.0), 10.0 + 170.0 * gloss)
       + uLampCol * (i1 * pow(max(dot(R, l1), 0.0), 8.0 + 80.0 * gloss) + i2 * pow(max(dot(R, l2), 0.0), 8.0 + 80.0 * gloss) + i3 * pow(max(dot(R, l3), 0.0), 8.0 + 80.0 * gloss)) * 2.0);
  return col;
}
`;
const SURF_VERT = /* glsl */`
attribute vec4 surf;
varying vec3 vW, vN, vC, vO; varying vec4 vS;
void main(){
  vO = position; vS = surf; vC = color;
  vec4 w = modelMatrix * vec4(position, 1.0);
  float sw = 1.0 - surf.w;
  // (what hangs stirs on the clock: at most 0.3 m along x and along z, less by the share typed for the thing)
  if (sw > 0.0) { float ph = floor(position.z / 15.0 + 0.5) * 1.7 + sign(position.x); w.xz += sw * 0.3 * vec2(sin(uTime * 0.83 + ph), cos(uTime * 0.61 + ph * 1.3)); }
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
const SURF_FRAG = /* glsl */`
varying vec3 vW, vN, vC, vO; varying vec4 vS;
void main(){
  vec3 n = normalize(vN); float front = gl_FrontFacing ? 1.0 : 0.0;
#ifndef AS_NOFLIP
  if (front < 0.5) n = -n;
#endif
  vec3 V = normalize(cameraPosition - vW), base = vC; float cutK = 1.0;
#ifdef AS_CARD
  // a spray of leaves: a card cut to a ragged clump. Its colour channels carry its own frame (x and y run 0 to 1 across it) and
  // its shade (z). The cut is a pattern fixed in the world where the card rests (the cards' mesh stands untransformed, so vO is
  // that place) and rides with the card as it stirs; it is filtered by the pixel's footprint: far off a card is a soft whole.
  // (the cut itself is made at the end, after every derivative has been taken)
  { vec2 q = vC.xy * 2.0 - 1.0; float fpc = min(length(dFdx(vW)), length(dFdy(vW))) * 576.0;
    cutK = mix(asNoise(vO * 1.7) * 0.7 + asNoise(vO * 4.9) * 0.45, 0.6, smoothstep(70.0, 260.0, fpc)) * (1.0 - dot(q, q));
    base = vec3(0.085, 0.125, 0.05) * (0.55 + 0.9 * vC.z); }
#endif
  float id = floor(vS.x), gloss = clamp((fract(vS.x) - 0.02) / 0.95, 0.0, 1.0), metal = vS.y;
  // the vault is built with its front faces toward the inside, so the face seen says which light falls on it; the gable and the
  // door leaves stand across the axis, so the way a face looks (south: inward) says it
  float ins = asInside(vW);
  if (id > 4.5 && id < 5.5) ins = front;
  if ((id > 7.5 && id < 8.5) || (id > 9.5 && id < 10.5)) ins = step(0.0, n.z * (vW.z < 40.0 ? 1.0 : -1.0));
  float hull = step(6.5, id) * step(id, 7.5);
  vec3 em = vec3(0.0), alb = asDetail(id, vW, vO, V, base, ins, n, gloss, em);
  vec3 col = asLight(vW, n, V, alb, gloss, metal, ins, hull) + em + base * vS.z;
  gl_FragColor = vec4(asAir(col, vW), 1.0);
#ifdef AS_CARD
  if (cutK < 0.26) discard;
#endif
}
`;
// the sky: the world's own dome
const SKY_VERT = /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SKY_FRAG = /* glsl */`
uniform vec2 uCloud; varying vec3 vW;
void main(){
  vec3 d = normalize(vW - cameraPosition); float h = max(d.y, 0.0), sd = max(dot(d, uSunDir), 0.0);
  vec3 c = asSky(d);
  // high cloud in long feathered streaks, drawn out into fibres, lit from below: rose away from the sun, gold toward it
  vec2 cp = d.xz / (h + 0.16) * 1.5; cp = vec2(dot(cp, vec2(0.94, 0.342)), dot(cp, vec2(-0.342, 0.94)));
  float n = asNoise(vec3(cp.x * 0.5 + uCloud.x + uTime * 0.006, cp.y * 3.0 + uCloud.y, 1.0)) * 0.5 + asNoise(vec3(cp.x * 1.6 + uCloud.y, cp.y * 8.0, 4.0)) * 0.3 + asNoise(vec3(cp.x * 4.6 + uCloud.x, cp.y * 21.0, 7.0)) * 0.2;
  float fib = asNoise(vec3(cp.x * 2.4 + uCloud.y + uTime * 0.006, cp.y * 44.0, 9.0));
  float cl = smoothstep(0.5, 0.84, n + 0.1 * (fib - 0.5)) * smoothstep(0.03, 0.15, h) * (1.0 - 0.8 * smoothstep(0.35, 0.8, h));
  vec3 cc = mix(vec3(0.46, 0.27, 0.34), vec3(1.5, 0.66, 0.36), pow(sd * 0.5 + 0.5, 3.0));
  c = mix(c, cc * (0.86 + 0.28 * fib), cl * (0.42 + 0.3 * fib));
  // the mist on the field closes the horizon: the like of the haze the ground fades to, a little stronger toward the sun
  vec3 hz = asHorizon(d) * 0.62 + uSunCol * (pow(sd, 8.0) * 0.16 + pow(sd, 60.0) * 0.5);
  c = mix(c, hz, exp(-h * 30.0));
  // seen from inside, through the opening: the shed's own air and its shafts lie between
  if (asInside(cameraPosition) > 0.5 && d.z < -1e-4) c = asAir(c, cameraPosition + d * ((ZD - cameraPosition.z) / d.z + 0.5));
  gl_FragColor = vec4(c, 1.0);
}
`;
// a plain figure: one instanced mesh; legs swing by the metres the ship has advanced (uStep), never by the clock
const FIG_VERT = /* glsl */`
attribute vec4 surf; attribute vec4 aPh; uniform float uStep, uWalk;
varying vec3 vW, vN, vC, vO; varying vec4 vS;
void main(){
  // aPh: the man's own phase, whether he walks, a number of his own (0 to 1) and whether his hands are free of a line
  float part = floor((1.0 - surf.w) * 4.0 + 0.5), walk = uWalk * aPh.y, ph = uStep * 6.2831853 + aPh.x, own = aPh.z;
  vec3 p = position, n = normal;
  // the arms: each man carries them a little in his own way; a man whose hands are free lets them hang
  if (part == 3.0) { float b = (own - 0.5) * 0.5 - 0.5 * aPh.w, cb = cos(b), sb = sin(b); vec3 q = p - vec3(0.0, 1.42, 0.0);
    p = vec3(q.x * mix(1.0, 0.8, aPh.w), 1.42 + q.y * cb - q.z * sb, q.y * sb + q.z * cb); n = vec3(n.x, n.y * cb - n.z * sb, n.y * sb + n.z * cb); }
  float a = (part == 1.0 ? 1.0 : (part == 2.0 ? -1.0 : 0.0)) * (0.38 + 0.16 * own) * sin(ph) * walk;
  float c = cos(a), s = sin(a); vec3 q = p - vec3(0.0, 0.9, 0.0);
  p = vec3(q.x, 0.9 + q.y * c - q.z * s, q.y * s + q.z * c); n = vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c);
  p.y += 0.022 * abs(cos(ph)) * walk;
  // a man on a line leans into it as he walks, each by his own measure
  p.z -= p.y * (0.03 + 0.1 * fract(own * 3.7)) * walk * (1.0 - aPh.w);
  // standing: a breath and a shift of weight, by the clock, at most 0.025 m at the head
  p.x += 0.012 * sin(uTime * 0.9 + aPh.x * 9.0) * (1.0 - walk) * p.y; p.z += 0.006 * sin(uTime * 1.4 + aPh.x * 5.0) * (1.0 - walk) * smoothstep(0.9, 1.5, p.y);
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vW = w.xyz; vO = w.xyz; vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
  // (his trousers are of another cloth than his jacket, darker or paler by his own number)
  vC = color * mix(instanceColor * ((part == 1.0 || part == 2.0) ? mix(0.6, 1.12, fract(own * 5.3)) : 1.0), vec3(1.0), surf.y); vS = vec4(surf.x, 0.0, 0.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
// a line: a ribbon that keeps at least a pixel and a quarter of width (a filter by the pixel's footprint), fading as the true line thins, to three tenths at the least
const ROPE_VERT = /* glsl */`
attribute vec3 aDir; attribute float aSide, aRide; uniform vec2 uRes; uniform float uPx; uniform vec3 uRide; varying vec3 vW; varying float vA;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0); w.xyz += uRide * aRide; vW = w.xyz;
  vec4 c0 = projectionMatrix * viewMatrix * w, c1 = projectionMatrix * viewMatrix * vec4(w.xyz + mat3(modelMatrix) * aDir, 1.0);
  vec2 d = (c1.xy / max(c1.w, 0.05) - c0.xy / max(c0.w, 0.05)) * uRes; float dl = length(d); d = dl > 1e-5 ? d / dl : vec2(1.0, 0.0);
  float wpx = 0.07 * uPx / max(c0.w, 0.1), px = max(wpx, 1.25); vA = clamp(wpx / 1.25, 0.3, 1.0);
  c0.xy += vec2(-d.y, d.x) * aSide * px / uRes * c0.w;
  gl_Position = c0;
}
`;
const ROPE_FRAG = /* glsl */`
uniform vec3 uRopeCol; varying vec3 vW; varying float vA;
void main(){
  float ins = asInside(vW);
  vec3 lit = mix(vec3(0.16, 0.2, 0.31), uCold * 0.6, ins) + uSunCol * asSunVis(vW, 0.0) * 0.45;
  gl_FragColor = vec4(asAir(uRopeCol * lit, vW), vA);
}
`;
// long shadows (the men's, the poplars', the mast's): strips laid on the ground along the way the light travels, shown only where the dawn reaches
const SHADOW_VERT = /* glsl */`
attribute vec4 aBase; uniform float uShLen; varying vec3 vW; varying vec2 vUv; varying float vK, vH;
void main(){
  vec2 L = normalize(-uSunDir.xz); vec3 b = (modelMatrix * vec4(aBase.xyz, 1.0)).xyz;
  vec3 p = vec3(b.x, 0.04, b.z) + vec3(L.y, 0.0, -L.x) * position.x * aBase.w + vec3(L.x, 0.0, L.y) * position.z * uShLen * max(position.y, 1.0);
  vW = p; vUv = vec2(position.x, position.z); vH = position.y; vK = asSunVis(b + vec3(0.0, 1.0, 0.0), 0.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`;
const SHADOW_FRAG = /* glsl */`
varying vec3 vW; varying vec2 vUv; varying float vK, vH;
void main(){
  // (a long shadow softens and pales along its length; a man's, thin as it is, is lost in the low light within its first half)
  float man = 1.0 - step(0.5, vH);
  float along = mix(1.0 - 0.8 * smoothstep(0.02, 0.6, vUv.y), 1.0 - smoothstep(0.0, 0.5, vUv.y), man) * (1.0 - smoothstep(0.6, 1.0, vUv.y));
  float a = (1.0 - smoothstep(0.22 - 0.2 * vUv.y, 0.5, abs(vUv.x))) * along * vK * asSunVis(vW, 0.0);
  gl_FragColor = vec4(0.0, 0.0, 0.0, a * mix(0.6, 0.22, man));
}
`;
// dust in the shafts: points that drift a little round their own places (0.6 m along each axis). Each is drawn at its true size (3 to 6 cm,
// larger than life), never under a pixel and a half across; where that least width holds, its light is cut by the share of
// the drawn disc it truly fills (a filter by the pixel's footprint). The shed's own thin air lies between it and the eye.
const MOTE_VERT = /* glsl */`
attribute vec4 aSeed; uniform float uPx; varying vec3 vCol;
void main(){
  vec3 p = position + 0.6 * vec3(sin(uTime * 0.11 + aSeed.x * 40.0), sin(uTime * 0.09 + aSeed.y * 23.0), cos(uTime * 0.1 + aSeed.z * 31.0));
  vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; float d = max(-mv.z, 0.1);
  float px = (0.03 + 0.03 * aSeed.w) * uPx / d, fill = min(1.0, px / 1.5); gl_PointSize = max(px, 1.5);
  float lit = asSunVis(p, 0.0), sd = max(dot(normalize(p - cameraPosition), uSunDir), 0.0);
  vCol = uSunCol * lit * (0.05 + 0.5 * pow(sd, 6.0)) * fill * fill * exp(-d * uFogDen) * (0.7 + 1.4 * aSeed.w);
}
`;
const MOTE_FRAG = /* glsl */`varying vec3 vCol; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(vCol * (1.0 - smoothstep(0.2, 1.0, d)), 1.0); }`;
// swallows: each flies a fixed closed course of its own (an ellipse laid in the air), told by the clock; the courses are set by place
const BIRD_VERT = /* glsl */`
attribute vec4 aC, aR; varying vec3 vW; varying float vSh;
void main(){
  float ang = aC.w + aR.w * uTime, ca = cos(aR.z), sa = sin(aR.z);
  vec3 e1 = vec3(ca, 0.0, sa), e2 = vec3(-sa, 0.0, ca);
  vec3 c = aC.xyz + e1 * cos(ang) * aR.x + e2 * sin(ang) * aR.y + vec3(0.0, sin(ang * 2.0 + aC.w) * 1.2, 0.0);
  vec3 f = normalize((-e1 * sin(ang) * aR.x + e2 * cos(ang) * aR.y) * sign(aR.w) + vec3(0.0, 1e-4, 0.0)), r = normalize(cross(f, vec3(0.0, 1.0, 0.0))), u = cross(r, f);
  float flap = sin(uTime * 13.0 + aC.w * 9.0) * (0.55 + 0.45 * sin(uTime * 0.7 + aC.w * 3.0));
  vec3 p = position; p.y += abs(p.x) * flap * 0.7;
  vec3 w = c + r * p.x + u * p.y + f * p.z;
  vW = w; vSh = 0.5 + 0.5 * u.y * sign(p.y + 0.01);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
`;
const BIRD_FRAG = /* glsl */`
varying vec3 vW; varying float vSh;
void main(){
  float ins = asInside(vW);
  vec3 lit = mix(vec3(0.16, 0.2, 0.31), uCold * 0.7, ins) + uSunCol * asSunVis(vW, 0.0) * 0.3;
  gl_FragColor = vec4(asAir(vec3(0.05, 0.055, 0.075) * lit * (0.6 + 0.8 * vSh), vW), 1.0);
}
`;

// ---- the shared light: uniforms and the family of materials
export function makeShedLight() {
  const U = {
    uTime: { value: 0 }, uDoorW: { value: 4 }, uShipZ: { value: 0 }, uFogDen: { value: 0.0016 }, uShaft: { value: 0.3 }, uLampK: { value: 1 }, uWet: { value: 1 }, uMist: { value: 0.013 },
    uSunDir: { value: new THREE.Vector3(-0.1388, 0.0698, -0.988).normalize() }, uSunCol: { value: lin('#ffa860', 2.5) }, uCold: { value: lin('#6f86b0', 0.85) },
    uLampCol: { value: lin('#ffd09a') }, uWarmWin: { value: lin('#ffca7a', 2.4) }, uCloud: { value: new THREE.Vector2(0, 0) },
    uRes: { value: new THREE.Vector2(1920, 1080) }, uPx: { value: 900 }, uStep: { value: 0 }, uWalk: { value: 0 }, uShLen: { value: 25.5 }, uRopeCol: { value: lin('#a08a62') }, uRide: { value: new THREE.Vector3() },
  };
  const cache = new Map(), keep = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };
  const FN = GLSL_UNI + GLSL_FN;
  const surface = (k = {}) => keep('s' + (k.side ?? THREE.FrontSide), () => new THREE.ShaderMaterial({ uniforms: U, vertexColors: true, side: k.side ?? THREE.FrontSide,
    vertexShader: GLSL_UNI + SURF_VERT, fragmentShader: FN + GLSL_SURF + SURF_FRAG }));
  const figure = () => keep('fig', () => new THREE.ShaderMaterial({ uniforms: U, vertexColors: true, side: THREE.DoubleSide, defines: { AS_NOFLIP: 1 },
    vertexShader: GLSL_UNI + FIG_VERT, fragmentShader: FN + GLSL_SURF + SURF_FRAG }));
  const leaves = () => keep('leaves', () => new THREE.ShaderMaterial({ uniforms: U, vertexColors: true, side: THREE.DoubleSide, defines: { AS_NOFLIP: 1, AS_CARD: 1 },
    vertexShader: GLSL_UNI + SURF_VERT, fragmentShader: FN + GLSL_SURF + SURF_FRAG }));
  const sky = () => keep('sky', () => new THREE.ShaderMaterial({ uniforms: U, side: THREE.BackSide, depthWrite: false, vertexShader: SKY_VERT, fragmentShader: FN + SKY_FRAG }));
  const rope = () => keep('rope', () => new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide, transparent: true, depthWrite: false, vertexShader: GLSL_UNI + ROPE_VERT, fragmentShader: FN + ROPE_FRAG }));
  const shadow = () => keep('shadow', () => new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -40, vertexShader: FN + SHADOW_VERT, fragmentShader: FN + SHADOW_FRAG }));
  const motes = () => keep('motes', () => new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: FN + MOTE_VERT, fragmentShader: MOTE_FRAG }));
  const birds = () => keep('birds', () => new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide, vertexShader: GLSL_UNI + BIRD_VERT, fragmentShader: FN + BIRD_FRAG }));
  return { uniforms: U, surface, figure, leaves, sky, rope, shadow, motes, birds, dispose() { for (const m of cache.values()) m.dispose(); } };
}

// ---------------------------------------------------------------- geometry
export const TONE = { HULL: '#b3b9c1', FIN: '#aab0b9', CAR: '#8d939a', STEEL: '#3b4046', STEEL_L: '#565c63', WOOD: '#4a2f1c', SKIN: '#b08a6a' };
const S_HULL = sf(SID.HULL, 0.5, 0.42), S_FIN = sf(SID.FIN, 0.46, 0.38), S_CAR = sf(SID.PLAIN, 0.45, 0.4), S_PROP = sf(SID.PLAIN, 0.62);
export const S_STEEL = sf(SID.STEEL, 0.35, 0.6), S_STEELM = sf(SID.STEEL, 0.12, 0.3);
const rad = (th, r, z) => [Math.sin(th) * r, SHIP.CY - Math.cos(th) * r, z];     // a point of the ship's frame: th from straight down, r from the axis

// the hull's skin: flat panels between thirty-six girders, a station every 2.5 m and closer on the bow
async function hullGeometry(ctx) {
  const zs = [SHIP.NOSE + 0.001]; for (const d of [0.12, 0.45, 1.0, 1.8, 2.9, 4.3, 6.0, 8.0, 10.2, 12.5]) zs.push(SHIP.NOSE + d);
  for (let z = SHIP.NOSE + 15; z < SHIP.STERN - 1; z += 2.5) zs.push(z); zs.push(SHIP.STERN - 0.3, SHIP.STERN - 0.001);
  const NP = 36, P = [], N = [], IX = [], pt = (j, i) => rad((i + 0.5) / NP * TAU, hullRadius(zs[j]), zs[j]);
  for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < NP; i++) {
    if (i === 0 && j % 20 === 19) await ctx.yield();
    const A = pt(j, i), B = pt(j, i + 1), C = pt(j + 1, i + 1), D = pt(j + 1, i), th = (i + 1) / NP * TAU;
    _a.set(C[0] - A[0], C[1] - A[1], C[2] - A[2]); _b.set(D[0] - B[0], D[1] - B[1], D[2] - B[2]); _x.crossVectors(_a, _b);
    if (_x.lengthSq() < 1e-12) continue; _x.normalize();
    const out = _x.x * Math.sin(th) - _x.y * Math.cos(th) + _x.z * (j < 12 ? -0.4 : 0.05) > 0; if (!out) _x.negate();
    // winding: counter-clockwise as seen from outside
    _a.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]); _b.set(C[0] - A[0], C[1] - A[1], C[2] - A[2]); _y.crossVectors(_a, _b); let ccw = _y.dot(_x) > 0;
    if (_y.lengthSq() < 1e-12) { _a.set(C[0] - A[0], C[1] - A[1], C[2] - A[2]); _b.set(D[0] - A[0], D[1] - A[1], D[2] - A[2]); _y.crossVectors(_a, _b); ccw = _y.dot(_x) > 0; }
    // the normal: the panel's own round the girth (flat between its girders), and along the length the hull's own slope at each
    // station, so that a panel reads as one long facet
    const base = P.length / 3, cs = Math.cos(Math.PI / NP);
    for (const [q, jj] of [[A, j], [B, j], [C, j + 1], [D, j + 1]]) {
      P.push(q[0], q[1], q[2]);
      if (jj === 0 || jj === zs.length - 1) { N.push(_x.x, _x.y, _x.z); continue; }
      const sl = -(hullRadius(zs[jj] + 0.25) - hullRadius(zs[jj] - 0.25)) / 0.5 * cs, l = Math.hypot(1, sl);
      N.push(Math.sin(th) / l, -Math.cos(th) / l, sl / l);
    }
    if (ccw) IX.push(base, base + 1, base + 2, base, base + 2, base + 3); else IX.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(IX);
  return g;
}
// a fin or a control surface: an outline in the plane (z along the ship, rho out from the axis), two skins a little apart and an edge
// between them; th says which way out from the axis it stands. root: how many of the outline's last edges lie in the hull (no edge strip)
function finGeometry(outline, halfT, th, root = 0) {
  const er = [Math.sin(th), -Math.cos(th)], ew = [Math.cos(th), Math.sin(th)], P = [], N = [], IX = [];
  const at = (z, rho, w) => [er[0] * rho + ew[0] * w, SHIP.CY + er[1] * rho + ew[1] * w, z];
  const tris = THREE.ShapeUtils.triangulateShape(outline.map((p) => new THREE.Vector2(p[0], p[1])), []);
  for (const side of [-1, 1]) {
    const base = P.length / 3;
    for (const p of outline) { const q = at(p[0], p[1], side * halfT(p[0], p[1])); P.push(q[0], q[1], q[2]); N.push(ew[0] * side, ew[1] * side, 0); }
    for (const t of tris) {
      const A = at(...outline[t[0]], 0), B = at(...outline[t[1]], 0), C = at(...outline[t[2]], 0);
      _a.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]); _b.set(C[0] - A[0], C[1] - A[1], C[2] - A[2]); _x.crossVectors(_a, _b);
      if ((_x.x * ew[0] + _x.y * ew[1]) * side > 0) IX.push(base + t[0], base + t[1], base + t[2]); else IX.push(base + t[0], base + t[2], base + t[1]);
    }
  }
  let cz = 0, cr = 0; for (const p of outline) { cz += p[0] / outline.length; cr += p[1] / outline.length; }
  for (let k = 0; k < outline.length - root; k++) {
    const p = outline[k], q = outline[(k + 1) % outline.length]; let nz = q[1] - p[1], nr = -(q[0] - p[0]); const l = Math.hypot(nz, nr) || 1; nz /= l; nr /= l;
    if (nz * ((p[0] + q[0]) / 2 - cz) + nr * ((p[1] + q[1]) / 2 - cr) < 0) { nz = -nz; nr = -nr; }
    const n = [er[0] * nr, er[1] * nr, nz], hp = halfT(p[0], p[1]), hq = halfT(q[0], q[1]);
    const A = at(p[0], p[1], -hp), B = at(q[0], q[1], -hq), C = at(q[0], q[1], hq), D = at(p[0], p[1], hp), base = P.length / 3;
    for (const v of [A, B, C, D]) { P.push(v[0], v[1], v[2]); N.push(n[0], n[1], n[2]); }
    _a.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]); _b.set(C[0] - A[0], C[1] - A[1], C[2] - A[2]); _x.crossVectors(_a, _b);
    if (_x.x * n[0] + _x.y * n[1] + _x.z * n[2] > 0) IX.push(base, base + 1, base + 2, base, base + 2, base + 3); else IX.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(IX);
  return g;
}
// a plain figure 1.73 m tall, facing north (z less), feet at the origin: overalls, a cap, no face. The kit's sway channel names
// the part for the walk (0.25 left leg, 0.5 right leg, 0.75 arms); the metal channel marks what the man's own tone does not tint.
export function figureGeometry() {
  const b = INT.makeBuilder(), W = '#ffffff';
  // a round limb from a to c, r thick at a and a little less at c
  const limb = (a, c, r, color, surf) => {
    _a.set(a[0], a[1], a[2]); _b.set(c[0], c[1], c[2]); _y.subVectors(_b, _a); const len = _y.length(); _y.multiplyScalar(1 / len);
    _x.set(1, 0, 0); _z.crossVectors(_x, _y).normalize(); _x.crossVectors(_y, _z);
    _m.makeBasis(_x, _y, _z); _m.setPosition((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2);
    b.add(new THREE.CylinderGeometry(r * 0.85, r, len, 6, 1, true), { m: _m, c: color, surf });
  };
  const leg = (s, sway) => {
    b.add(new THREE.CylinderGeometry(0.09, 0.068, 0.86, 7), { p: [s * 0.1, 0.47, 0], c: W, surf: sf(SID.PLAIN, 0.12, 0, 0, sway) });
    b.add(new THREE.SphereGeometry(1, 6, 4), { p: [s * 0.1, 0.06, -0.045], s: [0.085, 0.062, 0.15], c: '#1c1a18', surf: sf(SID.PLAIN, 0.3, 1, 0, sway) });
  };
  leg(-1, 0.25); leg(1, 0.5);
  b.add(new THREE.SphereGeometry(1, 8, 5), { p: [0, 0.93, 0], s: [0.2, 0.15, 0.125], c: W, surf: sf(SID.PLAIN, 0.12) });
  b.add(new THREE.SphereGeometry(1, 9, 7), { p: [0, 1.18, 0], s: [0.21, 0.33, 0.135], c: W, surf: sf(SID.PLAIN, 0.12) });
  b.add(new THREE.SphereGeometry(1, 8, 4), { p: [0, 1.42, 0], s: [0.25, 0.085, 0.12], c: W, surf: sf(SID.PLAIN, 0.12) });
  const S_ARM = sf(SID.PLAIN, 0.12, 0, 0, 0.75), S_HAND = sf(SID.PLAIN, 0.2, 1, 0, 0.75);
  limb([0.24, 1.42, 0], [0.31, 1.2, -0.06], 0.062, W, S_ARM); limb([0.31, 1.2, -0.06], [0.33, 1.04, -0.14], 0.055, W, S_ARM);
  limb([-0.24, 1.42, 0], [-0.1, 1.22, -0.12], 0.062, W, S_ARM); limb([-0.1, 1.22, -0.12], [0.15, 1.09, -0.2], 0.055, W, S_ARM);
  b.add(new THREE.SphereGeometry(0.052, 6, 4), { p: [0.34, 1.0, -0.15], c: TONE.SKIN, surf: S_HAND }); b.add(new THREE.SphereGeometry(0.052, 6, 4), { p: [0.17, 1.05, -0.22], c: TONE.SKIN, surf: S_HAND });
  b.add(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 6, 1, true), { p: [0, 1.5, 0], c: TONE.SKIN, surf: sf(SID.PLAIN, 0.2, 1) });
  b.add(new THREE.SphereGeometry(1, 8, 6), { p: [0, 1.6, 0], s: [0.1, 0.112, 0.108], c: TONE.SKIN, surf: sf(SID.PLAIN, 0.2, 1) });
  b.add(new THREE.CylinderGeometry(0.112, 0.118, 0.06, 8), { p: [0, 1.695, 0], c: '#26282c', surf: sf(SID.PLAIN, 0.15, 1) });
  b.add(new THREE.BoxGeometry(0.15, 0.016, 0.09), { p: [0, 1.672, -0.145], c: '#26282c', surf: sf(SID.PLAIN, 0.15, 1) });
  return b.build();
}
// sprays of leaves: cards for the material leaves(). add(at, out, e1, e2, hw, hh, shade): a card centred at `at`, hw to either
// side along e1 and hh along e2 (unit vectors), shaded as part of a crown whose face looks along `out`
export function leafCards() {
  const P = [], N = [], C = [], S = [], IX = [], sv = sf(SID.LEAF, 0.05, 0, 0, 0.25);      // (the sway share: a spray stirs 0.075 m at the most along x and along z)
  return {
    add(at, out, e1, e2, hw, hh, shade) {
      const base = P.length / 3;
      for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const a = (u * 2 - 1) * hw, c = (v * 2 - 1) * hh;
        P.push(at[0] + e1[0] * a + e2[0] * c, at[1] + e1[1] * a + e2[1] * c, at[2] + e1[2] * a + e2[2] * c); N.push(out[0], out[1], out[2]); C.push(u, v, shade); S.push(sv[0], sv[1], sv[2], sv[3]);
      }
      IX.push(base, base + 1, base + 2, base, base + 2, base + 3);
    },
    build() {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('surf', new THREE.Float32BufferAttribute(S, 4)); g.setIndex(IX); g.computeBoundingSphere();
      return g;
    },
  };
}
// ribbons for a set of lines: each line an array of [x, y, z]
export function ropeGeometry(lines) {
  const P = [], D = [], S = [], Rd = [], IX = [];
  for (const L of lines) {
    const base = P.length / 3;
    for (let i = 0; i < L.length; i++) {
      const a = L[Math.max(0, i - 1)], c = L[Math.min(L.length - 1, i + 1)], dx = c[0] - a[0], dy = c[1] - a[1], dz = c[2] - a[2], l = Math.hypot(dx, dy, dz) || 1;
      for (const s of [-1, 1]) { P.push(L[i][0], L[i][1], L[i][2]); D.push(dx / l, dy / l, dz / l); S.push(s); Rd.push(L[i][3] || 0); }
      if (i < L.length - 1) { const k = base + i * 2; IX.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(D, 3));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(S, 1)); g.setAttribute('aRide', new THREE.Float32BufferAttribute(Rd, 1)); g.setIndex(IX); g.computeBoundingSphere();
  return g;
}
// a line that hangs between two points: n spans, sag metres at the middle; ride 1: its first end is made fast to the hull and
// rides with it (the share falls to nothing at the other end)
export const RIDE = { X: [0.16, 0.06], Y: [0.11, 0.04] };      // the ship's ride at its lines, metres: the sum of each pair is the most it moves that way
export function hang(a, c, sag = 0, n = 10, ride = 0) {
  const out = []; for (let i = 0; i <= n; i++) { const f = i / n; out.push([a[0] + (c[0] - a[0]) * f, a[1] + (c[1] - a[1]) * f - sag * 4 * f * (1 - f), a[2] + (c[2] - a[2]) * f, ride * (1 - f)]); }
  return out;
}

export async function buildHero(ctx, opts = {}) {
  const own = !opts.light, LT = opts.light || makeShedLight(), mat = LT.surface();
  // object: the ship's frame (the world moves it along the shed and hangs the men and the trolleys in it). afloat: what floats
  // (hull, fins, cars, propellers) and rides a little within that frame.
  const object = new THREE.Group(); object.name = 'ship'; const afloat = new THREE.Group(); afloat.name = 'afloat'; object.add(afloat);
  const b = INT.makeBuilder();
  // ------------------------------------------------------------ the hull
  await ctx.yield();
  const hg = await hullGeometry(ctx);
  await ctx.yield();
  b.add(hg, { c: TONE.HULL, surf: S_HULL });
  await ctx.yield();
  // a corridor's ridge along the belly, hoods along the back, the mooring cone
  for (let z = -72; z < 96; z += 6) { const r0 = hullRadius(z), r1 = hullRadius(z + 6); strut(b, [0, SHIP.CY - r0 - 0.12, z], [0, SHIP.CY - r1 - 0.12, z + 6], 1.7, 0.7, [0, 1, 0], '#9ea4ac', S_HULL); }
  for (let k = 0; k < 15; k++) { const z = -76 + 13 * k, r = hullRadius(z); b.add(new THREE.SphereGeometry(1, 10, 6), { p: [0, SHIP.CY + r + 0.02, z], s: [0.42, 0.34, 0.95], c: TONE.HULL, surf: sf(SID.PLAIN, 0.3, 0.2) }); }
  b.add(new THREE.CylinderGeometry(0.05, 0.8, 2.2, 14), { p: [0, SHIP.CY, SHIP.NOSE - 0.6], r: [-Math.PI / 2, 0, 0], c: '#b6bbc0', surf: sf(SID.PLAIN, 0.5, 0.5) });
  b.add(new THREE.TorusGeometry(2.4, 0.07, 6, 28), { p: [0, SHIP.CY, SHIP.NOSE + 0.42], c: '#b6bbc0', surf: sf(SID.PLAIN, 0.5, 0.5) });
  await ctx.yield();
  // ------------------------------------------------------------ the fins: a cross at the stern
  const r98 = hullRadius(98) - 0.6, rAt = (z) => hullRadius(z) - 0.6;
  const FIN = [[98, r98], [103, 15.2], [112, 20], [120, 21], [131, 21], [131, rAt(131)], [124.5, rAt(124.5)], [118, rAt(118)], [111, rAt(111)], [104.5, rAt(104.5)]];
  const RUD = [[131.5, 4.9], [131.5, 20.7], [137.5, 20.2], [142, 16.5], [143, 9], [141, 5.2], [134, 5.0]];
  const finT = (z, rho) => (1.5 - 1.2 * Math.min(1, Math.max(0, (rho - 5) / 16))) * (0.4 + 0.6 * Math.min(1, Math.max(0, (z - 98) / 14)));
  const rudT = (z, rho) => (0.7 - 0.48 * Math.min(1, Math.max(0, (rho - 5) / 16))) * (1 - 0.8 * Math.min(1, Math.max(0, (z - 131.5) / 11.5)));
  const rudders = [];
  for (let k = 0; k < 4; k++) {
    const th = k * Math.PI / 2;      // 0 the lower fin, then starboard, upper, port
    b.add(finGeometry(FIN, finT, th, 5), { c: TONE.FIN, surf: S_FIN });
    // bracing wires from the fin's tip to the hull
    for (const s of [-1, 1]) { const tip = rad(th, 19, 116), foot = rad(th + s * 0.62, hullRadius(112) - 0.2, 112); strut(b, tip, foot, 0.06, 0.06, [0, 0, 1], TONE.STEEL, S_STEELM); }
    const rb = INT.makeBuilder(); rb.add(finGeometry(RUD, rudT, th, 0), { c: TONE.FIN, surf: S_FIN });
    const m = new THREE.Mesh(rb.build(), mat); m.matrixAutoUpdate = false; m.userData.axis = new THREE.Vector3(Math.sin(th), -Math.cos(th), 0).multiplyScalar(k < 2 ? 1 : -1); m.userData.pair = k % 2;   // (one axis for a pair: the two rudders swing together, and the two elevators)
    afloat.add(m); rudders.push(m);
    await ctx.yield();
  }
  // ------------------------------------------------------------ four engine cars, low on the flanks, each with a pusher propeller
  const props = [], pb = INT.makeBuilder();
  pb.add(new THREE.CylinderGeometry(0.34, 0.2, 0.9, 12), { r: [Math.PI / 2, 0, 0], c: TONE.STEEL_L, surf: S_STEEL });
  for (let k = 0; k < 4; k++) {
    const mm = new THREE.Matrix4().makeRotationZ(k * Math.PI / 2).multiply(new THREE.Matrix4().makeTranslation(0, 1.62, 0)).multiply(new THREE.Matrix4().makeRotationY(0.42));
    pb.add(new THREE.BoxGeometry(0.36, 2.8, 0.07), { m: mm, c: TONE.WOOD, surf: S_PROP });
  }
  const propGeo = pb.build();
  const carAt = [];
  for (const [z, side] of [[28, -1], [28, 1], [-20, -1], [-20, 1]]) {
    const th = side * 0.908, R = hullRadius(z), c = rad(th, R + 3.2, z); carAt.push(c);
    b.add(new THREE.SphereGeometry(1, 16, 10), { p: c, s: [1.15, 1.3, 3.3], c: TONE.CAR, surf: S_CAR });
    b.add(new THREE.CylinderGeometry(0.75, 0.9, 0.5, 14), { p: [c[0], c[1], c[2] - 3.0], r: [Math.PI / 2, 0, 0], c: '#5a5f65', surf: S_STEEL });      // the radiator's ring
    b.add(new THREE.BoxGeometry(0.05, 0.42, 1.2), { p: [c[0] + side * 1.1, c[1] + 0.3, c[2] - 0.6], c: '#ffc37a', surf: sf(SID.PLAIN, 0.1, 0, 1.8) });      // a lamp is lit inside
    b.add(new THREE.BoxGeometry(0.05, 0.42, 1.2), { p: [c[0] - side * 1.1, c[1] + 0.3, c[2] - 0.6], c: '#ffc37a', surf: sf(SID.PLAIN, 0.1, 0, 1.2) });
    for (const dz of [-1.9, 1.9]) for (const da of [-0.17, 0.17]) strut(b, [c[0] + Math.cos(th) * da * 4, c[1] + 0.95, c[2] + dz], rad(th + da, hullRadius(z + dz * 1.3) - 0.15, z + dz * 1.3), 0.46, 0.17, [0, 0, 1], '#868d95', S_CAR);
    // two braces to the belly, and the ladder the mechanics climb down from the hull
    for (const dz of [-1.2, 1.2]) strut(b, [c[0] - side * 0.5, c[1] + 0.6, c[2] + dz], rad(th - side * 0.36, hullRadius(z + dz) - 0.15, z + dz), 0.3, 0.12, [0, 0, 1], '#a3a9b0', S_CAR);
    { const top = rad(th, hullRadius(z) - 0.1, z), foot = [c[0], c[1] + 1.2, c[2]], ex = Math.cos(th) * 0.22, ey = Math.sin(th) * 0.22;
      for (const s of [-1, 1]) strut(b, [foot[0] + s * ex, foot[1] + s * ey, foot[2]], [top[0] + s * ex, top[1] + s * ey, top[2]], 0.04, 0.04, [0, 0, 1], TONE.STEEL_L, S_STEELM);
      for (let k = 1; k < 9; k++) { const f = k / 9, q = [foot[0] + (top[0] - foot[0]) * f, foot[1] + (top[1] - foot[1]) * f, foot[2]]; strut(b, [q[0] - ex, q[1] - ey, q[2]], [q[0] + ex, q[1] + ey, q[2]], 0.03, 0.03, [0, 0, 1], TONE.STEEL_L, S_STEELM); } }
    strut(b, [c[0], c[1] + 1.1, c[2] - 2.2], rad(th, hullRadius(z + 2.6) - 0.1, z + 2.6), 0.05, 0.05, [1, 0, 0], TONE.STEEL, S_STEELM); strut(b, [c[0], c[1] + 1.1, c[2] + 2.2], rad(th, hullRadius(z - 2.6) - 0.1, z - 2.6), 0.05, 0.05, [1, 0, 0], TONE.STEEL, S_STEELM);
    const p = new THREE.Mesh(propGeo, mat); p.position.set(c[0], c[1], c[2] + 3.5); p.userData.rate = (z > 0 ? 5.4 : 6.3) * side; afloat.add(p); props.push(p);
  }
  await ctx.yield();
  // ------------------------------------------------------------ the control car under the forward body, its windows lit
  const CC = [0, 11.3, -77], CS = [1.55, 1.5, 7.4];
  b.add(new THREE.SphereGeometry(1, 18, 12), { p: CC, s: CS, c: TONE.CAR, surf: S_CAR });
  const S_WIN = sf(SID.PLAIN, 0.3, 0, 2.2);
  await ctx.yield();
  for (let z = -82.6; z < -71.5; z += 1.15) for (const s of [-1, 1]) {
    const y = CC[1] + 0.28, dz = z + 0.42 - CC[2], x = CS[0] * Math.sqrt(Math.max(0.05, 1 - Math.pow((y - CC[1]) / CS[1], 2) - Math.pow(dz / CS[2], 2)));
    b.add(new THREE.BoxGeometry(0.06, 0.6, 0.84), { p: [s * (x + 0.005), y, z + 0.42], r: [0, Math.atan(-s * CS[0] * CS[0] * dz / (CS[2] * CS[2] * x)), 0], c: '#ffcf8a', surf: S_WIN });
  }
  // ------------------------------------------------------------ running lamps: red to port, green to starboard, white at the tail
  const lamp = (p, c, k) => b.add(new THREE.SphereGeometry(0.17, 8, 6), { p, c, surf: sf(SID.PLAIN, 0.3, 0, k) });
  lamp(rad(-Math.PI / 2, hullRadius(-7) + 0.12, -7), '#ff3a24', 5); lamp(rad(Math.PI / 2, hullRadius(-7) + 0.12, -7), '#2cff7a', 4); lamp([0, SHIP.CY, SHIP.STERN + 0.1], '#fff2d8', 4);
  await ctx.yield();
  const body = new THREE.Mesh(b.build(), mat); body.name = 'hull'; afloat.add(body);
  await ctx.yield();
  // where the handling lines are made fast (the ship's frame)
  const anchors = { side: [], bow: [[-0.7, SHIP.CY - 1.2, SHIP.NOSE + 1.4], [0.7, SHIP.CY - 1.2, SHIP.NOSE + 1.4]], aft: [], cars: carAt };
  for (const z of [-38, -51]) for (const s of [-1, 1]) anchors.side.push({ z, s, at: rad(s * 0.66, hullRadius(z), z) });
  for (const z of [36, 96]) for (const s of [-1, 1]) anchors.aft.push({ z, s, at: rad(s * 0.5, hullRadius(z), z) });
  const hinge = new THREE.Vector3(0, SHIP.CY, 131.5), _r = new THREE.Matrix4(), _t = new THREE.Matrix4();
  const tris = (body.geometry.index.count + rudders.reduce((n, m) => n + m.geometry.index.count, 0) + propGeo.index.count * 4) / 3;
  return {
    object, anchors, triangles: tris, light: LT,
    // the rudders and elevators swing through a slow test (0.2 radians either way at the most), the propellers turn over about
    // their own shafts (a closed course): both by the clock, both bounded. THE SHIP
    // RIDES AT ITS LINES, afloat: by the clock it surges at most 0.22 m to either side and 0.15 m up or down (RIDE above), no more
    update(dt, time) {
      afloat.position.set(RIDE.X[0] * Math.sin(time * 0.52 + 0.4) + RIDE.X[1] * Math.sin(time * 1.13), RIDE.Y[0] * Math.sin(time * 0.41 + 1.7) + RIDE.Y[1] * Math.sin(time * 0.93), 0);
      LT.uniforms.uRide.value.copy(afloat.position);
      for (const m of rudders) { const a = 0.2 * Math.sin(time * 0.55 + m.userData.pair * 1.9) * (0.6 + 0.4 * Math.sin(time * 0.17 + m.userData.pair));
        _r.makeRotationAxis(m.userData.axis, a); m.matrix.makeTranslation(hinge.x, hinge.y, hinge.z).multiply(_r).multiply(_t.makeTranslation(-hinge.x, -hinge.y, -hinge.z)); m.matrixWorldNeedsUpdate = true; }
      for (const p of props) p.rotation.z = (time * p.userData.rate) % TAU;
    },
    dispose() { body.geometry.dispose(); propGeo.dispose(); for (const m of rudders) m.geometry.dispose(); if (own) LT.dispose(); },
  };
}
