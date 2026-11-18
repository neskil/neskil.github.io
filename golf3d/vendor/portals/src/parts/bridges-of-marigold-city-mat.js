// bridges-of-marigold, the city: THE TWO MATERIALS. Both are lit materials of three (they take the scene's lights and
// fog) that also light themselves, since at night the city is its own light: a cool fill of the sky's colour on every
// wall, warm light pooled round lit openings and lamps, and the openings themselves.
// U (shared uniforms): uTime, uFill (the sky's fill), uWarm (the lamps' colour), uDensity (the share of lit openings).
import { GLSL_HASH, GLSL_VALUE_NOISE } from '../kit/fx.js';
import { TOWERS } from './bridges-of-marigold-plan.js';

// THE HOUSES: one unit block per house (its own z points out of the tower). Per house: iCol (the wall's paint) and
// iA = (seed, 0, shade 0..1: how open to the lamps the house stands, 0); iB = (bays of the front, floors, which cells
// a balcony stands before: first bay + 8 * bays + 64 * floor, or 0, the door's bay). The same material draws the tiled roofs
// that stand on some blocks (a second instanced shape with the block's own numbers; its points lie over the block).
// Its flat varyings (vHs, vCol, vA, vB) are per-instance values (the instance's own matrix and attributes): the same
// at all three corners of every triangle. This material is only ever given to instanced shapes.
// The shader lays out, from the seed alone: bays and floors, which cells hold an opening, its size, square or arched
// head, a door on the ground floor of the front, shutters shut or open, and behind open ones a lamp-lit room, a
// coloured curtain or a candle that flickers; a painted dado, a cornice, a lamp on a bracket with its pool of light.
export function makeHouseMaterial(THREE, U) {
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uTime: U.uTime, uFill: U.uFill, uWarm: U.uWarm, uDensity: U.uDensity });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 iCol; attribute vec4 iA, iB; varying vec3 vHp, vHn, vWp; flat varying vec3 vHs, vCol; flat varying vec4 vA, vB;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vHp = position; vHn = normal; vCol = iCol; vA = iA; vB = iB;
        #ifdef USE_INSTANCING
          vHs = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          vWp = (modelMatrix * instanceMatrix * vec4(position, 1.)).xyz;
        #else
          vHs = vec3(1.); vWp = (modelMatrix * vec4(position, 1.)).xyz;
        #endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHp, vHn, vWp; flat varying vec3 vHs, vCol; flat varying vec4 vA, vB; uniform float uTime, uDensity; uniform vec3 uFill, uWarm;\n' + GLSL_HASH + GLSL_VALUE_NOISE)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + HOUSE_FRAG)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += hEmis;');
  };
  mat.customProgramCacheKey = () => 'marigold-city-house-6';
  return mat;
}

