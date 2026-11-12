// HDR pipeline: scene -> bloom -> tone map + grade -> screen.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const POST_DEFAULTS = {
  exposure: 1.0,
  bloomStrength: 0.45, bloomRadius: 0.65, bloomThreshold: 0.9,
  saturation: 1.05, contrast: 1.04,
  tint: '#ffffff',      // multiplies the image (white = neutral)
  shadowTint: '#000000', // added into the darks (black = neutral)
  vignette: 0.32, grain: 0.025, aberration: 0.0,
  flat: 0,            // 1 = no filmic tone curve: a colour's linear value reaches the screen as written (for flat-colour, printed looks)
  fov: 62,
};

export function normalizePost(p = {}) {
  const o = { ...POST_DEFAULTS, ...p };
  if (p.bloom) { o.bloomStrength = p.bloom.strength ?? o.bloomStrength; o.bloomRadius = p.bloom.radius ?? o.bloomRadius; o.bloomThreshold = p.bloom.threshold ?? o.bloomThreshold; }
  if (p.grade) Object.assign(o, p.grade);
  o.tint = new THREE.Color(o.tint); o.shadowTint = new THREE.Color(o.shadowTint);
  return o;
}

const NUM = ['exposure', 'bloomStrength', 'bloomRadius', 'bloomThreshold', 'saturation', 'contrast', 'vignette', 'grain', 'aberration', 'flat', 'fov'];
export function blendPost(a, b, t, out) {
  for (const k of NUM) out[k] = a[k] + (b[k] - a[k]) * t;
  out.tint.copy(a.tint).lerp(b.tint, t); out.shadowTint.copy(a.shadowTint).lerp(b.shadowTint, t);
  return out;
}

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null }, uExposure: { value: 1 }, uSaturation: { value: 1 }, uContrast: { value: 1 },
    uTint: { value: new THREE.Color(1, 1, 1) }, uShadowTint: { value: new THREE.Color(0, 0, 0) },
    uVignette: { value: 0.3 }, uGrain: { value: 0.02 }, uAberration: { value: 0 }, uTime: { value: 0 }, uFade: { value: 1 }, uFlat: { value: 0 },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: /* glsl */`precision highp float;
    uniform sampler2D tDiffuse; uniform float uExposure,uSaturation,uContrast,uVignette,uGrain,uAberration,uTime,uFade,uFlat;
    uniform vec3 uTint,uShadowTint; varying vec2 vUv;
    vec3 RRTAndODTFit(vec3 v){ vec3 a=v*(v+.0245786)-.000090537; vec3 b=v*(.983729*v+.4329510)+.238081; return a/b; }
    vec3 aces(vec3 c){
      const mat3 inM=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));
      const mat3 outM=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));
      c=inM*c; c=RRTAndODTFit(c); c=outM*c; return clamp(c,0.,1.); }
    vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-.055, step(.0031308,c)); }
    float hash(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
    void main(){
      vec2 c = vUv-.5; float r2 = dot(c,c);
      vec3 col;
      if(uAberration>0.0001){ vec2 o=c*r2*uAberration;
        col=vec3(texture2D(tDiffuse,vUv+o).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-o).b);
      } else col=texture2D(tDiffuse,vUv).rgb;
      col = max(col,0.)*uExposure*uTint;
      col = mix(aces(col/.6), clamp(col,0.,1.), uFlat);
      float l = dot(col, vec3(.2126,.7152,.0722));
      col = mix(vec3(l), col, uSaturation);
      col = (col-.5)*uContrast+.5;
      col += uShadowTint*(1.-smoothstep(0.,.6,l))*.5;
      col *= mix(1., smoothstep(.95,.15,r2*1.9), uVignette);
      col = toSRGB(clamp(col,0.,1.));
      col += (hash(gl_FragCoord.xy+fract(uTime)*311.7)-.5)*uGrain;
      gl_FragColor = vec4(col*uFade,1.);
    }`,
};

// Removes not-a-number, infinite and absurdly bright pixels before bloom. One such pixel (a zero-length
// normal, a pow() of a negative number in some shader) is otherwise smeared by the bloom blur into
// large black squares on real GPUs.
const GuardShader = {
  uniforms: { tDiffuse: { value: null }, uTexel: { value: new THREE.Vector2(1 / 1280, 1 / 720) } },
  vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: /* glsl */`precision highp float;
    uniform sampler2D tDiffuse; uniform vec2 uTexel; varying vec2 vUv;
    // Bit tests as well as isnan(): a shader compiler that assumes no value is ever not-a-number may drop
    // comparisons, but cannot drop these. True for not-a-number, infinity and anything beyond +-60000.
    bool badf(float x){ return isnan(x) || isinf(x) || (floatBitsToUint(x) & 0x7fffffffu) > 0x476a6000u; }
    vec4 clean(vec2 uv){
      vec3 c = textureLod(tDiffuse, uv, 0.).rgb;
      bool bad = badf(c.r) || badf(c.g) || badf(c.b);
      return bad ? vec4(0.) : vec4(clamp(c, -400., 400.), 1.);
    }
    void main(){
      vec4 c = clean(vUv);
      if (c.a < .5) {
        // fill the hole with what surrounds it: look further out (1, 3, 9 ... 243 pixels) until something valid is found
        float r = 1.; vec2 d = uTexel * .7, e = vec2(uTexel.x, -uTexel.y) * .7;
        for (int i = 0; i < 6; i++) {
          c = clean(vUv + vec2(uTexel.x, 0.) * r) + clean(vUv - vec2(uTexel.x, 0.) * r) + clean(vUv + vec2(0., uTexel.y) * r) + clean(vUv - vec2(0., uTexel.y) * r)
            + clean(vUv + d * r) + clean(vUv - d * r) + clean(vUv + e * r) + clean(vUv - e * r);
          if (c.a > .5) break;
          r *= 3.;
        }
        c.rgb = c.a > .5 ? c.rgb / c.a : vec3(0.);
      }
      float a = textureLod(tDiffuse, vUv, 0.).a;   // the bloom pass weighs each pixel by this, so it must pass through unchanged
      gl_FragColor = vec4(c.rgb, badf(a) ? 1. : clamp(a, 0., 1.));
    }`,
};

