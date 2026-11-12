// Style lenses: an optional full-screen pass that redraws the finished picture in an art style
// (woodblock print, watercolour, ink wash ...). One lens per world at most, eased in after the
// portal and out again before the next one, so every crossing happens in the plain picture.
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import * as core from '../kit/core.js';
import { STYLES } from '../extras.js';

const { smoothstep, makeRng, hashSeed } = core;

// Every lens is a GLSL function  vec3 style(vec2 uv, vec3 base)  compiled between these two blocks.
// The input picture is the finished frame: display-referred sRGB, 0..1.
export const STYLE_PRELUDE = /* glsl */`precision highp float;
uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime, uStrength, uSeed, uScale; uniform vec3 uAccent; varying vec2 vUv;
float luma(vec3 c){ return dot(c, vec3(.2126,.7152,.0722)); }
vec3 src(vec2 uv){ return texture2D(tDiffuse, clamp(uv, 0., 1.)).rgb; }
float hash21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 hash22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x), mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+17.1; a*=.5; } return s; }
// one screen pixel in uv, and one "design" pixel (a css pixel) in uv: size brushes and dots with px
vec2 texel(){ return 1./uRes; }
vec2 px(){ return uScale/uRes; }
// Sobel edge strength on luminance, sampled r design pixels apart (0 flat .. ~1 hard edge)
float edge(vec2 uv, float r){ vec2 d=px()*r;
  float tl=luma(src(uv+d*vec2(-1,1))), t=luma(src(uv+d*vec2(0,1))), tr=luma(src(uv+d*vec2(1,1)));
  float l=luma(src(uv+d*vec2(-1,0))), rr=luma(src(uv+d*vec2(1,0)));
  float bl=luma(src(uv+d*vec2(-1,-1))), b=luma(src(uv+d*vec2(0,-1))), br=luma(src(uv+d*vec2(1,-1)));
  float gx=-tl-2.*l-bl+tr+2.*rr+br, gy=-tl-2.*t-tr+bl+2.*b+br; return length(vec2(gx,gy)); }
// 9-tap soft blur, r design pixels
vec3 blur(vec2 uv, float r){ vec2 d=px()*r; vec3 s=src(uv)*.25;
  s+=(src(uv+d*vec2(1,0))+src(uv-d*vec2(1,0))+src(uv+d*vec2(0,1))+src(uv-d*vec2(0,1)))*.125;
  s+=(src(uv+d)+src(uv-d)+src(uv+d*vec2(1,-1))+src(uv+d*vec2(-1,1)))*.0625; return s; }
vec3 rgb2hsv(vec3 c){ vec4 K=vec4(0.,-1./3.,2./3.,-1.); vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g)); vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r)); float d=q.x-min(q.w,q.y); return vec3(abs(q.z+(q.w-q.y)/(6.*d+1e-10)), d/(q.x+1e-10), q.x); }
vec3 hsv2rgb(vec3 c){ vec3 p=abs(fract(c.xxx+vec3(1.,2./3.,1./3.))*6.-3.); return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y); }
// paper: fibre and tooth, ~1 mean
float paper(vec2 uv, float scale){ vec2 p=uv*uRes/uScale/scale; return .5+.5*(fbm(p*.9)*.6+vnoise(p*vec2(.35,2.4))*.25+hash21(floor(p*2.))*.15); }
`;
const STYLE_MAIN = /* glsl */`
void main(){ vec3 base = src(vUv); vec3 styled = clamp(style(vUv, base), 0., 1.); gl_FragColor = vec4(mix(base, styled, uStrength), 1.); }`;
const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;

export class StyleLens {
  constructor(engine) { this.e = engine; this.passes = new Map(); this.active = null; this.activeId = null; this.k = 0; }

  async _pass(id) {
    if (this.passes.has(id)) return this.passes.get(id);
    const def = STYLES.find((s) => s.id === id); if (!def) return null;
    const mod = def.glsl ? def : (await def.load()).default;
    const pass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uStrength: { value: 0 }, uSeed: { value: 0 }, uScale: { value: 1 }, uAccent: { value: new THREE.Color(1, 0.3, 0.2) }, ...(mod.uniforms || {}) },
      vertexShader: VERT, fragmentShader: STYLE_PRELUDE + mod.glsl + STYLE_MAIN,
    });
    pass.styleDef = { ...def, ...mod };
    this.passes.set(id, pass);
    return pass;
  }

  // decide the lens for a world while it loads, and have its shader ready
  async prepare(W) {
    const set = this.e.settings.style;
    let id = null;
    if (set && set !== 'auto' && set !== 'off') id = set;
    else if (set === 'auto' && W.world.style !== 'none' && STYLES.length) {
      const rng = makeRng(hashSeed(W.seed + ':style'));
      const ok = STYLES.filter((s) => !(s.avoid || []).includes(W.def.category));
      const wanted = ok.find((s) => s.id === W.world.style);
      if (wanted) id = wanted.id; else if (ok.length && rng.chance(0.16)) id = rng.pick(ok).id;
    }
    W.styleId = id; W.styleManual = !!(set && set !== 'auto' && set !== 'off');
    if (id) { const p = await this._pass(id); if (!p) W.styleId = null; else { const r = this.e.renderer; try { r.setRenderTarget(null); await r.compileAsync(p.fsQuad._mesh, this.e.camera); } catch (e) { /* compiles on first use */ } } }   // the lens draws to the screen; the final pass before it is made for a buffer by Post.prewarm
  }
  enter(W) { this.seed = (W.seed % 1000) / 1000; }

  update(dt, A, u, frozen) {
    const id = A.styleId, pass = id ? this.passes.get(id) : null;
    const env = A.styleManual || frozen ? 1 : smoothstep(0.03, 0.11, u) * (1 - smoothstep(0.8, 0.92, u));
    const k = pass ? env * (this.e.settings.styleStrength ?? 1) : 0;
    const post = this.e.post;
    if (k > 0.004) {
      if (this.active !== pass) { post.setStylePass(pass); this.active = pass; }
      const un = pass.uniforms, pr = this.e.pr;
      un.uStrength.value = k; un.uTime.value = this.e.time; un.uSeed.value = this.seed; un.uScale.value = pr * Math.max(1, this.e.h / 900);
      un.uRes.value.set(Math.round(this.e.w * pr), Math.round(this.e.h * pr));
      un.uAccent.value.copy(A.post.tint);
      this.activeId = id;
    } else if (this.active) { post.setStylePass(null); this.active = null; this.activeId = null; }
    this.k = k;
  }
}
