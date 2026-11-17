// THE CITY THAT LEFT, the sky: the kit's dome (night-blue to slate, stars that come out along the flight), over it the
// afterglow (an apricot band low toward azimuth -40, rose above it, four cirrus bars lit from underneath; or the
// visit's other hour), and the other cities that have already left, small as lanterns, climbing.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { GLOW_AZ, GLOW_DIR, HERO } from './the-city-that-left-common.js';
import { EAST_CREST_X } from './the-city-that-left-land.js';

// the hour of the visit: colours of the low band and of the sky above it, how much cloud, how many stars
export const HOURS = {
  apricot: { band: '#E99A5E', rose: '#8C5A6E', bandGain: 1.35, roseGain: 0.62, bandH: 0.085, roseH: 0.25, cirrus: 1, shelf: 0, stars: 1, moon: false, wet: 0, key: '#F0B08A', keyGain: 1, fogGlow: '#8C5A6E' },
  rain: { band: '#D9C36B', rose: '#5F8A78', bandGain: 1.25, roseGain: 0.5, bandH: 0.095, roseH: 0.27, cirrus: 0.5, shelf: 0, stars: 0.8, moon: false, wet: 1, key: '#E6D08A', keyGain: 0.95, fogGlow: '#6F8A7A' },
  deep: { band: '#C8643E', rose: '#5E3E66', bandGain: 0.95, roseGain: 0.55, bandH: 0.06, roseH: 0.2, cirrus: 0.7, shelf: 0, stars: 2, moon: true, wet: 0, key: '#D99A80', keyGain: 0.8, fogGlow: '#5E4466' },
  shelf: { band: '#E99A5E', rose: '#8C5A6E', bandGain: 1.3, roseGain: 0.6, bandH: 0.085, roseH: 0.24, cirrus: 0.6, shelf: 1, stars: 0.7, moon: false, wet: 0, key: '#F0B08A', keyGain: 1, fogGlow: '#8C5A6E' },
};

