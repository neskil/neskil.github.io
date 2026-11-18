// BROUGHT IN: the hash sugarHash follows "Hash without Sine", Copyright (c)2014 David Hoskins, MIT License, published on Shadertoy; the same form as the kit's fx.js.
// valley-inside-the-works, the meadow: THE CONFECTIONER'S CRAFT. One material for everything that grows. It is lit by
// the scene's own two lights (the sun's part crossed by the plan's bars), sways in one light air, and wears sugar by a
// number each vertex carries (aS.y):
//   0 plain (stems, turf blades, bark)
//   1 CRYSTALLISED (petals): a frost of fine crystals; a few of them flash at a time as the eye or the bars move
//     (1 to 1.5: the same with a lighter frost, for the trees' blossom, which must keep its form in full light)
//   2 PULLED SUGAR (hawthorn leaves, reed and iris blades): glassy, a satin ribbon sheen, light coming through
//   3 SPUN SUGAR (the grasses' feathery heads, the webs): hair-fine pale gold threads that catch the light
// aS.x: how much it moves in the air; aS.z: how much light comes through it; aS.w: a thread's half width (signed by its
// edge; nought on everything that is not a thread). aT: a thread's own direction. uv: across and along a blade.
// The eye is read only for what the laws allow: a level of detail by its distance, the sheen and the glints, and a
// thread's breadth of one and a half grains. A THREAD so broadened covers more of the picture than it is broad: its
// cover is cut by the same share (its true breadth over its drawn breadth), the turf's own green standing for what
// lies behind it, so a thread far off is a faint line and never a bright wire.
// NO BLACK BLADES: a green that is darker than a clear deep green is lifted to it (its hue kept), whatever colour the
// form or the deal gave it; and whatever the lights give, in shade or lit from behind, a leaf or a blade is drawn no
// darker than 0.55 of its own colour, a little lighter along a blade's two edges.
// NOTHING BURNS TO WHITE: whatever the sun gives, the light a leaf, a blade or a blossom sends keeps its hue and is
// never brighter than a creamy white (0.85 of white, as the eye weighs the three colours): up to 0.55 it is as the
// lights made it, and above that it climbs ever more slowly toward 0.85, so the brighter part stays the brighter and
// a blossom in full sun still shows its own shading.
// THE SKY'S GLANCE (uSkyDir) is a direction of the world: toward the roof's glazed faces, up the valley and overhead
// (the plan's light without its lean to the right). The shader turns it into the lens's frame with viewMatrix.
import * as P from './valley-inside-the-works-plan.js';

