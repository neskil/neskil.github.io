// bridges-of-marigold, the air: THE CITY WITHOUT END. Beyond the ring of seven towers stand many more of the same
// city, from 300 to 950 m out, the most of them in the south, on both sides of the two long bridges and beyond their
// ends, where the last leg of the flight looks: tapering piles of painted houses with an uneven outline and a ring
// of terrace, no two alike in height, girth, lean, build or cap (a dome, a roof terrace with a cupola, a flat pile
// with a crane on it, a spire), all in one instanced mesh; house fronts in bands of the city's colours with rows of
// warm windows and lines of lamps; a pool of their light on the mist at each one's foot; neighbours joined by
// strings of lamps, lines of flags and petal bridges. Three of them stand nearer the last stretch of the flight
// and are built fuller, with houses standing out of their walls.
// The scene's fog pales them with distance. They are dealt by their own stream and BY PLACE: none nearer the great
// tower's axis than 300 m (the flown line keeps within 215 m of it), none within GAP metres of either long bridge's
// line while that bridge stands (its walls' widest reach, its lean and its crane's arm added), none's axis within
// RING_AIR metres of the ring on the ground plan (the three nearer ones excepted, whose walls stand 130 m and
// more from it), none's axis within 70 m of another's; no
// string, flag line or bridge of theirs crosses the two long bridges. Every die of a candidate is cast before it is tested; the search has a most.
import { NOISE, FOG_VERT_PARS, FOG_VERT, FOG_FRAG_PARS } from './bridges-of-marigold-air-glsl.js';
import { fogUniforms } from '../kit/fx.js';
import { sparkMaterial, sparkMesh } from './bridges-of-marigold-air-lamps.js';
import { GREAT_BRIDGE, HIGH_BRIDGE, EXIT, MIST } from './bridges-of-marigold-plan.js';

