// Makes every shader forgiving about maths that is undefined in GLSL. Direct3D (Windows) returns
// not-a-number for pow() of a negative base, sqrt() of a negative, normalize() of a zero vector and
// the like, where other drivers quietly return something harmless; one such pixel then turns into
// black squares once the bloom blur spreads it. The guards are injected into every shader source.
// pow() of a negative base keeps the value other drivers give, |a|^b, so pictures do not change
// (shaders here often write pow(x, 2.) for a square, with x signed).
const ALL = `#define pow(a,b) pow(max(abs(a),1e-30),b)
#define sqrt(a) sqrt(max(a,0.))
#define inversesqrt(a) inversesqrt(max(a,1e-30))
#define log(a) log(max(a,1e-30))
#define log2(a) log2(max(a,1e-30))
#define acos(a) acos(clamp(a,-1.,1.))
#define asin(a) asin(clamp(a,-1.,1.))
#define normalize(a) ((a)*inversesqrt(max(dot(a,a),1e-30)))
`;

export function installSafeMath(renderer, only) {
  // only: optional comma-separated list of the guards to install (a test aid); 'none' installs nothing
  const SAFE = only ? ALL.split('\n').filter((l) => only.split(',').some((k) => l.startsWith('#define ' + k + '('))).join('\n') + '\n' : ALL;
  const gl = renderer.getContext();
  if (gl.__safeMath) return; gl.__safeMath = true;
  const orig = gl.shaderSource;
  gl.shaderSource = function (shader, source) {
    let src = String(source);
    if (src.startsWith('#version')) { const i = src.indexOf('\n') + 1; src = src.slice(0, i) + SAFE + src.slice(i); }
    else src = SAFE + src;
    return orig.call(this, shader, src);
  };
}
