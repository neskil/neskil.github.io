/* Rainmaker: an island as a grid of heights, and rain that carves it.
 *
 * No DOM, no WebGL: tests.html checks this directly, and scene-erosion.js
 * renders it inside Data Room.
 *
 * Heights run 0…1 and a cell is one unit across. Each raindrop is followed on
 * its own: it rolls downhill, picks rock up while it is fast and the slope is
 * steep, and puts it down when it slows. Rivers, gorges, fans and deltas are
 * not drawn anywhere; they are what a few hundred thousand such drops leave.
 */
window.VizErosion = (function () {
    'use strict';

    var SEA = 0.12;

    var P = {
        inertia: 0.03,      // how much a drop keeps its heading over the slope's
        capacity: 0.5,      // sediment a drop can carry, per unit of speed × water × drop
        minCapacity: 0.002,
        erode: 0.2,         // share of spare capacity filled per step
        deposit: 0.1,       // share of excess sediment dropped per step
        evaporate: 0.012,
        gravity: 4,
        life: 110,          // steps before a drop has soaked away
        radius: 2           // a drop wears a patch this wide, not a single cell
    };

    function rng(seed) {
        var a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            var t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function lattice(seed) {
        return function (x, y) {
            var h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2147483647);
            h = Math.imul(h ^ (h >>> 13), 1274126177);
            return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
        };
    }

    function valueNoise(hash, x, y) {
        var xi = Math.floor(x), yi = Math.floor(y);
        var fx = x - xi, fy = y - yi;
        fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
        var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
        return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    }

    function makeBrush(radius) {
        var cells = [];
        var total = 0;
        for (var dy = -radius; dy <= radius; dy++) {
            for (var dx = -radius; dx <= radius; dx++) {
                var w = radius - Math.hypot(dx, dy);
                if (w > 0) { cells.push([dx, dy, w]); total += w; }
            }
        }
        return cells.map(function (c) { return [c[0], c[1], c[2] / total]; });
    }

    function makeIsland(n, seed) {
        if (n == null) n = 256;
        if (seed == null) seed = 1;
        var hash = lattice(seed), h = new Float32Array(n * n);
        function fbm(x, y, oct, ridged) {
            var amp = 0.5, sum = 0, norm = 0;
            for (var o = 0; o < oct; o++) {
                var v = valueNoise(hash, x + o * 17.3, y - o * 9.1);
                if (ridged) { v = 1 - Math.abs(2 * v - 1); v *= v; }
                sum += amp * v; norm += amp; amp *= 0.5; x *= 2.03; y *= 2.03;
            }
            return sum / norm;
        }
        for (var j = 0; j < n; j++) {
            for (var i = 0; i < n; i++) {
                var u = i / (n - 1) - 0.5, v = j / (n - 1) - 0.5;
                // Bend the coastline so it is not a circle.
                var wu = u + 0.09 * (fbm(u * 3 + 40, v * 3, 3, false) - 0.5);
                var wv = v + 0.09 * (fbm(u * 3, v * 3 + 70, 3, false) - 0.5);
                var d = Math.hypot(wu, wv) * 2;                     // 0 at the middle, 1 at the edge
                var mask = Math.max(0, 1 - Math.pow(d / 0.93, 2.4));
                var hills = fbm(u * 4.2 + 10, v * 4.2 + 10, 6, false);
                var ridges = fbm(u * 3.1 + 80, v * 3.1 - 30, 5, true);
                var land = 0.2 + 0.5 * hills + 0.62 * ridges * hills;
                h[j * n + i] = Math.max(0, Math.min(1, mask * land * 1.08 + (mask > 0 ? 0.02 : 0) * hills));
            }
        }
        return {
            n: n,
            seed: seed,
            h: h,
            base: Float32Array.from(h),     // the island before any rain, to compare against
            flow: new Float32Array(n * n),  // water lately through each cell: where the rivers are
            drops: 0,
            lost: 0,
            rand: rng(seed * 7919 + 13),
            brush: makeBrush(P.radius)
        };
    }

    // Height and slope at a point between cells.
    function sample(t, x, y, out) {
        if (!out) out = {};
        var n = t.n, h = t.h;
        var xi = Math.max(0, Math.min(n - 2, Math.floor(x)));
        var yi = Math.max(0, Math.min(n - 2, Math.floor(y)));
        var fx = Math.max(0, Math.min(1, x - xi));
        var fy = Math.max(0, Math.min(1, y - yi));
        var i = yi * n + xi;
        var a = h[i], b = h[i + 1], c = h[i + n], d = h[i + n + 1];
        out.gx = (b - a) * (1 - fy) + (d - c) * fy;
        out.gy = (c - a) * (1 - fx) + (d - b) * fx;
        out.h = a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
        return out;
    }

    function spread(t, x, y, amount) {
        var n = t.n, cx = Math.round(x), cy = Math.round(y);
        var placed = 0;
        for (var bi = 0; bi < t.brush.length; bi++) {
            var b = t.brush[bi];
            var px = cx + b[0], py = cy + b[1];
            if (px < 0 || py < 0 || px >= n || py >= n) continue;
            var k = py * n + px;
            var add = amount * b[2];
            if (t.h[k] < SEA) add = Math.min(add, Math.max(0, SEA - 0.004 - t.h[k]));
            t.h[k] += add; placed += add;
        }
        t.lost += amount - placed;
    }

    var S0 = {}, S1 = {};

    // One raindrop, landing at (x, y). Returns how many steps it lived.
    function drop(t, x, y) {
        var n = t.n, h = t.h;
        var dx = 0, dy = 0, speed = 1, water = 1, sediment = 0, step = 0;
        for (; step < P.life; step++) {
            var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, cell = yi * n + xi;
            sample(t, x, y, S0);
            dx = dx * P.inertia - S0.gx * (1 - P.inertia);
            dy = dy * P.inertia - S0.gy * (1 - P.inertia);
            var len = Math.hypot(dx, dy);
            if (len < 1e-9) break;                  // a dead-flat spot: it pools and soaks in
            dx /= len; dy /= len;
            x += dx; y += dy;
            if (x < 1 || y < 1 || x >= n - 2 || y >= n - 2) { x -= dx; y -= dy; break; }
            t.flow[cell] += water;
            var dh = sample(t, x, y, S1).h - S0.h;
            if (S1.h < SEA - 0.01) break;           // out to sea: whatever it carries settles here
            var cap = Math.max(-dh * speed * water * P.capacity, P.minCapacity);
            if (sediment > cap || dh > 0) {
                var amount = dh > 0 ? Math.min(dh, sediment) : (sediment - cap) * P.deposit;
                sediment -= amount;
                h[cell] += amount * (1 - fx) * (1 - fy);
                h[cell + 1] += amount * fx * (1 - fy);
                h[cell + n] += amount * (1 - fx) * fy;
                h[cell + n + 1] += amount * fx * fy;
            } else {
                var takeAmt = Math.min((cap - sediment) * P.erode, -dh);
                for (var bi = 0; bi < t.brush.length; bi++) {
                    var br = t.brush[bi];
                    var px = xi + br[0], py = yi + br[1];
                    if (px < 0 || py < 0 || px >= n || py >= n) continue;
                    var k = py * n + px, take = Math.min(h[k], takeAmt * br[2]);
                    h[k] -= take; sediment += take;
                }
            }
            speed = Math.sqrt(Math.max(0, speed * speed - dh * P.gravity));
            water *= 1 - P.evaporate;
        }
        if (sediment > 0) spread(t, x, y, sediment);
        t.drops++;
        return step;
    }

    // Rain `count` drops. With a cloud {x, y, r} they fall round that point;
    // otherwise anywhere on the map.
    function rain(t, count, cloud) {
        var n = t.n, rand = t.rand;
        for (var i = 0; i < count; i++) {
            var x, y;
            if (cloud) {
                var a = rand() * 2 * Math.PI, r = cloud.r * Math.sqrt(rand());
                x = cloud.x + Math.cos(a) * r; y = cloud.y + Math.sin(a) * r;
            } else {
                x = 1 + rand() * (n - 3); y = 1 + rand() * (n - 3);
            }
            if (x < 1 || y < 1 || x >= n - 2 || y >= n - 2) continue;
            if (sample(t, x, y, S0).h < SEA) { t.drops++; continue; }
            drop(t, x, y);
        }
    }

    function dry(t, keep) {
        if (keep == null) keep = 0.97;
        var f = t.flow;
        for (var i = 0; i < f.length; i++) f[i] *= keep;
    }

    function sculpt(t, x, y, radius, amount) {
        var n = t.n, r = Math.ceil(radius);
        var y0 = Math.max(0, Math.round(y) - r), y1 = Math.min(n - 1, Math.round(y) + r);
        var x0 = Math.max(0, Math.round(x) - r), x1 = Math.min(n - 1, Math.round(x) + r);
        for (var py = y0; py <= y1; py++) {
            for (var px = x0; px <= x1; px++) {
                var d = Math.hypot(px - x, py - y) / radius;
                if (d >= 1) continue;
                var w = amount * (1 - d * d) * (1 - d * d), k = py * n + px;
                var edge = Math.min(px, py, n - 1 - px, n - 1 - py) / 8;
                var add = w * Math.min(1, edge);
                var before = t.h[k];
                t.h[k] = Math.max(0, Math.min(1.2, before + add));
                t.base[k] = Math.max(0, t.base[k] + (t.h[k] - before));
            }
        }
    }

    function pick(t, eye, dir, yScale) {
        var n = t.n;
        var prev = 0;
        for (var s = 0; s < n * 4; s += 0.5) {
            var x = eye[0] + dir[0] * s, y = eye[1] + dir[1] * s, z = eye[2] + dir[2] * s;
            if (x < 0 || z < 0 || x > n - 1 || z > n - 1) { prev = s; continue; }
            var ground = Math.max(sample(t, x, z, S0).h, SEA) * yScale;
            if (y <= ground) {
                var lo = prev, hi = s;
                for (var k = 0; k < 12; k++) {
                    var m = (lo + hi) / 2;
                    var mx = eye[0] + dir[0] * m, mz = eye[2] + dir[2] * m;
                    var inside = mx >= 0 && mz >= 0 && mx <= n - 1 && mz <= n - 1;
                    var g = inside ? Math.max(sample(t, mx, mz, S0).h, SEA) * yScale : -Infinity;
                    if (eye[1] + dir[1] * m <= g) hi = m; else lo = m;
                }
                var hx = eye[0] + dir[0] * hi, hz = eye[2] + dir[2] * hi;
                return { x: hx, y: hz, land: sample(t, hx, hz, S0).h >= SEA };
            }
            prev = s;
        }
        return null;
    }

    function measure(t) {
        var h = t.h, base = t.base, n = t.n;
        var moved = 0, cut = 0, built = 0, land = 0, volume = 0;
        for (var i = 0; i < h.length; i++) {
            var d = h[i] - base[i];
            if (d < 0) { moved -= d; if (-d > cut) cut = -d; } else if (d > built) built = d;
            if (h[i] >= SEA) land++;
            if (base[i] > SEA) volume += base[i] - SEA;
        }
        return {
            moved: moved,
            movedShare: volume ? moved / volume : 0,
            deepestCut: cut,
            tallestFill: built,
            landShare: land / (n * n)
        };
    }

    function total(t) {
        var s = 0;
        for (var i = 0; i < t.h.length; i++) s += t.h[i];
        return s;
    }

    function riverShare(t, share) {
        if (share == null) share = 0.02;
        var sorted = Float32Array.from(t.flow).sort();
        var from = Math.floor(sorted.length * (1 - share));
        var top = 0, all = 0;
        for (var i = 0; i < sorted.length; i++) { all += sorted[i]; if (i >= from) top += sorted[i]; }
        return all ? top / all : 0;
    }

    return {
        SEA: SEA,
        P: P,
        rng: rng,
        makeIsland: makeIsland,
        sample: sample,
        drop: drop,
        rain: rain,
        dry: dry,
        sculpt: sculpt,
        pick: pick,
        measure: measure,
        total: total,
        riverShare: riverShare
    };
})();
