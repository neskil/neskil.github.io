// BLUE SAILS ON A DRY SEA: the white town in stone. Sea wall, water stairs, dry jetties, house floor, quays and
// avenues, terraces, the turned towers with their windows, the tiers behind the basin, the footbridges, and the
// mirror: y-flipped copies of the near towers that lie under the canal's translucent surface.
import * as THREE from 'three';
import { BS_NOISE, BS_COMMON, lin, makeAcc, vtx, quad, loft, tube, box, ball, finish } from './blue-sails-dry-sea.js';

export const WATER_Y = 8.4, QUAY_Y = 9.6, FLOOR_Y = 9.0, BASIN = { x: 0, z: -745, r: 38 };
export const TERRACE = (k) => ({ x0: 20 + 40 * k, x1: 60 + 40 * k, y: k === 0 ? QUAY_Y : 10 + 7 * k, z0: -432 - 14 * k });

// ---------------------------------------------------------------- white stone, worn round
// Vertex colour x the world's light, with courses, weather streaks and paving drawn in the shader. aGlow > 0 glows.
// mirror: the copy under the water (lit as the original is, dimmer, wobbling with the ripples).
export const LAMP_ROW = { x: 8.5, y: QUAY_Y + 5.0, z0: -523, dz: 16, n: 12 };
export const AVENUE_LAMPS = { x: 19.6, z0: -531, dz: 32, n: 6 };
export const RING_LAMPS = { r: 43.5, n: 14, gap: 11 };
// small lamps on the tiers (one on every fourth row, a quarter radian apart, the rows staggered), lamp standards up
// the water stairs and along the sea wall: the same rule places the lamp and lights the stone round it
export const TIER_LAMPS = { r0: 52, dr: 6.4, rows: 5, da: 0.25, y0: QUAY_Y + 3, dy: 4, clear: 12, amax: 1.5, s: 0.34 };
// the water stairs: thirty risers of 0.3 m in three flights of ten, 0.75 m to a tread, broken by two landings
export const STAIRS = { n: 30, rise: 0.3, tread: 0.75, land: 3.75, z0: -400, zTop: -430.2 };
export const stairZ = (i) => (i >= STAIRS.n ? STAIRS.zTop : STAIRS.z0 - STAIRS.tread * i - STAIRS.land * Math.floor(i / 10));   // the front edge of step i (its top lies at rise * (i + 1))
// a lamp in the middle of each landing, either side
export const STAIR_LAMPS = { x: 10.5, z0: (stairZ(9) + stairZ(10)) / 2 - 0.4, dz: stairZ(9) - stairZ(19), n: 2, y0: STAIRS.rise * 10, dy: STAIRS.rise * 10 };
export const WALL_LAMPS = { x0: 34, dx: 24, n: 7, z: -432.4, s: 0.8 };
export function stoneMaterial(SH, o = {}) {
  const mirror = !!o.mirror;
  return new THREE.ShaderMaterial({
    uniforms: { ...SH, uMirrorY: { value: o.mirrorY ?? WATER_Y } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
uniform float uMirrorY;
attribute vec3 color; attribute float aGlow;
varying vec3 vCol, vN, vW, vL; varying float vGlow;
void main(){
  vec3 lp = position, n = normal;
  #ifdef USE_INSTANCING
  lp = (instanceMatrix*vec4(lp, 1.0)).xyz; n = mat3(instanceMatrix)*n;
  #endif
  vec4 wp = modelMatrix*vec4(lp, 1.0);
  vL = wp.xyz; vN = n;
  ${mirror ? /* glsl */`
  float dep = max(uMirrorY - wp.y, 0.0);
  wp.x += (0.10 + 0.012*dep)*sin(wp.y*1.9 + uTime*1.7 + wp.z*0.3) + 0.25*sin(wp.y*0.45 - uTime*0.9);
  wp.z += 0.08*sin(wp.y*2.3 - uTime*1.3);
  vL.y = 2.0*uMirrorY - vL.y;` : ''}
  vW = wp.xyz; vCol = color; vGlow = aGlow;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
${BS_NOISE}
uniform vec3 uPoolCol;
varying vec3 vCol, vN, vW, vL; varying float vGlow;
// where the ray mirrored in the house floor meets a pillar of the row x = xr (1e4: nowhere)
// (x: how far along the ray, y: how much of the pillar covers it)
vec2 rowHit(vec3 p, vec3 Rr, float xr, float reach){
  float t = (xr - p.x)/(abs(Rr.x) < 1e-3 ? (Rr.x < 0.0 ? -1e-3 : 1e-3) : Rr.x);
  float zh = p.z + t*Rr.z, yh = t*Rr.y;
  float k = clamp(floor((-448.5 - zh)/7.0 + 0.5), 0.0, 9.0);
  float w = 1.05*length(Rr.xz)/max(abs(Rr.x), 0.08);
  float cov = (1.0 - smoothstep(0.55*w, w, abs(zh - (-448.5 - 7.0*k))))*(1.0 - smoothstep(11.0, 16.0, yh))*step(0.3, t);
  // polished stone is no looking-glass: the image of a pillar is strongest at its foot and is gone 5 m from it
  // (metres along the floor from the foot of the pillar to this place on the floor; the eye has no part in it);
  // wine is one: a pool carries the pillars that stand along it (reach: 5 m on stone, 60 m in a pool)
  cov *= 1.0 - smoothstep(0.0, reach, t*length(Rr.xz));
  return vec2(t, cov);
}
vec3 lampAt(vec3 p, vec3 N, vec3 lp, float power){
  vec3 L = lp - p; float d2 = dot(L, L); L *= inversesqrt(d2 + 1e-4);
  return uGold*power*clamp(dot(N, L)*0.85 + 0.15, 0.0, 1.0)/(d2 + 5.0);
}
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) N = -N;
  ${mirror ? 'N.y = -N.y;' : ''}
  vec3 Vv = cameraPosition - vW; float d = length(Vv);
  vec3 p = vL; float fp = max(length(dFdx(p)), length(dFdy(p))) + 1e-4;
  vec3 alb = vCol;
  float up = smoothstep(0.75, 0.95, N.y), wallF = 1.0 - smoothstep(0.2, 0.5, abs(N.y));
  // paving: square tiles 2.4 m, every other one a shade darker, fine joints
  vec2 tq = p.xz/2.4; vec2 tf = abs(fract(tq) - 0.5), ti = floor(tq);
  float joint = smoothstep(0.47 - fp*0.4, 0.5, max(tf.x, tf.y));
  float fadeT = 1.0 - smoothstep(0.5, 2.5, fp);
  // (the floor of the crystal house, from the lip of the stairs to the canal, is one polished dark stone: its joints barely show)
  float inH = step(p.z, -430.2)*step(-515.0, p.z)*step(abs(p.x), 22.0)*step(abs(p.y - ${FLOOR_Y.toFixed(1)}), 0.05)*up;
  alb *= 1.0 - up*fadeT*(1.0 - 0.8*inH)*(0.16*joint + 0.07*mod(ti.x + ti.y, 2.0) + 0.05*bsH(ti));
  alb *= 1.0 - 0.42*inH;
  // walls: courses 1.6 m high, long weather streaks below ledges, a little lichen-grey mottling
  float hx = p.x + p.z;
  float course = smoothstep(0.44 - fp*0.3, 0.5, abs(fract(p.y/1.6) - 0.5));
  float streak = bsN(vec2(hx*1.3, p.y*0.12))*bsN(vec2(hx*0.21, 3.0));
  alb *= 1.0 - wallF*((0.15*course)*(1.0 - smoothstep(0.3, 1.5, fp)) + 0.22*streak*(1.0 - smoothstep(1.0, 6.0, fp)));
  alb *= 0.9 + 0.2*bsF2(vec2(hx, p.y)*0.11 + 4.0);
  // the shore's stone keeps the marks of the sea that is gone: what it covered is a shade darker and greener, with
  // three old waterlines; a carved band of rings runs under the string course of the sea wall, and between the
  // pilasters a round-headed niche holds a small fire
  float shoreS = wallF*step(-432.5, p.z), fadeW = 1.0 - smoothstep(0.6, 3.0, fp);
  float tl = p.y + 0.5*bsN(vec2(hx*0.15, 1.0)) + 0.15*bsN(vec2(hx*1.1, 5.0));
  float tide = (1.0 - smoothstep(0.0, 0.3, abs(tl - 6.4))) + 0.7*(1.0 - smoothstep(0.0, 0.26, abs(tl - 5.0))) + 0.5*(1.0 - smoothstep(0.0, 0.22, abs(tl - 3.3)));
  float below = 1.0 - smoothstep(6.1, 6.9, tl);
  alb *= 1.0 - shoreS*(0.22*tide*fadeW + 0.16*below);
  alb = mix(alb, alb*vec3(0.84, 0.97, 0.9), shoreS*0.6*below);
  float seaW = shoreS*step(p.z, -428.4)*step(22.3, abs(p.x))*smoothstep(0.5, 0.8, abs(N.z));
  float frz = abs(fract(p.x/1.5) - 0.5)*1.5, fy = (p.y - 7.3)/0.42, ring = abs(length(vec2(frz, fy*0.42)) - 0.3);
  float band = step(abs(fy), 1.0)*((1.0 - smoothstep(0.03, 0.09 + fp, ring)) + (1.0 - smoothstep(0.03, 0.1, abs(abs(fy) - 0.9))));
  alb *= 1.0 - seaW*0.3*clamp(band, 0.0, 1.0)*(1.0 - smoothstep(0.1, 0.6, fp));
  float nx = mod(abs(p.x) - 28.0, 12.0) - 6.0, ny = p.y - 2.6;
  float nd = ny < 2.4 ? abs(nx) : length(vec2(nx, ny - 2.4));
  float niche = seaW*(1.0 - smoothstep(0.86, 0.94 + fp, nd))*step(0.0, ny), nfl = length(vec2(nx, (ny - 0.5)*0.8));
  alb *= 1.0 - 0.7*niche;
  // the towers are turned stone, lightly fluted: shallow vertical grooves that catch the raking light
  float tower = step(vGlow, -0.5)*wallF*(1.0 - smoothstep(0.15, 0.7, fp));
  vec3 Tn = normalize(vec3(-N.z, 0.0, N.x) + vec3(1e-5, 0.0, 0.0));
  N = normalize(N + Tn*0.16*tower*cos(hx*5.6));
  alb *= 1.0 - 0.05*tower*(0.5 + 0.5*sin(hx*5.6));
  vec3 c = alb*bsLight(N);
  // light that comes back off the lit sand onto the sea wall and the stairs, and off the basin onto the tiers
  c += alb*(uKeyCol*0.34 + uSkyCol*0.5)*clamp(N.z, 0.0, 1.0)*(0.45 + 0.55*smoothstep(-470.0, -432.0, p.z));
  vec2 bq = p.xz - vec2(${BASIN.x.toFixed(1)}, ${BASIN.z.toFixed(1)}); float bl = length(bq);
  c += alb*(uSkyCol*0.6 + uMoonCol*0.32)*clamp(dot(N.xz, -bq/max(bl, 1e-3)), 0.0, 1.0)*(1.0 - smoothstep(60.0, 130.0, bl))*step(p.z, -700.0);
  // and off the pale terraces onto the walls of the terraces above them, so no wall on the shaded side stands dark
  c += alb*(uSkyCol*0.9 + uKeyCol*0.5 + uGold*0.32)*wallF*smoothstep(52.0, 62.0, abs(p.x))*step(p.z, -440.0);
  // lamplight: the nearest two lamps of the canal row on this side, the nearest avenue lamp, the nearest basin lamp
  vec3 Lg = vec3(0.0); float sx = p.x < 0.0 ? -1.0 : 1.0;
  float kf = (${LAMP_ROW.z0.toFixed(1)} - p.z)/${LAMP_ROW.dz.toFixed(1)}, kq = clamp(floor(kf + 0.5), 0.0, ${(LAMP_ROW.n - 1).toFixed(1)});
  float kq2 = clamp(kq + (kf > kq ? 1.0 : -1.0), 0.0, ${(LAMP_ROW.n - 1).toFixed(1)});
  Lg += lampAt(p, N, vec3(sx*${LAMP_ROW.x.toFixed(1)}, ${LAMP_ROW.y.toFixed(1)}, ${LAMP_ROW.z0.toFixed(1)} - ${LAMP_ROW.dz.toFixed(1)}*kq), 24.0);
  Lg += lampAt(p, N, vec3(sx*${LAMP_ROW.x.toFixed(1)}, ${LAMP_ROW.y.toFixed(1)}, ${LAMP_ROW.z0.toFixed(1)} - ${LAMP_ROW.dz.toFixed(1)}*kq2), 24.0)*step(0.5, abs(kq2 - kq));
  float ka = clamp(floor((${AVENUE_LAMPS.z0.toFixed(1)} - p.z)/${AVENUE_LAMPS.dz.toFixed(1)} + 0.5), 0.0, ${(AVENUE_LAMPS.n - 1).toFixed(1)});
  Lg += lampAt(p, N, vec3(sx*${AVENUE_LAMPS.x.toFixed(1)}, ${LAMP_ROW.y.toFixed(1)}, ${AVENUE_LAMPS.z0.toFixed(1)} - ${AVENUE_LAMPS.dz.toFixed(1)}*ka), 24.0);
  float ba = atan(bq.x, -bq.y + 1e-5), bi = floor(ba/6.2832*${RING_LAMPS.n.toFixed(1)}), baa = (bi + 0.5)/${RING_LAMPS.n.toFixed(1)}*6.2832;
  vec3 blp = vec3(sin(baa)*${RING_LAMPS.r.toFixed(1)}, ${LAMP_ROW.y.toFixed(1)}, ${BASIN.z.toFixed(1)} - cos(baa)*${RING_LAMPS.r.toFixed(1)});
  Lg += lampAt(p, N, blp, 24.0)*step(${RING_LAMPS.gap.toFixed(1)}, abs(blp.x));
  // the small lamps of the tiers, the standards up the water stairs and along the sea wall
  float tm = clamp(floor((bl - ${TIER_LAMPS.r0.toFixed(1)})/${TIER_LAMPS.dr.toFixed(1)} + 0.5), 0.0, ${(TIER_LAMPS.rows - 1).toFixed(1)}), todd = mod(tm, 2.0);
  float ta = (floor(ba/${TIER_LAMPS.da.toFixed(2)} + 0.5*todd) + 0.5 - 0.5*todd)*${TIER_LAMPS.da.toFixed(2)}, trl = ${TIER_LAMPS.r0.toFixed(1)} + ${TIER_LAMPS.dr.toFixed(1)}*tm;
  vec3 tlp = vec3(sin(ta)*trl, ${(TIER_LAMPS.y0 + 5 * TIER_LAMPS.s).toFixed(2)} + ${TIER_LAMPS.dy.toFixed(1)}*tm, ${BASIN.z.toFixed(1)} - cos(ta)*trl);
  Lg += lampAt(p, N, tlp, 10.0)*step(${TIER_LAMPS.clear.toFixed(1)}, abs(tlp.x))*step(abs(ta), ${TIER_LAMPS.amax.toFixed(2)})*step(46.0, bl)*step(p.z, ${BASIN.z.toFixed(1)});
  float ks = clamp(floor((${STAIR_LAMPS.z0.toFixed(1)} - p.z)/${STAIR_LAMPS.dz.toFixed(1)} + 0.5), 0.0, ${(STAIR_LAMPS.n - 1).toFixed(1)});
  Lg += lampAt(p, N, vec3(sx*${STAIR_LAMPS.x.toFixed(1)}, ${(STAIR_LAMPS.y0 + 5).toFixed(1)} + ${STAIR_LAMPS.dy.toFixed(1)}*ks, ${STAIR_LAMPS.z0.toFixed(1)} - ${STAIR_LAMPS.dz.toFixed(1)}*ks), 24.0)*step(-431.0, p.z);
  float kw = clamp(floor((abs(p.x) - ${WALL_LAMPS.x0.toFixed(1)})/${WALL_LAMPS.dx.toFixed(1)} + 0.5), 0.0, ${(WALL_LAMPS.n - 1).toFixed(1)});
  Lg += lampAt(p, N, vec3(sx*(${WALL_LAMPS.x0.toFixed(1)} + ${WALL_LAMPS.dx.toFixed(1)}*kw), ${(QUAY_Y + 5 * WALL_LAMPS.s).toFixed(1)}, ${WALL_LAMPS.z.toFixed(1)}), 18.0)*step(-446.0, p.z);
  // and the portal's own pale light on the landing, the aisle and the feet of the two tall towers
  vec3 PL = vec3(0.0, 17.0, -809.0) - p; float pd2 = dot(PL, PL); PL *= inversesqrt(pd2 + 1e-4);
  Lg += vec3(0.62, 0.76, 1.0)*70.0*clamp(dot(N, PL)*0.8 + 0.2, 0.0, 1.0)/(pd2 + 70.0);
  c += alb*Lg;
  // the afterglow grazes the stone: a faint rose sheen where the surface turns toward it
  float rim = clamp(dot(N, uKeyDir), 0.0, 1.0);
  c += alb*uKeyCol*0.25*rim*rim;
  // the crystal house has a polished floor: it takes the gold of the fruit along the screens, and mirrors the
  // pillars, the screens' fruit and the dusk above
  // the niches' fires, and their light on the stone round them
  c += uGold*(1.7*niche*exp(-nfl*nfl*1.6) + 0.5*seaW*alb/(1.0 + 0.7*nd*nd)*step(-2.0, ny)*(1.0 - niche));
  if (inH > 0.5) {
    c += alb*uGold*0.5*exp(-abs(abs(p.x) - 19.0)/3.0);
    // five long shallow pools lie either side of the rill, in the bays between the inner pillars
    vec2 pq = vec2((abs(p.x) - 4.7)/2.3, (mod(-p.z - 445.0, 14.0) - 7.0)/5.2); pq *= pq;
    float pr = sqrt(sqrt(pq.x*pq.x + pq.y*pq.y + 1e-6)), inZ = step(p.z, -445.0)*step(-515.0, p.z);
    float pool = (1.0 - smoothstep(0.94, 1.0, pr))*inZ, rimP = (1.0 - smoothstep(0.0, 0.07, abs(pr - 1.05)))*inZ;
    vec2 wob = (vec2(bsN(p.xz*2.3 + vec2(uTime*0.3, 0.0)), bsN(p.xz*2.3 + vec2(7.0, uTime*0.27))) - 0.5)*0.07*pool;
    // the pools hold wine, as the canal does: dark, with small quick ripples that break up what they mirror, and a
    // bright meniscus where the wine meets the stone
    wob += (vec2(bsN(p.xz*7.1 + vec2(-uTime*0.7, uTime*0.4)), bsN(p.xz*7.1 + vec2(3.0 + uTime*0.5, uTime*0.8))) - 0.5)*0.1*pool*fadeT;
    c = mix(c, uPoolCol*(vec3(0.26) + uMoonCol*0.2 + uGold*0.08), pool) + alb*(uSkyCol*0.5 + uMoonCol*0.4 + uGold*0.2)*rimP*0.6;
    vec3 Rr = reflect(-Vv/max(d, 1e-3), normalize(vec3(wob.x, 1.0, wob.y)));
    float rch = mix(5.0, 60.0, pool);
    vec2 h1 = rowHit(p, Rr, -9.0, rch), h2 = rowHit(p, Rr, 9.0, rch), h3 = rowHit(p, Rr, -20.0, rch), h4 = rowHit(p, Rr, 20.0, rch);
    float cov = max(max(h1.y, h2.y), max(h3.y, h4.y));
    float tb = h1.y > 0.5 ? h1.x : (h2.y > 0.5 ? h2.x : (h3.y > 0.5 ? h3.x : (h4.y > 0.5 ? h4.x : 1e4)));
    float ry = clamp(Rr.y, 0.0, 1.0), om = 1.0 - ry, Ff = 0.05 + 0.95*om*om*om*om*om;
    vec3 refl = mix(uFog.rgb*1.15, uSkyCol*0.45, clamp(Rr.y*1.3, 0.0, 1.0));
    refl = mix(refl, dot(refl, vec3(0.3333))*(uPoolCol/max(dot(uPoolCol, vec3(0.3333)), 0.02)*0.2 + 0.03), 0.9*pool);       // (a pool gives the sky back dark, in its wine's colour; the moon, the pillars and the fruit keep their own light in it)
    float mo = clamp(dot(Rr, uMoonDir), 0.0, 1.0); mo *= mo; mo *= mo; mo *= mo; mo *= mo; mo *= mo;
    refl += uMoonCol*1.2*mo*mo;
    vec3 pilc = vec3(0.26, 0.36, 0.82)*(0.7 + 0.4*sin(p.z*0.9 + p.x*0.7)) + uKeyCol*0.12;
    // the crystal walls behind the outer rows, then the pillars before them, then the fruit as gold lights in the polish
    float ts = (sign(Rr.x)*20.0 - p.x)/(abs(Rr.x) < 1e-3 ? 1e-3 : Rr.x);
    vec2 sc = vec2(p.z + ts*Rr.z, ts*Rr.y);
    float wallHit = step(0.0, ts)*step(sc.y, 12.5)*step(sc.x, -449.0)*step(-512.0, sc.x);
    wallHit *= 1.0 - smoothstep(0.0, 6.0, ts*length(Rr.xz));       // (the wall's image, too, dies 6 m along the floor from the wall's foot)
    refl = mix(refl, vec3(0.13, 0.19, 0.46)*(0.8 + 0.4*bsH(floor(sc*0.42))) + uGold*0.05, 0.6*wallHit);
    refl = mix(refl, pilc, cov*(1.0 - 0.3*pool));       // (in a pool the wine's dark shows through the pillars' image)
    float fr = bsH(floor(sc*1.1));
    refl += uGold*1.8*step(0.84, fr)*(1.0 - smoothstep(0.1, 0.4, length(fract(sc*1.1) - 0.5)))*step(ts, tb)*step(sc.y, 11.5)*step(sc.x, -449.0)*step(-512.0, sc.x);
    float gloss = (0.85 + 0.15*bsH(ti + 7.0))*(1.0 - 0.8*joint*fadeT)*(1.0 - rimP);       // (matt in the joints of the paving and on the pools' rims)
    c = mix(c, refl, mix(clamp((0.34 + 0.6*Ff)*gloss, 0.0, 0.9), clamp(0.3 + 0.6*Ff, 0.0, 0.9), pool));
    // a few glints move on the wine; it lies a little below its kerb, so a dark wetted band of stone shows all
    // round it, and a bright meniscus where the wine meets that stone
    c += (uMoonCol*0.5 + uGold*0.3)*0.5*smoothstep(0.86, 0.97, bsN(p.xz*5.3 + vec2(uTime*0.6, -uTime*0.45)))*pool*fadeT;
    c *= 1.0 - 0.62*smoothstep(0.95, 0.965, pr)*(1.0 - smoothstep(1.0, 1.015, pr))*inZ;
    c += (uSkyCol*0.5 + uMoonCol*0.5 + uGold*0.25)*0.5*(1.0 - smoothstep(0.0, 0.012, abs(pr - 0.945)))*inZ;
  }
  // an inlaid border along each quay: two dark lines and a chain of lozenges between them
  float onQ = up*step(p.z, -517.0)*step(-706.0, p.z)*step(abs(p.y - ${QUAY_Y.toFixed(1)}), 0.3);
  float ax = abs(p.x), bw = fp*0.7;
  float lines = (1.0 - smoothstep(0.1, 0.14 + bw, abs(ax - 10.3))) + (1.0 - smoothstep(0.1, 0.14 + bw, abs(ax - 12.9)));
  float loz = 1.0 - smoothstep(0.5, 0.56 + bw, abs(ax - 11.6) + abs(fract(p.z/2.6) - 0.5)*2.2);
  c *= 1.0 - onQ*(1.0 - smoothstep(0.6, 3.0, fp))*0.42*clamp(lines + loz, 0.0, 1.0);
  c += vCol*max(vGlow, 0.0);
  ${mirror ? 'c *= vec3(0.5, 0.42, 0.5);' : ''}
  gl_FragColor = vec4(bsFog(max(c, 0.0), d), 1.0);
}`,
  });
}

// ---------------------------------------------------------------- lathe helpers
// prof: [[radius, y], ...] bottom to top; a closed solid of revolution about (cx, *, cz)
export function lathe(A, prof, cx, y0, cz, sides, colAt, a0 = 0, a1 = Math.PI * 2, glow = 0) {
  const rings = [], full = a1 - a0 > 6.28;
  for (let j = 0; j < prof.length; j++) {
    const ring = [], n = full ? sides : sides + 1;
    for (let k = 0; k < n; k++) {
      const a = a0 + (a1 - a0) * k / sides;
      ring.push([cx + Math.sin(a) * prof[j][0], y0 + prof[j][1], cz - Math.cos(a) * prof[j][0], colAt(j, a), glow]);
    }
    rings.push(ring);
  }
  loft(A, rings, full, false);
}
// the six turned profiles, as [radius (of base radius), height (of height)]
export const PROFILES = [
  // 0 a drum with a broad collar and a domed cap with a knob
  [[1.0, 0], [1.02, 0.035], [0.86, 0.06], [0.8, 0.3], [0.78, 0.62], [1.08, 0.655], [1.08, 0.7], [0.76, 0.72], [0.72, 0.86], [0.9, 0.885], [0.92, 0.91], [0.7, 0.935], [0.34, 0.97], [0.2, 0.975], [0.26, 0.99], [0, 1.0]],
  // 1 a waisted vase with a collar and a round head
  [[1.0, 0], [1.04, 0.04], [0.8, 0.09], [0.52, 0.3], [0.42, 0.56], [0.46, 0.67], [0.84, 0.705], [0.86, 0.735], [0.46, 0.76], [0.44, 0.79], [0.72, 0.84], [0.84, 0.9], [0.72, 0.955], [0.4, 0.992], [0, 1.0]],
  // 2 a stepped spool
  [[1.08, 0], [1.08, 0.06], [0.72, 0.1], [0.68, 0.3], [0.94, 0.33], [0.94, 0.38], [0.62, 0.41], [0.58, 0.64], [0.9, 0.675], [0.9, 0.72], [0.56, 0.75], [0.52, 0.9], [0.78, 0.93], [0.8, 0.965], [0.5, 0.99], [0, 1.0]],
  // 3 a tall flute with a ring and a ball
  [[0.94, 0], [0.96, 0.03], [0.62, 0.08], [0.44, 0.5], [0.36, 0.76], [0.56, 0.785], [0.56, 0.805], [0.3, 0.825], [0.62, 0.865], [0.8, 0.915], [0.62, 0.965], [0.28, 0.995], [0, 1.0]],
  // 4 a bud on a ringed stem
  [[0.86, 0], [0.9, 0.04], [0.64, 0.1], [0.5, 0.4], [0.46, 0.57], [0.74, 0.6], [0.76, 0.63], [0.5, 0.655], [0.78, 0.75], [0.98, 0.83], [0.86, 0.92], [0.5, 0.975], [0.16, 0.995], [0, 1.0]],
  // 5 a crowned shaft
  [[1.0, 0], [1.0, 0.05], [0.74, 0.09], [0.58, 0.45], [0.54, 0.76], [0.98, 0.8], [1.0, 0.84], [0.62, 0.86], [0.56, 0.905], [0.86, 0.955], [0.98, 0.985], [0.7, 1.0], [0, 1.0]],
];
export function profileRadius(kind, t) {
  const p = PROFILES[kind];
  for (let j = 0; j < p.length - 1; j++) if (t >= p[j][1] && t <= p[j + 1][1]) { const k = (t - p[j][1]) / Math.max(p[j + 1][1] - p[j][1], 1e-5); return p[j][0] + (p[j + 1][0] - p[j][0]) * k; }
  return p[p.length - 1][0];
}
// one tower into the accumulator. tw: { x, y, z, r, h, kind }
export function addTower(A, tw, sides) {
  const white = lin('#EDE8DF'), shade = lin('#CFC7C9'), warm = lin('#F2E6D8');
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const src = PROFILES[tw.kind], prof = [];
  // refine the profile so curves are round and ledges keep their edges; on the long plain runs of a near tower
  // a ring balcony with a low parapet is turned into the shaft (a place for people, and a measure of its size)
  tw.balconies = [];
  for (let j = 0; j < src.length; j++) {
    prof.push([src[j][0] * tw.r, src[j][1] * tw.h]);
    if (j < src.length - 1 && sides > 10) {
      const y0 = src[j][1] * tw.h, dy = (src[j + 1][1] - src[j][1]) * tw.h, r0 = src[j][0] * tw.r, dr = (src[j + 1][0] - src[j][0]) * tw.r, n = Math.min(4, Math.floor(dy / 7));
      const stops = []; for (let q = 1; q <= n; q++) stops.push({ t: q / (n + 1) });
      if (sides >= 20 && dy > 9 && Math.abs(dr) < 0.16 * dy && r0 > 1.2) for (const tb of (dy > 24 ? [0.3, 0.72] : [0.5])) {
        for (let q = stops.length - 1; q >= 0; q--) if (Math.abs(stops[q].t - tb) * dy < 2.2) stops.splice(q, 1);
        stops.push({ t: tb, balcony: true });
      }
      stops.sort((a, b) => a.t - b.t);
      for (const st of stops) {
        const r = r0 + dr * st.t, y = y0 + dy * st.t;
        if (!st.balcony) { prof.push([r, y]); continue; }
        const out = Math.min(1.0, 0.45 + 0.12 * tw.r);
        prof.push([r, y], [r + out, y + 0.12], [r + out, y + 1.15], [r + out - 0.16, y + 1.15], [r + out - 0.16, y + 0.42], [r, y + 0.42]);
        tw.balconies.push({ y: tw.y + y + 0.42, r: r + out * 0.5 });
      }
    }
  }
  const tone = 0.72 * (0.9 + 0.2 * ((tw.x * 0.37 + tw.z * 0.11) % 1 + 1) % 1);
  lathe(A, prof, tw.x, tw.y, tw.z, sides, (j) => {
    const t = prof[j][1] / tw.h, led = j > 0 && Math.abs(prof[j][0] - prof[j - 1][0]) > 0.08 * tw.r ? 0.06 : 0;
    const c = mixc(mixc(shade, white, 0.35 + 0.65 * t), warm, 0.2);
    return [c[0] * (tone + led), c[1] * (tone + led), c[2] * (tone + led)];
  }, 0, Math.PI * 2, -1);
}

// ---------------------------------------------------------------- shore: sea wall, water stairs, jetties, posts
const STONE = lin('#E6E0D6'), STONE2 = lin('#D5CCC9'), PAVE = lin('#D8CEC6');
const k7 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
export const JETTIES = [-103, -45, 45, 103], POSTS_X = [-170, -130, -95, -63, -7.5, 7.5, 74, 111, 142, 185];
// banner masts on the sea wall: one each side of the head of the stairs and of every jetty's root
export const BANNER_MASTS = [[-23.6, -432.6], [23.6, -432.6], ...JETTIES.flatMap((x) => [[x - 4.7, -432.6], [x + 4.7, -432.6]])], MAST_H = 13;
function buildShore(A, rng, out, marks = []) {
  const W = k7(STONE, 0.74), W2 = k7(STONE2, 0.7);
  // the wall, 9.6 m high and 600 m long; its middle 44 m stand 0.6 m lower, where the stairs come up
  box(A, -187, QUAY_Y / 2, -434.5, 330, QUAY_Y, 9, W); box(A, 187, QUAY_Y / 2, -434.5, 330, QUAY_Y, 9, W);
  for (const s of [-1, 1]) box(A, s * 11.5, FLOOR_Y / 2 - 0.05, -434.5, 21, FLOOR_Y - 0.1, 9, W);
  box(A, 0, 4.05, -434.5, 2, 8.1, 9, k7(STONE2, 0.4));              // (the rill's channel runs out through it to the lip)
  // pilasters every 12 m under the parapet blocks, a heavier coping; in each bay between them the shader cuts a niche
  // with a small fire in it (a glow hangs in each)
  for (const s of [-1, 1]) for (let i = 0; i < 27; i++) {
    box(A, s * (28 + i * 12), (QUAY_Y - 1.5) / 2, -429.75, 1.7, QUAY_Y - 1.5, 0.7, W2);
    const nx = 34 + i * 12;
    if (i < 17 && !JETTIES.some((j) => Math.abs(Math.abs(j) - nx) < 4.5)) { out.lamps.push([s * nx, 3.25, -429.7]); out.lampSizes[out.lamps.length - 1] = 0.5; }
  }
  box(A, -187, QUAY_Y - 0.12, -429.7, 330, 0.24, 0.9, W); box(A, 187, QUAY_Y - 0.12, -429.7, 330, 0.24, 0.9, W);
  // a string course and a low parapet with gaps
  box(A, -187, QUAY_Y - 1.5, -429.8, 330, 0.5, 0.5, W2); box(A, 187, QUAY_Y - 1.5, -429.8, 330, 0.5, 0.5, W2);
  for (const s of [-1, 1]) for (let i = 0; i < 27; i++) box(A, s * (28 + i * 12), QUAY_Y + 0.45, -430.6, 9.2, 0.9, 0.7, W);
  // water stairs: thirty steps in three flights with two landings, 40 m wide, a channel 2 m wide down the middle;
  // the landings and every flight's first step are of the darker stone
  for (let i = 0; i < STAIRS.n; i++) {
    const y = STAIRS.rise * (i + 1), z0 = stairZ(i), c = k7(i % 10 === 9 || i % 10 === 0 ? STONE2 : STONE, i % 10 === 9 ? 0.66 : 0.72);
    for (const s of [-1, 1]) box(A, s * 10.5, y - 0.3, (z0 - 430.2) / 2, 19, 0.6, 430.2 + z0, c);
    if (y > 1.2) box(A, 0, y - 1.2, (z0 - 430.2) / 2, 2, 0.6, 430.2 + z0, k7(STONE2, 0.5));
  }
  for (const s of [-1, 1]) {
    const x0 = s * 20, x1 = s * 22.2, a = Math.min(x0, x1), b = Math.max(x0, x1);
    loft(A, [[[a, 0, -398.5, W], [b, 0, -398.5, W], [b, 1.2, -398.5, W], [a, 1.2, -398.5, W]], [[a, 0, -430.4, W], [b, 0, -430.4, W], [b, 10.3, -430.4, W], [a, 10.3, -430.4, W]]], true, true);
    box(A, s * 21.1, 0.9, -397.6, 3.2, 1.8, 2.6, W2);
    lathe(A, [[1.0, 0], [1.0, 0.25], [0.6, 0.5], [0.6, 2.2], [0.95, 2.5], [0.6, 2.9], [0, 3.0]], s * 21.1, 1.8, -397.6, 10, () => W);
    out.lamps.push([s * 21.1, 1.8 + 3.5, -397.6]);
  }
  // four dry jetties, 58 m long, with a round head and a lamp at the end of each
  for (const x of JETTIES) {
    box(A, x, 4.5, -401, 5, 9.0, 58, W); box(A, x, 9.2, -401, 5.8, 0.5, 58.4, W2);
    lathe(A, [[2.9, 0], [2.9, 8.9], [3.3, 9.0], [3.3, 9.5], [0, 9.5]], x, 0, -372, 14, () => W);
    lathe(A, [[0.5, 0], [0.5, 0.08], [0.12, 0.2], [0.1, 0.6], [0.3, 0.7], [0.62, 0.98], [0.56, 0.98], [0.25, 0.78], [0, 0.76]], x, 9.5, -372, 8, () => k7(lin('#8C6B3E'), 0.8));
    ball(A, x, 9.5 + 3.6, -372, 0.36, lin('#FFC46A'), 3.2, 5, 1.18);        // (a globe of fire hanging over its cup, as in the town)
    out.lamps.push([x, 9.5 + 3.6, -372]);
    for (let i = 0; i < 5; i++) box(A, x, 2.2 + (i % 2) * 2.4, -382 - i * 10, 5.5, 0.35, 0.8, W2);
  }
  const BR = k7(lin('#8C6B3E'), 0.8);
  for (const [x, z] of BANNER_MASTS) lathe(A, [[0.32, 0], [0.32, 0.3], [0.15, 0.6], [0.08, MAST_H], [0.2, MAST_H + 0.15], [0, MAST_H + 0.4]], x, QUAY_Y, z, 6, () => BR);
  // old sea-marks along the fairway the fleet comes in by: low worn stumps, each with a small lamp in a bronze cup
  for (const m of marks) {
    const r = m.r, h = m.h, c = k7(STONE2, 0.6 + 0.12 * (m.tone ?? 0.5));
    lathe(A, [[r * 1.5, 0], [r * 1.3, 0.3], [r, 0.6], [r * 0.86, h * 0.78], [r * 1.22, h * 0.85], [r * 1.22, h * 0.93], [r * 0.5, h], [0, h]], m.x, -0.05, m.z, 9, () => c);
    lathe(A, [[0.1, 0], [0.3, 0.18], [0.32, 0.24], [0, 0.24]], m.x, h - 0.05, m.z, 7, () => BR);
    ball(A, m.x, h + 0.36, m.z, 0.17, lin('#FFC46A'), 3.2, 4);
    out.lamps.push([m.x, h + 0.36, m.z]); out.lampSizes[out.lamps.length - 1] = 0.45;
  }
  // old mooring posts, 5 m tall, standing on the sand before the wall
  for (const x of POSTS_X) {
    const z = -372 - rng() * 22, h = 4.4 + rng() * 1.2, r = 0.5 + rng() * 0.25, c = k7(STONE2, 0.62 + 0.1 * rng());
    lathe(A, [[r * 1.3, 0], [r * 1.15, 0.5], [r, 0.9], [r * 0.86, h * 0.8], [r * 1.25, h * 0.86], [r * 1.25, h * 0.93], [r * 0.7, h], [0, h]], x, 0, z, 9, () => c);
    out.posts.push([x, h, z, r]);
  }
}

// ---------------------------------------------------------------- ground: house floor, quays, avenues, terraces, tiers
function innerX(z) {                                                 // the edge of the water (or of the house floor) at this z
  if (z > -515) return 22;
  const dz = z - BASIN.z, bite = Math.abs(dz) < BASIN.r ? Math.sqrt(BASIN.r * BASIN.r - dz * dz) : 0;
  if (z > BASIN.z) return Math.max(7, bite);
  return bite;
}
function buildGround(A, out) {
  const P = k7(PAVE, 0.7), W = k7(STONE, 0.72), W2 = k7(STONE2, 0.66);
  // forecourt and house floor (y 9), with the rill's channel down the middle: one slab from the back edge of the top
  // step of the water stairs (STAIRS.zTop) to the head of the canal (z -515), so no seam crosses the stair head
  for (const s of [-1, 1]) box(A, s * 11.5, FLOOR_Y - 0.5, (STAIRS.zTop - 515) / 2, 21, 1.0, 515 + STAIRS.zTop, P);
  box(A, 0, 7.9, -474.5, 2, 0.4, 81, k7(STONE2, 0.4));
  // quay and avenue strips either side, cut round the basin; their inner faces stop at the water (the mirror lies below)
  const zs = []; for (let z = -432; z > -900.01; z -= 2) zs.push(z);
  zs.push(-514.999, -515.001, -707.5, -783.2); zs.sort((a, b) => b - a);
  for (const s of [-1, 1]) {
    const top = [], wall = [];
    for (const z of zs) {
      const xi = Math.max(innerX(z), 0.0);
      top.push([[s * xi, QUAY_Y, z, P], [s * 60, QUAY_Y, z, P]]);
      wall.push([[s * xi, QUAY_Y, z, W], [s * xi, WATER_Y - 0.02, z, W2]]);
    }
    loft(A, top, false, s > 0); loft(A, wall, false, s < 0);
  }
  // a kerb along each quay
  for (const s of [-1, 1]) box(A, s * 7.3, QUAY_Y + 0.12, -611, 0.6, 0.24, 192, W);
  // THE QUAY HEAD, where the house floor (y 9) meets the canal (z -515; water 0.6 m below, quays 0.6 m above).
  // The rill runs out between two capped cheeks over a spout 1.7 m long and falls into the canal (the water is in the
  // life part); either side of the spout a pale lip edges the floor and three water steps of 0.2 m go down into the
  // canal; two steps of 0.2 m lead up to each quay across the aisle; at each quay's corner stands a newel with a
  // bronze cup and a globe of fire over it (7.5 m either side of our line).
  const HZ = -515, BRZ = k7(lin('#8C6B3E'), 0.8);
  box(A, 0, 8.15, HZ - 0.85, 1.96, 1.1, 1.7, k7(STONE2, 0.4));                    // the spout's bed, under the rill
  for (const s of [-1, 1]) {
    box(A, s * 1.64, 8.5, HZ - 0.35, 1.32, 1.8, 2.7, W); box(A, s * 1.64, 9.47, HZ - 0.35, 1.52, 0.14, 2.9, W2);          // cheek and its cap
    box(A, s * 4.65, FLOOR_Y, HZ + 0.17, 4.8, 0.16, 0.46, W2);                    // the lip
    for (let j = 0; j < 3; j++) box(A, s * 4.65, (7.8 + [8.8, 8.6, WATER_Y + 0.02][j]) / 2, HZ + 0.05 - 0.3 * (j + 1), 4.8, [8.8, 8.6, WATER_Y + 0.02][j] - 7.8, 0.1 + 0.6 * (j + 1), W);
    for (let j = 0; j < 2; j++) box(A, s * 14.5, FLOOR_Y + 0.1 * (j + 1) - 0.05, HZ + 0.575 - 0.3 * j, 15, 0.2 * (j + 1) + 0.1, 1.25 - 0.6 * j, W);
    box(A, s * 7.5, QUAY_Y + 0.35, HZ - 0.5, 1.0, 0.7, 1.0, W);                    // the newel at the quay's corner
    lathe(A, [[0.35, 0], [0.35, 0.06], [0.09, 0.14], [0.07, 0.42], [0.21, 0.49], [0.43, 0.69], [0.39, 0.69], [0.18, 0.55], [0, 0.53]], s * 7.5, QUAY_Y + 0.7, HZ - 0.5, 8, () => BRZ);
    ball(A, s * 7.5, QUAY_Y + 0.7 + 1.3, HZ - 0.5, 0.26, lin('#FFC46A'), 3.2, 5, 1.18);
  }
  // terraces: five more levels a side, each 7 m higher and set 14 m further back from the shore
  for (const s of [-1, 1]) for (let k = 1; k <= 5; k++) {
    const t = TERRACE(k), c = k7(STONE, 0.7 - 0.02 * k);
    box(A, s * (t.x0 + 352) / 2, (t.y + 9) / 2, (t.z0 - 925) / 2, 352 - t.x0, t.y - 9, 925 + t.z0, c);
    if (k === 1) box(A, s * 206, QUAY_Y - 0.3, -439.5, 292, 0.6, 15, P);                                   // the quay level before the first terrace
    box(A, s * (t.x0 + 0.5), t.y + 0.5, (t.z0 - 925) / 2, 1.0, 1.0, 925 + t.z0, k7(STONE2, 0.7));        // parapet
    for (let i = 0; i < 16; i++) box(A, s * (t.x0 - 0.5), (t.y + 9.6) / 2 - 0.3, t.z0 - 14 - i * 30, 1.6, t.y - 9.6 - 0.6, 3.2, W2);      // buttresses
    // a flight of steps up from the level below, every 150 m
    for (let q = 0; q < 3; q++) for (let j = 0; j < 7; j++) box(A, s * (t.x0 - 6.5 + j), t.y - 7 + (j + 1) / 2, -500 - q * 150 - 14 * k, 1.0, j + 1, 5, W);
  }
  // the tiers: twenty rows in a half circle behind the basin, open at the canal side, an aisle to the portal
  const T0 = 48, TD = 1.6, TN = 20, AIS = 9;
  for (let i = 0; i < TN; i++) {
    const r0 = T0 + TD * i, r1 = r0 + TD, y0 = QUAY_Y + i, y1 = y0 + 1, am = Math.asin(AIS / r0), c = k7(i % 2 ? STONE : STONE2, i % 2 ? 0.4 : 0.34);
    for (const [a0, a1] of [[-Math.PI / 2, -am], [am, Math.PI / 2]]) {
      const n = 14, rings = [];
      for (let q = 0; q <= n; q++) {
        const a = a0 + (a1 - a0) * q / n, sx = Math.sin(a), cz = -Math.cos(a);
        rings.push([[BASIN.x + sx * r0, y0, BASIN.z + cz * r0, c], [BASIN.x + sx * r0, y1, BASIN.z + cz * r0, c], [BASIN.x + sx * r1, y1, BASIN.z + cz * r1, c]]);
      }
      loft(A, rings, false, false);
    }
  }
  const zA = BASIN.z - Math.sqrt(T0 * T0 - AIS * AIS), zB = BASIN.z - Math.sqrt(80 * 80 - AIS * AIS), yT = QUAY_Y + TN;
  for (const s of [-1, 1]) {
    // aisle flanks and the south ends of the tiers
    // (each row of seats ends in its own upright face, so the flanks are stepped like the rows)
    for (let i = 0; i < TN; i++) {
      const r0 = T0 + TD * i, r1 = r0 + TD, y1 = QUAY_Y + i + 1, k = Math.sqrt(r0 * r0 - AIS * AIS), k1 = Math.sqrt(r1 * r1 - AIS * AIS), q = r1 / r0, c = k7(STONE2, 0.42);
      quad(A, vtx(A, s * AIS, QUAY_Y, BASIN.z - k, c), vtx(A, s * AIS, QUAY_Y, BASIN.z - k1, c), vtx(A, s * AIS, y1, BASIN.z - k1, c), vtx(A, s * AIS, y1, BASIN.z - k, c));
      A.i.push(vtx(A, s * AIS, y1, BASIN.z - k, c), vtx(A, s * AIS, y1, BASIN.z - k1, c), vtx(A, s * AIS * q, y1, BASIN.z - k * q, c));
      quad(A, vtx(A, s * r0, QUAY_Y, BASIN.z, c), vtx(A, s * r1, QUAY_Y, BASIN.z, c), vtx(A, s * r1, y1, BASIN.z, c), vtx(A, s * r0, y1, BASIN.z, c));
    }
    box(A, s * AIS, yT - 9.4, zB - 1.5, 2.4, 22, 3, W);                          // a pier at the head of the aisle
  }
  // a great round-headed gate-wall of dark stone stands across the head of the aisle, behind the portal, between the
  // two tall towers: 42 m wide, 38 m to its crown, with a pale stone rim; the ring's light lies on it
  const GW = [0.05, 0.048, 0.1], gz0 = -814.6, gz1 = -817.4, GR = 21, grings = [], rim = [];
  for (let i = 0; i <= 28; i++) {
    const x = -GR + 2 * GR * i / 28, yt = 17 + Math.sqrt(Math.max(GR * GR - x * x, 0));
    grings.push([[x, QUAY_Y, gz0, GW], [x, yt, gz0, GW], [x, yt, gz1, GW], [x, QUAY_Y, gz1, GW]]);
  }
  loft(A, grings, true, false);
  for (let i = 0; i <= 28; i++) { const a = Math.PI * i / 28; rim.push([Math.cos(a) * GR, 17 + Math.sin(a) * GR, gz0 - 0.2]); }
  tube(A, [[GR, QUAY_Y, gz0 - 0.2], ...rim, [-GR, QUAY_Y, gz0 - 0.2]], 0.8, 6, W);
  // the back wall of the tiers with a parapet
  lathe(A, [[80, QUAY_Y], [80, yT + 1.2], [81.2, yT + 1.2], [81.2, QUAY_Y]], BASIN.x, 0, BASIN.z, 40, () => k7(STONE2, 0.5), -Math.PI / 2, Math.PI / 2);
  out.tiers = { r0: T0, dr: TD, n: TN, aisle: AIS, yTop: yT };
}
// three slim footbridges over the canal, their crowns at y 21
export const BRIDGES = [-562, -612, -662];
function buildBridges(A) {
  const W = k7(STONE, 0.74), W2 = k7(STONE2, 0.7), SP = 21;
  for (const z of BRIDGES) {
    const rings = [], n = 32, hw = 1.5, yAt = (x) => QUAY_Y + 11.4 * (1 - (x / SP) * (x / SP));
    for (let i = 0; i <= n; i++) {
      const x = -SP + 2 * SP * i / n, q = Math.abs(x) / SP, y = yAt(x), th = 0.34 + 1.5 * q * q * q;
      rings.push([[x, y - th, z - hw, W2], [x, y - th, z + hw, W2], [x, y, z + hw + 0.12, W], [x, y + 0.16, z + hw + 0.12, W], [x, y + 0.16, z - hw - 0.12, W], [x, y, z - hw - 0.12, W]]);
    }
    loft(A, rings, true, false);
    // the rail: slender balusters and a round hand rail on each side
    for (const e of [-1, 1]) {
      const rail = []; for (let i = 0; i <= n; i++) { const x = -SP + 2 * SP * i / n; rail.push([x, yAt(x) + 1.05, z + e * (hw - 0.05)]); }
      tube(A, rail, 0.09, 4, W);
      for (let x = -SP + 0.6; x < SP; x += 1.2) box(A, x, yAt(x) + 0.58, z + e * (hw - 0.05), 0.1, 0.9, 0.1, W2);
    }
    // a slender pier under each haunch, and a round finial at each foot
    for (const s of [-1, 1]) {
      lathe(A, [[0.9, 0], [0.9, 0.5], [0.45, 0.8], [0.45, 2.0], [0.75, 2.5], [0, 3.1]], s * (SP + 0.6), QUAY_Y, z, 8, () => W);
    }
  }
}

// ---------------------------------------------------------------- the towers: where they stand
// 46 towers on six levels a side (6, 5, 4, 3, 3, 2), low by the canal and taller up the terraces, plus the two
// 72 m towers that flank the portal. On the quay level the fifth of each side is the broad drum the canopy
// comes down on. Nothing nearer than 14 m to the path; nothing on the tiers.
export function layoutTowers(rng) {
  const T = [], per = [6, 5, 4, 3, 3, 2], Z0 = [-468, -524, -583, -642, -700, -862];
  for (const side of [-1, 1]) {
    let last = -1;
    for (let k = 0; k < 6; k++) for (let i = 0; i < per[k]; i++) {
      const te = TERRACE(k); let x, z, r, h, kind;
      do { kind = rng.int(0, 5); } while (kind === last); last = kind;
      if (k === 0) {
        z = Z0[i] + rng.range(-5, 5); r = rng.range(3.0, 4.6); x = side * rng.range(27 + r, 50); h = rng.range(24, 46);
        if (i === 4) { x = side * 50; z = -700; r = 8; h = 34.4; kind = 0; }
      } else {
        z = te.z0 - 26 + (-880 - te.z0 + 26) * ((i + 0.5 + rng.range(-0.3, 0.3)) / per[k]);
        r = rng.range(3.4, 6.2); x = side * (te.x0 + r + rng.range(4, 24)); h = rng.range(26, 44) + 4 * k + (rng() < 0.3 ? 12 : 0);
        const dz = z - BASIN.z, dd = Math.hypot(x, dz);
        if (z < -690 && dd < 90 + r) x = side * Math.sqrt(Math.max((90 + r) * (90 + r) - dz * dz, x * x));
      }
      T.push({ x, y: te.y, z, r, h: Math.min(h, 62), kind, k, near: k === 0, drum: k === 0 && i === 4 });
    }
    T.push({ x: side * 24, y: QUAY_Y, z: -835, r: 6.4, h: 72, kind: side < 0 ? 3 : 5, k: 0, near: true, tall: true });
  }
  return T;
}
// windows: rings of slits and round lights up every shaft; [x, y, z, angle, w, h, phase, kind]
export function layoutWindows(rng, towers, pathX = 0) {
  const W = [];
  for (const tw of towers) {
    if (tw.near) {                                                   // a lit doorway at the foot, turned toward the canal, and one or two more round the foot
      const nd = tw.tall || tw.drum ? 3 : 1 + (rng() < 0.5 ? 1 : 0);
      for (let q = 0; q < nd; q++) {
        const a = -Math.sign(tw.x) * Math.PI / 2 + (tw.tall ? (tw.x < 0 ? 1 : -1) * 0.5 : 0) + rng.range(-0.5, 0.5) + q * 2.1, rr = profileRadius(tw.kind, 1.3 / tw.h) * tw.r;
        W.push([tw.x + Math.sin(a) * (rr + 0.06), tw.y + 1.35, tw.z - Math.cos(a) * (rr + 0.06), a, 0.62, 1.3, rng() * 40, 2]);
      }
    }
    const rows = tw.near ? Math.max(4, Math.round(tw.h / 2.6)) : Math.max(3, Math.round(tw.h / 4.5));
    for (let j = 0; j < rows; j++) {
      const t = 0.09 + 0.84 * (j + 0.5) / rows, rr = profileRadius(tw.kind, t) * tw.r, round = rng() < 0.22;
      const slope = Math.abs(profileRadius(tw.kind, t + 0.012) - profileRadius(tw.kind, t - 0.012)) * tw.r / (0.024 * tw.h);
      if (rr < 0.8 || slope > 0.55) continue;                         // none on a ledge or a shoulder
      const n = Math.max(4, Math.round(rr * 6.28 / (round ? 3.6 : 1.9))), a0 = rng() * 6.28, lit = 0.3 + 0.5 * rng();
      for (let q = 0; q < n; q++) {
        if (rng() > lit) continue;
        const a = a0 + q / n * 6.28, w = round ? 0.26 + 0.1 * rng() : 0.11 + 0.05 * rng(), h = round ? w : 0.5 + 0.45 * rng();
        W.push([tw.x + Math.sin(a) * (rr + 0.05), tw.y + t * tw.h, tw.z - Math.cos(a) * (rr + 0.05), a, w * (tw.near ? 1 : 1.5), h * (tw.near ? 1 : 1.4), rng() * 40, round ? 1 : 0]);
      }
    }
  }
  return W;
}
export function windowMesh(SH, W, o = {}) {
  const n = W.length, P = new Float32Array(n * 4), Q = new Float32Array(n * 4);
  W.forEach((w, i) => { P.set([w[0], w[1], w[2], w[3]], i * 4); Q.set([w[4], w[5], w[6], w[7]], i * 4); });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(P, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(Q, 4)); g.instanceCount = n;
  const mirror = !!o.mirror;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...SH, uLit: { value: o.lit ?? 1 } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
attribute vec4 iP, iQ; varying vec2 vQ; varying vec3 vW; varying vec2 vK; varying float vDim;
void main(){
  float a = iP.w; vec3 tg = vec3(cos(a), 0.0, sin(a));
  vec2 sz = max(iQ.xy, vec2(0.7*uPx*length(cameraPosition - iP.xyz)));
  vDim = (iQ.x*iQ.y)/max(sz.x*sz.y, 1e-6);
  vec3 wp = iP.xyz + tg*position.x*sz.x + vec3(0.0, position.y*sz.y, 0.0);
  ${mirror ? /* glsl */`
  wp.y = 2.0*${WATER_Y.toFixed(2)} - wp.y; float dep = max(${WATER_Y.toFixed(2)} - wp.y, 0.0);
  wp.x += (0.10 + 0.012*dep)*sin(wp.y*1.9 + uTime*1.7 + wp.z*0.3) + 0.25*sin(wp.y*0.45 - uTime*0.9);
  wp.z += 0.08*sin(wp.y*2.3 - uTime*1.3);` : ''}
  vQ = position.xy; vW = wp; vK = vec2(iQ.z, iQ.w);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
uniform float uLit;
varying vec2 vQ; varying vec3 vW; varying vec2 vK; varying float vDim;
void main(){
  vec2 wq = clamp(vQ, -1.0, 1.0);                                   // (a varying runs past its range at an antialiased edge)
  float r = vK.y > 1.5 ? max(abs(wq.x), wq.y < 0.45 ? abs(wq.y) : length(vec2(wq.x, (wq.y - 0.45)/0.55))) : (vK.y > 0.5 ? length(wq) : max(abs(wq.x), abs(wq.y)));
  if (vK.y > 0.5 && r > 1.0) discard;
  r = min(r, 1.0);
  // each window wavers on its own, and now and then one dims as someone passes inside
  float fl = 0.82 + 0.18*sin(uTime*(1.3 + fract(vK.x)*2.0) + vK.x*7.0);
  float pass = 1.0 - 0.75*smoothstep(0.93, 0.99, sin(uTime*0.23 + vK.x*3.1));
  float core = 1.0 - 0.55*r*r;
  float warm = fract(vK.x*0.731);
  vec3 c = mix(uGold, vec3(1.0, 0.86, 0.6), 0.35*warm)*(2.6 + 2.0*warm)*core*fl*pass*uLit;
  c *= mix(1.0, clamp(vDim, 0.0, 1.0), 0.6);
  c = mix(c, uFog.rgb, 0.6*bsFogF(length(cameraPosition - vW)));
  ${mirror ? 'c *= 0.55;' : ''}
  gl_FragColor = vec4(max(c, 0.0), 1.0);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- assembly
export async function makeTown(ctx, SH, o = {}) {
  const St = o.streams, group = new THREE.Group(), out = { lamps: [], posts: [], lampSizes: [] };
  const stone = stoneMaterial(SH), mirrorMat = stoneMaterial(SH, { mirror: true });
  const mesh = (A, mat = stone) => { const m = new THREE.Mesh(finish(A), mat); group.add(m); return m; };
  let A = makeAcc(); buildShore(A, St.shore, out, o.marks || []); mesh(A);
  await ctx.yield();
  A = makeAcc(); buildGround(A, out); mesh(A);
  await ctx.yield();
  A = makeAcc(); buildBridges(A); const bridges = mesh(A);
  await ctx.yield();
  const towers = layoutTowers(St.towers);
  // near chunk (quay level and the two tall ones): fine; the terraces: coarser, one chunk a side
  const nearA = makeAcc(); for (const t of towers) if (t.near) addTower(nearA, t, t.tall ? 24 : 20);
  const nearMesh = mesh(nearA);
  await ctx.yield();
  for (const s of [-1, 1]) { const F = makeAcc(); for (const t of towers) if (!t.near && Math.sign(t.x) === s) addTower(F, t, t.k <= 2 ? 16 : 12); mesh(F); await ctx.yield(); }
  const wins = layoutWindows(St.windows, towers);
  group.add(windowMesh(SH, wins, { lit: o.windows ?? 1 }));
  await ctx.yield();
  // the mirror: the near towers, the bridges and their windows again, upside down under the water
  const mir = new THREE.Group(); mir.scale.y = -1; mir.position.y = 2 * WATER_Y;
  mir.add(new THREE.Mesh(nearMesh.geometry, mirrorMat), new THREE.Mesh(bridges.geometry, mirrorMat));
  group.add(mir);
  group.add(windowMesh(SH, wins.filter((w) => Math.abs(w[0]) < 62), { mirror: true, lit: o.windows ?? 1 }));
  return { object: group, towers, windows: wins, lamps: out.lamps, lampSizes: out.lamps.map((q, i) => out.lampSizes[i] ?? 1), posts: out.posts, tiers: out.tiers, stone };
}