const HOUSE_FRAG = /* glsl */`
  vec3 hEmis = vec3(0.);
  {
    vec3 an = abs(vHn), m = vHp * vHs; float seed = vA.x, shade = mix(.4, 1., vA.z);
    float yg = m.y + vHs.y * .5, topd = vHs.y * .5 - m.y;
    float h1 = hash11(seed * 91.7 + 3.), h2 = hash11(seed * 57.3 + 11.), h3 = hash11(seed * 23.1 + 7.), h4 = hash11(seed * 131.9 + 5.);
    vec3 wallC = vCol, dc;
    float lum = dot(wallC, vec3(.3, .6, .1));
    vec3 trimC = lum > .42 ? mix(vec3(.04, .1, .42), vec3(.5, .1, .05), step(.5, h2)) : mix(vec3(.8, .74, .62), wallC * .3 + .02, step(.72, h3));
    // the lamps of the street, by place: one may hang in each 9 m of the city's air (some coloured, as the strings are);
    // each throws a soft pool on whatever plaster is near it
    vec3 pools = vec3(0.);
    {
      vec3 g = vWp / 9. - .5, gi = floor(g);
      for (int i = 0; i < 8; i++) {
        vec3 c = gi + vec3(float(i & 1), float((i >> 1) & 1), float((i >> 2) & 1));
        vec3 r = hash33(c + 17.3); float on = step(r.x + r.y, .95);
        vec3 lp = (c + .5 + (hash33(c * 1.7 + 4.1) - .5) * .7) * 9., d = vWp - lp;
        float hue = fract(r.z * 7.3);
        vec3 lc = r.z < .62 ? uWarm : (hue < .25 ? vec3(.15, .9, .8) : (hue < .5 ? vec3(1., .2, .62) : (hue < .75 ? vec3(.6, .34, 1.) : vec3(.55, 1., .25)))) * .7;
        pools += lc * on * exp(-dot(d, d) / 22.);
      }
    }
    vec3 nightC = uFill * 1.15;
    if (vHp.y > .5005) {
      // the tiled roof that stands on the block: ridges run down each slope
      float across = an.x > an.z ? m.z : m.x, down = an.x > an.z ? m.x : m.z, fwr = fwidth(across) + fwidth(down);
      float ridge = abs(fract(across / .46) - .5) * 2., lap = fract(down / .7 + .5 * floor(across / .46));
      dc = vec3(.5, .18, .08) * (.55 + .6 * ridge / (1. + fwr * 5.)) * (1. - .25 * smoothstep(.75, 1., lap) / (1. + fwr * 5.)) * (.78 + .44 * vnoise(vec2(across, down) * .7 + seed * 50.));
      hEmis += dc * (nightC * 1.4 + (uWarm * .06 + pools * .5) * shade);
    } else if (an.y > .5) {
      vec2 q = m.xz, hf = vHs.xz * .5; float e = min(hf.x - abs(q.x), hf.y - abs(q.y)), fw = fwidth(q.x) + fwidth(q.y);
      if (vHn.y > 0.) {
        // a flat roof: lime-washed cement inside a coping of the wall's own paint
        dc = mix(wallC * .45, vec3(.3, .25, .24), .6) * (.8 + .4 * vnoise(q * .6 + seed * 31.));
        dc = mix(dc, wallC * .8 + .04, 1. - smoothstep(.3, .36 + fw, e));
        hEmis += dc * (nightC * 1.25 + (uWarm * .05 + pools * .45) * shade);
      } else {
        float beam = smoothstep(.3, .36, abs(fract(q.x / .9) - .5));
        dc = mix(vec3(.2, .11, .06), vec3(.07, .05, .06), beam / (1. + fw * 3.));
        hEmis += dc * (nightC * .5 + (uWarm * .25 + pools * .6) * shade);
      }
    } else {
      bool side = an.x > an.z; bool front = !side && vHn.z > 0.;
      float wl = side ? vHs.z : vHs.x, wu = side ? m.z : m.x;
      float fw = fwidth(wu) + fwidth(m.y), aa = 1. / (1. + fw * 3.);
      float faceId = side ? (vHn.x > 0. ? 1. : 2.) : (front ? 0. : 3.);
      // this house's own way with openings: how wide its bays, how many floors, how many cells are open, how big
      float bays = (front && vB.x > .5) ? vB.x : max(1., floor(wl / (2.2 + 2.2 * h1))), bw = wl / bays;
      float floors = vB.y > .5 ? vB.y : clamp(floor((vHs.y + (h2 - .5) * 1.5) / 2.75), 2., 3.), fh = vHs.y / floors;
      float pres = mix(.45, .96, hash11(seed * 41.3)), big = mix(.74, 1.36, h3);
      float bu = (wu / wl + .5) * bays, fv = yg / fh;
      vec2 cell = vec2(floor(bu), floor(fv));
      float hc = hash13(vec3(cell, seed * 311. + faceId * 17.)), hc2 = hash13(vec3(cell + 7.3, seed * 173. + faceId * 5.));
      float st = hash13(vec3(cell * 1.7 + 3.1, seed * 97. + faceId * 3.));
      float doorBay = vB.x > .5 ? vB.w : floor(h2 * bays);
      float ground = 1. - step(.5, cell.y), isDoor = ground * (1. - step(.25, abs(cell.x - doorBay))) * (front ? 1. : 0.);
      // a balcony of real timber and iron stands before some cells (vB.z says which): there the opening is a door to it
      float bfl = floor(vB.z / 64.), bn = floor(mod(vB.z, 64.) / 8.), bx = mod(vB.z, 8.);
      float onB = (front && vB.z > .5 && abs(cell.y - bfl) < .25 && cell.x > bx - .25 && cell.x < bx + bn - .75) ? 1. : 0.;
      float has = max(max(isDoor, onB), 1. - step(side ? pres * .5 : pres, hc));
      float tall = max(onB, (1. - ground) * step(.7, hc2) * (1. - isDoor));
      // kinds of opening: a door; a wide arched shop mouth beside it; a round eye high in a wall; else a window, tall or not
      float shop = ground * (1. - isDoor) * step(.84, hc) * (front ? 1. : 0.), eye = (1. - ground) * (1. - tall) * step(.93, hc2) * (1. - onB);
      has = max(has, shop);
      // no upper floor of a wall shows exactly two openings side by side (two alone over a door or a sill can read as a
      // face): where the dealt cells would leave two, a wall of three bays and more opens every cell of that floor, and a
      // wall of two bays keeps one (the door of a real balcony if there is one)
      if (ground < .5) {
        float cnt = 0., anyB = 0.;
        for (int i = 0; i < 6; i++) {
          float fi = float(i);
          if (fi < bays - .5) {
            float hi = hash13(vec3(fi, cell.y, seed * 311. + faceId * 17.));
            float bi = (front && vB.z > .5 && abs(cell.y - bfl) < .25 && fi > bx - .25 && fi < bx + bn - .75) ? 1. : 0.;
            cnt += max(bi, 1. - step(side ? pres * .5 : pres, hi)); anyB = max(anyB, bi);
          }
        }
        if (cnt > 1.5 && cnt < 2.5) {
          if (bays > 2.5) has = 1.;
          else has *= step(abs(cell.x - (anyB > .5 ? bx : floor(hash11(seed * 19.7 + cell.y * 3.3) * 1.999))), .25);
        }
      }
      float ww = min(isDoor > .5 ? .64 + .14 * h3 : mix((.4 + .22 * hc2) * big, bw * .5 - .4, shop), bw * .5 - .34);
      float ox = (fract(bu) - .5) * bw - (st - .5) * max(0., bw - 2. * ww - .9), oy = fract(fv) * fh;
      float sill = isDoor + shop > .5 ? 0. : mix(.8 + .3 * hc, .1, tall), head = isDoor + shop > .5 ? 2.2 + .25 * h3 : min(fh - .45, .8 + .3 * hc + (1.05 + .5 * h4) * big);
      vec2 q = vec2(abs(ox), oy); float yc = head - ww;
      float dBox = max(q.x - ww, max(sill - q.y, q.y - head));
      float dArch = q.y > yc ? length(vec2(q.x, q.y - yc)) - ww : max(q.x - ww, sill - q.y);
      float archK = max(shop, step(hash11(seed * 7.7 + 1.) * 1.6 - .3, hc2));
      float dO = mix(mix(dBox, dArch, archK), length(vec2(ox, oy - fh * .55)) - .46, eye);
      float inO = has * (1. - smoothstep(-fw, fw, dO)), inF = has * (1. - smoothstep(.13 - fw, .13 + fw, dO));
      // far off, where an opening is under about two pixels, its pattern is faded into the mean brightness of its cell
      // (plain anti-aliasing); and the painted relief below grows with distance so that it still reads
      float far = smoothstep(.7, 1.6, fw), far2 = smoothstep(.25, .8, fw);
      float cov = has * clamp(1.8 * ww * (head - sill) / (bw * fh), 0., 1.);
      // the wall: limewash that has weathered; an older coat or the bare plaster where it has worn through (most at the
      // foot and under the eaves); a painted dado, a cornice; a moulding round each opening, lit above and dark below
      float n1 = vnoise(vec2(wu + seed * 40., m.y) * .4), n2 = vnoise(vec2(wu * 1.7 + seed * 9., m.y * 2.1) * 1.3);
      vec3 old = mix(vec3(.6, .54, .47), wallC.gbr * .7 + .06, step(.55, h1));
      float worn = smoothstep(.6, .68 + fw, n1 * .55 + n2 * .45 + .2 * (1. - smoothstep(0., 2.2, yg)) + .14 * (1. - smoothstep(0., 1.3, topd)));
      dc = wallC * (.76 + .48 * n1) * (1. - .25 * smoothstep(.45, .9, vnoise(vec2(wu * 2.1 + seed * 9., m.y * .12))) * aa);
      dc = mix(dc, old * (.7 + .5 * n2), worn * .85 * aa);
      dc = mix(dc, mix(wallC * .42, trimC, step(.5, h4) * .7) * (.8 + .4 * n2), (1. - smoothstep(1., 1.04 + fw, yg)) * aa);
      dc = mix(dc, trimC, (1. - smoothstep(.3, .34 + fw, topd)) * .8 * aa);
      // seen from afar: a dark eave line, a paler plinth; on some fronts a painted balcony (a pale slab, its railing,
      // its shadow on the wall below) where no real one stands
      dc = mix(dc, vec3(.035, .025, .05), (1. - smoothstep(.4, .5 + fw, topd)) * far2 * .85);
      dc = mix(dc, mix(wallC, vec3(.8, .74, .62), .5) * 1.1, (1. - smoothstep(1.15, 1.25 + fw, yg)) * far2 * .7);
      float pb = (front && vB.z < .5) ? step(hash11(seed * 61.7), .55) : 0.;
      float bhw = wl * mix(.2, .46, h2), by = yg - fh, bin = pb * (1. - smoothstep(bhw, bhw + .05 + fw, abs(wu - (h1 - .5) * (wl - 2. * bhw))));
      dc *= 1. - .55 * bin * step(by, 0.) * (1. - smoothstep(0., .75 + fw, -by));
      dc *= 1. - .3 * bin * step(0., by) * (1. - smoothstep(.85, .9 + fw, by)) * mix(1., .5 + .5 * step(.5, fract(wu / .15)), aa);
      dc = mix(dc, vec3(.62, .57, .5), bin * (1. - smoothstep(.08, .12 + fw * .5, abs(by - .02))));
      float edge = smoothstep(.13, .0, abs(dO - .065)) * has * (1. - inO);
      dc = mix(dc, trimC * (oy > mix(sill, head, .5) ? 1.25 : .7), inF * (1. - inO) * (1. - far));
      // open shutters stand either side of some lit windows; shut ones fill the opening
      float hl = hash11(seed * 13.3), litShare = mix(.12, .8, hl * hl) * uDensity * step(.06, hl);
      float lit = max(step(st, litShare), onB * step(st, .8) * step(.06, hl)), curtain = step(st, litShare * .26), candle = step(litShare * .78, st) * lit;
      float openDoor = max(isDoor * step(hc2, mix(.45, 1., far2)), shop * step(.06, hl));      // (from afar every front shows its lit doorway)
      vec3 shutC = hc2 < .2 ? vec3(.03, .15, .16) : (hc2 < .4 ? vec3(.04, .06, .28) : (hc2 < .6 ? vec3(.2, .1, .05) : (hc2 < .8 ? vec3(.28, .05, .04) : vec3(.05, .19, .08))));
      float slat = .72 + .5 * step(.5, fract(oy / .11)), split = smoothstep(.0, .03 + fw, abs(ox));
      float leaf = has * lit * step(.5, h4) * (1. - isDoor) * (1. - shop) * (1. - eye) * (1. - tall) * step(ww + .16, q.x) * step(q.x, 2. * ww + .1) * step(sill, q.y) * step(q.y, head);
      dc = mix(dc, shutC * 1.6 * mix(1., slat, aa), leaf * aa);
      dc = mix(dc, shutC * mix(1., slat * (.55 + .45 * split), aa), inO * (1. - far));
      // the room behind: glazing bars, a grille of iron before a ground-floor window, the deep jamb in shade
      float bars = 1. - (1. - smoothstep(.0, .035 + fw, abs(ox))) * .8 - (1. - smoothstep(.0, .03 + fw, abs(oy - mix(sill, head, .62)))) * .6;
      float grille = ground * (1. - isDoor) * (1. - shop) * step(.5, h1) * (1. - smoothstep(.02, .035 + fw, abs(fract(ox / .17) - .5) * .17)) * .7;
      float jamb = 1. - .65 * (1. - smoothstep(.0, .16, -dO)) * step(oy, head - .05);
      float room = (.6 + .65 * vnoise(vec2(ox * 1.3 + cell.x * 5., oy * .8 + cell.y * 3.) + seed * 70.)) * mix(1., clamp(bars, 0., 1.) * (1. - grille), aa) * mix(1., jamb, aa);
      vec3 warm = mix(vec3(1., .45, .12), vec3(1., .72, .34), hc2);
      float cs = fract(st * 613.);
      vec3 cur = cs < .25 ? vec3(1., .2, .4) : (cs < .5 ? vec3(.1, .85, .78) : (cs < .75 ? vec3(.6, .28, 1.) : vec3(.4, 1., .28)));
      vec3 glowC = mix(warm, cur * (.75 + .25 * sin(ox * 21.)), curtain * (1. - shop));
      float flick = .62 + .3 * sin(uTime * (6. + 5. * hc) + st * 60.) * sin(uTime * 2.3 + hc * 40.);
      float power = mix(1.7, 1.15 * flick, candle) * (1. - isDoor) * (1. - shop) * lit + openDoor * 2. * (1.15 - .5 * oy / 2.4);
      hEmis += glowC * power * mix(room * inO, .9 * cov, far);
      dc = mix(dc, vec3(.02), inO * step(.01, power) * (1. - far));
      // light on the wall: the pools of the street's lamps, this house's own lamp on its bracket, its own lit openings;
      // between them the night's blue and violet
      float lamp = (front ? 1. : 0.) * step(hash11(seed * 29.1), .4), lx = (h4 - .5) * wl * .7, ly = min(vHs.y - .9, 3.1);
      vec2 ld = vec2(wu - lx, yg - ly); float lr = dot(ld, ld);
      float pool = lamp * (exp(-lr / 9.) * .75 + exp(-lr / .8) * .7) * (ld.y < 0. ? 1. : .6);
      float wash = step(.01, power) * has * exp(-max(dO, 0.) * 1.7) * .62 * (1. - inO);
      float under = 1. - .55 * (1. - smoothstep(0., 1.2 + 1.3 * far2, topd));
      vec3 lightW = (uWarm * (.045 + pool + wash) + pools * .62) * shade * under * (side ? .5 : 1.);
      hEmis += dc * lightW + mix(dc, vec3(dot(dc, vec3(.34))), .5) * nightC * (.75 + .5 * under);
      hEmis += dc * uWarm * edge * .12 * aa;
      float lampR = .14 + fw * .5;      // (the lamp's disc keeps its light as it shrinks under a pixel)
      hEmis += vec3(1., .62, .26) * 4.5 * lamp * (1. - smoothstep(.1, .16 + fw, sqrt(max(lr, 1e-6)))) * min(1., .03 / (lampR * lampR));
    }
    diffuseColor.rgb = dc;
  }`;