export function buildSky(ctx, S, opts = {}) {
  const hour = HOURS[opts.hour] || HOURS.apricot, rng = opts.forks.sky;
  const C = (h) => new THREE.Color(h);
  const sky = makeSky({
    rng, preset: 'blueHour', zenith: '#0C0F17', mid: '#262C3C', horizon: '#3A3B4A', ground: '#1f222c', horizonPow: 3.2, midPow: 1.0,
    scatter: 0, sunElevation: -6, sunAzimuth: -40, sunIntensity: 0, sunGlow: 0, stars: 0.14, twinkle: 0.8, starDensity: hour.stars > 1 ? 0.34 : 0.24, milkyWay: 0,
    bodies: hour.moon ? [{ elevation: 10, azimuth: 118, size: 1.25, phase: 0.96, phaseAngle: 60, intensity: 0.9, color: '#f2e6c8', glow: 0.22, glowColor: '#c8b890', glowSize: 5 }] : [],
    clouds: false, clouds2: false, bake: !!hour.moon, renderer: ctx.renderer,
  });
  // ---- the afterglow, the cirrus and the cloud shelf: one transparent dome drawn straight after the kit's
  const glowMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uTime: S.uniforms.uTime, uAz: { value: GLOW_AZ },
      uBandC: { value: C(hour.band).multiplyScalar(hour.bandGain) }, uRoseC: { value: C(hour.rose).multiplyScalar(hour.roseGain) },
      uH: { value: new THREE.Vector2(hour.bandH, hour.roseH) }, uCirrus: { value: hour.cirrus }, uShelf: { value: hour.shelf },
      uSeed: { value: rng.range(0, 40) },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uAz, uCirrus, uShelf, uSeed; uniform vec3 uBandC, uRoseC; uniform vec2 uH;
      varying vec3 vDir;
      float sH(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
      float sN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
        return mix(mix(sH(i), sH(i + vec2(1., 0.)), f.x), mix(sH(i + vec2(0., 1.)), sH(i + vec2(1., 1.)), f.x), f.y); }
      // one cirrus bar: centre (azimuth from the glow, elevation), half length, thickness; x, y in radians
      vec2 bar(float da, float e, vec4 b, float tilt){
        float x = da - b.x, y = e - b.y - tilt*x - .012*(sN(vec2(x*5. + uSeed, b.x*9.)) - .5);
        float along = 1. - smoothstep(b.z*.35, b.z, abs(x));
        float w = b.w*(.6 + .8*sN(vec2(x*18. + uSeed, b.y*90.)));
        float dens = exp(-y*y/max(w*w, 1e-6))*along*smoothstep(.1, .8, .6*sN(vec2(x*14. + uSeed, y*60. + b.y*50.)) + .7*sN(vec2(x*5. - uSeed, b.x*3.)));
        return vec2(dens, 1. - smoothstep(-w, w, y));                         // density, how much of it is the lit underside
      }
      void main(){
        vec3 d = vDir / max(length(vDir), 1e-4);
        float e = asin(clamp(d.y, -1., 1.));
        float az = atan(d.x + 1e-6, -d.z), da = az - uAz; da = atan(sin(da), cos(da) + 1e-6);
        float up = max(e, 0.);
        float lobeA = exp(-da*da/(.8*.8)), lobeR = exp(-da*da/(1.3*1.3));
        float band = exp(-up*up/(uH.x*uH.x))*lobeA, rose = exp(-up*up/(uH.y*uH.y))*lobeR;
        vec3 col = uBandC*band + uRoseC*rose*(1. - .6*band);
        float a = clamp(band + rose*.85, 0., 1.);
        // cirrus low in the north-west, drifting; rose underneath, slate on top
        float dr = da - uTime*.00035;
        vec2 c1 = bar(dr, e, vec4(-.52, .13, .34, .007), .03), c2 = bar(dr, e, vec4(-.1, .185, .42, .009), -.02);
        vec2 c3 = bar(dr, e, vec4(.33, .1, .27, .006), .05), c4 = bar(dr, e, vec4(-.9, .22, .3, .008), -.04);
        float cd = clamp((c1.x + c2.x + c3.x + c4.x)*uCirrus, 0., 1.), under = (c1.x*c1.y + c2.x*c2.y + c3.x*c3.y + c4.x*c4.y)/max(c1.x + c2.x + c3.x + c4.x, 1e-4);
        vec3 cirLit = (uBandC*.8 + uRoseC*.7)*lobeR, cirDark = vec3(.035, .04, .075);
        col = mix(col, mix(cirDark, cirLit, under), cd*.8); a = max(a, cd*.8);
        // a high shelf of cloud lit from below (one of the visit's hours)
        // (its pattern is laid on a flat layer overhead, so it has no seam anywhere round the sky)
        vec2 lay = d.xz / max(d.y + .25, .2);
        float sy = (e - .42)/.2, shelf = uShelf*smoothstep(-1., -.2, sy)*(1. - smoothstep(.6, 1.6, sy))*smoothstep(.3, .62, sN(lay*2.6 + vec2(uSeed - uTime*.002, uSeed*.37)) + .25*sN(lay*14. + uSeed));
        vec3 shelfC = mix(vec3(.03, .035, .065), uRoseC*1.2 + uBandC*.25, (1. - smoothstep(-.9, .5, sy))*(.35 + .65*lobeR));
        col = mix(col, shelfC, shelf*.85); a = max(a, shelf*.85);
        float fade = smoothstep(-.07, .0, e);
        gl_FragColor = vec4(col*fade, a*fade);
      }`,
  });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(3600, 48, 24), glowMat);
  glow.renderOrder = -0.9; glow.frustumCulled = false;

  // ---- the other cities (each a town on its own rough slab of rock): one draw of quads, each at its own bearing. They are bystanders, on the world clock: each
  // climbs all the time at its own rate inside its own band of the sky (it comes up faint out of the haze at the
  // foot of the band and thins away to nothing at the top, and then the next one is coming up), and where in its
  // band it is as the visit begins is drawn. So the sky reads the same whatever the clock says when we come in.
  const n = opts.cities ?? 16, cr = opts.forks.skyCities;
  const base = new THREE.PlaneGeometry(2, 2), ig = new THREE.InstancedBufferGeometry();
  ig.setAttribute('position', base.attributes.position); ig.setAttribute('uv', base.attributes.uv); ig.setIndex(base.index);
  const A = new Float32Array((n + 1) * 4), Bt = new Float32Array((n + 1) * 2), Ln = new Float32Array((n + 1) * 2);
  const deg = Math.PI / 180;
  // put(i, bearing, foot and top of its band of sky, size, degrees climbed a second): all in degrees
  const put = (i, az, lo, hi, size, rate) => { A[i * 4] = az * deg; A[i * 4 + 1] = cr.range(lo, hi) * deg; A[i * 4 + 2] = size * deg * 0.5; A[i * 4 + 3] = rate * deg; Bt[i * 2] = cr(); Bt[i * 2 + 1] = cr(); Ln[i * 2] = lo * deg; Ln[i * 2 + 1] = (hi - lo) * deg; };
  // the big neighbour: south-east, a little right of the last heading (azimuth 135)
  put(0, 149, 8, 24, 2.5, 0.022);
  for (let i = 1; i < n; i++) {
    // five over our town as seen from the valley to the south (their band starts just over its roofs), four in the
    // south-east, the rest anywhere but low in the afterglow
    if (i <= 5) put(i, -26 + (i - 1) * 13.5 + cr.range(-4, 4), 13, 31, cr.range(1.1, 1.5), cr.range(0.02, 0.06));
    else if (i <= 9) put(i, 100 + (i - 6) * 19 + cr.range(-6, 6), 7, 38, cr.range(0.45, 1.5), cr.range(0.02, 0.06));
    else put(i, cr.range(-180, 180), 7, 44, cr.range(0.45, 1.5), cr.range(0.02, 0.06));
  }
  // rare: a second town breaking the skyline beyond the east ridge. It is leaving as ours is: its rise is paced to
  // the flight like ours (it starts below the ridge and comes clear of it about half way along).
  // It stands in the world: 2,400 m beyond the crest of the east ridge, abreast of our town on the ridge's own
  // (north-south) line. Its bearing is taken from where the eye is every frame.
  const second = !!opts.second, secondAt = new THREE.Vector3(EAST_CREST_X + 2400, 0, HERO.z);
  A[n * 4] = 78 * deg; A[n * 4 + 1] = -3.2 * deg; A[n * 4 + 2] = 3.4 * deg * 0.5; A[n * 4 + 3] = 0; Bt[n * 2] = cr(); Bt[n * 2 + 1] = cr(); Ln[n * 2] = -3.2 * deg; Ln[n * 2 + 1] = 1;
  ig.setAttribute('aCity', new THREE.InstancedBufferAttribute(A, 4)); ig.setAttribute('aSeed', new THREE.InstancedBufferAttribute(Bt, 2)); ig.setAttribute('aBand', new THREE.InstancedBufferAttribute(Ln, 2));
  ig.instanceCount = second ? n + 1 : n;
  const cityMat = new THREE.ShaderMaterial({
    depthWrite: false, transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { uTime: S.uniforms.uTime, uGold: S.uniforms.uGold, uRise: { value: 0 }, uLast: { value: n }, uLastAz: { value: 78 * deg } },
    vertexShader: /* glsl */`
      attribute vec4 aCity; attribute vec2 aSeed, aBand;
      uniform float uTime, uRise, uLast, uLastAz;
      varying vec2 vUv; varying vec2 vSeed; varying float vPx, vShow;
      void main(){
        float isLast = step(uLast - .5, float(gl_InstanceID));
        // where in its band of sky it is by now (0 at the foot, 1 at the top, round and round)
        float span = max(aBand.y, 1e-4), f = fract((aCity.y - aBand.x + aCity.w*uTime)/span);
        vShow = mix(smoothstep(0., .12, f)*(1. - smoothstep(.85, 1., f)), 1., isLast);
        float az = mix(aCity.x, uLastAz, isLast), el = mix(aBand.x + f*span, aCity.y + uRise, isLast);
        vec3 dir = vec3(sin(az)*cos(el), sin(el), -cos(az)*cos(el));
        vec3 rt = normalize(vec3(cos(az), 0., sin(az))), upv = cross(rt, dir);
        vec3 p = cameraPosition + (dir + (rt*position.x + upv*position.y)*aCity.z*1.7)*3300.;
        vUv = position.xy*1.7; vSeed = aSeed;
        gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
        vPx = aCity.z;                                                           // its half-size in the sky, in radians
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGold;
      varying vec2 vUv; varying vec2 vSeed; varying float vPx, vShow;
      float sH(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
      void main(){
        vec2 p = vUv; float x = clamp(p.x, -1., 1.), show = clamp(vShow, 0., 1.), edgeK = clamp(1. - x*x, 0., 1.);
        // the rock under it: a shallow slab cut out of its country, ragged along its underside, never a smooth lens
        float jag = sH(vec2(floor((x + 1.)*11. + vSeed.y*9.), vSeed.x*17.));
        float belly = -(.14 + .2*sqrt(edgeK) + .11*jag*edgeK);
        float lens = step(abs(p.x), 1.)*smoothstep(belly - .02, belly + .02, p.y)*(1. - smoothstep(-.02, .02, p.y));
        // the town on it: an uneven skyline, low toward its edges, with two or three towers standing out of it
        float colm = floor((x + 1.)*13. + vSeed.x*7.), hc = sH(vec2(colm, vSeed.y*31.)), tw = step(.84, sH(vec2(colm*1.7, vSeed.x*53.)));
        float sky = (.07 + .2*hc + .36*tw)*smoothstep(0., .45, edgeK)*step(abs(p.x), .96);
        float town = step(0., p.y)*(1. - smoothstep(sky - .02, sky + .02, p.y));
        // its windows are lit in clusters: some quarters bright, some dark
        vec2 wc = floor(vec2((x + 1.)*30., p.y*46.));
        float quarter = smoothstep(.25, .6, sH(floor(wc/vec2(4., 5.)) + vSeed*23.));
        float win = step(.5, sH(wc + vSeed*57.))*quarter*town;
        // small on screen: the windows of a quarter run together into that quarter's own glow, inside the skyline
        float px = clamp(vPx*500., 0., 60.), fine = smoothstep(5., 24., px);
        vec3 col = uGold*(win*mix(.9, 2.2, fine) + town*quarter*(.3 + .7*hc)*mix(1.2, 0., fine));
        // its field shows only as a faint haze on the one limb the sun, already under the horizon, grazes from below:
        // soft, gone well inside the card's edge, never a line round it
        vec2 fp = p - vec2(0., .05); float fr = length(fp);
        float graze = clamp(dot(fp / max(fr, 1e-3), vec2(-.55, -.83)), 0., 1.);
        col += vec3(.6, .5, .5)*smoothstep(.75, 1.15, fr)*(1. - smoothstep(1.15, 1.6, fr))*graze*graze*.02;
        float a = clamp(lens*.94 + town*.8, 0., 1.);
        col += vec3(.012, .014, .024)*(lens + town*(1. - win));
        gl_FragColor = vec4(col, a)*show;
      }`,
  });
  const cities = new THREE.Mesh(ig, cityMat); cities.renderOrder = -0.8; cities.frustumCulled = false;
  const object = new THREE.Group(); object.add(sky.object, glow, cities);
  const eye = new THREE.Vector3();
  return {
    object, sky, glow, cities, hour,
    // risen: the share of its rise our town has done (0 to 1). The stars come out as it goes up; the second town,
    // which is leaving as ours is, has climbed 11 degrees of our sky by the time ours is done.
    update(dt, time, camera, risen) {
      sky.update(dt, time, camera);
      eye.setFromMatrixPosition(camera.matrixWorld); glow.position.copy(eye);
      if (sky.uniforms.uStars) sky.uniforms.uStars.value.x = lerp(0.14, 0.42, risen) * Math.min(1.4, hour.stars);
      cityMat.uniforms.uRise.value = clamp(risen, 0, 1) * 11 * Math.PI / 180;
      cityMat.uniforms.uLastAz.value = Math.atan2(secondAt.x - eye.x, -(secondAt.z - eye.z));
    },
    dispose() { sky.dispose?.(); },
  };
}