export class Post {
  constructor(renderer, w, h, pixelRatio, samples = 4, type = THREE.HalfFloatType) {
    this.renderer = renderer;
    const rt = new THREE.WebGLRenderTarget(w * pixelRatio, h * pixelRatio, { type, samples });
    this.composer = new EffectComposer(renderer, rt);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(w, h);
    this.renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.6, 0.9);
    // The vendor pass's blur takes its bell's sigma as the kernel's radius and stops the taps at one sigma, so the edge
    // tap still weighs 0.6 of the centre: a near box, and a small bright lamp close to the lens glowed as a square.
    // Here each blur is a true bell of the same width (the old taps' own spread is about half the radius) taken out to
    // 2.5 sigma, where a tap weighs 0.04: the glow is as wide as before and round.
    for (const m of this.bloom.separableBlurMaterials) {
      const s = 0.5 * m.defines.KERNEL_RADIUS, n = Math.ceil(2.5 * s) + 1, c = [];
      for (let i = 0; i < n; i++) c.push(Math.exp(-0.5 * i * i / (s * s)));
      m.defines.KERNEL_RADIUS = n; m.uniforms.gaussianCoefficients.value = c; m.needsUpdate = true;
    }
    this.final = new ShaderPass(FinalShader);
    this.guard = new ShaderPass(GuardShader);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.guard);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.final);
    this.guard.uniforms.uTexel.value.set(1 / Math.max(1, w * pixelRatio), 1 / Math.max(1, h * pixelRatio));
    if (type !== THREE.HalfFloatType) this.bloom.enabled = false;   // the glow pass needs float buffers
  }
  // Has every pass's shader program made before the first frame needs it, without holding the page up: the passes
  // that draw into buffers are compiled with a buffer set and the last one for the screen (a program is specific to
  // which of the two it draws into). The final pass is made both ways, since a style lens after it sends it to a buffer.
  prewarm(buffer, camera) {
    const r = this.renderer, quad = this.final.fsQuad._mesh.geometry, jobs = [], b = this.bloom;
    const one = (mat, toScreen) => { if (!mat) return; r.setRenderTarget(toScreen ? null : buffer); try { jobs.push(r.compileAsync(new THREE.Mesh(quad, mat), camera)); } catch (e) { /* made on first use instead */ } };
    try {
      one(this.guard.material, false);
      if (b.enabled) { one(b.materialHighPassFilter, false); for (const m of b.separableBlurMaterials || []) one(m, false); one(b.compositeMaterial, false); one(b.blendMaterial, false); }
      one(this.final.material, false); one(this.final.material, true);
    } finally { r.setRenderTarget(null); }
    return Promise.allSettled(jobs);
  }
  // what the glow pass added over the last frame (rgb times alpha), or null when there is no glow pass
  get bloomTexture() { return this.bloom.enabled ? this.bloom.renderTargetsHorizontal[0].texture : null; }
  setSize(w, h, pixelRatio) { this.composer.setPixelRatio(pixelRatio); this.composer.setSize(w, h); this.guard.uniforms.uTexel.value.set(1 / Math.max(1, w * pixelRatio), 1 / Math.max(1, h * pixelRatio)); }
  // antialiasing level of the picture (0 = none); the buffers are rebuilt on their next use
  setSamples(n) { for (const rt of [this.composer.renderTarget1, this.composer.renderTarget2]) { rt.samples = n; rt.dispose(); } }
  // an optional style lens runs after everything else (see style.js)
  setStylePass(pass) {
    if (this.stylePass) this.composer.removePass(this.stylePass);
    this.stylePass = pass || null;
    if (pass) this.composer.addPass(pass);
  }
  render(scene, camera, p, time, fade = 1) {
    this.renderPass.scene = scene; this.renderPass.camera = camera;
    this.bloom.strength = p.bloomStrength; this.bloom.radius = p.bloomRadius; this.bloom.threshold = p.bloomThreshold;
    const u = this.final.uniforms;
    u.uExposure.value = p.exposure; u.uSaturation.value = p.saturation; u.uContrast.value = p.contrast;
    u.uTint.value.copy(p.tint); u.uShadowTint.value.copy(p.shadowTint);
    u.uVignette.value = p.vignette; u.uGrain.value = p.grain; u.uAberration.value = p.aberration; u.uFlat.value = p.flat || 0; u.uTime.value = time; u.uFade.value = fade;
    this.composer.render();
  }
}