// EVERYTHING ELSE (merged, with vertex colours): aux = (kind, a number for that kind).
//   0 stone in courses (number: warm light baked at the place, 0..2)      1 plain paint, timber, iron (number: the same)
//   2 a light of its own (number: its strength)                          3 a heap of marigolds (number: its own glow)
//   4 fired tiles: number 0 roof tiles in ridges, 1 a floor laid in a pattern of squares (no figure in it)
//   5 the dark inside of a tower                                         6 cloth on a line (number: how far it swings)
//   7 a timber or iron member of a scaffold, a crane or a rail (number: warm light at the place)
//   9 carved stone: a diaper of raised lozenges with a boss in each (number: warm light at the place)
//   10 a flag of cut paper on a line: its colour, with a flower, a sun or a leaf cut out of it and small holes round
//      (number: which of the three); it flutters, pinned along its top
//   11 the underside of tower 7's deck: a sun of orange rays on blue, edged white, in fired tiles (no face in it)
//   (any kind but 10 may ride the water: its third number is then the phase of a slow rise and fall of 7 cm)
//   8 a railing 1 m high: rails and bars with air between (number: the height of its foot); far off, where a bar is
//     finer than a pixel, it is drawn as a dim panel instead
export function makeStoneMaterial(THREE, U) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uTime: U.uTime, uFill: U.uFill, uWarm: U.uWarm });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aux; uniform float uTime; varying vec3 vLp, vLn; varying vec4 vAux;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        if (aux.x > 5.5 && aux.x < 6.5) transformed += normal * sin(uTime * 2.6 + position.x * 1.9 + position.y * 2.7 + position.z * 1.3) * .16 * aux.y;
        if (aux.x < 9.5 && aux.z > 0.) transformed.y += sin(uTime * 1.1 + aux.z) * .07;
        if (aux.x > 9.5 && aux.x < 10.5) transformed += normal * sin(uTime * 3.1 + position.x * 1.3 + position.z * 1.7) * .14 * (1. - aux.w);
        vLp = (modelMatrix * vec4(transformed, 1.)).xyz; vLn = normal; vAux = aux;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLp, vLn; varying vec4 vAux; uniform float uTime; uniform vec3 uFill, uWarm;\n' + GLSL_HASH + GLSL_VALUE_NOISE)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + STONE_FRAG)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += hEmis;')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\nif (hDrop > .5) discard;');
  };
  mat.customProgramCacheKey = () => 'marigold-city-stone-4';
  return mat;
}

