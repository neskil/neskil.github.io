// Groom a baked piece of ground: take the kinks out of it along the line a
// hole is played on, and leave the country either side as the world has it.
//
//   node golf3d/tools/groom-ground.mjs turtle --path "10,4 10,22 10,37 25,51 33,54.5" \
//        --width 6 --passes 6 --all 1 --flat 10,4,2,4.5 --flat 33,54.5,4.5,7
//
// --path "x,z x,z …"  the line of play, in golf units
// --width w           groomed fully within w of the line, easing out to nothing by 2w
// --passes n          how many 3x3 blurs the groomed ground is given (land only)
// --all n             blurs given to the whole piece first, for the folds between hills
// --flat gx,gz,r0,r1  as bake-ground: level inside r0, eased back by r1
// --print             only print the plan
//
// A sculpted hole's world is pressed to this grid (backdrop.mjs → sculpt), so
// what is smoothed here is smoothed in the picture as well as under the ball.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2), id = args[0];
const one = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const all = (n) => args.map((a, i) => a === n ? args[i + 1] : null).filter(Boolean);
const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'js', 'tour-ground.js');
const src = readFileSync(file, 'utf8');
const m = src.match(new RegExp("G3\\.TOUR_GROUND\\['" + id + "'\\] = (\\{.*\\});"));
if (!m) { console.error('no ground baked for', id); process.exit(1); }
const G = JSON.parse(m[1]), nx = G.nx, nz = G.nz, d = G.d;
let h = Float64Array.from(G.h);
const SEA = 0.05;
function blur(a) {
    const b = new Float64Array(a);
    for (let k = 1; k < nz - 1; k++) for (let i = 1; i < nx - 1; i++) {
        if (a[k * nx + i] <= SEA) continue;
        let t = 0, n = 0;
        for (let p = -1; p <= 1; p++) for (let q = -1; q <= 1; q++) { const v = a[(k + p) * nx + i + q]; if (v > SEA) { t += v; n++; } }
        b[k * nx + i] = (t + a[k * nx + i] * 3) / (n + 3);
    }
    return b;
}
function plan(a) {
    for (let k = nz - 1; k >= 0; k--) console.log(String(G.z0 + k * d).padStart(5) + ' ' + Array.from({ length: nx }, (_, i) => { const v = a[k * nx + i]; return v <= SEA ? ' ~' : String(Math.round(v)).padStart(2); }).join(''));
}
if (args.includes('--print')) { plan(h); process.exit(0); }
for (let n = +one('--all', 0); n > 0; n--) h = blur(h);
const path = (one('--path', '') || '').trim().split(/\s+/).filter(Boolean).map((p) => p.split(',').map(Number));
if (path.length > 1) {
    const w = +one('--width', 6);
    let s = h;
    for (let n = +one('--passes', 6); n > 0; n--) s = blur(s);
    const dist = (x, z) => {
        let best = Infinity;
        for (let i = 0; i < path.length - 1; i++) {
            const ax = path[i][0], az = path[i][1], bx = path[i + 1][0] - ax, bz = path[i + 1][1] - az;
            const t = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)));
            best = Math.min(best, Math.hypot(x - ax - bx * t, z - az - bz * t));
        }
        return best;
    };
    for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
        if (h[k * nx + i] <= SEA) continue;
        const r = dist(G.x0 + i * d, G.z0 + k * d), u = Math.max(0, Math.min(1, (r - w) / w)), f = 1 - u * u * (3 - 2 * u);
        h[k * nx + i] += (s[k * nx + i] - h[k * nx + i]) * f;
    }
}
const at = (gx, gz) => h[Math.round((gz - G.z0) / d) * nx + Math.round((gx - G.x0) / d)];
for (const f of all('--flat')) {
    const [gx, gz, r0, r1] = f.split(',').map(Number), level = at(gx, gz);
    for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
        const r = Math.hypot(G.x0 + i * d - gx, G.z0 + k * d - gz);
        if (r >= r1) continue;
        const u = r <= r0 ? 0 : (r - r0) / (r1 - r0), e = u * u * (3 - 2 * u);
        h[k * nx + i] = level + (h[k * nx + i] - level) * e;
    }
    console.log(`flat at ${gx},${gz}: y = ${level.toFixed(2)}`);
}
G.h = Array.from(h, (v) => +v.toFixed(2));
writeFileSync(file, src.replace(m[0], `G3.TOUR_GROUND['${id}'] = ${JSON.stringify(G)};`));
console.log(`groomed ${id}: ${nx} x ${nz}`);
plan(h);
