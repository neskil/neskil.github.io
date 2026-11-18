// bridges-of-marigold, the air: THE NIGHT SKY. It is always night (design, section 7): the hour only tints that
// night. No sun and no moon disc. Three things, all carried round the rendering lens at the far distance as a sky is:
//   THE DOME (the kit's makeSky, its own stars and bodies off): a deep blue-violet fall from zenith to horizon and one
//     low wash of colour on the side the hour names (teal in the north by night; rose and pale gold in the east at
//     dawn; ember-red in the west at dusk; under the hidden moon of 'day' a brighter, cooler sky behind a high veil).
//   THE STARS: this part's own, each dealt its own place on the upper sky by the sky's stream (no lattice), its own
//     size in pixels, colour and brightness: most faint and fine, a few bright; they twinkle by the world's clock
//     and fade toward the horizon. Besides those, a faint BAND of many small stars along one great circle.
//   THE HAZE: a band of the fog's own colour round the horizon, whole at the horizon's line and gone a few degrees
//     over it, so that the sky's lowest band and the far mist are one and no hard horizon shows.
// Bearings of the kit's sky: azimuth 0 looks down -z (north), +90 down +x (east).
import { makeSky } from '../kit/sky.js';

// What each hour deals. sky: the dome. air: the fog's colour and the fill the world file gives its lights.
// mist: the gulf's own mist colour. veil: the high thin cloud (day only).
export const HOURS = {
  night: {
    zenith: '#0d0a30', mid: '#1a1250', horizon: '#33247e', wash: '#18b0a2', washAz: 0, scatter: 0.62, scatterPow: 2.6, stars: 1.25,
    fog: '#1e1450', fillSky: '#4a3aa8', fillGround: '#6a3a1c', fill: 1.0, key: '#35c2b6', keyI: 0.55, keyAz: 0, mist: '#2c2466', veil: 0,
    exposure: 1.08, tint: '#fff6ee', shadow: '#1c1232',
  },
  dawn: {
    zenith: '#110e38', mid: '#2c1e5a', horizon: '#6a3a72', wash: '#ff8f7a', washAz: 90, scatter: 0.85, scatterPow: 3.2, stars: 0.7,
    fog: '#2a183f', fillSky: '#6a4a9c', fillGround: '#70401e', fill: 1.1, key: '#ffb08a', keyI: 0.6, keyAz: 90, mist: '#3a2458', veil: 0,
    exposure: 1.04, tint: '#fff2ee', shadow: '#1e1230',
  },
  golden: {
    zenith: '#0e0a2e', mid: '#221246', horizon: '#4a1c44', wash: '#e2401c', washAz: -90, scatter: 0.8, scatterPow: 3.6, stars: 1.0,
    fog: '#200e30', fillSky: '#553a8a', fillGround: '#74381a', fill: 1.0, key: '#ff7a48', keyI: 0.55, keyAz: -90, mist: '#361c44', veil: 0,
    exposure: 1.06, tint: '#fff3e6', shadow: '#1e102a',
  },
  day: {
    zenith: '#0e1a44', mid: '#1a3868', horizon: '#2c6a86', wash: '#3fd0c0', washAz: 0, scatter: 0.5, scatterPow: 2.0, stars: 0.75,
    fog: '#12284a', fillSky: '#4a78b4', fillGround: '#5a3c22', fill: 1.35, key: '#9fd6e6', keyI: 0.9, keyAz: 35, mist: '#243e66', veil: 0.34,
    exposure: 1.0, tint: '#f2f8ff', shadow: '#101a36',
  },
};

const STAR_VERT = /* glsl */`
attribute vec4 aDir, aLum; uniform float uTime, uPx, uFar, uStars; varying vec2 vQ; varying vec3 vCol;
void main(){
  vec4 mv = viewMatrix*vec4(cameraPosition + aDir.xyz*uFar, 1.);
  mv.xy += position.xy*(uPx*uFar*aDir.w);
  float tw = 0.72 + 0.28*sin(uTime*(1.6 + 3.4*aLum.w) + aLum.w*97.);
  vCol = aLum.rgb*tw*uStars*smoothstep(0.03, 0.3, aDir.y); vQ = position.xy*2.;
  gl_Position = projectionMatrix*mv; }`;
const STAR_FRAG = /* glsl */`
varying vec2 vQ; varying vec3 vCol;
void main(){ float d = min(length(vQ), 1.), k = 1. - d; gl_FragColor = vec4(vCol*k*k, 1.); }`;
const HAZE_VERT = /* glsl */`
uniform float uFar; varying float vE;
void main(){ vE = position.y; vec4 mv = viewMatrix*vec4(cameraPosition + position*uFar, 1.); gl_Position = projectionMatrix*mv; }`;
const HAZE_FRAG = /* glsl */`
uniform vec3 uHaze; uniform float uTop; varying float vE;
void main(){ float a = 1. - smoothstep(0.004, uTop, vE); gl_FragColor = vec4(uHaze*a, a); }`;

