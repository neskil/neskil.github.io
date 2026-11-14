# Reproject an equirectangular Earth map into the view from above the North
# Pole (orthographic, northern hemisphere), plus a procedural cloud layer.
# A one-off, kept so the two images in ../img can be made again; it needs
# numpy and Pillow, which nothing else in the repo does. See ../README.md.
#
#   python3 orbit/tools/textures.py earth-blue-marble.jpg orbit/img/earth.webp orbit/img/clouds.webp
import sys, numpy as np
from PIL import Image
src, out_earth, out_clouds = sys.argv[1:4]
N = 1024; SS = 2; M = N * SS
eq = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W, _ = eq.shape
c = (np.arange(M) + 0.5) / M * 2 - 1
x, y = np.meshgrid(c, c)            # y grows downwards in the image
rho = np.sqrt(x * x + y * y)
inside = rho <= 1
lat = 90 - np.degrees(np.arcsin(np.clip(rho, 0, 1)))
lon = np.degrees(np.arctan2(-y, x))  # anticlockwise on screen = eastward
px = ((lon + 180) / 360 * W) % W
py = np.clip((90 - lat) / 180 * H, 0, H - 1)
x0 = np.floor(px).astype(int); x1 = (x0 + 1) % W; fx = (px - x0)[..., None]
y0 = np.floor(py).astype(int); y1 = np.minimum(y0 + 1, H - 1); fy = (py - y0)[..., None]
img = (eq[y0, x0] * (1 - fx) * (1 - fy) + eq[y0, x1] * fx * (1 - fy)
       + eq[y1, x0] * (1 - fx) * fy + eq[y1, x1] * fx * fy)
rgba = np.zeros((M, M, 4), np.float32)
rgba[..., :3] = img
rgba[..., 3] = np.clip((1 - rho) * M / 2, 0, 1) * 255   # antialiased rim
Image.fromarray(rgba.astype(np.uint8), 'RGBA').resize((N, N), Image.LANCZOS).save(out_earth, 'WEBP', quality=82, method=6)

# Clouds: fractal value noise sampled in 3D on the sphere (so the pole is
# not a seam), warped a little and squashed along latitude like weather bands.
rng = np.random.default_rng(7)
P = 256
perm = rng.permutation(P); vals = rng.random(P)
def h(i, j, k):
    return vals[perm[(perm[(perm[i % P] + j) % P] + k) % P]]
def vnoise(X, Y, Z):
    xi, yi, zi = np.floor(X).astype(int), np.floor(Y).astype(int), np.floor(Z).astype(int)
    fx, fy, fz = X - xi, Y - yi, Z - zi
    fx, fy, fz = [f * f * (3 - 2 * f) for f in (fx, fy, fz)]
    out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (fx if dx else 1 - fx) * (fy if dy else 1 - fy) * (fz if dz else 1 - fz)
                out = out + w * h(xi + dx, yi + dy, zi + dz)
    return out
def fbm(X, Y, Z, octaves):
    return sum(vnoise(X * 2 ** k, Y * 2 ** k, Z * 2 ** k) / 2 ** k for k in range(octaves)) / (2 - 2 ** (1 - octaves))
la, lo = np.radians(lat), np.radians(lon)
X, Y, Z = np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)
f = 3.0
wx = fbm(X * f + 11, Y * f, Z * f, 3) - 0.5
wy = fbm(X * f, Y * f + 23, Z * f, 3) - 0.5
n = fbm(X * f * 1.4 + wx * 1.6 + 5, Y * f * 1.4 + wy * 1.6, Z * f * 4.0, 6)
dens = np.clip((n - 0.52) * 4.0, 0, 1) ** 1.5
cl = np.zeros((M, M, 4), np.float32)
cl[..., :3] = 255
cl[..., 3] = dens * 0.9 * 255 * inside
Image.fromarray(cl.astype(np.uint8), 'RGBA').resize((N, N), Image.LANCZOS).save(out_clouds, 'WEBP', quality=70, method=6)