//   aT (x, z, radius, height)   aS (taper, seed, share of windows lit, the height of its foot)
//   aK (its lean: metres east and south to a metre of height; its cap; its build)
// The shape's rings go in pairs, a level's foot and its top: five levels of houses (one of them, the third or the
// fourth, a thin wide terrace), then the crown, then the cap's three rings. Every level has its own width, its own
// place a little off the axis and its own reach at each corner, and the houses' levels end at uneven heights from
// corner to corner: an outline of houses piled on houses, never a smooth shaft. No two alike: each tower has its
// own height and girth, leans its own way, is built straight, swollen at the waist or shouldered, and is capped
// with a dome on a drum, a roof terrace with a cupola, a flat pile of houses (where a crane stands) or a spire.
const RINGS = 14, SIDES = 8, BODY = '0.86', GAP = 55, RING_AIR = 240;
const VERT = /* glsl */`
${NOISE}${FOG_VERT_PARS}
attribute vec4 aT, aS, aK; varying vec2 vL; varying vec4 vS; varying float vKind; varying vec3 vP;
// where level k begins (0 to 5; the fifth is the crown's foot), as a share of the tower's height
float levelAt(float k){ return k < 0.5 ? 0. : (k > 4.5 ? ${BODY} : ${BODY}*(k + (hash11(k*7.3 + aS.y*31.) - 0.5)*0.5)/5.); }
void main(){
  float rg = floor(position.y*${RINGS}. + 0.5), blk = floor(rg*0.5), odd = rg - 2.*blk, bnd = blk + odd;
  float sd = dot(position.xz, position.xz) > 1e-6 ? floor(atan(position.z, position.x)*${(SIDES / 6.2832).toFixed(4)} + 0.5) : 0.;
  float kt = 2. + floor(hash11(aS.y*17.3)*2.), thin = 3.4/aT.w;
  float deck = step(0.5, aK.z)*step(aK.z, 1.5), flat0 = step(1.5, aK.z)*step(aK.z, 2.5), spire = step(2.5, aK.z);
  float isT = step(abs(blk - kt), 0.5), crown = step(4.5, blk)*step(blk, 5.5), cap = step(5.5, blk);
  // the ring's height: a level's top is the next one's foot; the terrace is a thin level at the top of its span
  float y6 = 0.925 + (${BODY} + thin - 0.925)*deck + 0.005*flat0 - 0.025*spire;
  float y = abs(bnd - kt) < 0.5 ? levelAt(kt + 1.) - thin : levelAt(min(bnd, 5.));
  float uneven = step(0.5, bnd)*step(bnd, 4.5)*step(0.5, abs(bnd - kt))*step(0.5, abs(bnd - kt - 1.));
  y += uneven*(hash12(vec2(sd, bnd) + aS.y*77.) - 0.5)*5./aT.w;
  y = bnd > 5.5 ? y6 : y;
  y = rg > 12.5 ? mix(y6, 1., rg > 13.5 ? 1. : 0.62 + 0.38*flat0 - 0.22*spire) : y;
  // the ring's radius at this corner: the build (straight, swollen at the waist, or shouldered), then the level's own
  float lv = levelAt(min(blk, 5.))/${BODY}, waist = step(0.5, aK.w)*step(aK.w, 1.5), sh = step(1.5, aK.w);
  float rr = aT.z*(1. - aS.x*${BODY}*mix(lv, lv*lv, sh))*(1. + 0.24*waist*sin(3.1416*lv));
  float houses = (0.84 + 0.3*hash12(vec2(blk, 9.) + aS.y*41.))*(0.86 + 0.3*hash12(vec2(sd, blk) + aS.y*57.))*(1. + 0.1*step(blk, 0.5));
  float r = mix(rr*mix(houses, 1.4, isT), rr*(0.74 + 0.62*deck + 0.08*flat0 - 0.24*spire), crown);
  float capR = rr*(0.74 - 0.32*deck - 0.18*flat0 - 0.24*spire);
  r = mix(r, capR*(rg > 13.5 ? 0. : (rg > 12.5 ? 0.74 + 0.26*flat0 - 0.24*spire : 1.)), cap);
  vec2 off = (hash22(vec2(blk, 3.) + aS.y*23.) - 0.5)*aT.z*0.16*step(0.5, blk)*step(blk, 4.5);
  vec3 w = vec3(aT.x + position.x*r + off.x, aS.w + y*aT.w, aT.y + position.z*r + off.y);
  w.xz += aK.xy*(y*aT.w);
  vL = position.xz; vS = vec4(r, y*aT.w, aS.y, aS.z); vP = w; vKind = cap*(1. - flat0) > 0.5 ? 3. : (isT + crown*deck > 0.5 ? 2. : 1.);
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
// THE FRONTS, drawn by place on the tower: rows of painted houses, a storey every 6.5 m and a house every 6 to 16 m
// along the wall, each row a little off the row under it. The storeys go in BANDS of three, and most houses of a
// band wear the band's own paint (the near towers' pinks, reds and oranges the most, violet, blue, teal and cream
// between), the rest their own. A house stands forward or back of its neighbours (lighter or in shade), is lit
// from under its eaves by its own lamp or by none, and has two windows, each lit or dark by its own chance, with
// the wall about a lit one warmed by it; half of the lit ones flicker as candles do by the world's clock. Along
// the eaves of one row in five runs a LINE OF LAMPS in the five colours. A terrace's rim is a pale parapet with a
// row of lamps; the roofs are tile; a dome or spire is painted in two colours by turns. In the night's fill, the
// sky's key and the warm of the tower's own lamps; the lowest 40 m go into the mist's own colour, where the foot
// stands in its pool of light.
// Where a pixel covers more than a window, the windows are drawn at their mean; more than a house, the houses too.
const FRAG = /* glsl */`
${NOISE}${FOG_FRAG_PARS}
uniform float uTime; uniform vec3 uFill, uKey, uKeyDir, uWarm, uRose, uTeal, uGlow, uHaze; varying vec2 vL; varying vec4 vS; varying float vKind; varying vec3 vP;
vec3 paint(float h){ return h < 0.24 ? vec3(0.66, 0.07, 0.30) : (h < 0.4 ? vec3(0.72, 0.16, 0.16) : (h < 0.54 ? vec3(0.74, 0.32, 0.06) :
  (h < 0.67 ? vec3(0.32, 0.14, 0.62) : (h < 0.78 ? vec3(0.10, 0.22, 0.62) : (h < 0.89 ? vec3(0.06, 0.40, 0.42) : vec3(0.66, 0.54, 0.40)))))); }