export async function buildSky(ctx, o) {
  const { THREE, rng, hour, U, detail } = o, H = HOURS[hour], FAR = 3000;
  const sky = makeSky({
    rng, preset: 'night', bodies: [], clouds: false, stars: 0, milkyWay: 0,
    clouds2: H.veil ? { coverage: H.veil, stretch: 1, opacity: 0.42, lit: '#7fa8c8', shade: '#1c3050', scale: 0.8 } : false,
    zenith: H.zenith, mid: H.mid, horizon: H.horizon, ground: H.fog, horizonPow: 3.0, groundFalloff: 3,
    sunElevation: -7, sunAzimuth: H.washAz, sunIntensity: 0, sunGlow: 0,
    scatterColor: H.wash, scatter: H.scatter, scatterPow: H.scatterPow, scatterHigh: 0.02, scatterFall: 5.5, fogColor: H.fog,
  });
  const group = new THREE.Group(); group.add(sky.object);
  await ctx.yield();
  // ---- the stars: a place on the upper sky, a size in pixels, a colour and a brightness for each
  const n = Math.round(1000 * Math.min(1, 0.5 + 0.5 * detail)), nb = Math.round(3000 * Math.min(1, 0.5 + 0.5 * detail)), D = new Float32Array((n + nb) * 4), L = new Float32Array((n + nb) * 4);
  for (let i = 0; i < n; i++) {
    const y = rng(), az = rng() * Math.PI * 2, mag = rng(), hue = rng(), tw = rng(), r = Math.sqrt(Math.max(0, 1 - y * y));
    const big = Math.pow(mag, 9), b = 0.1 + 0.42 * mag * mag * mag + 2.8 * big;
    const c = hue < 0.6 ? [0.86, 0.9, 1] : hue < 0.82 ? [1, 0.86, 0.7] : hue < 0.93 ? [0.7, 0.82, 1] : [1, 0.74, 0.62];
    D[i * 4] = r * Math.cos(az); D[i * 4 + 1] = y; D[i * 4 + 2] = r * Math.sin(az); D[i * 4 + 3] = 1.5 + 0.7 * mag + 3.2 * big;
    L[i * 4] = c[0] * b; L[i * 4 + 1] = c[1] * b; L[i * 4 + 2] = c[2] * b; L[i * 4 + 3] = tw;
  }
  // THE BAND: more stars, small and faint, gathered along one great circle that climbs out of the south-west, stands
  // a hand high in the south and high in the east (a place of the sky, as the wash is): thickest along its middle line
  const dirOf = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  const u0 = dirOf(3.23, 0.31), nrm = new THREE.Vector3().crossVectors(u0, dirOf(2.0, 0.72)).normalize(), v0 = new THREE.Vector3().crossVectors(nrm, u0);
  for (let i = n; i < n + nb; i++) {
    const ph = rng() * Math.PI * 2, off = (rng() + rng() + rng() - 1.5) * (0.1 + 0.2 * rng()), mag = rng(), hue = rng(), tw = rng(), c = Math.cos(off), s = Math.sin(off), b = 0.1 + 0.42 * mag * mag * mag;
    const col = hue < 0.6 ? [0.86, 0.9, 1] : hue < 0.85 ? [1, 0.86, 0.72] : [0.74, 0.84, 1];
    D[i * 4] = (Math.cos(ph) * u0.x + Math.sin(ph) * v0.x) * c + nrm.x * s; D[i * 4 + 1] = (Math.cos(ph) * u0.y + Math.sin(ph) * v0.y) * c + nrm.y * s;
    D[i * 4 + 2] = (Math.cos(ph) * u0.z + Math.sin(ph) * v0.z) * c + nrm.z * s; D[i * 4 + 3] = 1.4 + 0.8 * mag;
    L[i * 4] = col[0] * b; L[i * 4 + 1] = col[1] * b; L[i * 4 + 2] = col[2] * b; L[i * 4 + 3] = tw;
  }
  const quad = new THREE.PlaneGeometry(1, 1), sg = new THREE.InstancedBufferGeometry();
  sg.index = quad.index; sg.setAttribute('position', quad.attributes.position);
  sg.setAttribute('aDir', new THREE.InstancedBufferAttribute(D, 4)); sg.setAttribute('aLum', new THREE.InstancedBufferAttribute(L, 4)); sg.instanceCount = n + nb;
  const sm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
    uniforms: { uTime: U.uTime, uPx: U.uPx, uFar: { value: FAR }, uStars: { value: H.stars } } });
  const stars = new THREE.Mesh(sg, sm); stars.frustumCulled = false; stars.renderOrder = -0.6; group.add(stars);
  // ---- the haze band: a short upright ring of unit radius, scaled to the far distance in the shader
  const hg = new THREE.CylinderGeometry(1, 1, 0.5, 48, 1, true).translate(0, 0.07, 0);
  const hm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.BackSide, vertexShader: HAZE_VERT, fragmentShader: HAZE_FRAG,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { uFar: { value: FAR }, uHaze: { value: new THREE.Color(H.fog) }, uTop: { value: 0.085 } } });
  const haze = new THREE.Mesh(hg, hm); haze.frustumCulled = false; haze.renderOrder = -0.4; group.add(haze);
  return {
    object: group, sky, triangles: 32 + (n + nb) * 2 + 96, drawCalls: 4,
    update(dt, time, camera) { sky.update(dt, time, camera); },
    prewarm(renderer, scene) { return sky.prewarm(renderer, null, scene); },
    dispose() { if (sky.dispose) sky.dispose(); quad.dispose(); sg.dispose(); sm.dispose(); hg.dispose(); hm.dispose(); },
  };
}
