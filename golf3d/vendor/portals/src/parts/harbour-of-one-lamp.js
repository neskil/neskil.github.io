// THE HARBOUR OF ONE LAMP, the hero and the shared craft: the tall house under the hill's crown and its one lit window.
// The window IS the opening of this world: a bare hole of 7 by 9.2 m through the front wall, from the wall's outer face to
// its inner face, where the opening stands. Nothing is built in the hole or before it. Round it stand our own stone jambs,
// lintel and sill and two oak casement leaves open outward at 115 degrees, and the lamp's light is PAINT on those faces by a
// law of the faces (their place on the front), breathing as a flame does on the world clock.
// BEHIND THE OPENING'S PLANE (0.3 m inside the house, hidden wherever the engine draws the opening): one flat sheet of the
// veil's own lamp gold, fixed in the world, NO LARGER THAN THE OPENING (7 by 9.2, its edges on the opening's own: the join
// sheet's ruling). Reason:
// where a world before looks into this one the engine draws no opening here (the join sheet's ruling on the spark of world
// 6), and the hole would stand black in the middle of its own light. It shows nothing: one flat colour.
// Local frame of the part: origin at the middle of the front at door-sill level, +Y up, the front facing +Z; the wall's outer
// face is z 0, its inner face (the opening's plane) z -WALL. Everything is three times life. No texture, no timer.
// This file also exports the mason (a small builder of quads with the attributes the stone shader reads) and the stone
// shader itself, which the world module uses for the town, the harbour and the boats, so that one light law holds everywhere.
import * as THREE from 'three';

export const GOLD = '#E8A94E';
// the house's measures (metres): half width, depth, floors, eaves, ridge, wall thickness; the opening; the leaves
export const HOUSE = { hw: 10, depth: 14, eaves: 25.5, ridge: 31, wall: 0.9, floors: [0, 9, 18] };
export const WIN = { hw: 3.5, y0: 10.4, y1: 19.6, yc: 15, jamb: 1.0, sillOut: 1.1, sillH: 0.7, leafW: 3.5, leafOpen: 115, back: 0.3 };
// surfaces the stone shader knows
export const SURF = { PLAIN: 0, LIME: 1, SLATE: 2, STONE: 3, WOOD: 4, FLAGS: 5, ROCK: 6, GLASS: 7, NET: 8, CLOTH: 9, LEAF: 10, PANE: 11, RUN: 12, DRY: 13, SWAG: 14, PAVE: 15 };
// r5m1: DRY is linen on a roof's line, SWAG a net drying in a swag (both hang from a line: their pattern's v is minus the
// metres below it, their fourth number how loose they hang); PAVE is the flags the lamp's rays fall on (the square, the
// upper street's treads and landing), whose gold is light on stone by a law of the stone's place (paveLamp).
// The greatest reach of a hung piece from where it hangs at rest (the vertex law below, mirrored for the counts by place)
export const DRY = { swing: 0.62, fold: 0.6, lift: 0.3 };
export const dryReach = (drop, loose = 1) => drop * Math.sin(DRY.swing * loose) + DRY.fold * loose;

// THE LAST LIGHT stands in the west-south-west over the sea, 120 degrees west of north (north is -Z, east +X); its light
// comes from the band and the pale sky over it, about 11 degrees up. A unit vector TOWARD the light.
export const KEY_AZ = 120 * Math.PI / 180, KEY_EL = 11 * Math.PI / 180;
export const KEY_DIR = [-Math.sin(KEY_AZ) * Math.cos(KEY_EL), Math.sin(KEY_EL), -Math.cos(KEY_AZ) * Math.cos(KEY_EL)];
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
export const linear = lin;

// ---------------------------------------------------------------- THE WORLD'S OWN SKY OVER THE KIT'S DOME (GLSL, shared)
// A law of direction and the world clock, the same for the dome's skin and for whatever mirrors the sky (the panes): by
// the BEARING from the sunken sun. THE BAND at the sea's rim: a broad rose glow with deep ember in it at the rim itself,
// gone into the dusk's blue by about twelve degrees up; broadest on the sun's bearing, nothing on the far side. CLOUD:
// long level bars on a flat shell (long across the sun's bearing), full toward the west and thin away from it, and a few
// heaps standing over the western rim. Cloud is lit from below by the sunken sun: gold on its lower edges, coral and rose
// on its undersides toward the west, lilac above and in its thick; slate lilac with a faint rose under it away from the
// west. It drifts slowly. STARS stand only in the east, where the sky is dark enough. Colours are linear; what comes back
// is premultiplied (rgb, cover).
const v3 = (hex, k = 1) => 'vec3(' + lin(hex, k).map((v) => v.toFixed(4)).join(', ') + ')';
export const SKIN_GLSL = /* glsl */`
  float skH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float skN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(skH(i), skH(i + vec2(1., 0.)), f.x), mix(skH(i + vec2(0., 1.)), skH(i + vec2(1., 1.)), f.x), f.y); }
  float skF(vec2 p){ return (.5 * skN(p) + .27 * skN(p * 2.03 + 7.1) + .15 * skN(p * 4.07 + 3.7)) / .92; }
  // the bars' thickness at a place q of the flat shell (x toward the sun's bearing, y across it), drifting on the clock
  float skBars(vec2 q, float t, float drift){
    return skF(vec2(q.x * 1.25 + 3.3, q.y * .4 + 11.7 + t * drift)) * .8 + .2 * skN(vec2(q.x * 3.4, q.y * 1.1 - t * drift * 1.6)); }
  // k: x the bars' cover toward the west, y away from it, z the heaps, w the drift
  vec4 westSky(vec3 d, vec2 sun, float t, vec4 k){
    float el = clamp(d.y, 0., 1.); vec2 nd = normalize(d.xz + vec2(1e-5)); float bw = dot(nd, sun), west = smoothstep(-.35, .9, bw);
    // the band: the rose glow, and the deep ember in it at the rim
    float aR = exp(-el / .2) * smoothstep(-.3, .8, bw) * .8, aE = exp(-el / .07) * smoothstep(.1, .9, bw) * .96;
    vec3 col = ${v3('#E0A39A')} * aR; float a = aR;
    col = col * (1. - aE) + mix(${v3('#C2665A')}, ${v3('#DC7A66')}, smoothstep(0., .07, el)) * aE; a = a + aE - a * aE;
    // the bars
    vec2 p = d.xz / (el + .16), q = vec2(dot(p, sun), dot(p, vec2(-sun.y, sun.x)));
    float cover = mix(k.y, k.x, west) * smoothstep(.015, .09, el) * (1. - .5 * smoothstep(.55, .95, el));
    float n = skBars(q, t, k.w), n1 = skBars(q * 1.07, t, k.w);
    float dens = smoothstep(1. - cover, 1.22 - cover, n + .12), low = clamp((n - n1) * 7., 0., 1.), lit = clamp(.62 + (n - n1) * 6., 0., 1.);
    vec3 under = mix(${v3('#A88CA8')}, mix(${v3('#E69A8A')}, ${v3('#E88A66')}, west * west), west);
    vec3 top = mix(${v3('#566088')}, ${v3('#6A6292')}, west);
    vec3 cc = mix(top, under, lit * (.45 + .55 * west) * (1. - .3 * smoothstep(.7, 1., dens))) + ${v3('#F2CE98')} * (dens * (1. - dens) * 4. * low * (.15 + .85 * west));
    float ca = dens * mix(.5, .92, west);
    col = col * (1. - ca) + cc * ca; a = a + ca - a * ca;
    // the heaps over the western rim: rounded heads on a level foot a little over the sea's edge, in a few companies along
    // the rim; their feet lit ember and gold from below, coral in their middles, lilac in their heads
    float az = atan(nd.x * sun.y - nd.y * sun.x, bw), few = smoothstep(.42, .68, skN(vec2(az * 1.6 + 4.2 + t * k.w * .3, 2.))) * k.z * smoothstep(0., .55, bw);
    vec2 hq = vec2(az * 5. + t * k.w * .6 + 2.7, el * 13.);
    float hn = skF(hq), hup = skF(hq + vec2(0., .5)), win = smoothstep(.034, .042, el) * (1. - smoothstep(.07, .2, el));
    float hd = smoothstep(.27, .4, hn * win * few) * .94, up = clamp(smoothstep(.04, .15, el) + (hn - hup) * 2.5, 0., 1.);
    vec3 hc = mix(mix(${v3('#E08A72')}, ${v3('#C48C9A')}, smoothstep(0., .45, up)), ${v3('#5A547E')}, smoothstep(.35, .95, up)) + ${v3('#F2CE98')} * (1. - smoothstep(.036, .06, el)) * .5;
    col = col * (1. - hd) + hc * hd; a = a + hd - a * hd;
    return vec4(col, a);
  }
  // the first stars, in the east only: points by a fixed hash of direction, twinkling on the clock
  float skStars(vec3 d, vec2 sun, float t){
    vec3 g = d * 70., id = floor(g), f = fract(g) - .5; float h = skH(id.xy + id.z * 17.3);
    vec3 o = vec3(skH(id.yz + 3.1), skH(id.zx + 9.7), skH(id.xy + 5.3)) - .5; float r = length(f - o * .6);
    float east = (1. - smoothstep(-.55, .1, dot(normalize(d.xz + vec2(1e-5)), sun))) * smoothstep(.08, .3, d.y);
    return step(.95, h) * (1. - smoothstep(.04, .16, r)) * east * (.55 + .45 * sin(t * (1.2 + 5. * h) + h * 70.)) * (.35 + .65 * skH(id.zy + 1.7));
  }`;