// `shared` holds what every plant material of the part reads (the clock, the air, the picture's height, the flown line's x
// by z); mode: 0 a thing drawn whole at any range; 1 a plant in its real form, drawn in to its root from lod[0] to lod[1]
// metres from the eye; 2 the same plant's far form, which takes over there and is itself drawn in from lod[2] to lod[3];
// 3 a plant of the upper valley: the n-th of its stretch is drawn out to a range of its own, lod[0] + lod[1] / (1 + n / lod[2])
// metres (150 at most), growing from its root over the last lod[3] of them, and it broadens a little far off, so that a
// stretch thins with distance and keeps its cover; 4 a far form that gives way to a real one inside lod[0]..lod[1].
// (A level of detail by where the eye is: the laws allow it. A far form that has no near twin, by place, stands whole
// out to lod[2] and is drawn in from there to lod[3] like the rest.)
// uPixH is the height of the drawing in pixels (by it a thread is never drawn thinner than a grain and a half of the
// picture): the top file hands it in from the renderer's own size when the part is built (pixH) and sets it again
// from the renderer on every update. A build with no renderer draws no picture and never reads it.
export function sugarShared(THREE, look, routeX, pixH = 1) {
  const sky = new THREE.Vector3(0, P.LIGHT_DIR[1], P.LIGHT_DIR[2]).normalize();
  return { uTime: { value: 0 }, uWind: { value: new THREE.Vector2(0.86, 0.5) }, uPixH: { value: pixH }, uSkyCol: { value: look.sky.clone() }, uSkyDir: { value: sky }, uFrost: { value: 38 }, uRX: { value: routeX } };
}
export function sugarMaterial(THREE, shared, mode = 0, lod = [15, 19.5, 34, 42]) {
  const uniforms = { ...shared, uMode: { value: mode }, uLod: { value: new THREE.Vector4(lod[0], lod[1], lod[2], lod[3]) } };
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  m.userData.uniforms = uniforms;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec4 aS; attribute vec3 aT;
        uniform float uTime, uPixH, uMode; uniform vec2 uWind; uniform vec4 uLod; uniform float uRX[16];
        varying vec4 vS; varying vec3 vObj; varying vec2 vUvS; varying float vSeed, vThin;`)
      .replace('#include <begin_vertex>', `vec3 transformed = vec3(position);
        {
          #ifdef USE_INSTANCING
            mat4 mI = instanceMatrix;
          #else
            mat4 mI = mat4(1.0);
          #endif
          mat3 m3 = mat3(mI); vec3 root = mI[3].xyz; vec3 wp = m3 * transformed + root;
          #ifndef USE_INSTANCING
            root = vec3(aT.x, wp.y - aT.y, aT.z);      // a mesh that is not instanced hands each vertex its own root: (x, height over it, z)
          #endif
          if (uMode > 0.5) {
            float dEye = distance(root, cameraPosition), nearK = smoothstep(uLod.x, uLod.y, dEye), lod = 1.0 - nearK, wide = 1.0;
            if (uMode > 3.5) lod = nearK;
            else if (uMode > 2.5) {
              #ifdef USE_INSTANCING
                float reach = min(uLod.x + uLod.y / (1.0 + float(gl_InstanceID) / uLod.z), 150.0);
              #else
                float reach = 150.0;
              #endif
              lod = 1.0 - smoothstep(reach - uLod.w, reach, dEye); wide = 1.0 + 0.8 * smoothstep(uLod.x, uLod.x + 70.0, dEye);
            } else if (uMode > 1.5) {
              // (166, 16, -36 and 15.5 are the planting's Z_TOP, its table's step, Z_HI_END and NEAR, typed again: the two move together)
              float fi = clamp((166.0 - root.z) / 16.0, 0.0, 14.999); int i0 = int(floor(fi));
              float twin = step(-36.0, root.z) * step(root.z, 166.0) * step(abs(root.x - mix(uRX[i0], uRX[i0 + 1], fract(fi))), 15.5);
              lod = mix(1.0, nearK, twin) * (1.0 - smoothstep(uLod.z, uLod.w, dEye));
            }
            vec3 grown = (wp - root) * lod; grown.xz *= wide; wp = root + grown;
          }
          vThin = 1.0;
          float hgt = max(wp.y - root.y, 0.0), ph = dot(root.xz, vec2(0.31, 0.23));
          float gust = 0.5 * sin(uTime * 0.83 - ph) + 0.3 * sin(uTime * 1.9 - ph * 1.7 + root.x * 0.4) + 0.35 * sin(uTime * 0.31 - root.z * 0.09);
          vec2 lean = uWind * (0.035 + 0.05 * gust) * hgt * aS.x;
          lean += vec2(sin(uTime * 4.1 + wp.x * 3.1 + wp.z * 2.3), cos(uTime * 3.3 + wp.z * 2.9)) * 0.012 * aS.x * min(hgt, 1.5);
          wp.xz += lean; wp.y -= 0.35 * dot(lean, lean) / max(hgt, 0.4);
          #ifdef USE_INSTANCING
            if (abs(aS.w) > 0.0) {      // a thread: a ribbon turned to the eye, never thinner than a grain and a half of the picture
              vec3 tw = m3 * aT, toEye = cameraPosition - wp, side = cross(tw, toEye);
              side /= max(length(side), 1e-5);
              float grainM = length(toEye) * 2.0 / max(projectionMatrix[1][1] * uPixH, 1.0);
              float halfW = abs(aS.w) * length(m3[1]), drawn = max(halfW, 0.75 * grainM);
              wp += side * sign(aS.w) * drawn; vThin = halfW / max(drawn, 1e-6);      // (its true breadth over its drawn breadth)
            }
            transformed = inverse(m3) * (wp - root);
          #else
            transformed = wp;
          #endif
          vS = aS; vObj = position; vUvS = uv; vSeed = fract(dot(root.xz, vec2(0.731, 0.377)));
        }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTime, uFrost; uniform vec3 uSkyCol, uSkyDir;
        varying vec4 vS; varying vec3 vObj; varying vec2 vUvS; varying float vSeed, vThin;
        // sugarHash: BROUGHT IN, it follows "Hash without Sine" (c)2014 David Hoskins, MIT License; see the head of this file
        vec3 sugarHash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb = mix(vec3(0.07, 0.18, 0.04), diffuseColor.rgb, clamp(vThin, 0.0, 1.0));   // (a broadened thread's cover: the turf's green stands for what lies behind it)
        {
          // a dark green is lifted to a clear deep green (0.2 of green at the least), by how green it is
          float gG = max(diffuseColor.g, 1e-4), green = clamp((gG - max(diffuseColor.r, diffuseColor.b)) / gG * 4.0, 0.0, 1.0);
          diffuseColor.rgb *= mix(1.0, max(1.0, 0.2 / gG), green);
        }`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        {
          // (a kind between 1 and 1.5 is crystallised with a lighter frost: the trees' blossom, which must keep its form in full light)
          float kind = vS.y, isFrost = (1.0 - step(0.5, abs(kind - 1.0))) * (1.0 - 1.8 * abs(kind - 1.0)), isPulled = 1.0 - step(0.5, abs(kind - 2.0)), isSpun = step(2.5, kind);
          vec3 Vv = normalize(vViewPosition), Nn = normalize(normal);
          vec3 sunC = vec3(0.0), Lv = vec3(0.0, 1.0, 0.0);
          #if NUM_DIR_LIGHTS > 0
            Lv = directionalLights[0].direction; sunC = directionalLights[0].color * lightBar(vValleyBar);
          #endif
          vec3 Hh = Lv + Vv; Hh /= max(length(Hh), 1e-4);
          vec3 Hs = (viewMatrix * vec4(uSkyDir, 0.0)).xyz + Vv; Hs /= max(length(Hs), 1e-4);   // the sky's own glance, a direction of the world (the glass up the valley and overhead) turned into the lens's frame
          float toSun = clamp(dot(-Vv, Lv) * 0.5 + 0.5, 0.0, 1.0);          // 1 looking straight at the light
          // light through a thin thing: what falls on its far face comes through, most of all looking toward the light
          float far = max(dot(-Nn, Lv), 0.0);
          vec3 thru = diffuseColor.rgb * sunC * RECIPROCAL_PI * vS.z * (0.75 * far + 0.12) * (0.55 + 1.6 * toSun * toSun);
          thru *= mix(vec3(1.0), vec3(1.25, 1.2, 0.55), isPulled);          // pulled sugar glows green-gold
          // CRYSTALLISED: each crystal a facet of its own; it flashes when it turns the sun (or the sky) to the eye
          vec3 cp = vObj * uFrost; float cw = max(max(fwidth(cp.x), fwidth(cp.y)), fwidth(cp.z)), fine = 1.0 - smoothstep(0.35, 1.1, cw);
          vec3 rnd = sugarHash(floor(cp) + vSeed * 91.0);
          vec3 fn = Nn + (rnd - 0.5) * 1.5 + 0.12 * sin(uTime * (0.5 + rnd.z) + rnd.yzx * 6.2832); fn /= max(length(fn), 1e-3);
          float gl = clamp(dot(fn, Hh), 0.0, 1.0), gs = clamp(dot(fn, Hs), 0.0, 1.0);
          gl *= gl; gl *= gl; gl *= gl; gl *= gl; gl *= gl; gl *= gl;       // to the 64th: a crystal's flash is a point
          gs *= gs; gs *= gs; gs *= gs; gs *= gs; gs *= gs;
          float soft = clamp(dot(Nn, Hh), 0.0, 1.0); soft *= soft; soft *= soft; soft *= soft;
          vec3 frost = isFrost * (sunC * (7.0 * gl * fine + 0.22 * soft) + uSkyCol * (1.1 * gs * fine + 0.03));
          // PULLED: glassy; a band of sheen lies across the blade where its length turns the light to the eye
          vec3 tg = dFdy(vViewPosition) * dFdx(vUvS.x) - dFdx(vViewPosition) * dFdy(vUvS.x); tg /= max(length(tg), 1e-7);
          float th = dot(tg, Hh), band = clamp(1.0 - th * th, 0.0, 1.0); band *= band; band *= band; band *= band; band *= band;
          float tsk = dot(tg, Hs), bandS = clamp(1.0 - tsk * tsk, 0.0, 1.0); bandS *= bandS; bandS *= bandS; bandS *= bandS;
          float su = vUvS.x * 9.0, sw = fwidth(su), stri = mix(0.8, 0.55 + 0.45 * abs(fract(su) - 0.5) * 2.0, 1.0 - smoothstep(0.3, 1.0, sw));
          float fres = 1.0 - abs(dot(Nn, Vv)); fres *= fres;
          vec3 pulled = isPulled * (sunC * 0.9 * band * stri + uSkyCol * (0.28 * bandS * stri + 0.22 * fres));
          // SPUN: threads of pale gold; they take fire against the light
          vec3 spun = isSpun * vec3(1.0, 0.78, 0.4) * (sunC * (0.03 + 0.2 * toSun * toSun * toSun + 0.5 * gl) + uSkyCol * 0.05);
          totalEmissiveRadiance += (thru + frost + pulled + spun) * clamp(vThin, 0.0, 1.0);
          // the floor: what the lights leave darker than 0.55 of the thing's own colour is made up to it (0.75 along a blade's edges)
          vec3 lit = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
          vec3 least = diffuseColor.rgb * (0.55 + 0.2 * smoothstep(0.55, 1.0, abs(vUvS.x - 0.5) * 2.0));
          totalEmissiveRadiance += max(least - lit, vec3(0.0));
          // the frost's grain on the petal itself
          reflectedLight.indirectDiffuse *= 1.0 + isFrost * fine * (0.3 * rnd.x - 0.1);
        }`)
      .replace('#include <opaque_fragment>', `
        {
          // nothing burns to white: the light sent keeps its hue, and its brightness (as the eye weighs the three
          // colours) is bent over under a creamy white's: unchanged up to 0.55, then ever more slowly toward 0.85
          float sent = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
          if (sent > 0.55) { float over = (sent - 0.55) / 0.3; outgoingLight *= (0.55 + 0.3 * over / (1.0 + over)) / sent; }
        }
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'valley-meadow-sugar';
  return P.barMaterial(m);
}