vec3 lampHue(float k){ return k < 0.5 ? uTeal : (k < 1.5 ? uRose : (k < 2.5 ? uWarm : (k < 3.5 ? vec3(0.5, 0.14, 1.5) : vec3(0.6, 1.3, 0.06)))); }
void main(){
  float ang = dot(vL, vL) > 1e-6 ? atan(vL.y, vL.x) : 0.;
  vec3 fn = cross(dFdx(vP), dFdy(vP)); fn /= max(length(fn), 1e-6); fn *= dot(fn, cameraPosition - vP) < 0. ? -1. : 1.;
  float dome = step(2.9, vKind), roof = step(0.75, abs(fn.y))*(1. - dome), rim = step(1.5, vKind)*(1. - dome)*(1. - roof), wallK = (1. - dome)*(1. - roof)*(1. - rim);
  vec3 sky = uFill*(0.55 + 0.45*fn.y) + uKey*max(dot(fn, uKeyDir), 0.); float row = floor(vS.y/6.5);
  vec2 hc = vec2(ang*vS.x/(8.5*(0.7 + 1.2*hash11(row*1.7 + vS.z*3.))) + hash11(row + vS.z*13.)*5., vS.y/6.5), house = floor(hc), hf = fract(hc);
  float band = floor(row/3. + hash11(vS.z*7.)*3.), h0 = hash12(house + vS.z*91.), hh = h0 < 0.64 ? hash11(band*1.31 + vS.z*5.) : fract(h0*7.3);
  float own = step(0.36, hash12(house*1.7 + vS.z*13. + 5.))*(0.55 + 0.45*hash12(house*2.3 + 1.)), back = step(0.7, hash12(house*3.7 + 2.));
  vec2 fw = vec2(min(fwidth(hc.x), 1.), fwidth(hc.y));       // (the angle's own seam is no footprint)
  float coarse = smoothstep(0.45, 1.1, max(fw.x, fw.y)), fine = 1. - smoothstep(0.16, 0.42, max(fw.x*2., fw.y));
  vec3 light = sky + uGlow*mix((0.3 + 0.95*own)*(0.6 + 0.62*hf.y)*(1. - 0.45*back), 0.72, coarse);
  vec3 wall = mix(paint(hh), paint(hash11(band*1.31 + vS.z*5.))*0.8 + 0.06, coarse)*light*(1. - 0.5*fine*max(step(0.9, hf.y), step(0.95, hf.x)));
  vec2 wi = vec2(house.x*2. + floor(hf.x*2.), house.y), wq = vec2(fract(hf.x*2.), hf.y);
  float hs = hash12(wi*3.1 + vS.z*17.), lit = step(1. - vS.w, hash12(wi + vS.z*7.));
  float win = step(abs(wq.x - 0.5), 0.13 + 0.06*hs)*step(0.22, wq.y)*step(wq.y, 0.56 + 0.08*hs);
  float spill = (1. - smoothstep(0.12, 0.5, abs(wq.x - 0.5)))*(1. - smoothstep(0.2, 0.52, abs(wq.y - 0.4)));
  float candle = 1. - 0.4*step(0.5, fract(hs*9.7))*(0.5 + 0.5*sin(uTime*(2.5 + 5.*hs) + hs*61.));
  vec3 lampC = hs < 0.86 ? uWarm : (hs < 0.93 ? uRose : uTeal);
  vec3 col = wall + mix(uWarm*vS.w*0.14, lampC*lit*(win*(0.7 + 0.8*hs) + 0.1*spill)*candle, fine);
  // a line of lamps along the eaves of one row in five
  float lq = ang*vS.x/2.8, lrow = step(0.8, hash11(row*3.3 + vS.z*19.)), lfw = 1. - smoothstep(0.2, 0.5, min(fwidth(lq), 1.));
  float ld = step(abs(fract(lq) - 0.5), 0.3)*step(0.8, hf.y)*step(hf.y, 0.97)*(0.8 + 0.2*sin(uTime*(1.7 + 2.6*fract(floor(lq)*0.37)) + floor(lq)*5.));
  col += lrow*mix(vec3(0.5, 0.42, 0.44)*step(0.76, hf.y)*0.5, lampHue(mod(floor(lq), 5.))*ld, lfw*fine);
  float lx = ang*vS.x/4.2, lh = hash11(floor(lx) + vS.z*3.), lfine = 1. - smoothstep(0.2, 0.5, min(fwidth(lx), 1.));
  vec3 rimC = vec3(0.5, 0.4, 0.36)*(sky + uGlow*0.9) + mix(uWarm*0.22, (lh < 0.6 ? uWarm : (lh < 0.8 ? uRose : uTeal))*0.9*step(abs(fract(lx) - 0.5), 0.22), lfine);
  vec3 roofC = vec3(0.36, 0.2, 0.15)*(sky + uGlow*0.45);
  float dh = fract(vS.z*5.31);
  vec3 domeC = mix(dh < 0.3 ? vec3(0.1, 0.3, 0.55) : (dh < 0.55 ? vec3(0.1, 0.48, 0.44) : (dh < 0.8 ? vec3(0.62, 0.12, 0.3) : vec3(0.7, 0.4, 0.1))), vec3(0.8, 0.6, 0.24), 0.8*step(0.5, fract(ang*${(SIDES / 2 / 6.2832).toFixed(5)})))*(sky*1.2 + uGlow*0.7);
  col = col*wallK + rimC*rim + roofC*roof + domeC*dome;
  col = mix(col, uHaze, 0.92*(1. - smoothstep(6., 42., vS.y)));          // the foot is lost in the mist it stands in
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`;
// THE POOLS: each far tower warms the mist at its foot: one level disc of light to a tower, lying on the mist
const POOL_VERT = /* glsl */`
${FOG_VERT_PARS}
attribute vec4 aT, aS; varying vec2 vQ; varying float vHue;
void main(){ vQ = position.xy*2.; vHue = aS.y;
  vec4 mvPosition = viewMatrix*vec4(aT.x + position.x*aT.z*7., aS.w + 12., aT.y + position.y*aT.z*7., 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
const POOL_FRAG = /* glsl */`
${FOG_FRAG_PARS}
uniform vec3 uWarm, uRose, uTeal; varying vec2 vQ; varying float vHue;
void main(){ float d = min(length(vQ), 1.), k = 1. - d; k *= k;
  vec3 hue = vHue < 0.6 ? uWarm : (vHue < 0.8 ? uRose : uTeal);
  gl_FragColor = vec4(hue*k*(0.3 + 0.7*k)*(1. - fxFog()), 1.); }`;
const SPAN_VERT = /* glsl */`
${FOG_VERT_PARS}
attribute float aE; varying float vE;
void main(){ vE = aE; vec4 mvPosition = modelViewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
const SPAN_FRAG = /* glsl */`
${FOG_FRAG_PARS}
uniform vec3 uGold; varying float vE;
void main(){ gl_FragColor = vec4(fxApplyFog(uGold*(1. - 0.6*vE*vE)), 1.); }`;

// A HOUSE standing out of a nearer tower's wall: a box that wears the wall's own fronts (the same place on the
// tower gives the same house)   aB (its middle; its turn)   aD (its size; the tower's foot)   aH (the tower's axis x, z; seed; share lit)
const HOUSE_VERT = /* glsl */`
${FOG_VERT_PARS}
attribute vec4 aB, aD, aH; varying vec2 vL; varying vec4 vS; varying float vKind; varying vec3 vP;
void main(){
  float c = cos(aB.w), s = sin(aB.w); vec3 q = position*aD.xyz, w = aB.xyz + vec3(q.x*c + q.z*s, q.y, q.z*c - q.x*s);
  vec2 ax = w.xz - aH.xy; float rad = max(length(ax), 1e-3);
  vL = ax/rad; vS = vec4(rad, w.y - aD.w, aH.z, aH.w); vP = w; vKind = 1.;
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
// A FLAG LINE between two far towers: one hanging ribbon, cut into flags 1.8 m wide by place along it, each its own colour
const FLAG_VERT = /* glsl */`
${FOG_VERT_PARS}
attribute vec2 aU; varying vec2 vU;
void main(){ vU = aU; vec4 mvPosition = modelViewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition;
${FOG_VERT} }`;
const FLAG_FRAG = /* glsl */`
${NOISE}${FOG_FRAG_PARS}
varying vec2 vU;
void main(){
  float k = floor(vU.x/2.3), f = fract(vU.x/2.3), h = hash11(k*1.37 + 3.);
  if(f > 0.8*(1. - 0.5*smoothstep(0.55, 1., vU.y)*step(0.5, fract(k*0.5)))) discard;      // (every other flag is cut to a point)
  vec3 c = h < 0.2 ? vec3(0.9, 0.12, 0.42) : (h < 0.4 ? vec3(1.0, 0.5, 0.08) : (h < 0.55 ? vec3(0.1, 0.62, 0.6) : (h < 0.7 ? vec3(0.42, 0.18, 0.85) : (h < 0.85 ? vec3(0.95, 0.8, 0.2) : vec3(0.3, 0.7, 0.15)))));
  gl_FragColor = vec4(fxApplyFog(c*(0.5 - 0.14*vU.y)), 1.);
}`;

export async function buildFar(ctx, o) {
  const { THREE, look, U, H, rng, lampColors } = o, group = new THREE.Group();
  const want = Math.round(150 * Math.min(1, 0.5 + 0.5 * look.detail)), T = [], S = [], K = [], towers = [];
  // the two long bridges' own air, while each stands (the bed it carries on under the mist included)
  const SOUTH_END = Math.max(GREAT_BRIDGE.z0, HIGH_BRIDGE.z1) + 60;
  const nearBridge = (x, z, reach) => (z > GREAT_BRIDGE.z1 && z < GREAT_BRIDGE.z0 + 60 && Math.abs(x - GREAT_BRIDGE.x) < GAP + reach)
    || (z > HIGH_BRIDGE.z0 && z < HIGH_BRIDGE.z1 + 60 && Math.abs(x - HIGH_BRIDGE.x) < GAP + reach);
  // (a string or a bridge between two far towers may not cross the long bridges: the two stand on one side of them, or south of their ends)
  const crosses = (a, b) => (a.x - (GREAT_BRIDGE.x + HIGH_BRIDGE.x) / 2) * (b.x - (GREAT_BRIDGE.x + HIGH_BRIDGE.x) / 2) < 0 && Math.min(a.z, b.z) < SOUTH_END;
  const put = (x, z, rad, hgt, taper, seed, share, la, lean, cap, build) => {
    towers.push({ x, z, rad, hgt, seed, taper, cap, lx: Math.cos(la) * lean, lz: Math.sin(la) * lean }); T.push(x, z, rad, hgt);
    S.push(taper, seed, share * (0.75 + 0.25 * look.density), MIST - 10); K.push(Math.cos(la) * lean, Math.sin(la) * lean, cap, build);
  };
  // THREE NEARER TOWERS OF FULLER BUILD, where the last stretch of the flight looks: one to the right of the high
  // bridge, one to the left of the great bridge, one further on to the right (the ring is 130 m and more from the
  // nearest of their walls). Straight, upright; each with houses standing out of its walls (see HOUSES below).
  const HEROES = [[HIGH_BRIDGE.x + 118, EXIT.z + 135, 31, 262, 0], [GREAT_BRIDGE.x - 118, EXIT.z + 150, 28, 236, 2], [HIGH_BRIDGE.x + 104, EXIT.z + 305, 25, 208, 2]];
  for (const h of HEROES) put(h[0], h[1], h[2], h[3], 0.3 + 0.1 * rng(), rng(), 0.74, 0, 0, h[4], 0);
  for (let tries = 0; towers.length < want && tries < want * 12; tries++) {
    const rr = rng(), south = rng(), ba0 = rng(), fat = rng(), hgt = rng.range(80, 300), taper = rng.range(0.22, 0.52), seed = rng(), share = rng.range(0.5, 0.78);
    const rad = 12 + 28 * fat * fat, la = rng() * Math.PI * 2, lean = 0.065 * rng() * rng(), cap = Math.floor(rng() * 4), build = Math.floor(rng() * 3);
    // (bearing 0 is south: two in five of them are dealt to the southern third of the round, the rest all round)
    const ba = south < 0.42 ? (ba0 - 0.5) * 2.4 : ba0 * Math.PI * 2, R = 300 + 650 * Math.sqrt(rr), x = R * Math.sin(ba), z = R * Math.cos(ba);
    // (its reach: the widest its walls stand from its foot's axis, 1.67 of its radius, or its crane's arm; and how far it leans)
    if (nearBridge(x, z, lean * hgt + Math.max(rad * 1.67, cap === 2 ? rad * 0.16 + 28 : 0)) || Math.hypot(x - EXIT.x, z - EXIT.z) < RING_AIR) continue;
    let ok = true; for (const t of towers) if (Math.hypot(t.x - x, t.z - z) < 70) { ok = false; break; }
    if (!ok) continue;
    put(x, z, rad, hgt, taper, seed, share, la, lean, cap, build);
  }
  await ctx.yield();
  const cyl = new THREE.CylinderGeometry(1, 1, 1, SIDES, RINGS, false).translate(0, 0.5, 0), g = new THREE.InstancedBufferGeometry();
  g.index = cyl.index; g.setAttribute('position', cyl.attributes.position);
  g.setAttribute('aT', new THREE.InstancedBufferAttribute(new Float32Array(T), 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(S), 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(K), 4)); g.instanceCount = towers.length;
  const ka = H.keyAz * Math.PI / 180;
  const m = new THREE.ShaderMaterial({ fog: true, vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { ...fogUniforms(), uTime: U.uTime, uFill: { value: new THREE.Color(H.fillSky).multiplyScalar(H.fill) }, uKey: { value: new THREE.Color(H.key).multiplyScalar(0.6 * H.keyI) },
      uKeyDir: { value: new THREE.Vector3(Math.sin(ka) * 300, 150, -Math.cos(ka) * 300).normalize() }, uGlow: { value: new THREE.Color('#ffe2c4').multiplyScalar(0.32) }, uHaze: { value: new THREE.Color(H.mist).multiplyScalar(1.3) },
      uWarm: { value: new THREE.Color('#ffb458').multiplyScalar(1.5) }, uRose: { value: lampColors.magenta.clone().multiplyScalar(1.6) }, uTeal: { value: lampColors.teal.clone().multiplyScalar(1.6) } } });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; group.add(mesh);
  const quad = new THREE.PlaneGeometry(1, 1), pg = new THREE.InstancedBufferGeometry();
  pg.index = quad.index; pg.setAttribute('position', quad.attributes.position); pg.setAttribute('aT', g.attributes.aT); pg.setAttribute('aS', g.attributes.aS); pg.instanceCount = towers.length;
  const pm = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: POOL_VERT, fragmentShader: POOL_FRAG,
    uniforms: { ...fogUniforms(), uWarm: { value: new THREE.Color('#ff9438').multiplyScalar(0.36) }, uRose: { value: lampColors.magenta.clone().multiplyScalar(0.28) }, uTeal: { value: lampColors.teal.clone().multiplyScalar(0.24) } } });
  const pools = new THREE.Mesh(pg, pm); pools.frustumCulled = false; pools.renderOrder = 3; group.add(pools);
  await ctx.yield();
  // ---- a few faint petal bridges between far towers that stand near one another (each tower joined once at most)
  const pos = [], ed = [], idx = [], used = new Set(); let spans = 0;
  for (let i = 0; i < towers.length && spans < 18; i++) for (let j = i + 1; j < towers.length && spans < 18; j++) {
    const a = towers[i], b = towers[j], d = Math.hypot(a.x - b.x, a.z - b.z);
    if (used.has(i) || used.has(j) || d < 95 || d > 200 || crosses(a, b)) continue;
    used.add(i); used.add(j); spans++;
    const y0 = Math.min(a.hgt, b.hgt) * 0.5, ux = (b.x - a.x) / d, uz = (b.z - a.z) / d, base = pos.length / 3, N = 18;
    for (let k = 0; k <= N; k++) {
      const t = k / N, s = a.rad * 0.8 + (d - (a.rad + b.rad) * 0.8) * t, y = y0 + 0.14 * d * 4 * t * (1 - t);
      for (const e of [-1, 1]) { pos.push(a.x + ux * s - uz * e * 4.5, y, a.z + uz * s + ux * e * 4.5); ed.push(e); }
      if (k < N) { const q = base + k * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('aE', new THREE.Float32BufferAttribute(ed, 1)); sg.setIndex(idx);
  const sm = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: SPAN_VERT, fragmentShader: SPAN_FRAG, uniforms: { ...fogUniforms(), uGold: { value: look.glow.clone().multiplyScalar(0.9) } } });
  if (spans) { const spansMesh = new THREE.Mesh(sg, sm); spansMesh.frustumCulled = false; group.add(spansMesh); }
  await ctx.yield();
  // ---- faint strings of lamps between far towers that stand near one another (two strings to a tower at most): a
  // lamp every 7 m of a sagging span from wall to wall, the string's colour and each lamp's twinkle from the
  // towers' own seeds (no more dice)
  const five = [lampColors.teal, lampColors.magenta, lampColors.orange, lampColors.violet, lampColors.lime], LP = [], LH = [], LC = [], tied = new Uint8Array(towers.length);
  let strings = 0; const pairs = new Set();
  for (let i = 0; i < towers.length && strings < 60; i++) for (let j = i + 1; j < towers.length && strings < 60; j++) {
    const a = towers[i], b = towers[j], d = Math.hypot(a.x - b.x, a.z - b.z);
    if (tied[i] > 1 || tied[j] > 1 || d < 75 || d > 230 || crosses(a, b)) continue;
    tied[i]++; tied[j]++; strings++; pairs.add(i + ':' + j);
    const ux = (b.x - a.x) / d, uz = (b.z - a.z) / d, ya = MIST + a.hgt * (0.5 + 0.3 * a.seed), yb = MIST + b.hgt * (0.5 + 0.3 * b.seed), run = d - (a.rad + b.rad) * 0.7, n = Math.max(6, Math.round(run / 7));
    const col = five[Math.floor(a.seed * 4.999)], two = five[Math.floor(b.seed * 4.999)];
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, s = a.rad * 0.7 + run * t, c = k % 2 ? col : two;
      LP.push(a.x + ux * s, ya + (yb - ya) * t - 0.09 * d * 4 * t * (1 - t), a.z + uz * s, 2.6); LH.push(1, 0, 0, 0); LC.push(c.r * 0.8, c.g * 0.8, c.b * 0.8, (a.seed * 7.13 + k * 0.381) % 1);
    }
  }
  const lmat = sparkMaterial(THREE, U, { drop: 0, core: 3.2, halo: 0.55 }), lset = sparkMesh(THREE, lmat, LP, LH, LC);
  if (lset.count) group.add(lset.mesh);
  await ctx.yield();
  // ---- lines of flags between far towers that stand near one another (two to a tower at most; none where a string
  // of lamps hangs already): a ribbon 2.8 m deep under a sagging line, cut into flags by its shader
  const fp = [], fu = [], fi = [], flagged = new Uint8Array(towers.length); let flagLines = 0;
  for (let i = 0; i < towers.length && flagLines < 50; i++) for (let j = i + 1; j < towers.length && flagLines < 50; j++) {
    const a = towers[i], b = towers[j], d = Math.hypot(a.x - b.x, a.z - b.z);
    if (flagged[i] > 1 || flagged[j] > 1 || d < 75 || d > 210 || crosses(a, b) || pairs.has(i + ':' + j)) continue;
    flagged[i]++; flagged[j]++; flagLines++;
    const ux = (b.x - a.x) / d, uz = (b.z - a.z) / d, ya = MIST + a.hgt * (0.3 + 0.3 * b.seed), yb = MIST + b.hgt * (0.3 + 0.3 * a.seed), run = d - (a.rad + b.rad) * 0.7, base = fp.length / 3, N = 16;
    for (let k = 0; k <= N; k++) {
      const t = k / N, q = a.rad * 0.7 + run * t, y = ya + (yb - ya) * t - 0.07 * d * 4 * t * (1 - t);
      fp.push(a.x + ux * q, y, a.z + uz * q, a.x + ux * q, y - 2.8, a.z + uz * q); fu.push(run * t, 0, run * t, 1);
      if (k < N) { const v = base + k * 2; fi.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
    }
  }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute('aU', new THREE.Float32BufferAttribute(fu, 2)); fg.setIndex(fi);
  const fm = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: FLAG_VERT, fragmentShader: FLAG_FRAG, uniforms: { ...fogUniforms() } });
  if (flagLines) { const fl = new THREE.Mesh(fg, fm); fl.frustumCulled = false; group.add(fl); }
  // ---- a crane on every flat pile: a mast, a rising jib and its cabin, of plain beams
  const cp = [], ci = [];
  const beam = (cx, cy, cz, sx, sy, sz, yaw, pitch) => {
    const base = cp.length / 3, cw = Math.cos(yaw), sw = Math.sin(yaw), cq = Math.cos(pitch), sq = Math.sin(pitch);
    for (let v = 0; v < 8; v++) {
      const x = (v & 1 ? 0.5 : -0.5) * sx, y = (v & 2 ? 0.5 : -0.5) * sy, z = (v & 4 ? 0.5 : -0.5) * sz, y1 = y * cq + z * sq, z1 = z * cq - y * sq;
      cp.push(cx + x * cw + z1 * sw, cy + y1, cz - x * sw + z1 * cw);
    }
    for (const f of [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]) ci.push(base + f[0], base + f[1], base + f[2], base + f[0], base + f[2], base + f[3]);
  };
  for (const t of towers) {
    if (t.cap !== 2) continue;
    const topR = 0.56 * t.rad * (1 - 0.86 * t.taper), ty = MIST - 10 + t.hgt, yaw = t.seed * 19, hm = 15 + 12 * t.seed, lj = 20 + 14 * ((t.seed * 7.7) % 1), half = lj / 2 - 5;
    const mx = t.x + t.lx * t.hgt + Math.sin(yaw) * topR * 0.35, mz = t.z + t.lz * t.hgt + Math.cos(yaw) * topR * 0.35;
    beam(mx, ty + hm / 2, mz, 2.0, hm, 2.0, yaw, 0);
    beam(mx + Math.sin(yaw) * half * 0.94, ty + hm - 1.5 + half * 0.34, mz + Math.cos(yaw) * half * 0.94, 1.5, 1.5, lj, yaw, 0.35);
    beam(mx, ty + hm - 3.5, mz, 4.2, 2.4, 4.2, yaw, 0);
  }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci);
  const cm = new THREE.MeshBasicMaterial({ color: new THREE.Color('#c98a45').multiplyScalar(0.5), fog: true, side: THREE.DoubleSide });
  if (ci.length) { const cranes = new THREE.Mesh(cg, cm); cranes.frustumCulled = false; group.add(cranes); }
  await ctx.yield();
  // ---- HOUSES standing out of the three nearer towers' walls: boxes of one or two storeys at dealt bearings and
  // storeys, each pushed a few metres out of the wall and wearing the wall's own fronts
  const HB = [], HD = [], HH = [], perHero = Math.round(150 * Math.min(1, 0.4 + 0.6 * look.detail));
  for (let h = 0; h < HEROES.length; h++) for (let i = 0; i < perHero; i++) {
    const t = towers[h], ba = rng() * Math.PI * 2, up = rng(), wide = rng.range(7, 13), tall = 6.5 * (1 + Math.floor(rng() * 2)), outw = rng.range(1.5, 5.5);
    const row = Math.round((44 + (0.86 * t.hgt - 52) * up) / 6.5) * 6.5, R = t.rad * (1 - t.taper * (row / t.hgt)) + outw - 7;
    HB.push(t.x + Math.cos(ba) * R, MIST - 10 + row + tall / 2, t.z + Math.sin(ba) * R, Math.PI / 2 - ba); HD.push(wide, tall, 14, MIST - 10); HH.push(t.x, t.z, t.seed, 0.74 * (0.75 + 0.25 * look.density));
  }
  const bx = new THREE.BoxGeometry(1, 1, 1), hg = new THREE.InstancedBufferGeometry(); hg.index = bx.index; hg.setAttribute('position', bx.attributes.position);
  hg.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(HB), 4)); hg.setAttribute('aD', new THREE.InstancedBufferAttribute(new Float32Array(HD), 4));
  hg.setAttribute('aH', new THREE.InstancedBufferAttribute(new Float32Array(HH), 4)); hg.instanceCount = HB.length / 4;
  const hm2 = new THREE.ShaderMaterial({ fog: true, vertexShader: HOUSE_VERT, fragmentShader: FRAG, uniforms: m.uniforms });
  const housesMesh = new THREE.Mesh(hg, hm2); housesMesh.frustumCulled = false; group.add(housesMesh);
  return {
    object: group, triangles: towers.length * (cyl.index.count / 3 + 2) + idx.length / 3 + lset.count * 2 + fi.length / 3 + ci.length / 3 + hg.instanceCount * 12,
    drawCalls: 3 + (spans ? 1 : 0) + (lset.count ? 1 : 0) + (flagLines ? 1 : 0) + (ci.length ? 1 : 0), count: towers.length, spans, strings, flagLines,
    update() {}, dispose() { for (const x of [cyl, g, m, quad, pg, pm, sg, sm, lset, lmat, fg, fm, cg, cm, bx, hg, hm2]) x.dispose(); },
  };
}