// ---------------------------------------------------------------- THE GUST OF THE ONE WIND (GLSL, shared; r5m1)
// A law of place and the world clock, the same for cloth, net, leaf and turf: fronts 56 m apart run down the wind at 7 m a
// second and a finer flaw 13 m long rides on them at 5.5 m a second; across the wind they are bent and broken by place.
// x: the broad front alone (0 the lull, 1 the gust); y: front and flaw together (0 to 1).
export const GUST_GLSL = /* glsl */`
  vec2 gustAt(vec2 p, vec3 wind, float t){
    vec2 w = normalize(wind.xz + vec2(1e-5, 0.)); float s = dot(p, w), q = dot(p, vec2(-w.y, w.x));
    float a = .5 + .5 * sin((s - 7. * t) * .1122 + 1.9 * sin(q * .043) + .8 * sin(q * .017 + 2.));
    float b = .5 + .5 * sin((s - 5.5 * t) * .4833 + 2.3 * sin(q * .11 + 1.3));
    return vec2(a, clamp(.72 * a + .28 * b, 0., 1.));
  }`;

// ---------------------------------------------------------------- the stone shader (one light law for every solid of the world)
// aP: x surface kind, y ambient occlusion (1 open, 0 shut in), z the lamp's paint (HDR strength of gold), w sway in metres
// aSh: the painted shade from the last light (0 lit, 1 in the shade a standing thing throws on its own wall)
const VERT = /* glsl */`
  attribute vec3 color; attribute vec4 aP; attribute vec2 aUv; attribute float aSh;
  uniform float uTime; uniform vec3 uWind;
  varying vec3 vCol, vN, vW; varying vec4 vP; varying vec2 vUv; varying float vSh;
  #include <fog_pars_vertex>
  ${GUST_GLSL}
  void main(){
    vec4 wp = modelMatrix * vec4(position, 1.);
    vec3 nW = normalize(mat3(modelMatrix) * normal);
    // (the ground's fourth number is its share of turf, not a sway: the ground stands still)
    float kind = aP.x, sw = (kind > 5.5 && kind < 6.5) ? 0. : aP.w;
    float ph = wp.x * .23 + wp.z * .19 + wp.y * .31;
    // (r5m1: ONE WIND. Whatever sways leans with the gust that passes its own place and recovers behind it; never past its full sway)
    vec2 tg = gustAt(wp.xz, uWind, uTime);
    float gust = .15 + .85 * tg.y;
    if (kind > 12.5 && kind < 14.5) {
      // LINEN AND NETS ON A ROOF'S LINE: a piece hangs from its line (d metres below it) and swings out from it down the
      // wind as far as the wind meets it squarely, 0.62 of a radian at the full gust, its hem lifting as it swings; folds
      // travel down it, and along it where the wind runs along the line (3.2 m long at 5 m a second)
      float d = max(-aUv.y, 0.), lift = min(d, 1.6) / 1.6;
      vec3 wn = normalize(vec3(uWind.x, 0., uWind.z)), nh = normalize(vec3(nW.x, 0., nW.z) + vec3(1e-5, 0., 0.));
      float sq = dot(wn, nh), th = sq * (.12 + .5 * tg.y) * sw, live = sw * lift * (.3 + .7 * tg.y);
      float wave = sin(6.2832 * (d / 2.6 + aUv.x * .23) - uTime * 4.2 + 4. * tg.y);
      float flag = sin(dot(wp.xz, wn.xz) * 1.9635 - uTime * 9.8 + aUv.x) * (1. - abs(sq));
      wp.xyz += nh * (d * sin(th) + live * .3 * (wave + flag)) + vec3(0., d * (1. - cos(th)) + .1 * live * wave, 0.);
    } else
    wp.xyz += vec3(uWind.x, 0., uWind.z) * (sw * gust) + vec3(0., sw * .12 * sin(uTime * 2.1 + ph * 1.3), 0.);
    vW = wp.xyz; vN = nW; vCol = color; vP = aP; vUv = aUv; vSh = aSh;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const FRAG = /* glsl */`
  uniform float uTime, uBreath, uAmb; uniform vec3 uSky, uGround, uKeyDir, uKeyCol, uLampCol, uLampK, uWind;
  uniform vec3 uSkyZ, uSkyM, uSkyH, uSkyS, uSunDir, uSunCol, uCirLit, uCirShade, uEmber; uniform vec4 uSkyG, uSkyG2, uSunP, uCir, uSkin; uniform vec2 uSkinDir; uniform float uSkinT0;
  varying vec3 vCol, vN, vW; varying vec4 vP; varying vec2 vUv; varying float vSh;
  #include <fog_pars_fragment>
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
  ${SKIN_GLSL}
  ${GUST_GLSL}
  uniform vec3 uLampW; uniform vec4 uPave, uWell;
  // THE LAMP ON THE FLAGS (r5m1), a law of the stone's own place and nothing else: rays from the window (uLampW) to the
  // stone. It falls with the distance (as the baked law does: 1.2 to 17 m, a half at 77 m) and with the slope of the stone
  // to the rays, and lies only inside the window's cone. BEYOND THE STREET'S MOUTH the window is seen between the street's
  // two last walls: the share of its breadth that a place sees is its light, so the fan ends in a soft edge that widens
  // with the distance from the window (never under a metre). THE WELL's rim and post stand in the rays and throw their
  // soft shadows on the stone behind them, softer the further behind. (The square's south parapet shades what lies beyond
  // the square by the baked law. The two open leaves, folded back at 115 degrees with their feet 10.4 m over the landing,
  // stand outside every ray that reaches a flag: they throw no shadow on lit stone.)
  float paveLamp(vec3 P){
    vec3 dv = P - uLampW; if (dv.z < .3 || dv.y > -1.) return 0.;
    float d = length(dv), far = max(d - 17., 0.) / 60., facing = -dv.y / d;
    float F = 1.2 / (1. + far * far) * smoothstep(.4384, .6157, dv.z / d) * smoothstep(0., .2, facing) * (.75 + .25 * smoothstep(.15, .6, facing));
    float m = (P.z - uPave.y) / max(P.z - uLampW.z, 1.);
    if (m > 0.) { float x0 = uPave.x / (1. - m), hw = max(uPave.z * m / (1. - m), .5), sh = clamp((x0 + hw - abs(P.x)) / (2. * hw), 0., 1.); F *= sh * sh * (3. - 2. * sh); }
    // (a ray climbs 'rise' metres for every metre it runs toward the window: a thing h high shades the stone behind it for h / rise metres)
    vec2 toW = normalize(uLampW.xz - P.xz), rel = uWell.xy - P.xz; float al = dot(rel, toW), pe = abs(rel.x * toW.y - rel.y * toW.x), rise = -dv.y / max(length(dv.xz), 1.), soft = .25 + .05 * max(al, 0.);
    float rim = sqrt(max(uWell.z * uWell.z - pe * pe, 0.)), sR = step(0., al + rim) * (1. - smoothstep(uWell.z - soft, uWell.z + soft, pe)) * (1. - smoothstep(uWell.w - .3, uWell.w + .5, (al - rim) * rise));
    float sP = step(0., al) * (1. - smoothstep(.62 - .6 * soft, .62 + .6 * soft, pe)) * (1. - smoothstep(1.6, 2.4, al * rise));
    F *= 1. - .82 * max(sR, sP);
    return F;
  }
  // THE SKY IN A DIRECTION, for what mirrors it: the kit's own clear-sky law by the kit's own numbers (the dome's uniforms,
  // shared): its three-colour gradient, the warm wash on the sunken sun's side, the sun's two halo lobes; and the high
  // streaks as soft patches of their own two colours on the kit's own shell (uCir: cover, scale, opacity, drift), and the
  // world's own sky over it (the band at the sea's rim and the cloud of the west, by the one law the dome's skin is drawn
  // by). A ray that goes down meets the town and the sea under that sky: the shade's slate.
  vec3 skyAt(vec3 d){
    float dn = smoothstep(-.3, .0, d.y); d = normalize(vec3(d.x, max(d.y, 0.), d.z));
    float inv = 1. - clamp(d.y, 0., 1.);
    vec3 c = mix(uSkyZ, uSkyM, pow(inv, uSkyG2.x)); c = mix(c, uSkyH, pow(inv, uSkyG.x));
    float side = clamp(.5 + .5 * dot(d, uSunDir), 0., 1.), sc = pow(side, uSkyG.z) * mix(uSkyG2.y, 1., pow(inv, uSkyG2.z));
    c = mix(c, uSkyS, clamp(sc * uSkyG.y, 0., 1.));
    float mu = dot(d, uSunDir), g2 = mix(.9, .985, uSunP.w);
    c += uSunCol * uSunP.z * (.16 * pow(.0784 / (1.5184 - 1.44 * mu), 1.5) + .42 * pow((1. - g2) * (1. - g2) / (1. + g2 * g2 - 2. * g2 * mu), 1.5));
    float sh = sqrt(484. * d.y * d.y + 45.) - 22. * d.y; vec2 q = d.xz * sh * uCir.y + uCir.w * uTime;
    float streak = smoothstep(.8 - .6 * uCir.x, 1.05 - .6 * uCir.x, vn(vec2(q.x * .28 + q.y * .1, q.y) * 1.6) + .5 * vn(q * 3.1)) * uCir.z * smoothstep(0., .1, d.y);
    c = mix(c, mix(uCirShade, uCirLit, .25 + .75 * side) + uSkyS * pow(side, uSkyG.z * .6) * uSkyG.y * .15, streak);
    // the world's own band and cloud, as the dome's skin has them
    vec4 w = westSky(d, uSkinDir, uTime + uSkinT0, uSkin); c = c * (1. - w.a) + w.rgb;
    return mix(uGround * 1.5, c, dn);
  }
  void main(){
    int s = int(vP.x + .5);
    vec2 uv = vUv; vec3 n = normalize(vN);
    float big = vn(uv * .22 + 3.1), mid = vn(uv * .9 + 11.7), fine = vn(uv * 3.7);
    float tone = 1., ao = clamp(vP.y, 0., 1.), gl = 0.;
    float wq = max(fwidth(uv.x), fwidth(uv.y)) / .42;
    if (s == 1) {                                  // limewash over rubble: mottled, lumps showing, damp at the foot, runs under the eaves
      float lump = smoothstep(.35, .75, vn(uv * vec2(1.1, 1.6) + 5.)) * .1;
      tone = .8 + .24 * big + .12 * mid - lump + .05 * fine;
      tone *= 1. - .26 * smoothstep(.5, .9, vn(vec2(uv.x * .7, uv.y * .08 + 2.))) * (.4 + .6 * mid);
      // where the wash has worn off, the rubble's own courses show darker
      float worn = smoothstep(.6, .72, vn(uv * .17 + 9.) * .7 + .3 * mid);
      // and at the wall's foot (the pattern's own height is the height over the ground) the wash is worn away raggedly by
      // boots, rain and splash: the rubble shows there on every wall
      worn = max(worn, .9 * smoothstep(2.3, .5, uv.y + 1.6 * (vn(uv * vec2(.45, .3) + 3.) - .5)));
      float rw = floor(uv.y / .8), rx = uv.x / 1.3 + .5 * mod(rw, 2.) + h21(vec2(rw, 2.)) * .4;
      float rj = smoothstep(0., .12, fract(uv.y / .8)) * smoothstep(0., .08, fract(rx)), rid = h21(vec2(floor(rx), rw));
      // under whole wash the same stones still show as soft lumps, where the eye is near enough to tell one from the next
      float told = 1. - smoothstep(.12, .45, wq);
      tone *= mix(1., (.9 + .16 * rid) * (.84 + .16 * rj) * (.93 + .14 * vn(uv * 9.)), told * (1. - worn));
      tone *= mix(1., (.58 + .26 * rid) * (.75 + .25 * rj), worn);
    } else if (s == 2) {                           // slate in courses: every slate its own tone, a dark line under each course
      float row = floor(uv.y / .62), fx = uv.x / .5 + .5 * mod(row, 2.) + h21(vec2(row, 7.)) * .3;
      float id = h21(vec2(floor(fx), row));
      float edge = smoothstep(0., .16, fract(uv.y / .62)) * smoothstep(0., .1, fract(fx)) ;
      tone = (.72 + .5 * id) * (.62 + .38 * edge) * (.9 + .2 * big);
    } else if (s == 3) {                           // dressed stone in courses with mortar
      float row = floor(uv.y / .9), fx = uv.x / 1.7 + .5 * mod(row, 2.) + h21(vec2(row, 3.)) * .35;
      float id = h21(vec2(floor(fx), row * 1.7));
      float joint = smoothstep(0., .1, fract(uv.y / .9)) * smoothstep(0., .05, fract(fx));
      tone = (.74 + .36 * id) * (.68 + .32 * joint) * (.86 + .22 * mid) + .04 * fine;
      // old wash worn to patches on some stones, and the damp of the tide's reach: stone within 2 m of the water stands dark
      tone *= 1. + .16 * smoothstep(.55, .8, vn(uv * .31 + 17.)) * step(.5, id);
      tone *= mix(.56, 1., smoothstep(.9, 2.3, vW.y + .9 * (vn(vec2(uv.x * .4, 5.)) - .5)));
    } else if (s == 4) {                           // planks: a tone to each, grain along them, a dark seam between
      float pl = uv.x / .5, id = h21(vec2(floor(pl), 9.));
      tone = (.74 + .4 * id) * (.6 + .4 * smoothstep(0., .1, fract(pl))) * (.82 + .3 * vn(vec2(uv.x * 9., uv.y * .5)));
    } else if (s == 5 || s == 15) {                // flags: big worn slabs, a tone to each, dark joints, damp patches
      float row = floor(uv.y / 1.9), fx = uv.x / 2.6 + h21(vec2(row, 5.)) ;
      float id = h21(vec2(floor(fx), row * 2.3));
      float joint = smoothstep(0., .08, fract(uv.y / 1.9)) * smoothstep(0., .06, fract(fx));
      tone = (.74 + .34 * id) * (.66 + .34 * joint) * (.8 + .32 * big);
      // (the flags the lamp falls on show their grain and the hollows worn in them)
      if (s == 15) tone *= (.9 + .2 * fine) * (.92 + .16 * mid);
    } else if (s == 6) {                           // living rock and thin turf: strata and blotches
      tone = .62 + .5 * big + .3 * mid * mid + .12 * fine - .15 * smoothstep(.4, .6, vn(vec2(uv.x * .05, uv.y * .9)));
      // THE WIND ON THE HILL (r5m1): where turf, heath or crop grows (the ground's own share, vP.w: none on rock, road,
      // shingle or the town's ground) the gust's fronts run over it down the wind, the blades laid over showing paler
      // and with a sheen as a front passes, a shade darker in the lull behind it
      if (vP.w > .01) { float g = gustAt(vW.xz, uWind, uTime).x, lit = smoothstep(.45, .95, g); gl = vP.w * lit; tone *= 1. + vP.w * (.3 * lit - .1 * smoothstep(.5, .05, g)); }
    } else if (s == 7) {                           // old glass: dark, with slow glints that slide as the flame breathes
      float g = vn(vec2(uv.x * 1.3 + uTime * .11, uv.y * .7 - uTime * .07)) * vn(uv * 2.9 + uTime * .05);
      tone = .8 + .5 * big; gl = smoothstep(.3, .62, g);
    } else if (s == 8) {                           // net: a knotted mesh, holes cut where the mesh can be resolved
      // (far off, where the knots cannot be told, the same mesh is drawn two, four, eight times as coarse, so that a net is
      // seen through at every distance and never stands as a board)
      float lvl = exp2(clamp(ceil(log2(max(wq / .2, .001))), 0., 4.));
      vec2 q = uv / (.42 * lvl); float m = min(abs(fract(q.x + q.y) - .5), abs(fract(q.x - q.y) - .5));
      if (m > .15) discard;
      tone = .85 + .4 * mid;
    } else if (s == 9) {                           // cloth: soft folds; where the cloth stirs in the wind (its sway) they run along it
      tone = .76 + .22 * sin(uv.x * 9. + 2. * mid - uTime * 2.3 * step(.004, vP.w)) + .07 * sin(uv.x * 23. + uv.y * 2.) + .1 * big;
    } else if (s == 10) {                          // leaf and needle masses
      // (they stir: gusts run over every leaf mass on the one wind, turning the paler undersides up as they pass)
      float gust = vn(vec2((vW.x + vW.z) * .45 - uTime * .8 * uWind.x, vW.y * .6 + uTime * .2));
      tone = (.7 + .6 * mid) * (.78 + .5 * gust); gl = .8 * (gust - .5);
    } else if (s == 11) {                          // a pane of old glass in the town: dark, a little uneven
      tone = .7 + .5 * mid;
    } else if (s == 13) {                          // linen on a roof's line: soft broad folds that run as it stirs
      // (the folds stand as deep in it as in the washing of the lanes, broader, and run along it and down it as it stirs)
      tone = .68 + .18 * sin(uv.x * 4.3 + 2. * mid - uTime * 2.1) + .09 * sin(uv.y * 2.4 + uTime * 4.2 + uv.x * 1.4) + .08 * big;
    } else if (s == 14) {                          // a net drying in a swag: the knotted mesh seen through, cork floats along its head rope
      // (its foot hangs in festoons, 2.75 to 3.4 m under the line, a foot rope along them; the mesh as the nets of the quay)
      // (a drying net's mesh is told a little finer than a net's on the quay, its cords thinner: it hangs as a veil against the sky)
      float dn = -uv.y, lvl = exp2(clamp(ceil(log2(max(wq / .3, .001))), 0., 4.)), hem = 2.75 + .6 * abs(sin(uv.x * 1.2566));
      if (dn > hem) discard;
      vec2 q = uv / (.42 * lvl); float m = min(abs(fract(q.x + q.y) - .5), abs(fract(q.x - q.y) - .5)) + .035;
      float cork = 1. - smoothstep(.16, .22, length(vec2((fract(uv.x / .9) - .5) * .9, dn - .2))), rope = max(1. - smoothstep(.05, .09, dn), 1. - smoothstep(.05, .09, hem - dn));
      if (m > .15 && cork < .5 && rope < .5) discard;
      tone = (.8 + .4 * mid) * (1. + .7 * cork);
    } else if (s == 12) {                          // water running in a gutter: streaks of the sky sliding down it (the pattern's v runs up the fall)
      float g = vn(vec2(uv.x * 7., uv.y * 2.4 + uTime * 2.8)) * .65 + .35 * vn(vec2(uv.x * 15., uv.y * 5. + uTime * 4.1));
      tone = .7; gl = smoothstep(.42, .7, g);
    } else { tone = .88 + .2 * big + .06 * fine; }
    vec3 alb = vCol * tone;
    float up = n.y * .5 + .5;
    vec3 amb = mix(uGround, uSky, up) * (uAmb * ao);
    // THE LAST LIGHT, the key: faces turned to the band take it plainly, faces aslant to it by their slant, faces turned from
    // it none (they stand in the sky's blue fill); vSh is the painted shade a standing thing throws along its own wall
    float key = max(dot(n, uKeyDir), 0.) * (1. - clamp(vSh, 0., 1.));
    // the lamp's paint p: where it lies the sky's blue and the last light's pale straw give way to it (uLampK.z), and it is laid as gold of
    // strength uLampK.x p / (1 + uLampK.y p) (far washes are plainly seen, near ones never burn to white), a little by the face's own tone
    float p = max(vP.z, 0.), lum = dot(alb, vec3(.3, .55, .15));
    if (s == 15) p = paveLamp(vW);
    // (cloth lets the last light through: a sail or a sheet seen against the band glows in its own colour)
    if (s == 9 || s == 13) key += .6 * max(dot(-n, uKeyDir), 0.);
    vec3 col = alb * (amb + uKeyCol * key * (.45 + .55 * ao));
    // (chalk in the last light is pale, never white: what the sky and the band lay on a face is eased off above .45)
    // (on the flags the lamp falls on, the dusk's own light on the stone stays under the gold: light on stone, not paint)
    col *= 1. / (1. + .8 * max(max(col.r, max(col.g, col.b)) - .45, 0.)) / (1. + (s == 15 ? .9 : uLampK.z) * p);
    // (tar and old paint on planks keep a dull sheen of the sky: dark wood is slate under it, never a black hole)
    col += uSky * (s == 7 ? .2 + .7 * gl : s == 12 ? .12 + gl : s == 4 ? .13 * ao : 0.);
    if (s == 11) {
      // A PANE IS A DIM MIRROR OF THE SKY, by the mirror law (a law of physics, as the water's reflection is): the eye's ray
      // is turned about the pane's own normal and the pane shows the sky in that direction, band and cloud as the sky has
      // them, BUT NEVER MORE THAN A THIRD OF THE SKY'S OWN LIGHT (old glass before a dark room: a seventh of it seen square
      // on, a third along the pane), and greyed toward the dusk's cool: the band is a pale rose in it, never a red or an
      // orange bar, so no pane can be taken for a lamp within. Old glass is uneven: each pane leans a little in soft
      // patches. Unlit from within: nothing here is warm but what the lamp's own paint lays on it.
      vec3 v = normalize(vW - cameraPosition);
      vec3 pn = normalize(n + .06 * vec3(vn(uv * vec2(1.7, 1.1) + 7.) - .5, vn(uv * 1.3 + 2.) - .5, vn(uv * 1.9 + 4.) - .5));
      float cs = clamp(dot(-v, pn), 0., 1.), fr = .14 + .19 * pow(1. - cs, 3.);
      vec3 mir = skyAt(reflect(v, pn)); float ml = dot(mir, vec3(.3, .55, .15));
      col = alb * amb * .22 + mix(ml * vec3(.9, .97, 1.14), mir, .42) * fr * (.7 + .3 * ao);
    }
    // (the grass under a gust has a sheen of the sky)
    if (s == 6) col += uSky * (.05 * gl);
    // THE GOLD ON THE FLAGS MULTIPLIES THE STONE (r5m1): every slab's own tone, its joints and its grain stay under it
    if (s == 15) col += uLampCol * (uLampK.x * p / (1. + uLampK.y * p) * uBreath) * min(alb * 5., vec3(1.4));
    // (and on linen and nets it is paint on the thing: a pale sheet stands softly gold on its window side, a tanned net a warm brown)
    else if (s == 13 || s == 14) col += uLampCol * (uLampK.x * p / (1. + uLampK.y * p) * uBreath) * min(alb * (s == 14 ? 1.5 : 2.4), vec3(1.));
    else col += uLampCol * (uLampK.x * p / (1. + uLampK.y * p) * uBreath) * (.7 + .55 * lum + .45 * gl);
    gl_FragColor = vec4(col, 1.);
    #include <fog_fragment>
  }`;

// the light of the standing dusk, shared by every stone material of the world (the world module owns the values)
// the light law's uniforms; with the dome given (the kit's sky), the dome's own numbers ride along by reference for what
// mirrors the sky (the panes)
export function makeLight(sky, ember = '#D9756A', skin = null) {
  const L = {
    uTime: { value: 0 }, uBreath: { value: 1 }, uAmb: { value: 1.6 },
    uSky: { value: new THREE.Vector3(...lin('#98A8C8')) }, uGround: { value: new THREE.Vector3(...lin('#565E72')) },
    uKeyDir: { value: new THREE.Vector3(...KEY_DIR) }, uKeyCol: { value: new THREE.Vector3(...lin('#D9D08E', 1.5)) },
    uLampCol: { value: new THREE.Vector3(1, 0.45, 0.07) }, uLampK: { value: new THREE.Vector3(1.1, 1.2, 2.5) }, uWind: { value: new THREE.Vector3(1, 0, 0) },
    // the lamp on the flags (paveLamp): the lamp's place; the street's half width, its mouth's z and the window's half
    // width; the well (x, z, its rim's reach and height). The world sets them by its own places; as they stand here no
    // flag is lit (the hero alone has none).
    uLampW: { value: new THREE.Vector3(0, 1e5, 0) }, uPave: { value: new THREE.Vector4(5, 1e5, WIN.hw, 0) }, uWell: { value: new THREE.Vector4(0, -1e5, 1, 1) },
  };
  const u = sky ? sky.uniforms : null, C = (hex) => ({ value: new THREE.Color(hex) }), V = (x, y, z, w) => ({ value: new THREE.Vector4(x, y, z, w) });
  const cir = sky && sky.options.clouds2 ? sky.options.clouds2 : null;
  Object.assign(L, { uSkyZ: u ? u.uZenith : C('#2B3759'), uSkyM: u ? u.uMid : C('#5470A8'), uSkyH: u ? u.uHorizon : C('#8AA3C4'), uSkyS: u ? u.uScatterColor : C('#D9D08E'),
    uSkyG: u ? u.uGrad : V(7, 1.5, 1.7, 0), uSkyG2: u ? u.uGrad2 : V(1.4, 0.02, 5.2, 0), uSunDir: u ? u.uSunDir : { value: new THREE.Vector3(...KEY_DIR) }, uSunCol: u ? u.uSunColor : C('#D9756A'), uSunP: u ? u.uSun : V(0, 0, 0, 0),
    uEmber: C(ember), uCirLit: C(cir ? cir.lit : '#000000'), uCirShade: C(cir ? cir.shade : '#000000'), uCir: cir ? V(cir.coverage, cir.scale * 3.2, cir.opacity, Math.hypot(cir.wind[0], cir.wind[1])) : V(0, 1, 0, 0) });
  // the world's own sky over the dome (the skin's uniforms, shared by reference; none: the band alone, no cloud)
  Object.assign(L, { uSkinDir: skin ? skin.uDir : { value: new THREE.Vector2(KEY_DIR[0], KEY_DIR[2]).normalize() }, uSkin: skin ? skin.uSkin : V(0, 0, 0, 0), uSkinT0: skin ? skin.uSkinT0 : { value: 0 } });
  return L;
}
export function stoneMaterial(light, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...light }, vertexShader: VERT, fragmentShader: FRAG, fog: true,
    side: o.side ?? THREE.FrontSide,
  });
}

// ---------------------------------------------------------------- the mason: quads with colour, surface, occlusion, lamp paint and sway
// st.lamp: a number is the paint itself; LAMP_BAKE marks a vertex for the world's ray law (bake() below fills it).
export const LAMP_BAKE = -1;
export function makeMason() {
  // the corners are kept in typed stores that double when full (plain arrays of this size are slow and leave much to clear)
  let cap = 2048, n = 0, pos = new Float32Array(cap * 3), nor = new Float32Array(cap * 3), col = new Float32Array(cap * 3), uvs = new Float32Array(cap * 2), ap = new Float32Array(cap * 4), shd = new Float32Array(cap);
  let icap = 4096, ni = 0, idx = new Uint32Array(icap);
  const more = (a, k) => { const b = new Float32Array(cap * k); b.set(a); return b; };
  const grow = () => { cap *= cap < 32768 ? 4 : 2; pos = more(pos, 3); nor = more(nor, 3); col = more(col, 3); uvs = more(uvs, 2); ap = more(ap, 4); shd = more(shd, 1); };
  const face = (a, b, c) => { if (ni + 3 > icap) { icap *= 2; const b2 = new Uint32Array(icap); b2.set(idx); idx = b2; } idx[ni++] = a; idx[ni++] = b; idx[ni++] = c; };
  const st = { c: [1, 1, 1], surf: 0, ao: 1, sway: 0, lamp: 0, sh: 0, M: null };
  const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3(), _p = [0, 0, 0];
  const m = {
    st,
    set(o) { Object.assign(st, o); if (o.M !== undefined && st.M) _nm.getNormalMatrix(st.M); return m; },
    col(hex, k = 1) { st.c = typeof hex === 'string' ? lin(hex, k) : [hex[0] * k, hex[1] * k, hex[2] * k]; return m; },
    vert(p, nrm, u, v, ao, lamp, sway, sh) {
      _v.set(p[0], p[1], p[2]); _n.set(nrm[0], nrm[1], nrm[2]);
      if (st.M) { _v.applyMatrix4(st.M); _n.applyMatrix3(_nm).normalize(); }
      if (n === cap) grow();
      const k = n * 3, k4 = n * 4;
      pos[k] = _v.x; pos[k + 1] = _v.y; pos[k + 2] = _v.z; nor[k] = _n.x; nor[k + 1] = _n.y; nor[k + 2] = _n.z; col[k] = st.c[0]; col[k + 1] = st.c[1]; col[k + 2] = st.c[2];
      uvs[n * 2] = u; uvs[n * 2 + 1] = v; ap[k4] = st.surf; ap[k4 + 1] = ao; ap[k4 + 2] = lamp ?? st.lamp; ap[k4 + 3] = sway ?? st.sway; shd[n] = sh ?? st.sh;
      return n++;
    },
    // a b c d counter-clockwise seen from the lit side. o.ao: one number or [a, b, c, d]; o.lamp and o.sway the same;
    // o.sub: the longest edge of a cell in metres (the quad is cut into a grid); o.uv: [u, v] where the pattern begins
    quad(a, b, c, d, o = {}) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const lu = Math.hypot(ux, uy, uz), lv = Math.hypot(vx, vy, vz), u0 = o.uv ? o.uv[0] : 0, v0 = o.uv ? o.uv[1] : 0;
      const nu = o.sub ? Math.max(1, Math.ceil(lu / o.sub)) : 1, nv = o.sub ? Math.max(1, Math.ceil(lv / o.sub)) : 1;
      const four = (x, dflt) => (x === undefined ? [dflt, dflt, dflt, dflt] : typeof x === 'number' ? [x, x, x, x] : x);
      const A = four(o.ao, st.ao), Lm = four(o.lamp, st.lamp), Sw = four(o.sway, st.sway), Sh = four(o.sh, st.sh), nn = [nx, ny, nz], base = n;
      const bl = (q, s, t) => (q[0] * (1 - s) + q[1] * s) * (1 - t) + (q[3] * (1 - s) + q[2] * s) * t;
      if (nu === 1 && nv === 1 && !o.lampAt) {   // an uncut quad: its four corners as they stand
        m.vert(a, nn, u0, v0, A[0], Lm[0], Sw[0], Sh[0]); m.vert(b, nn, u0 + lu, v0, A[1], Lm[1], Sw[1], Sh[1]);
        m.vert(d, nn, u0, v0 + lv, A[3], Lm[3], Sw[3], Sh[3]); m.vert(c, nn, u0 + lu, v0 + lv, A[2], Lm[2], Sw[2], Sh[2]);
      } else for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const s = i / nu, t = j / nv, p = _p;
        for (let k = 0; k < 3; k++) p[k] = (a[k] * (1 - s) + b[k] * s) * (1 - t) + (d[k] * (1 - s) + c[k] * s) * t;
        const lampV = o.lampAt ? o.lampAt(p) : bl(Lm, s, t);
        m.vert(p, nn, u0 + lu * s, v0 + lv * t, bl(A, s, t), lampV, bl(Sw, s, t), bl(Sh, s, t));
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const q = base + j * (nu + 1) + i; face(q, q + 1, q + nu + 2); face(q, q + nu + 2, q + nu + 1); }
      return m;
    },
    tri(a, b, c, o = {}) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1;
      const nn = [nx / nl, ny / nl, nz / nl], lu = Math.hypot(ux, uy, uz), A = o.ao ?? [st.ao, st.ao, st.ao], L = o.lamp ?? [st.lamp, st.lamp, st.lamp];
      const i0 = m.vert(a, nn, 0, 0, A[0], L[0]), i1 = m.vert(b, nn, lu, 0, A[1], L[1]), i2 = m.vert(c, nn, lu * 0.5, Math.hypot(vx, vy, vz), A[2], L[2]);
      face(i0, i1, i2); return m;
    },
    // an upright box; o.no: letters of faces left out (t top, b bottom, n north -z, s south +z, e east +x, w west -x);
    // o.aoLow and o.aoHigh: occlusion at the foot and the head of its upright faces; o.sub as for quad
    box(x0, y0, z0, x1, y1, z1, o = {}) {
      const no = o.no || '', lo = o.aoLow ?? st.ao, hi = o.aoHigh ?? st.ao, q = { sub: o.sub, ao: [lo, lo, hi, hi], lamp: o.lamp, uv: o.uv, lampAt: o.lampAt };
      if (!no.includes('s')) m.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], q);
      if (!no.includes('n')) m.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], q);
      if (!no.includes('e')) m.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], q);
      if (!no.includes('w')) m.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], q);
      if (!no.includes('t')) m.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], { sub: o.sub, ao: o.aoTop ?? hi, lamp: o.lampTop ?? o.lamp, lampAt: o.lampAt });
      if (!no.includes('b')) m.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], { ao: lo * 0.6, lamp: o.lamp });
      return m;
    },
    // an upright round or tapering post of seg sides between y0 and y1 (radii r0 at the foot, r1 at the head), capped
    post(cx, cz, y0, y1, r0, r1, seg = 8, o = {}) {
      const lo = o.aoLow ?? st.ao, hi = o.aoHigh ?? st.ao;
      for (let i = 0; i < seg; i++) {
        const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        m.quad([cx + c1 * r0, y0, cz + s1 * r0], [cx + c0 * r0, y0, cz + s0 * r0], [cx + c0 * r1, y1, cz + s0 * r1], [cx + c1 * r1, y1, cz + s1 * r1], { ao: [lo, lo, hi, hi], uv: [i * 1.3, 0], lamp: o.lamp });
        if (!o.open) m.tri([cx, y1, cz], [cx + c1 * r1, y1, cz + s1 * r1], [cx + c0 * r1, y1, cz + s0 * r1], { ao: [hi, hi, hi] });
      }
      return m;
    },
    get count() { return n; }, get triangles() { return ni / 3; },
    // the world's ray law fills every vertex marked LAMP_BAKE: fn(x, y, z, nx, ny, nz) gives the paint
    bake(fn, from = 0, to = n) {
      for (let i = from; i < to; i++) if (ap[i * 4 + 2] < 0) ap[i * 4 + 2] = fn(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]);
    },
    // the world's law of the last light's shade fills every vertex: fn(x, y, z, nx, ny, nz) gives 0 (lit) to 1 (in shade);
    // a corner keeps the deeper of that and the painted shade it already carries
    shade(fn, from = 0, to = n) {
      for (let i = from; i < to; i++) if (shd[i] < 1) shd[i] = Math.max(shd[i], fn(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]));
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos.slice(0, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor.slice(0, n * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(col.slice(0, n * 3), 3)); g.setAttribute('aUv', new THREE.BufferAttribute(uvs.slice(0, n * 2), 2));
      g.setAttribute('aP', new THREE.BufferAttribute(ap.slice(0, n * 4), 4)); g.setAttribute('aSh', new THREE.BufferAttribute(shd.slice(0, n), 1));
      g.setIndex(new THREE.BufferAttribute(n > 65535 ? idx.slice(0, ni) : new Uint16Array(idx.subarray(0, ni)), 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      return g;
    },
  };
  return m;
}

// ---------------------------------------------------------------- the lamp's paint on the house's own front (a law of the wall)
// A FAN ROUND THE WINDOW (r3: the window itself is by far the brightest thing of the front, and the wall it stands in keeps
// the dusk): above the sill's level 2.4 at the outer edge of jambs and lintel, gone to 0.1 within 4.2 m; below it 2.0 under
// the sill falling to 0.1 within 4 m (the door and its step take the stem's light from the street's own law).
export function frontWash(x, y) {
  const W = WIN, hx = W.hw + W.jamb, top = W.y1 + 0.9, sm = (t) => { const s = Math.min(1, Math.max(0, t)); return s * s * (3 - 2 * s); };
  const dx = Math.max(Math.abs(x) - hx, 0);
  const above = 0.1 + 2.3 * (1 - sm(Math.hypot(dx, Math.max(y - top, 0)) / 4.2));
  const dl = Math.hypot(dx, Math.max(W.y0 - y, 0)), below = 0.1 + 1.9 * Math.max(0, 1 - dl / 4);
  return below + (above - below) * sm((y - W.y0 + 1.5) / 3);
}
// ALBEDOS (what the stone is, not what the dusk makes of it: under the blue of the sky chalk shows pale blue-white, slate
// slate blue, tar a dark plum brown; the brief's palette is what is seen)
export const PAL = { chalk: '#DAD7CF', stone: '#A8A49A', slate: '#666A74', tar: '#5A4A42', oak: '#8C7658', iron: '#33363C', blue: '#8399B4', green: '#829C84',
  vine: '#55704A', lead: '#454850', glass: '#34404E', rock: '#77756E', turf: '#5E6850', flags: '#8E8B84', rope: '#8E8878', pot: '#8A6652', spar: '#5C564E' };

export async function buildHero(ctx, opts = {}) {
  const light = opts.light || makeLight(), H = HOUSE, W = WIN, m = makeMason();
  const fixed = ctx.core.makeRng(ctx.core.hashSeed('the tall house'));   // the join thing never varies: one fixed number, no seed
  const group = new THREE.Group();
  // ---- THE FRONT: a tall GABLE front (the ridge runs back from the street), the great window through two storeys its chief
  // feature. A grid of cells with the hole and the door's recess left out; above the side eaves the wall runs up into the
  // gable under the roof's line. Occlusion under the verge and at the foot.
  const cuts = (a, b, step, extra) => { const s = new Set(extra); for (let v = a; v <= b + 1e-6; v += step) s.add(Math.round(v * 100) / 100); return [...s].filter((v) => v >= a - 1e-6 && v <= b + 1e-6).sort((p, q) => p - q); };
  const roofY = (x) => H.ridge - (H.ridge - H.eaves) * Math.abs(x) / H.hw;
  const xs = cuts(-H.hw, H.hw, 1, [-W.hw, W.hw, -1.5, 1.5]), ys = cuts(0, H.eaves, 1, [6.3, W.y0, W.y1, H.eaves]);
  const aoWall = (y, top = H.eaves) => Math.min(1, 0.5 + 0.5 * (top - y) / 2.2) * (0.78 + 0.22 * Math.min(1, y / 1.6));
  const aoFront = (x, y) => aoWall(y, roofY(x));
  m.col(PAL.chalk).set({ surf: SURF.LIME });
  for (let j = 0; j < ys.length - 1; j++) for (let i = 0; i < xs.length - 1; i++) {
    if (i === 0) await ctx.yield();
    const x0 = xs[i], x1 = xs[i + 1], y0 = ys[j], y1 = ys[j + 1], cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (Math.abs(cx) < W.hw && cy > W.y0 && cy < W.y1) continue;
    if (Math.abs(cx) < 1.5 && cy < 6.3) continue;
    m.quad([x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], { uv: [x0 + 30, y0], ao: [aoFront(x0, y0), aoFront(x1, y0), aoFront(x1, y1), aoFront(x0, y1)], lampAt: (p) => frontWash(p[0], p[1]) });
  }
  // the gable: each column of the grid runs on up to the roof's line, in two steps
  for (let i = 0; i < xs.length - 1; i++) { const x0 = xs[i], x1 = xs[i + 1];
    for (const [f0, f1] of [[0, 0.5], [0.5, 1]]) { const ya = (x, f) => H.eaves + (roofY(x) - H.eaves) * f;
      m.quad([x0, ya(x0, f0), 0], [x1, ya(x1, f0), 0], [x1, ya(x1, f1), 0], [x0, ya(x0, f1), 0], { uv: [x0 + 30, H.eaves], ao: [aoFront(x0, ya(x0, f0)), aoFront(x1, ya(x1, f0)), aoFront(x1, ya(x1, f1)), aoFront(x0, ya(x0, f1))], lampAt: (p) => frontWash(p[0], p[1]) }); } }
  await ctx.yield();
  // ---- the two side walls and the back gable (no lamp reaches them)
  const D = H.depth, band = (a, b, n) => { for (const [y0, y1] of [[0, 1.6], [1.6, H.eaves - 2.2], [H.eaves - 2.2, H.eaves]]) m.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], { uv: [n, y0], ao: [aoWall(y0), aoWall(y0), aoWall(y1), aoWall(y1)] }); };
  band([H.hw, 0], [H.hw, -D], 7); band([H.hw, -D], [-H.hw, -D], 31); band([-H.hw, -D], [-H.hw, 0], 53);
  m.tri([H.hw, H.eaves, -D], [-H.hw, H.eaves, -D], [0, H.ridge, -D], { ao: [0.7, 0.7, 0.6] });
  await ctx.yield();
  // ---- the roof: two slate slopes falling east and west from the ridge, eave and verge overhang; under the front verge a
  // dark soffit and a bargeboard that follow the gable's line
  const ov = 0.8, vg = 0.7, slope = (H.ridge - H.eaves) / H.hw, ey = H.eaves - ov * slope;
  for (const sx of [-1, 1]) {
    m.col(PAL.slate).set({ surf: SURF.SLATE });
    const e0 = [sx * (H.hw + ov), ey, vg], e1 = [sx * (H.hw + ov), ey, -D - vg], r0 = [0, H.ridge, vg], r1 = [0, H.ridge, -D - vg];
    if (sx > 0) m.quad(e0, e1, r1, r0, { ao: 1, uv: [3, 0] }); else m.quad(e1, e0, r0, r1, { ao: 1, uv: [17, 0] });
    m.col(PAL.stone, 0.6).set({ surf: SURF.PLAIN });
    const w0 = [sx * H.hw, H.eaves, 0], w1 = [0, H.ridge, 0], lampS = (p) => frontWash(p[0], p[1]) * 0.6;
    if (sx > 0) m.quad(w0, e0, r0, w1, { ao: 0.45, lampAt: lampS }); else m.quad(e0, w0, w1, r0, { ao: 0.45, lampAt: lampS });
    const b0 = [e0[0], e0[1] - 0.3, vg], b1 = [0, H.ridge - 0.3, vg];
    m.col(PAL.oak, 0.7).set({ surf: SURF.WOOD });
    if (sx > 0) m.quad(b0, e0, r0, b1, { ao: 0.9, lampAt: lampS }); else m.quad(e0, b0, b1, r0, { ao: 0.9, lampAt: lampS });
  }
  m.col(PAL.stone, 0.8).set({ surf: SURF.PLAIN }).box(-0.3, H.ridge - 0.15, -D - vg, 0.3, H.ridge + 0.25, vg, { no: 'b' });
  await ctx.yield();
  // ---- two chimneys through the slopes, each with two pots
  const chimneys = [];
  for (const cx of [-6.2, 5.6]) {
    m.col(PAL.stone, 0.9).set({ surf: SURF.STONE }).box(cx - 1.1, roofY(cx) - 1.6, -D / 2 - 0.9, cx + 1.1, H.ridge + 3.1, -D / 2 + 0.9, { no: 'b', aoLow: 0.7, aoHigh: 1 });
    m.col(PAL.stone, 0.7).set({ surf: SURF.PLAIN }).box(cx - 1.3, H.ridge + 3.1, -D / 2 - 1.1, cx + 1.3, H.ridge + 3.4, -D / 2 + 1.1, {});
    for (const dx of [-0.5, 0.5]) m.col(PAL.pot).post(cx + dx, -D / 2, H.ridge + 3.4, H.ridge + 4.3, 0.34, 0.26, 7, { aoLow: 0.7 });
    chimneys.push(new THREE.Vector3(cx, H.ridge + 4.3, -D / 2));
  }
  await ctx.yield();
  // ---- THE WINDOW'S SURROUND: jambs, lintel, relieving arch, reveals, sill. The hole itself is bare.
  const jz = 0.14, hx = W.hw + W.jamb;
  m.col(PAL.stone).set({ surf: SURF.STONE });
  for (const sx of [-1, 1]) {
    const a = sx > 0 ? W.hw : -hx, b = sx > 0 ? hx : -W.hw;
    m.box(a, W.y0, 0, b, W.y1, jz, { no: 'nb' + (sx > 0 ? 'w' : 'e'), lamp: 2.6, uv: [sx * 4 + 9, 0] });
    // the reveal: the jamb's inner face through the wall's thickness, ending at the opening's plane
    const x = sx * W.hw;
    if (sx > 0) m.quad([x, W.y0, -H.wall], [x, W.y0, jz], [x, W.y1, jz], [x, W.y1, -H.wall], { lamp: 3.2 });
    else m.quad([x, W.y0, jz], [x, W.y0, -H.wall], [x, W.y1, -H.wall], [x, W.y1, jz], { lamp: 3.2 });
  }
  m.box(-hx - 0.4, W.y1, 0, hx + 0.4, W.y1 + 1.1, jz + 0.06, { no: 'nb', lamp: 2.5, uv: [2, 5] });
  m.quad([-W.hw, W.y1, -H.wall], [W.hw, W.y1, -H.wall], [W.hw, W.y1, jz], [-W.hw, W.y1, jz], { lamp: 3.2 });
  m.quad([-W.hw, W.y0, jz], [W.hw, W.y0, jz], [W.hw, W.y0, -H.wall], [-W.hw, W.y0, -H.wall], { lamp: 2.6 });
  // the relieving arch: thin slates on edge in a low bow over the lintel
  m.col(PAL.slate, 0.9).set({ surf: SURF.PLAIN });
  for (let i = 0; i < 23; i++) {
    const t = (i + 0.5) / 23 * 2 - 1, x = t * (hx + 0.3), y = W.y1 + 1.2 + 0.95 * (1 - t * t), lean = -t * 0.5, c = Math.cos(lean), sn = Math.sin(lean), h = 0.7, w = 0.12;
    const P = (u, v) => [x + u * c - v * sn, y + u * sn + v * c, jz];
    m.quad(P(-w, 0), P(w, 0), P(w, h), P(-w, h), { lampAt: (p) => frontWash(p[0], p[1]) * 0.8 });
  }
  // the sill: one long stone standing out below the opening's lower edge, wholly under it
  m.col(PAL.stone, 1.05).set({ surf: SURF.STONE });
  m.box(-hx - 0.2, W.y0 - W.sillH, 0, hx + 0.2, W.y0, W.sillOut, { no: 'n', lamp: 1.3, lampTop: 2.4, aoLow: 0.7, uv: [1, 3] });
  return finishHero(ctx, { group, m, light, fixed, chimneys });
}

// a four-sided bar between two points (stays, hinges' straps, stems)
export function bar(m, a, b, r, o = {}) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), up = Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const s = new THREE.Vector3().crossVectors(d, up).normalize(), t = new THREE.Vector3().crossVectors(s, d);
  const ring = (p, rr) => [0, 1, 2, 3].map((i) => { const ca = Math.cos(i * Math.PI / 2 + 0.785), sa = Math.sin(i * Math.PI / 2 + 0.785); return [p[0] + (s.x * ca + t.x * sa) * rr, p[1] + (s.y * ca + t.y * sa) * rr, p[2] + (s.z * ca + t.z * sa) * rr]; });
  const A = ring(a, r), B = ring(b, o.r1 ?? r);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; m.quad(A[j], A[i], B[i], B[j], o); }
}
// a slab in a leaf's own frame (u along the leaf from its hinge, y up, w through it): both faces and the four edges
function slab(m, u0, y0, u1, y1, t, lampPlus, lampMinus, lampEdge) {
  m.quad([u0, y0, t], [u1, y0, t], [u1, y1, t], [u0, y1, t], { lamp: lampPlus, uv: [u0, y0] });
  m.quad([u1, y0, -t], [u0, y0, -t], [u0, y1, -t], [u1, y1, -t], { lamp: lampMinus, uv: [u0 + 5, y0] });
  m.quad([u1, y0, t], [u1, y0, -t], [u1, y1, -t], [u1, y1, t], { lamp: lampEdge });
  m.quad([u0, y0, -t], [u0, y0, t], [u0, y1, t], [u0, y1, -t], { lamp: lampEdge });
  m.quad([u0, y1, t], [u1, y1, t], [u1, y1, -t], [u0, y1, -t], { lamp: lampEdge });
  m.quad([u0, y0, -t], [u1, y0, -t], [u1, y0, t], [u0, y0, t], { lamp: lampEdge });
}

async function finishHero(ctx, S) {
  const { group, m, light, fixed, chimneys } = S, H = HOUSE, W = WIN;
  // ---- the door in its recess, its stone surround and its worn step
  m.col(PAL.tar).set({ surf: SURF.WOOD, lamp: 0 });
  m.quad([-1.5, 0, -0.4], [1.5, 0, -0.4], [1.5, 6.3, -0.4], [-1.5, 6.3, -0.4], { ao: [0.5, 0.5, 0.42, 0.42], lampAt: (p) => frontWash(p[0], p[1]) * 0.8 });
  m.col(PAL.stone, 0.8).set({ surf: SURF.STONE });
  m.quad([-1.5, 0, -0.4], [-1.5, 0, 0], [-1.5, 6.3, 0], [-1.5, 6.3, -0.4], { ao: 0.6, lamp: 0.5 }); m.quad([1.5, 0, 0], [1.5, 0, -0.4], [1.5, 6.3, -0.4], [1.5, 6.3, 0], { ao: 0.6, lamp: 0.5 });
  m.quad([-1.5, 6.3, -0.4], [1.5, 6.3, -0.4], [1.5, 6.3, 0], [-1.5, 6.3, 0], { ao: 0.5, lamp: 0.4 });
  m.col(PAL.stone).box(-2.1, 6.3, 0, 2.1, 7.1, 0.12, { no: 'nb', lampAt: (p) => frontWash(p[0], p[1]) });
  for (const sx of [-1, 1]) m.box(sx > 0 ? 1.5 : -2.1, 0, 0, sx > 0 ? 2.1 : -1.5, 6.3, 0.1, { no: 'nb', lampAt: (p) => frontWash(p[0], p[1]) });
  m.col(PAL.stone, 1.1).set({ surf: SURF.FLAGS }).box(-2.6, -0.5, 0, 2.6, 0, 1.5, { no: 'nb', lampAt: (p) => 0.5, aoLow: 0.7 });
  for (const [bx, by, sgn] of [[-0.9, 1.2, 1], [-0.9, 4.9, 1]]) { m.col(PAL.iron).set({ surf: SURF.PLAIN }); m.box(bx - 0.5, by, -0.4, bx + 1.6, by + 0.16, -0.34, { no: 'n', lamp: 0.3 }); }
  // ---- seven windows with closed plank shutters (two to each floor beside the great window, one in the gable): two leaves
  // each, a little askew, strap hinges, sill and lintel
  const wins = [[-6.3, 2.2, 3, 4.2], [6.3, 2.2, 3, 4.2], [-7.9, 11.6, 2.2, 3.6], [7.9, 11.6, 2.2, 3.6], [-7.6, 19.6, 2.2, 3.4], [7.6, 19.6, 2.2, 3.4], [0, 25.4, 1.9, 2.4]];
  for (const [cx, y0, w, h] of wins) {
    m.col(PAL.stone).set({ surf: SURF.STONE });
    m.box(cx - w / 2 - 0.35, y0 - 0.4, 0, cx + w / 2 + 0.35, y0, 0.3, { no: 'n', lampAt: (p) => frontWash(p[0], p[1]), aoLow: 0.7 });
    m.box(cx - w / 2 - 0.3, y0 + h, 0, cx + w / 2 + 0.3, y0 + h + 0.5, 0.12, { no: 'nb', lampAt: (p) => frontWash(p[0], p[1]) });
    for (const sx of [-1, 1]) {
      // each leaf from its hinge (the window's outer edge) to the meeting stile, its free edge standing a little out of true
      const out = 0.03 + 0.16 * fixed(), lw = w / 2 - 0.03, hx = cx + sx * w / 2, fx = hx - sx * lw, lampS = frontWash(cx, y0 + h / 2) * 0.9;
      const hp = (y) => [hx, y, 0.07], fp = (y) => [fx, y, 0.07 + out], ya = y0 + 0.05, yb = y0 + h - 0.05;
      m.col(PAL.blue, 0.75 + 0.3 * fixed()).set({ surf: SURF.WOOD });
      if (sx > 0) m.quad(fp(ya), hp(ya), hp(yb), fp(yb), { lamp: lampS, ao: 0.9, uv: [cx + sx, y0] });
      else m.quad(hp(ya), fp(ya), fp(yb), hp(yb), { lamp: lampS, ao: 0.9, uv: [cx + sx, y0] });
      m.col(PAL.iron).set({ surf: SURF.PLAIN });
      for (const hy of [y0 + 0.6, y0 + h - 0.75]) {
        const mx = hx - sx * lw * 0.7, mz = 0.1 + out * 0.7;
        if (sx > 0) m.quad([mx, hy, mz], [hx, hy, 0.1], [hx, hy + 0.15, 0.1], [mx, hy + 0.15, mz], { lamp: lampS * 0.4 });
        else m.quad([hx, hy, 0.1], [mx, hy, mz], [mx, hy + 0.15, mz], [hx, hy + 0.15, 0.1], { lamp: lampS * 0.4 });
      }
    }
    m.set({ M: null });
  }
  await ctx.yield();
  // ---- THE TWO CASEMENT LEAVES: oak and old glass, hung on the jambs' outer edges, open outward at 115 degrees. They do not swing.
  // Each leaf's inner face (the face that looks across the opening and a little out to the bay) takes the lamp at 3.2.
  const open = W.leafOpen * Math.PI / 180, T = 0.07;
  for (const sx of [-1, 1]) {
    await ctx.yield();
    const U = new THREE.Vector3(-sx * Math.cos(open), 0, Math.sin(open)), Nin = new THREE.Vector3(-sx * Math.sin(open), 0, -Math.cos(open));
    // local +w is the inner face for the east leaf; for the west leaf the frame is mirrored, so +w is the outer face
    const Z = sx > 0 ? Nin : Nin.clone().negate(), M = new THREE.Matrix4().makeBasis(U, new THREE.Vector3(0, 1, 0), Z).setPosition(sx * W.hw, W.y0, 0.02);
    // (the oak of the leaves takes the lamp at 1.1, their edges at 0.6: dark-edged leaves; the glass in them at 3.2)
    const inG = 2.7, inL = 1.1, outL = 0.35, lp = sx > 0 ? inL : outL, lmn = sx > 0 ? outL : inL, gp = sx > 0 ? inG : outL, gmn = sx > 0 ? outL : inG, le = 0.6, Lw = W.leafW, Lh = W.y1 - W.y0;
    m.col(PAL.oak).set({ surf: SURF.WOOD, M, ao: 1 });
    slab(m, 0, 0, 0.26, Lh, T, lp, lmn, le); slab(m, Lw - 0.26, 0, Lw, Lh, T, lp, lmn, le); slab(m, Lw / 2 - 0.11, 0.28, Lw / 2 + 0.11, Lh - 0.28, T, lp, lmn, le);
    const rails = [0, 1, 2, 3, 4].map((k) => k * Lh / 4), rh = 0.1;
    for (const [y0, y1] of [[0, 0.28], [Lh - 0.28, Lh], [rails[1] - rh, rails[1] + rh], [rails[2] - rh, rails[2] + rh], [rails[3] - rh, rails[3] + rh]]) slab(m, 0.26, y0, Lw - 0.26, y1, T, lp, lmn, le);
    // eight panes of old glass, a shade brighter than the oak, each crossed by two thin lead cames
    for (const [u0, u1] of [[0.26, Lw / 2 - 0.11], [Lw / 2 + 0.11, Lw - 0.26]]) for (const [y0, y1] of [[0.28, rails[1] - rh], [rails[1] + rh, rails[2] - rh], [rails[2] + rh, rails[3] - rh], [rails[3] + rh, Lh - 0.28]]) {
      m.col(PAL.glass).set({ surf: SURF.GLASS });
      m.quad([u0, y0, 0.02], [u1, y0, 0.02], [u1, y1, 0.02], [u0, y1, 0.02], { lamp: gp * 1.2, uv: [u0 * 3 + sx, y0] });
      m.quad([u1, y0, -0.02], [u0, y0, -0.02], [u0, y1, -0.02], [u1, y1, -0.02], { lamp: gmn * 1.2, uv: [u0 * 3 + 7, y0] });
      m.col(PAL.lead).set({ surf: SURF.PLAIN });
      for (const f of [1 / 3, 2 / 3]) { const y = y0 + (y1 - y0) * f; slab(m, u0, y - 0.025, u1, y + 0.025, 0.035, lp * 0.5, lmn * 0.5, 0.5); }
    }
    // the iron stay: from the leaf's outer face to a hook in the wall
    m.set({ M: null }).col(PAL.iron).set({ surf: SURF.PLAIN });
    const onLeaf = new THREE.Vector3(2.0, 4.2, sx > 0 ? -T : T).applyMatrix4(M);
    bar(m, [onLeaf.x, onLeaf.y, onLeaf.z], [sx * (W.hw + 2.6), W.y0 + 4.2, 0.05], 0.05, { lamp: 0.6 });
  }
  m.set({ M: null });
  return dressHero(ctx, S);
}

// the flame's breath on the world clock: a slow swell of 13 in 100 at 0.3 Hz (plain on the wall, the leaves and the steps),
// with 3 in 100 at about 6 Hz in it; never a flash, never under 84 in 100
export const breathAt = (t) => 1 + 0.03 * Math.sin(t * 37.7) * (0.6 + 0.4 * Math.sin(t * 14.3 + 1.1)) + 0.13 * Math.sin(t * 1.885);

async function dressHero(ctx, S) {
  const { group, m, light, fixed, chimneys } = S, H = HOUSE, W = WIN;
  // ---- the old vine: from the door's west side up to the eaves, west of the west leaf; leaves stir in the wind, gold where lit
  const stem = [[-2.7, 0, 0.22], [-3.6, 2.6, 0.25], [-5.6, 6.2, 0.25], [-8.2, 9.4, 0.25], [-9.0, 13.5, 0.25], [-8.8, 17.4, 0.25], [-9.1, 21, 0.25], [-8.0, 24.2, 0.3], [-5.4, 24.9, 0.3]];
  m.col('#4A4038').set({ surf: SURF.PLAIN, M: null });
  for (let i = 0; i < stem.length - 1; i++) bar(m, stem[i], stem[i + 1], 0.16 - i * 0.012, { lampAt: (p) => frontWash(p[0], p[1]) * 0.5, ao: 0.8 });
  m.set({ surf: SURF.LEAF });
  for (let i = 0; i < 360; i++) {
    if (i % 60 === 59) await ctx.yield();
    const t = Math.pow(fixed(), 0.8) * (stem.length - 1), k = Math.min(stem.length - 2, Math.floor(t)), f = t - k, a = stem[k], b = stem[k + 1];
    const spread = 0.5 + 1.2 * (t / stem.length), cx = a[0] + (b[0] - a[0]) * f + (fixed() - 0.5) * 2 * spread, cy = Math.min(H.eaves - 0.5, a[1] + (b[1] - a[1]) * f + (fixed() - 0.5) * 1.8), cz = 0.2 + 0.4 * fixed();
    const r = 0.3 + 0.28 * fixed(), ang = fixed() * 6.283, tilt = (fixed() - 0.5) * 0.9, ca = Math.cos(ang) * r, sa = Math.sin(ang) * r;
    m.col(PAL.vine, 0.7 + 0.7 * fixed());
    const L = frontWash(cx, cy) * 0.75;
    m.quad([cx - ca, cy - sa, cz], [cx + sa * 0.7, cy - ca * 0.7, cz + tilt * r], [cx + ca, cy + sa, cz + tilt * r * 0.6], [cx - sa * 0.7, cy + ca * 0.7, cz - tilt * r * 0.4], { lamp: L, sway: [0.04, 0.18, 0.3, 0.18], ao: 0.85 });
  }
  await ctx.yield();
  const mat = stoneMaterial(light, { side: THREE.DoubleSide });
  await ctx.yield();
  const hg = m.geometry(); await ctx.yield();
  const house = new THREE.Mesh(hg, mat); house.name = 'tall-house'; group.add(house);
  await ctx.yield();
  // ---- behind the opening's plane: the one flat sheet of the veil's gold (see the head of this file). Fixed in the world.
  // AS RULED IN THE JOIN SHEET: no larger than the opening, its edges on the opening's own (7 by 9.2)
  const sheetZ = -(H.wall + W.back), sg = new THREE.PlaneGeometry(2 * W.hw, W.y1 - W.y0);
  const sheet = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: GOLD, fog: false, toneMapped: false }));
  sheet.position.set(0, W.yc, sheetZ); sheet.name = 'behind-the-opening'; group.add(sheet);
  // ---- a dozen pale moths wheeling in the light, six a side, in two boxes beside the jambs and over the leaves: each keeps
  // to its own small round inside its box (centre and reach dealt once), so none comes nearer the line than MOTH.x0 less a wing
  // (the leaves' free edges stand at x 4.98; the boxes begin 5.5 m from the line, outside them)
  const MOTH = { x0: 5.5, x1: 8.8, y0: 11, y1: 22, z0: 0.8, z1: 4.4, n: 12, wing: 0.3 };
  const mp = [], mc = [], ma = [], mph = [], mq = [], mi = [];
  for (let i = 0; i < MOTH.n; i++) {
    const sx = i % 2 ? 1 : -1, ax = 0.4 + 0.9 * fixed(), ay = 0.5 + 1.4 * fixed(), az = 0.4 + 1.0 * fixed();
    const cx = sx * (MOTH.x0 + ax + fixed() * (MOTH.x1 - MOTH.x0 - 2 * ax)), cy = MOTH.y0 + ay + fixed() * (MOTH.y1 - MOTH.y0 - 2 * ay), cz = MOTH.z0 + az + fixed() * (MOTH.z1 - MOTH.z0 - 2 * az);
    const ph = [fixed() * 6.283, fixed() * 6.283, fixed() * 6.283, fixed()], b = mp.length / 3;
    for (const side of [-1, 1]) for (const q of [[0, 0.16], [side * MOTH.wing, 0.2], [side * MOTH.wing * 0.8, -0.14], [0, -0.1]]) { mp.push(0, 0, 0); mc.push(cx, cy, cz); ma.push(ax, ay, az); mph.push(...ph); mq.push(q[0], q[1]); }
    mi.push(b, b + 1, b + 2, b, b + 2, b + 3, b + 4, b + 6, b + 5, b + 4, b + 7, b + 6);
  }
  const mg = new THREE.BufferGeometry();
  mg.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); mg.setAttribute('aC', new THREE.Float32BufferAttribute(mc, 3)); mg.setAttribute('aA', new THREE.Float32BufferAttribute(ma, 3));
  mg.setAttribute('aPh', new THREE.Float32BufferAttribute(mph, 4)); mg.setAttribute('aQ', new THREE.Float32BufferAttribute(mq, 2)); mg.setIndex(mi);
  mg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, W.yc + 1.5, 2.5), 10);
  const mothMat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: light.uTime, uBreath: light.uBreath, uLampCol: light.uLampCol, uSky: light.uSky }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aC, aA; attribute vec4 aPh; attribute vec2 aQ; uniform float uTime; varying float vWing;
      #include <fog_pars_vertex>
      void main(){
        vec3 w = vec3(.7, .9, .55) * (.8 + .5 * aPh.w), c = aC + aA * sin(uTime * w + aPh.xyz), vel = aA * w * cos(uTime * w + aPh.xyz);
        vec3 f = normalize(vel + vec3(1e-3, 0., 0.)), s = normalize(cross(f, vec3(0., 1., 0.)) + vec3(0., 0., 1e-3)), up = cross(s, f);
        float flap = sin(uTime * (17. + 6. * aPh.w) + aPh.x * 9.);
        vec3 p = c + f * aQ.y + s * (aQ.x * cos(flap)) + up * (abs(aQ.x) * sin(flap));
        vWing = abs(aQ.x) * 3.;
        vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uBreath; uniform vec3 uLampCol, uSky; varying float vWing;
      #include <fog_pars_fragment>
      void main(){
        vec3 pale = vec3(.82, .8, .74) * (.75 + .25 * clamp(vWing, 0., 1.));
        gl_FragColor = vec4(pale * (uSky * .5 + uLampCol * 1.5 * uBreath), 1.);
        #include <fog_fragment>
      }`,
  });
  const moths = new THREE.Mesh(mg, mothMat); moths.name = 'moths'; group.add(moths);
  const center = new THREE.Vector3(0, W.yc, 0);
  return {
    object: group, radius: 20, height: H.ridge, center, light, mason: m, mothBox: MOTH,
    anchors: { window: new THREE.Vector3(0, W.yc, -H.wall), windowNormal: new THREE.Vector3(0, 0, 1), lineStart: new THREE.Vector3(0, W.yc, 60 - H.wall), leafClear: W.hw, chimneys },
    update(dt, time) { light.uTime.value = time; light.uBreath.value = breathAt(time); },
    ground: true, groundY: 0,
  };
}