const STONE_FRAG = /* glsl */`
  #define SUN_X ${TOWERS[7].x.toFixed(2)}
  #define SUN_Z ${TOWERS[7].z.toFixed(2)}
  vec3 hEmis = vec3(0.); float hDrop = 0.;
  {
    float kind = vAux.x, par = vAux.y; vec3 lp = vLp, an = abs(vLn), dc = diffuseColor.rgb;
    float wallU = an.x > an.z ? lp.z : lp.x, fw = fwidth(lp.y) + fwidth(wallU), vert = 1. - smoothstep(.55, .8, an.y);
    if (kind < .5) {
      float course = lp.y / .9, row = floor(course), bu = wallU / 2.1 + hash12(vec2(row, 7.)) ;
      float dj = min(min(fract(course), 1. - fract(course)) * .9, min(fract(bu), 1. - fract(bu)) * 2.1);
      dc *= mix(1., .62, (1. - smoothstep(.02, .07 + fw, dj)) / (1. + fw * 5.) * vert);
      dc *= (.74 + .5 * vnoise(vec2(wallU, lp.y) * .23 + 3.1)) * (.9 + .2 * hash12(vec2(floor(bu), row)) / (1. + fw * 3.));
      vec2 g = lp.xz; float pf = fwidth(g.x) + fwidth(g.y); vec2 pj = abs(fract(g / 1.6) - .5) * 1.6;
      dc *= mix(1., 1. - .3 * (1. - smoothstep(.02, .07 + pf, min(pj.x, pj.y))) / (1. + pf * 4.), 1. - vert);
      hEmis += dc * (uFill * (.8 + .5 * an.y) + uWarm * par);
    } else if (kind < 1.5) {
      dc *= .84 + .3 * vnoise(vec2(wallU, lp.y) * .9 + lp.zx * .4);
      hEmis += dc * (uFill + uWarm * par);
    } else if (kind < 2.5) {
      hEmis += dc * par * (.86 + .14 * sin(uTime * 5.3 + lp.x * 3.1 + lp.z * 2.3)); dc *= .05;
    } else if (kind < 3.5) {
      vec3 g = lp * 9.; float sp = hash13(floor(g)), sp2 = vnoise(lp.xz * 2.3 + lp.y * 1.7);
      dc = mix(vec3(.95, .34, .02), vec3(1., .62, .06), sp) * (.55 + .6 * sp2);
      hEmis += dc * (uFill * .6 + vec3(1., .82, .6) * par);
    } else if (kind < 4.5) {
      vec2 g = lp.xz; float pf = fwidth(g.x) + fwidth(g.y);
      if (par < .5) {
        float ridge = abs(fract((g.x + g.y) / .6) - .5) * 2.;
        dc *= (.6 + .55 * ridge / (1. + pf * 4.)) * (.85 + .3 * vnoise(g * .8));
        hEmis += dc * (uFill * 1.2 + uWarm * .12);
      } else {
        vec2 c = floor(g / .8), f = fract(g / .8) - .5; float ch = mod(c.x + c.y, 2.), dm = abs(f.x) + abs(f.y);
        vec3 a = dc, b = vec3(.72, .64, .5), k = vec3(.05, .16, .5);
        vec3 t = mix(a, b, ch); t = mix(t, k, (1. - smoothstep(.16, .19 + pf, dm)) * ch / (1. + pf * 3.));
        t *= 1. - .35 * (1. - smoothstep(.0, .03 + pf, min(.5 - abs(f.x), .5 - abs(f.y)))) / (1. + pf * 5.);
        dc = t * (.85 + .25 * vnoise(g * .5));
        hEmis += dc * (uFill * 1.1 + uWarm * (.3 + .25 * vnoise(g * .13 + 5.)));
      }
    } else if (kind < 5.5) {
      dc = vec3(.012, .008, .022); hEmis += dc * uFill * 2.;
    } else if (kind < 6.5) {
      hEmis += dc * (uFill * 1.2 + uWarm * .5);
    } else if (kind > 10.5) {
      vec2 p = lp.xz - vec2(SUN_X, SUN_Z); float r = length(p), th = atan(p.y, p.x + 1e-5), pf = fwidth(p.x) + fwidth(p.y);
      float tri = abs(fract(th * 3.8197) - .5) * 2., w = clamp((21.2 - r) / 8.4, 0., 1.), e = .04 + pf * .2;
      float ray = 1. - smoothstep(w - e, w + e, tri), rim = smoothstep(w, w + .1, tri) - smoothstep(w + .1 + e, w + .22 + e, tri);
      dc = mix(vec3(.05, .16, .55), vec3(.86, .82, .74), max(rim, smoothstep(20.5, 20.6 + pf, r)));
      dc = mix(dc, mix(vec3(.95, .45, .06), vec3(1., .66, .1), step(.5, fract(th * 1.9099))), ray);
      vec2 tj = abs(fract(p / .6) - .5) * .6;
      dc *= 1. - .3 * (1. - smoothstep(.015, .04 + pf, min(tj.x, tj.y))) / (1. + pf * 4.);
      dc *= .85 + .3 * vnoise(p * .7);
      hEmis += dc * (uFill * 1.3 + uWarm * (.35 + .9 * exp(-(r - 20.2) * (r - 20.2) / 6.)));
    } else if (kind > 9.5) {
      // cut paper: a rosette of petals, a sun of rays or a leaf with its ribs, small lozenge holes round it, a scalloped hem
      vec2 uv = vec2(vAux.z, vAux.w > 1. ? 2. - vAux.w : vAux.w), p = uv - vec2(.5, .52);
      float fu = fwidth(uv.x) + fwidth(uv.y), r = length(p), a = atan(p.y, p.x + 1e-5);
      float flower = step(r, .3 * (.55 + .45 * abs(cos(a * 3.)))) * step(.07, r);
      float sun = step(r, .16) * step(.08, r) + step(.2, r) * step(r, .34) * step(.55, abs(cos(a * 6.)));
      float leaf = step(abs(p.x) + .9 * p.y * p.y * 3., .2) * step(.025, abs(p.x)) * step(.5, fract(p.y * 9. + abs(p.x) * 6.) + .3);
      float cut = par < .5 ? flower : (par < 1.5 ? sun : leaf);
      vec2 gq = abs(fract(uv * vec2(5., 4.)) - .5);
      cut = max(cut, step(gq.x + gq.y, .2) * step(.36, r));
      cut = max(cut, step(uv.y, .1 * abs(sin(uv.x * 15.708))));
      float fine = smoothstep(.06, .16, fu);
      hDrop = cut * (1. - step(.5, fine));
      dc *= mix(1., .72, fine);
      hEmis += dc * (uFill * 1.3 + uWarm * .75);
    } else if (kind > 8.5) {
      vec2 c = fract(vec2(wallU, lp.y) / .8) - .5; float d = abs(c.x) + abs(c.y), fc = 1. / (1. + fw * 5.);
      float ring = smoothstep(.2, .24 + fw, d) - smoothstep(.36, .4 + fw, d), boss = 1. - smoothstep(.07, .11 + fw, length(c));
      dc *= 1. + fc * ((ring + boss) * (c.y > 0. ? .38 : .12) - .32 * (smoothstep(.38, .42, d) - smoothstep(.44, .5, d)));
      dc *= .8 + .4 * vnoise(vec2(wallU, lp.y) * .5 + 7.);
      hEmis += dc * (uFill + uWarm * par);
    } else if (kind > 7.5) {
      float v = lp.y - par, bar = abs(fract(wallU / .3) - .5);
      float solid = max(max(1. - smoothstep(.09, .1 + fw, v), smoothstep(.9 - fw, .91, v)), 1. - smoothstep(.1, .11 + fw, bar));
      float fine = smoothstep(.05, .14, fw);
      hDrop = (1. - solid) * (1. - step(.5, fine));
      dc *= mix(1., .5 + .5 * solid, fine);
      hEmis += dc * (uFill + uWarm * .5);
    } else {
      hEmis += dc * (uFill + uWarm * par);
    }
    diffuseColor.rgb = dc;
  }`;
