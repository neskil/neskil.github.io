/* Courses dealt on the spot.

   The rack in courses.js is hand-built, hole by hole, and every one of those
   holes is an argument someone made. This file is the other thing: a course
   nobody has seen, generated from a seed, legal by construction and checked
   before it is handed over.

   Three decisions hold the whole design up.

   **A hole is a line with bands across it.** Every hole here is built in a
   frame — an *along* axis running tee to cup, and a *cross* axis at right
   angles to it — and every feature is a band laid across the cross axis at
   some point along the way. That is not a limitation of the vocabulary; it
   is what makes the result playable without simulating it. A band that
   always leaves a mouth in it can always be got through, and a hole made of
   bands that each leave a mouth has a way from the tee to the cup by
   construction. The frame also means the generator writes one hole layout
   and gets four: the along axis can run left-to-right, right-to-left, up the
   field or down it, and nothing in a feature has to know which.

   **Rules are checked, not remembered.** `GOLF.validateHole` is the whole
   rule book from tests.html — thicknesses, post radii, tee and cup
   clearance, gates that stray off the field or seal it shut — as a function
   rather than as a page of assertions. The generator runs it on every hole
   it builds and re-rolls the ones that fail, and the suite runs the same
   function over the shipped rack, which is what stops the two drifting
   apart. A `strict` pass adds the rules a hand-built hole is allowed to
   argue its way out of and a generated one is not: nothing solid inside a
   slope zone, and a rough collar wide enough to catch whatever a slope
   sheds.

   **The same seed is the same course.** All the randomness comes from one
   seeded PRNG, so a draw can be shared as six characters of base 36, resumed
   after a refresh, and reported in a bug. Nothing here calls Math.random —
   the caller picks the seed.

   What this file does *not* do is touch the rack. Loading it adds nothing to
   `GOLF.COURSES`; `GOLF.installDraw(seed)` is the one call that puts a draw
   on it, and the game makes that call. That is what lets tests.html generate
   a hundred courses without any of them turning up in the picker. */
(function (GOLF) {
    'use strict';

    var C = GOLF.CONFIG;
    var P = GOLF.physics;

    var DRAW_ID = 'draw';
    var DRAW_HOLES = 9;

    // Every hazard list a hole carries, which is what a builder's output gets
    // merged into. courses.js fills in the ones a hand-built hole leaves out;
    // nothing generated here is allowed to leave one out in the first place.
    var FAMILIES = ['walls', 'water', 'sand', 'rough', 'ice', 'bumpers', 'slopes'];

    /* How many holes ask to be an elbow. Rather more than end up one: a lane
       is half a field wide and four of the nine features need more cross axis
       than that, so about half of what asks for the shape cannot have it and
       is dealt straight instead. Asking for half a card lands two or three,
       which is what the shape is worth — it is a change of pace, and nine
       bends is as samey as nine corridors. */
    var ELBOW_SHARE = 0.5;

    /* ── randomness ─────────────────────────────────────────────────────── */

    // The same generator tests.html plays the bot with. Small, fast, and
    // seeded — which is the only property that matters here.
    function mulberry32(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function randomSeed() {
        return (Math.random() * 4294967296) >>> 0;
    }

    /* A seed is shown and shared as base 36 — six characters rather than ten
       digits, and it survives a round trip through a URL. Anything that is
       not a seed comes back as one anyway, by hashing it: `?seed=birthday`
       is a perfectly good way to name a course. */
    function seedFrom(text) {
        if (text === null || text === undefined || text === '') return null;
        if (typeof text === 'number') return text >>> 0;
        if (/^[0-9a-z]{1,7}$/i.test(text)) {
            var n = parseInt(text, 36);
            if (isFinite(n)) return n >>> 0;
        }
        var h = 2166136261;
        for (var i = 0; i < text.length; i++) {
            h ^= text.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function seedLabel(seed) {
        return (seed >>> 0).toString(36);
    }

    function between(rng, lo, hi) { return lo + rng() * (hi - lo); }

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function shuffled(rng, list) {
        var out = list.slice();
        for (var i = out.length - 1; i > 0; i--) {
            var j = Math.floor(rng() * (i + 1));
            var t = out[i]; out[i] = out[j]; out[j] = t;
        }
        return out;
    }

    /* ── the frame ──────────────────────────────────────────────────────

       `along` runs from the tee to the cup and `cross` runs at right angles
       to it. A feature is written once, in those terms, and the frame turns
       it into world rectangles — so the same band is a gate across a
       left-to-right hole and a gate across a hole played up the field, with
       no second copy of the code and no chance of the two drifting.

       Bands are centred on their along position rather than started at it,
       which is what keeps a feature indifferent to whether the along axis
       runs up or down: reversing the direction reverses `at()` and nothing
       else.

       A frame also owns a *window* on the cross axis rather than the whole
       of it. For a straight hole that window is the field, cushion to
       cushion, and there is nothing to think about. For one lane of an
       elbow (see below) it is the cushion and the divider — and because
       every builder writes its cross coordinates against `0` and `f.V`
       rather than against the field, the same builder works inside a lane
       without knowing it is in one. */
    function makeFrame(horizontal, teeU, cupU, v0, v1) {
        if (v0 === undefined) { v0 = 0; v1 = horizontal ? C.WORLD_H : C.WORLD_W; }
        var f = {
            horizontal: horizontal,
            U: horizontal ? C.WORLD_W : C.WORLD_H,   // the along extent of the field
            V: v1 - v0,                              // the cross extent of the window
            V0: v0,                                  // where that window starts
            teeU: teeU,
            cupU: cupU,
            span: Math.abs(cupU - teeU)
        };

        f.at = function (frac) { return teeU + (cupU - teeU) * frac; };

        f.rect = function (u, du, v, dv) {
            return horizontal
                ? { x: u, y: v0 + v, w: du, h: dv }
                : { x: v0 + v, y: u, w: dv, h: du };
        };

        f.point = function (u, v) {
            return horizontal ? { x: u, y: v0 + v } : { x: v0 + v, y: u };
        };

        // A slope always pushes along the cross axis: across the line of the
        // hole, never up or down it. Downhill along the line is a conveyor
        // belt to the cup, and the interesting question a slope asks is what
        // it does to a shot passing over it.
        f.slope = function (u, du, v, dv, accel) {
            var r = f.rect(u, du, v, dv);
            r.ax = horizontal ? 0 : accel;
            r.ay = horizontal ? accel : 0;
            return r;
        };

        // Likewise a moving bar sweeps the cross axis, which is the axis a
        // gate has to sweep to be a gate at all.
        f.bar = function (u, du, v, dv, move) {
            var r = f.rect(u, du, v, dv);
            r.move = {
                axis: horizontal ? 'y' : 'x',
                amp: move.amp,
                speed: move.speed,
                phase: move.phase
            };
            return r;
        };

        f.post = function (u, v, rad) {
            var p = f.point(u, v);
            p.r = rad;
            return p;
        };

        return f;
    }

    /* The along footprint of whatever a feature produced. Derived rather than
       declared: a builder that forgets to report its own extent would be a
       feature the spacing rules do not know about, and spacing is what keeps
       a slope away from a wall and a bunker out of the cup. */
    function footprint(f, part) {
        var lo = Infinity, hi = -Infinity;
        function rect(r) {
            var a = f.horizontal ? r.x : r.y;
            var b = a + (f.horizontal ? r.w : r.h);
            if (a < lo) lo = a;
            if (b > hi) hi = b;
        }
        ['walls', 'water', 'sand', 'rough', 'ice', 'slopes'].forEach(function (k) {
            (part[k] || []).forEach(rect);
        });
        (part.bumpers || []).forEach(function (b) {
            var a = f.horizontal ? b.x : b.y;
            if (a - b.r < lo) lo = a - b.r;
            if (a + b.r > hi) hi = a + b.r;
        });
        return { lo: lo, hi: hi };
    }

    /* ── the features ───────────────────────────────────────────────────

       Nine of them, each one a band across the hole, each one leaving a way
       through by construction. A builder answers `null` when the frame it
       was handed has no room for it — a bar that would need more cross axis
       than the field has, say — and the hole is re-rolled rather than
       squeezed.

       Every builder is handed `v` as well as `u`: where the straight line
       from the tee to the cup crosses the band it is about to build. That is
       the difference between a hazard and scenery. A bunker dropped at a
       random point across the field is something the player walks past
       without noticing; the same bunker on the line is the hole. So the ones
       that block put themselves on `v`, and the ones with a way through put
       their mouth *beside* it — far enough that the straight line does not
       simply go through the gap, near enough that the answer is a small
       correction rather than a different hole.

       The names and phrases live with the feature that earns them, so a hole
       called The Ford has water on it and a hole called Nettles has posts.
       Names assembled out of two word lists read as noise the second time
       you see one; these read as a course.

       `minV` is how much cross axis the builder needs to produce something
       worth playing. At the full width of the field every one of them fits,
       so on a straight hole it never says no; it is what a lane of an elbow
       reads to know that a bar with 470px of travel has nowhere to sweep in
       a 280px corridor. */

    var FEATURES = {
        gate: {
            names: ['The Doorway', 'Threadneedle', 'Keyhole', 'The Gap'],
            phrase: 'a mouth in the wall to thread',
            minV: 250,
            build: function (rng, f, u, v) {
                // A share of the cross axis rather than a flat width. Across
                // the field these are the numbers they always were; inside a
                // lane they come down with it, and the two walls either side
                // stay thick enough to be walls.
                var mouth = between(rng, Math.min(150, f.V * 0.3), Math.min(210, f.V * 0.42));
                // Beside the line, not on it: the wall has to be in the way
                // before the mouth is worth aiming at.
                var c = clamp(v + (rng() < 0.5 ? -1 : 1) * between(rng, mouth * 0.6, mouth * 0.6 + 120),
                              70 + mouth / 2, f.V - 70 - mouth / 2);
                var lo = c - mouth / 2, hi = c + mouth / 2;
                return { walls: [f.rect(u - 12, 24, 0, lo), f.rect(u - 12, 24, hi, f.V - hi)] };
            }
        },

        dogleg: {
            names: ['The Elbow', 'Round the Back', 'The Turn Again', 'Blindside'],
            phrase: 'a blocker to go round, with sand on the inside of the turn',
            minV: 420,
            build: function (rng, f, u, v) {
                // The blocker comes from whichever cushion the line is
                // nearer, and is long enough to cover it with room to spare:
                // a dogleg that the straight shot goes past is a wall.
                var high = v > f.V / 2;
                var needed = (high ? f.V - v : v) + between(rng, 60, 110);
                var len = clamp(needed, f.V * 0.5, f.V * 0.75);
                var wall = high ? f.rect(u - 13, 26, f.V - len, len) : f.rect(u - 13, 26, 0, len);
                var openLo = high ? 0 : len;
                var openHi = high ? f.V - len : f.V;
                var sandW = Math.min(200, (openHi - openLo) - 60);
                if (sandW < 60) return null;
                var sand = f.rect(u + 30, 150, openLo + 30, sandW);
                return { walls: [wall], sand: [sand] };
            }
        },

        moat: {
            names: ['The Ford', 'Deep Water', 'The Crossing', 'One Bridge'],
            phrase: 'water with one bridge over it',
            minV: 240,
            build: function (rng, f, u, v) {
                var depth = between(rng, 100, 150);
                var bridge = between(rng, 110, 150);
                // A crossing is about weight rather than aim, so the bridge
                // sits near the line — but rarely dead on it.
                var c = clamp(v + (rng() < 0.5 ? -1 : 1) * between(rng, 0, 150),
                              60 + bridge / 2, f.V - 60 - bridge / 2);
                var lo = c - bridge / 2, hi = c + bridge / 2;
                return {
                    water: [
                        f.rect(u - depth / 2, depth, 0, lo),
                        f.rect(u - depth / 2, depth, hi, f.V - hi)
                    ]
                };
            }
        },

        lattice: {
            names: ['Nettles', 'The Thicket', 'Pincushion', 'The Rookery'],
            phrase: 'staggered posts with no straight line through them',
            minV: 400,
            build: function (rng, f, u) {
                var rows = rng() < 0.65 ? 2 : 3;
                var rowGap = between(rng, 105, 130);
                var step = between(rng, 130, 170);
                var rad = between(rng, 22, 26);
                var posts = [];
                var first = u - (rows - 1) * rowGap / 2;
                for (var r = 0; r < rows; r++) {
                    var start = rad + 20 + (r % 2) * step / 2 + between(rng, 0, 30);
                    for (var v = start; v <= f.V - rad - 20; v += step) {
                        posts.push(f.post(first + r * rowGap, v, rad));
                    }
                }
                return posts.length >= 4 ? { bumpers: posts } : null;
            }
        },

        bar: {
            names: ['The Wiper', 'Second Hand', 'The Metronome', 'Windscreen'],
            phrase: 'a bar sweeping across that will not wait for you',
            minV: 480,
            build: function (rng, f, u, v) {
                var len = between(rng, 170, 230);
                var amp = between(rng, 90, 150);
                // The travel has to keep 60px of daylight at both extremes.
                // The rule the suite states is 3 ball radii; this is nearly
                // three times that, because a gap the ball only just fits
                // through is a gate that reads as shut.
                var lo = 60 + amp;
                var hi = f.V - 60 - len - amp;
                if (hi <= lo) return null;
                // Hung so its travel is centred on the line: a bar sweeping
                // a corner of the field nobody plays is a windmill in a car
                // park.
                return {
                    walls: [f.bar(u - 13, 26, clamp(v - len / 2, lo, hi), len, {
                        amp: amp,
                        speed: between(rng, 1.05, 1.65),
                        phase: rng() * Math.PI * 2
                    })]
                };
            }
        },

        tilt: {
            names: ['The Cant', 'Sidehill', 'The Camber', 'Off the Level'],
            phrase: 'a bank that sheds everything to one side',
            minV: 400,
            build: function (rng, f, u) {
                var len = between(rng, 190, 250);
                var drain = 150;                       // the rough collar it sheds into
                var down = rng() < 0.5 ? 1 : -1;
                var uphill = between(rng, 90, 140);
                var lo, hi;
                if (down > 0) { hi = f.V - drain; lo = Math.max(uphill, hi - 400); }
                else { lo = drain; hi = Math.min(f.V - uphill, lo + 400); }
                if (hi - lo < 140) return null;
                var accel = between(rng, 100, 150);
                return {
                    slopes: [f.slope(u - len / 2, len, lo, hi - lo, down * accel)],
                    rough: [down > 0
                        ? f.rect(u - len / 2, len, f.V - drain, drain)
                        : f.rect(u - len / 2, len, 0, drain)]
                };
            }
        },

        rink: {
            names: ['Black Ice', 'The Rink', 'Cold Water', 'Skating'],
            phrase: 'a stretch of ice that gives nothing back',
            minV: 0,
            build: function (rng, f, u) {
                var depth = between(rng, 140, 200);
                return { ice: [f.rect(u - depth / 2, depth, 0, f.V)] };
            }
        },

        bunker: {
            names: ['The Beach', 'Sandy Lie', 'The Waste', 'Heavy Going'],
            phrase: 'sand sat on the line',
            minV: 250,
            build: function (rng, f, u, v) {
                var depth = between(rng, 130, 190);
                // Capped so it still has 40px of grass either side of it in
                // a lane. Across the field the cap is never the binding one.
                var width = between(rng, 150, Math.min(300, f.V - 80));
                // Sand sat on the line, which is what the blurb promises.
                var c = clamp(v, 40 + width / 2, f.V - 40 - width / 2);
                return { sand: [f.rect(u - depth / 2, depth, c - width / 2, width)] };
            }
        },

        pocket: {
            names: ['Two Guards', 'The Gateposts', 'Narrow Minds', 'The Sentries'],
            phrase: 'two posts to be putted between',
            minV: 280,
            build: function (rng, f, u, v) {
                var rad = between(rng, 22, 26);
                var mouth = between(rng, Math.min(110, f.V * 0.3), Math.min(160, f.V * 0.4));
                // Straddling the line: the posts are the doorway the direct
                // route has to come through.
                var c = clamp(v, 80 + mouth / 2, f.V - 80 - mouth / 2);
                return {
                    bumpers: [
                        f.post(u, c - mouth / 2, rad),
                        f.post(u, c + mouth / 2, rad)
                    ]
                };
            }
        }
    };

    /* Shaping rather than blocking: these never carry a hole on their own,
       they are what a hole gets in addition. Rough down both cushions is the
       lesson the first hole anybody plays teaches, and it is worth repeating. */
    var TRIMMINGS = {
        collar: {
            phrase: 'rough down both cushions',
            minV: 400,
            build: function (rng, f, u) {
                // Kept short on purpose. A 500px stretch of collar is a
                // footprint nothing else on the hole can be spaced against,
                // and the hole comes back without it every time.
                var len = between(rng, 180, 320);
                var depth = between(rng, 70, 130);
                return {
                    rough: [
                        f.rect(u - len / 2, len, 0, depth),
                        f.rect(u - len / 2, len, f.V - depth, depth)
                    ]
                };
            }
        },
        bunker: FEATURES.bunker,
        rink: FEATURES.rink,
        pocket: FEATURES.pocket
    };

    var PRIMARY_KEYS = Object.keys(FEATURES);
    var TRIMMING_KEYS = Object.keys(TRIMMINGS);

    /* Which of these count as work. Par is not measured by playing the hole
       — that would mean a bot in the boot path — it is counted off the two
       things that actually cost strokes: the length of the hole and how much
       is in the way. */
    var COSTLY = { moat: 1, dogleg: 1, bar: 1, lattice: 1 };

    /* ── the rules ──────────────────────────────────────────────────────

       The rule book out of tests.html, as a function. Every problem it can
       report is a sentence rather than a boolean, because a generator that
       re-rolls a hole should be able to say what was wrong with the one it
       threw away.

       `strict` adds the rules a hand-built hole is allowed to argue with and
       a generated one is not. Crown Green puts the cup inside its own slope
       and means it; Sisyphus runs its hill into the cushion and means that
       too. Neither is something a generator should be allowed to produce by
       accident, so the strict pass forbids both — and the suite runs the
       shipped rack through the lenient pass, which is what keeps the two
       lists honest with each other. */
    function validateHole(h, opts) {
        var strict = !!(opts && opts.strict);
        var bad = [];
        var margin = C.BALL_R + 1;
        var zones = [].concat(h.walls || [], h.water || [], h.sand || [],
                              h.rough || [], h.ice || [], h.slopes || [],
                              h.lava || [], h.avalanches || []);
        var rects = zones.filter(function (z) { return !z.pts; });
        var polys = zones.filter(function (z) { return !!z.pts; });
        var posts = h.bumpers || [];
        // Curves and blocks are rails underneath, and are held to every rule
        // a rail is.
        var rails = P.railsOf(h);

        rects.forEach(function (r) {
            if (Math.min(r.w, r.h) < 20) bad.push('a rectangle thinner than 20px');
        });

        /* A polygon zone has to be a shape the substep cap can see: three
           corners at least, and no sliver of it narrower than the 20px a
           rectangle is held to — measured as twice the area over the
           perimeter, which is the width of a strip and the diameter of a
           disc. Walls and slopes stay rectangles: a wall at an angle is a
           rail, and a slope's rules are written for edges that run with
           the axes. */
        polys.forEach(function (z) {
            var p = z.pts;
            if (!Array.isArray(p) || p.length < 6 || p.length % 2) { bad.push('a polygon with fewer than three corners'); return; }
            if (!((h.water || []).indexOf(z) >= 0 || (h.sand || []).indexOf(z) >= 0 ||
                  (h.rough || []).indexOf(z) >= 0 || (h.ice || []).indexOf(z) >= 0 ||
                  (h.lava || []).indexOf(z) >= 0)) {
                bad.push('a polygon wall, slope or chute — only water, lava, sand, rough and ice may have corners');
            }
            var area = 0, perim = 0;
            for (var i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
                area += p[j] * p[i + 1] - p[i] * p[j + 1];
                perim += Math.hypot(p[i] - p[j], p[i + 1] - p[j + 1]);
                if (p[i] < -1 || p[i] > C.WORLD_W + 1 || p[i + 1] < -1 || p[i + 1] > C.WORLD_H + 1) {
                    bad.push('a polygon corner off the field');
                }
            }
            if (perim > 0 && Math.abs(area) / perim < 10) bad.push('a polygon thinner than 20px');
        });

        /* A solid running along the cushion either meets it or leaves a
           ball's width and a little more. A sliver narrower than the ball,
           between a wall and the cushion and parallel to it, is somewhere a
           hard shot can drive a ball and leave it held, pressed between the
           two and overlapping both. A wall that meets the cushion at an
           angle is a corner, which a ball simply sits in. */
        var crack = C.BALL_R * 2 + 1, cracked = false;
        // Shape by shape: a curve that meets the cushion somewhere along it
        // makes a corner where it does, not a crack.
        var shapes = (h.rails || []).map(function (r) { return [r]; })
            .concat((h.arcs || []).map(P.arcRails), (h.blocks || []).map(P.blockRails));
        shapes.forEach(function (links) {
            var near = [Infinity, Infinity, Infinity, Infinity], touch = [false, false, false, false];
            links.forEach(function (r) {
                var hw = r.w / 2, L = Math.hypot(r.tx - r.x, r.ty - r.y) || 1;
                var flatX = Math.abs(r.ty - r.y) / L < 0.6, flatY = Math.abs(r.tx - r.x) / L < 0.6;
                [[flatX, Math.min(r.y, r.ty) - hw], [flatX, C.WORLD_H - Math.max(r.y, r.ty) - hw],
                 [flatY, Math.min(r.x, r.tx) - hw], [flatY, C.WORLD_W - Math.max(r.x, r.tx) - hw]].forEach(function (c, side) {
                    if (c[1] <= 0.5) touch[side] = true;
                    else if (c[0]) near[side] = Math.min(near[side], c[1]);
                });
            });
            near.forEach(function (gap, side) { if (!touch[side] && gap < crack) cracked = true; });
        });
        (h.walls || []).forEach(function (w) {
            if (w.move) return;
            [w.x, w.y, C.WORLD_W - w.x - w.w, C.WORLD_H - w.y - w.h].forEach(function (gap) {
                if (gap > 0.5 && gap < crack) cracked = true;
            });
        });
        if (cracked) bad.push('a crack between a wall and the cushion narrower than a ball');

        rails.forEach(function (r) {
            if (!(r.w >= 20)) bad.push('a rail thinner than 20px');
            [[r.x, r.y], [r.tx, r.ty]].forEach(function (e) {
                if (e[0] < -1 || e[0] > C.WORLD_W + 1 || e[1] < -1 || e[1] > C.WORLD_H + 1) bad.push('a rail end off the field');
            });
        });
        posts.forEach(function (b) {
            if (b.r < C.BUMPER_MIN_R) bad.push('a post under BUMPER_MIN_R');
        });

        /* A curve has to turn the right way round and stay open: some sweep
           and no more than a full turn, and a radius wider than its own
           thickness so the inside of the bend is not a solid disc. */
        (h.arcs || []).forEach(function (a) {
            var sweep = a.to - a.from;
            if (!(sweep > 0 && sweep <= 360)) bad.push('a curve that does not sweep forwards');
            if (!(a.r > (a.w || 24))) bad.push('a curve tighter than it is thick');
        });
        /* A block is a solid shape the ball can only ever meet the edges of:
           three corners at least, on the field. Its edges are rails, so
           their thickness is checked with the rest of them. */
        (h.blocks || []).forEach(function (b) {
            var p = b.pts;
            if (!Array.isArray(p) || p.length < 6 || p.length % 2) { bad.push('a block with fewer than three corners'); return; }
            for (var i = 0; i < p.length; i += 2) {
                if (p[i] < -1 || p[i] > C.WORLD_W + 1 || p[i + 1] < -1 || p[i + 1] > C.WORLD_H + 1) {
                    bad.push('a block corner off the field');
                    break;
                }
            }
        });
        /* A hill pulls the ball for as long as it is on it, so — like a
           slope — it may not reach anything it could hold the ball against:
           the cushion, a wall, a post, a rail or a block. A bowl gathers to
           its middle and a mound sheds off its sides, and either would pin
           a ball on whatever stood in the way for ever. */
        (h.hills || []).forEach(function (hl) {
            if (!(hl.r >= 40) || !hl.a) { bad.push('a hill too small or too flat to be one'); return; }
            if (hl.x - hl.r < margin || hl.y - hl.r < margin || hl.x + hl.r > C.WORLD_W - margin || hl.y + hl.r > C.WORLD_H - margin) {
                bad.push('a hill that reaches the cushion');
            }
            var reach = hl.r + C.BALL_R;
            var pinned = (h.walls || []).some(function (w) {
                return P.circleRect(hl.x, hl.y, reach, travelEnvelope(w)) !== null;
            }) || posts.some(function (b) {
                return P.circleCircle(hl.x, hl.y, reach, b) !== null;
            }) || rails.some(function (r) {
                return P.circleRail(hl.x, hl.y, reach, r) !== null;
            });
            if (pinned) bad.push('a hill with something solid on it');
            if (Math.hypot(h.tee.x - hl.x, h.tee.y - hl.y) < hl.r + C.BALL_R) bad.push('the tee is on a hill');
            if (strict && Math.hypot(h.hole.x - hl.x, h.hole.y - hl.y) < hl.r) bad.push('the cup is on a hill');
        });

        if (!(h.par >= 2 && h.par <= 5)) bad.push('par outside 2..5');

        if (!(h.tee.x > margin && h.tee.x < C.WORLD_W - margin &&
              h.tee.y > margin && h.tee.y < C.WORLD_H - margin)) {
            bad.push('the tee is off the field');
        }
        if (!(h.hole.x > C.HOLE_R && h.hole.x < C.WORLD_W - C.HOLE_R &&
              h.hole.y > C.HOLE_R && h.hole.y < C.WORLD_H - C.HOLE_R)) {
            bad.push('the cup is off the field');
        }
        if (Math.hypot(h.hole.x - h.tee.x, h.hole.y - h.tee.y) <= 100) {
            bad.push('the tee and the cup are on top of each other');
        }

        if (blocked(h, h.tee.x, h.tee.y, C.BALL_R)) bad.push('the tee is inside something');
        if (blocked(h, h.hole.x, h.hole.y, C.HOLE_R)) bad.push('the cup is inside something');

        posts.forEach(function (a, ai) {
            posts.forEach(function (b, bi) {
                if (bi <= ai) return;
                var gap = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
                if (gap > 0 && gap < C.BALL_R * 2 + 6) bad.push('two posts leave an unusable slot');
            });
        });

        (h.walls || []).forEach(function (w) {
            if (!w.move) return;
            var vertical = w.move.axis === 'y';
            var period = 2 * Math.PI / w.move.speed;
            for (var t = 0; t < period; t += 0.05) {
                var R = P.wallRect(w, t);
                if (R.x < -1 || R.y < -1 || R.x + R.w > C.WORLD_W + 1 || R.y + R.h > C.WORLD_H + 1) {
                    bad.push('a moving wall leaves the field');
                    break;
                }
                var gap = vertical
                    ? Math.max(R.y, C.WORLD_H - (R.y + R.h))
                    : Math.max(R.x, C.WORLD_W - (R.x + R.w));
                if (gap < C.BALL_R * 3) { bad.push('a moving gate seals the field shut'); break; }
            }
        });

        /* Tunnels. Each mouth needs room to be a mouth: on the field, clear
           of anything solid or wet over the whole of a gate's travel, off
           the tee, well off the cup, off every slope (a ball the hill holds
           over a mouth would go down it at rest), and clear of every other
           mouth. Two mouths that touch are one tunnel with nowhere to go. */
        var mouths = [];
        (h.tunnels || []).forEach(function (t) {
            mouths.push({ x: t.x, y: t.y }, { x: t.tx, y: t.ty });
            if (Math.hypot(t.tx - t.x, t.ty - t.y) < C.TUNNEL_R * 6) bad.push('a tunnel too short to go anywhere');
        });
        var TR = C.TUNNEL_R;
        mouths.forEach(function (m, mi) {
            if (!(m.x - TR > margin && m.x + TR < C.WORLD_W - margin &&
                  m.y - TR > margin && m.y + TR < C.WORLD_H - margin)) {
                bad.push('a tunnel mouth off the field');
            }
            var solid = (h.walls || []).some(function (w) {
                return P.circleRect(m.x, m.y, TR + C.BALL_R, travelEnvelope(w)) !== null;
            }) || posts.some(function (b) {
                return P.circleCircle(m.x, m.y, TR + C.BALL_R, b) !== null;
            }) || rails.some(function (r) {
                return P.circleRail(m.x, m.y, TR + C.BALL_R, r) !== null;
            }) || (h.water || []).concat(h.lava || []).some(function (r) {
                return circleTouches(m.x, m.y, TR + C.BALL_R, r);
            });
            if (solid) bad.push('a tunnel mouth crowded by a wall, a post or water');
            if ((h.avalanches || []).some(function (a) { return P.circleRect(m.x, m.y, TR, a) !== null; })) {
                bad.push('a tunnel mouth in an avalanche chute');
            }
            if ((h.slopes || []).some(function (r) { return circleTouches(m.x, m.y, TR, r); }) || P.inHill(h.hills, m.x, m.y, TR)) {
                bad.push('a tunnel mouth on a slope');
            }
            if (Math.hypot(m.x - h.tee.x, m.y - h.tee.y) < TR + C.BALL_R + 12) bad.push('a tunnel mouth on the tee');
            if (Math.hypot(m.x - h.hole.x, m.y - h.hole.y) < TR + C.HOLE_R + 40) bad.push('a tunnel mouth on the cup');
            mouths.forEach(function (o, oi) {
                if (oi <= mi) return;
                if (Math.hypot(m.x - o.x, m.y - o.y) < TR * 2 + C.BALL_R * 2) bad.push('two tunnel mouths on top of each other');
            });
        });

        /* Avalanche chutes. A slide has to be something you can wait out,
           so every point of a chute lies clear for AVALANCHE_CLEAR seconds of
           each cycle, and one slide is gone before the next sets off. The
           tee and the cup stand off the chute: a ball teed up in the path of
           a slide would be carried off before it was played, and a cup in
           one could be swept clean of the ball rolling into it. */
        (h.avalanches || []).forEach(function (a) {
            if (['down', 'up', 'left', 'right'].indexOf(a.dir) < 0) { bad.push('a chute with no downhill'); return; }
            if (a.x < -1 || a.y < -1 || a.x + a.w > C.WORLD_W + 1 || a.y + a.h > C.WORLD_H + 1) bad.push('a chute off the field');
            var len = a.len || C.AVALANCHE_LEN;
            if (!(a.every > 0) || a.every < (P.chuteLength(a) + len) / C.AVALANCHE_SPEED) {
                bad.push('a chute whose slides overlap');
            } else if (a.every - len / C.AVALANCHE_SPEED < C.AVALANCHE_CLEAR) {
                bad.push('a chute that is never clear long enough to cross');
            }
            if (P.circleRect(h.tee.x, h.tee.y, C.BALL_R + 12, a)) bad.push('the tee is in an avalanche chute');
            if (P.circleRect(h.hole.x, h.hole.y, C.HOLE_R + 24, a)) bad.push('the cup is in an avalanche chute');
        });

        /* Geysers. A vent is a disc of open ground: off the field's edge,
           clear of anything solid, wet or burning (a ball that rolls onto a
           blowing vent has to be able to roll onto it), off every slope and
           chute, off the tee and well off the cup, and blowing for part of
           its cycle rather than all of it or none. */
        var VR = C.VENT_R;
        (h.vents || []).forEach(function (v) {
            if (!(v.every > 0) || !(v.run > 0.3) || v.run > v.every - 0.8) bad.push('a vent that never rests or never blows');
            if (!(v.x - VR > margin && v.x + VR < C.WORLD_W - margin && v.y - VR > margin && v.y + VR < C.WORLD_H - margin)) {
                bad.push('a vent off the field');
            }
            var crowded = (h.walls || []).some(function (w) {
                return P.circleRect(v.x, v.y, VR + C.BALL_R, travelEnvelope(w)) !== null;
            }) || posts.some(function (b) {
                return P.circleCircle(v.x, v.y, VR + C.BALL_R, b) !== null;
            }) || rails.some(function (r) {
                return P.circleRail(v.x, v.y, VR + C.BALL_R, r) !== null;
            }) || [].concat(h.water || [], h.lava || []).some(function (z) {
                return circleTouches(v.x, v.y, VR, z);
            });
            if (crowded) bad.push('a vent crowded by a wall, a post, water or lava');
            if ((h.slopes || []).concat(h.avalanches || []).some(function (z) { return circleTouches(v.x, v.y, VR, z); }) ||
                P.inHill(h.hills, v.x, v.y, VR)) {
                bad.push('a vent on a slope or in a chute');
            }
            if (Math.hypot(v.x - h.tee.x, v.y - h.tee.y) < VR + C.BALL_R + 12) bad.push('a vent on the tee');
            if (Math.hypot(v.x - h.hole.x, v.y - h.hole.y) < VR + C.HOLE_R + 40) bad.push('a vent on the cup');
            mouths.forEach(function (m) {
                if (Math.hypot(v.x - m.x, v.y - m.y) < VR + TR + C.BALL_R * 2) bad.push('a vent on a tunnel mouth');
            });
        });

        /* Spinners. An arm bats a ball on; it must never be able to crush
           one. So the whole disc its tips sweep, and a ball's width and a
           little more round it, is open grass: off the cushion, clear of
           every wall over its whole travel, every post, rail, curve, block
           and other spinner, and off the tee, the cup, every mouth and every
           vent — a ball teed up in a sweep would be hit before it was played. */
        var spins = h.spinners || [];
        spins.forEach(function (sp, si) {
            if (!(sp.r >= 40) || !(sp.arms >= 1 && sp.arms <= 4) || !(Math.abs(sp.speed) >= 0.3 && Math.abs(sp.speed) <= 3)) {
                bad.push('a spinner too small, too fast, too slow or with no arms');
                return;
            }
            var sweep = P.sweepOf(sp), room = sweep + C.BALL_R * 2 + 4;
            if (sp.x - room < 0 || sp.y - room < 0 || sp.x + room > C.WORLD_W || sp.y + room > C.WORLD_H) {
                bad.push('a spinner that sweeps too near the cushion');
            }
            var crowded = (h.walls || []).some(function (w) {
                return P.circleRect(sp.x, sp.y, room, travelEnvelope(w)) !== null;
            }) || posts.some(function (b) {
                return P.circleCircle(sp.x, sp.y, room, b) !== null;
            }) || rails.some(function (r) {
                return P.circleRail(sp.x, sp.y, room, r) !== null;
            }) || spins.some(function (o, oi) {
                return oi !== si && Math.hypot(o.x - sp.x, o.y - sp.y) < room + P.sweepOf(o);
            });
            if (crowded) bad.push('a spinner with something solid in its sweep');
            if (Math.hypot(h.tee.x - sp.x, h.tee.y - sp.y) < sweep + C.BALL_R + 12) bad.push('the tee is in a spinner\'s sweep');
            if (Math.hypot(h.hole.x - sp.x, h.hole.y - sp.y) < sweep + C.HOLE_R + 12) bad.push('the cup is in a spinner\'s sweep');
            mouths.forEach(function (m) {
                if (Math.hypot(m.x - sp.x, m.y - sp.y) < sweep + TR + C.BALL_R) bad.push('a tunnel mouth in a spinner\'s sweep');
            });
            (h.vents || []).forEach(function (v) {
                if (Math.hypot(v.x - sp.x, v.y - sp.y) < sweep + VR + C.BALL_R) bad.push('a vent in a spinner\'s sweep');
            });
        });

        /* Belts. Ground that moves carries the ball to its far end, so the
           far end has to run out onto open ground: not into the cushion and
           not into anything solid, or the ball would ride it into a wall and
           never stop. Nothing else lies on a belt — no sand, ice, slope,
           hill, chute, water or lava — because it is its own surface. */
        (h.belts || []).forEach(function (bt) {
            if (['down', 'up', 'left', 'right'].indexOf(bt.dir) < 0) { bad.push('a belt going nowhere'); return; }
            if (!(bt.speed >= 40 && bt.speed <= 320)) bad.push('a belt too slow to see or too fast to ride');
            if (bt.x < -1 || bt.y < -1 || bt.x + bt.w > C.WORLD_W + 1 || bt.y + bt.h > C.WORLD_H + 1) bad.push('a belt off the field');
            var d = P.chuteDir(bt), reach = C.BALL_R * 3 + 4;
            // The strip just past the belt's far end, where it puts the ball down.
            var foot = d.x > 0 ? { x: bt.x + bt.w, y: bt.y, w: reach, h: bt.h }
                     : d.x < 0 ? { x: bt.x - reach, y: bt.y, w: reach, h: bt.h }
                     : d.y > 0 ? { x: bt.x, y: bt.y + bt.h, w: bt.w, h: reach }
                     : { x: bt.x, y: bt.y - reach, w: bt.w, h: reach };
            if (foot.x < 0 || foot.y < 0 || foot.x + foot.w > C.WORLD_W || foot.y + foot.h > C.WORLD_H) {
                bad.push('a belt that runs into the cushion');
            }
            var span = { x: Math.min(bt.x, foot.x), y: Math.min(bt.y, foot.y),
                         w: Math.max(bt.x + bt.w, foot.x + foot.w) - Math.min(bt.x, foot.x),
                         h: Math.max(bt.y + bt.h, foot.y + foot.h) - Math.min(bt.y, foot.y) };
            var blocked = (h.walls || []).some(function (w) { return overlaps(travelEnvelope(w), span); }) ||
                posts.some(function (b) { return P.circleRect(b.x, b.y, b.r, span) !== null; }) ||
                rails.some(function (r) { return railTouches(r, span); }) ||
                spins.some(function (sp) { return P.circleRect(sp.x, sp.y, P.sweepOf(sp), span) !== null; });
            if (blocked) bad.push('a belt that runs into something solid');
            var layered = false;
            for (var gx = bt.x + 4; gx < bt.x + bt.w && !layered; gx += 8) {
                for (var gy = bt.y + 4; gy < bt.y + bt.h && !layered; gy += 8) {
                    layered = !!(P.zoneAt(h.water, gx, gy) || P.zoneAt(h.lava, gx, gy) || P.zoneAt(h.sand, gx, gy) ||
                        P.zoneAt(h.ice, gx, gy) || P.zoneAt(h.slopes, gx, gy) || P.zoneAt(h.avalanches, gx, gy) ||
                        P.inHill(h.hills, gx, gy));
                }
            }
            if (layered) bad.push('a belt laid over another surface');
            if (P.circleRect(h.tee.x, h.tee.y, C.BALL_R + 4, bt)) bad.push('the tee is on a belt');
            if (P.circleRect(h.hole.x, h.hole.y, C.HOLE_R + 12, bt)) bad.push('the cup is on a belt');
            mouths.forEach(function (m) { if (P.circleRect(m.x, m.y, TR, bt)) bad.push('a tunnel mouth on a belt'); });
            (h.vents || []).forEach(function (v) { if (P.circleRect(v.x, v.y, VR, bt)) bad.push('a vent on a belt'); });
        });

        if (strict) {
            (h.slopes || []).forEach(function (s) {
                if (s.pts) return;   // reported above
                if (!s.ax && !s.ay) { bad.push('a slope with nowhere to fall'); return; }

                // Nothing solid inside a slope zone. A ball inside one is
                // never counted as at rest, so a ball the hill holds against
                // a post is a hole that never hands itself back.
                var pinned = posts.some(function (b) {
                    return P.circleRect(b.x, b.y, b.r + C.BALL_R, s) !== null;
                }) || (h.walls || []).some(function (w) {
                    return overlaps(travelEnvelope(w), grow(s, 60));
                }) || rails.some(function (r) {
                    return overlaps(railBox(r), grow(s, 60));
                });
                if (pinned) bad.push('a slope with something solid inside it');

                if (P.pointInRect(h.hole.x, h.hole.y, s)) bad.push('the cup is inside a slope');
                if (P.pointInRect(h.tee.x, h.tee.y, s)) bad.push('the tee is inside a slope');

                // And what it sheds has to have somewhere to stop: a collar
                // of rough at the foot of the hill, clear of the cushion.
                if (!drains(h, s)) bad.push('a slope with no collar to shed into');
            });
        }

        return bad;
    }

    function blocked(h, x, y, rad) {
        return (h.walls || []).some(function (w) {
            return P.circleRect(x, y, rad, P.wallRect(w, 0)) !== null;
        }) || (h.bumpers || []).some(function (b) {
            return P.circleCircle(x, y, rad, b) !== null;
        }) || P.railsOf(h).some(function (r) {
            return P.circleRail(x, y, rad, r) !== null;
        }) || P.zoneAt(h.water, x, y) !== null || P.zoneAt(h.lava, x, y) !== null || P.inBlock(h, x, y) !== null;
    }

    // Does a circle reach into a zone, rectangle or polygon? Inside it, or
    // within `rad` of one of its edges.
    function circleTouches(x, y, rad, z) {
        if (!z.pts) return P.circleRect(x, y, rad, z) !== null;
        if (P.pointInPoly(x, y, z.pts)) return true;
        var p = z.pts;
        for (var i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
            if (P.circleRail(x, y, rad, { x: p[j], y: p[j + 1], tx: p[i], ty: p[i + 1], w: 0 })) return true;
        }
        return false;
    }

    // Everything a rail covers, as a box: its spine grown by half its width.
    function railBox(r) {
        var h = r.w / 2;
        return {
            x: Math.min(r.x, r.tx) - h, y: Math.min(r.y, r.ty) - h,
            w: Math.abs(r.tx - r.x) + r.w, h: Math.abs(r.ty - r.y) + r.w
        };
    }

    function grow(r, by) {
        return { x: r.x - by, y: r.y - by, w: r.w + by * 2, h: r.h + by * 2 };
    }

    // Does a rail reach into a rectangle? Its spine sampled every few pixels,
    // each sample a disc as wide as the rail.
    function railTouches(r, R) {
        var L = Math.hypot(r.tx - r.x, r.ty - r.y), n = Math.max(1, Math.ceil(L / 4));
        for (var i = 0; i <= n; i++) {
            if (P.circleRect(r.x + (r.tx - r.x) * i / n, r.y + (r.ty - r.y) * i / n, r.w / 2, R)) return true;
        }
        return false;
    }

    function overlaps(a, b) {
        return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    }

    // Everything a wall can cover over its whole cycle, which is the shape a
    // slope has to stay away from — a gate that is 200px clear at one phase
    // and touching at another is touching.
    function travelEnvelope(w) {
        if (!w.move) return w;
        var a = Math.abs(w.move.amp);
        return w.move.axis === 'y'
            ? { x: w.x, y: w.y - a, w: w.w, h: w.h + a * 2 }
            : { x: w.x - a, y: w.y, w: w.w + a * 2, h: w.h };
    }

    /* Does the hill have somewhere to put what it sheds? Step off the
       downhill edge and ask what is there: it has to be rough, and the
       cushion has to be far enough beyond it that a ball rolling in cannot
       reach the cushion, bounce, and be handed back to the hill. 140px of
       rough stops anything these gradients can produce. */
    function drains(h, s) {
        var dirX = s.ax > 0 ? 1 : s.ax < 0 ? -1 : 0;
        var dirY = s.ay > 0 ? 1 : s.ay < 0 ? -1 : 0;
        var x = s.x + s.w / 2 + dirX * (s.w / 2 + 20);
        var y = s.y + s.h / 2 + dirY * (s.h / 2 + 20);
        var toWall = dirX > 0 ? C.WORLD_W - (s.x + s.w)
                   : dirX < 0 ? s.x
                   : dirY > 0 ? C.WORLD_H - (s.y + s.h)
                   : s.y;
        return toWall >= 140 && P.zoneAt(h.rough, x, y) !== null;
    }

    /* ── building a hole ────────────────────────────────────────────────── */

    /* Where along the hole the features go. Spread wide rather than evenly:
       the first one has to clear the tee and the last one the cup, and what
       is left in the middle is what two or three bands have to share. Slots
       any closer together and a wide feature — a bunker 220px deep, a
       lattice three rows thick — collides with its neighbour, the hole is
       thrown away, and the draw quietly fills up with one-feature holes. */
    var HOLE_SLOTS = {
        1: [0.5],
        2: [0.34, 0.72],
        3: [0.27, 0.53, 0.8]
    };

    function tryHole(rng, primary, cap) {
        // Across the field far more often than up it: played up the field a
        // hole has room for one band, and a draw of nine of those would be
        // nine one-idea holes. The hand-built rack plays a few up the field,
        // and they are the better for being the exception.
        var horizontal = rng() < 0.86;
        var U = horizontal ? C.WORLD_W : C.WORLD_H;
        var V = horizontal ? C.WORLD_H : C.WORLD_W;
        var forward = rng() < 0.5;
        var near = between(rng, 80, 145);
        var far = U - between(rng, 80, 145);
        var f = makeFrame(horizontal, forward ? near : far, forward ? far : near);
        var teeV = between(rng, 80, V - 80);
        var cupV = between(rng, 80, V - 80);

        /* Played up the field there is 640px of along axis rather than 960,
           and once the tee and the cup have had their clearance there is one
           band's worth of room left in it. Asking for two is asking for a
           hole that gets thrown away — which is why the field used to be
           crossed nine times out of ten and played up it once. One idea,
           stated across the full width, is what a short hole is anyway:
           Bunker Hill on the Old Course is exactly that. */
        var count = Math.min(cap, horizontal ? 3 : 1,
            1 + (rng() < 0.75 ? 1 : 0) + (rng() < 0.35 ? 1 : 0));
        var keys = [{ set: FEATURES, key: primary }];
        while (keys.length < count) {
            keys.push({ set: TRIMMINGS, key: TRIMMING_KEYS[Math.floor(rng() * TRIMMING_KEYS.length)] });
        }
        keys = shuffled(rng, keys);

        var slots = HOLE_SLOTS[count];
        var lo = Math.min(f.teeU, f.cupU), hi = Math.max(f.teeU, f.cupU);
        var parts = [], spans = [];

        for (var i = 0; i < count; i++) {
            var entry = keys[i];
            var frac = slots[i] + between(rng, -0.03, 0.03);
            var u = f.at(frac);
            // Where the straight line from the tee to the cup crosses this
            // band. Every builder places itself against it.
            var v = teeV + (cupV - teeV) * frac;
            var part = entry.set[entry.key].build(rng, f, u, v);
            if (!part) return null;

            // Nothing may crowd the tee or the cup, and nothing may crowd
            // anything else: 60px between footprints is what keeps a slope
            // clear of a wall and a bunker out of a gate's mouth.
            var span = footprint(f, part);
            if (span.lo < lo + 80 || span.hi > hi - 75) return null;
            for (var j = 0; j < spans.length; j++) {
                if (span.lo < spans[j].hi + 60 && spans[j].lo < span.hi + 60) return null;
            }
            spans.push(span);
            parts.push({ entry: entry, part: part });
        }

        var hole = {
            tee: f.point(f.teeU, teeV),
            hole: f.point(f.cupU, cupV),
            walls: [], water: [], sand: [], rough: [], ice: [], bumpers: [], slopes: [],
            // Not dealt: a tunnel is a hand-built course's idea (see The
            // Warren), and the deck is nine features for nine holes.
            tunnels: [],
            rails: []
        };
        parts.forEach(function (p) {
            FAMILIES.forEach(function (k) {
                if (p.part[k]) hole[k] = hole[k].concat(p.part[k]);
            });
        });

        // Par off the two things that cost strokes: how far it is, and how
        // much of it is in the way.
        var par = 2;
        if (f.span > 430) par++;
        if (count >= 3) par++;
        if (parts.some(function (p) { return COSTLY[p.entry.key] && p.entry.set === FEATURES; })) par++;
        hole.par = Math.max(2, Math.min(5, par));

        hole.primary = keys.filter(function (k) { return k.set === FEATURES; })[0].key;
        hole.phrases = parts.map(function (p) { return p.entry.set[p.entry.key].phrase; });
        return hole;
    }

    /* ── the elbow ──────────────────────────────────────────────────────

       Everything above builds one straight line with bands across it, and
       nine of those on a card is nine of the same hole wearing different
       furniture. The shape of a hole is the first thing a player reads off
       the screen, so this is the second shape: a long wall down the field
       with one end left open, the tee behind it and the cup round the end of
       it. There is no straight line from the tee to the cup at all — which
       is the one thing a band laid across a corridor can never take away,
       because a band always has a mouth in it.

       It comes two ways. A **bend** puts the cup near the mouth, so the way
       to it is to carry on down the lane and turn once. A **hairpin** puts
       it back at the closed end of the far lane, so the route runs the whole
       length of the field, round, and the whole length back — and for most
       of the way out, the cup is getting further away, not nearer. Both are
       dealt; the hairpin is the shape worth having and it is the one that
       cost something, because the bot in tests.html used to find its way by
       getting nearer the cup and could not play one at all. That bot is now
       a breadth-first search over shots rather than a greedy walk, which is
       the honest fix: it plans like a player looking at the screen, and its
       stroke — power, spread, overswing — is untouched.

       It is the same machinery underneath. Each leg is a frame of its own,
       and a frame carries the cross window it lives in, so every builder
       above works inside a lane without knowing it is in one. What a lane
       cannot do is fit everything — a bar that needs 470px of travel has
       nowhere to sweep in a 280px lane — so each feature declares its `minV`
       and a lane draws only from the ones that fit.

       Two things are checked rather than assumed. The straight line from the
       tee to the cup has to actually run into the wall, or the shape is a
       wall with a hole played past it; and no band may come within a band's
       clearance of the mouth, so the way round stays open by construction,
       exactly as a band's own mouth does. */

    var ELBOW_NAMES = {
        bend:    ['The Long Wall', 'Round the Corner', 'Blind Corner',
                  'The Sidestep', 'Behind the Wall', 'The Detour'],
        hairpin: ['The Hairpin', 'Switchback', 'Round the Houses',
                  'The Long Way', 'Elbow Room', 'The Return']
    };
    var ELBOW_PHRASE = {
        bend: 'a wall down the field to get round',
        hairpin: 'out, round the end of a wall, and all the way back'
    };

    var DIVIDER_T = 26;      // thick enough to be a wall, per the rule book
    var CORNER_CLEAR = 40;   // how far short of the mouth a leg stops
    var LANE_MIN = 265;      // a lane narrower than this is a gutter

    /* Does the straight line from the tee to the cup run into the wall? A
       walk along it rather than a solved intersection: the step is well under
       the thickness of what it is looking for, and this runs a few dozen
       times a draw rather than a few thousand. */
    function lineHits(a, b, rect) {
        var steps = 160;
        for (var i = 0; i <= steps; i++) {
            var t = i / steps;
            if (P.pointInRect(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, rect)) return true;
        }
        return false;
    }

    function tryElbow(rng, primary, cap) {
        // Legs across the field twice as often as up it, for the reason a
        // straight hole is dealt that way: 960px of along axis carries a leg
        // and 640 barely does. The two are not one hole rotated — the field
        // is 3:2, so the lanes come out wide and short one way and narrow
        // and long the other.
        var horizontal = rng() < 0.62;
        var U = horizontal ? C.WORLD_W : C.WORLD_H;
        var V = horizontal ? C.WORLD_H : C.WORLD_W;

        // The wall sits near the middle: both lanes have to be wide enough to
        // line a putt up in, and a 200px lane is a gutter.
        var dv = between(rng, V * 0.46, V * 0.54);
        var laneA = dv, laneB = V - dv - DIVIDER_T;
        if (Math.min(laneA, laneB) < LANE_MIN) return null;

        /* Which end is open, and by how much. `sign` runs from the closed end
           towards the mouth, and everything below is written along it, which
           is what saves a mirrored copy of the whole layout. */
        var openFar = rng() < 0.5;
        var sign = openFar ? 1 : -1;
        var edge = openFar ? 0 : U;
        // The mouth is the only way through, so it is generous on purpose and
        // has a floor as well as a share: threading a 140px gap from 300px
        // away is a trick, not a corner.
        var gap = between(rng, Math.max(190, U * 0.22), Math.max(215, U * 0.30));
        var cornerU = edge + sign * (U - gap);
        var turnU = cornerU - sign * CORNER_CLEAR;

        function closedEnd() { return edge + sign * between(rng, 80, Math.min(155, U * 0.17)); }

        var hairpin = rng() < 0.45;
        var teeU = closedEnd();
        var cupU = hairpin
            ? closedEnd()                                    // back where it started
            : cornerU - sign * between(rng, -40, U * 0.15);  // round the corner and stop

        var teeV = between(rng, 70, laneA - 70);
        var cupV = between(rng, 70, laneB - 70);

        var outer = makeFrame(horizontal, 0, U);
        var divider = outer.rect(openFar ? 0 : cornerU, U - gap, dv, DIVIDER_T);

        /* The leg out, and on a hairpin the leg back. `aim` is the line a band
           places itself against, the way `v` is on a straight hole: out of the
           tee towards the mouth, and out of the mouth towards the cup. */
        var legs = [{
            f: makeFrame(horizontal, teeU, turnU, 0, laneA),
            V: laneA, aim: [teeV, laneA / 2]
        }];
        if (hairpin) {
            legs.push({
                f: makeFrame(horizontal, turnU, cupU, dv + DIVIDER_T, V),
                V: laneB, aim: [laneB / 2, cupV]
            });
        }

        var tee = legs[0].f.point(teeU, teeV);
        var cup = makeFrame(horizontal, 0, U, dv + DIVIDER_T, V).point(cupU, cupV);

        // The shape has to be the shape. A tee and a cup that can see each
        // other over the end of the wall is a hole with a wall beside it.
        if (!lineHits(tee, cup, divider)) return null;

        /* The deck's feature goes in whichever lane will hold it; trimmings
           fill what is left of the budget, and a leg under 520px only has
           room for one band once the tee (or the cup) and the mouth have had
           their clearance. */
        var primaryLeg = -1;
        for (var L = 0; L < legs.length; L++) {
            if (FEATURES[primary].minV <= legs[L].V) { primaryLeg = L; break; }
        }
        if (primaryLeg < 0) return null;

        var budget = cap;
        legs.forEach(function (leg) { leg.entries = []; });
        legs[primaryLeg].entries.push({ set: FEATURES, key: primary });
        budget--;
        legs.forEach(function (leg) {
            var room = (leg.f.span > 520 ? 2 : 1) - leg.entries.length;
            var fits = TRIMMING_KEYS.filter(function (k) { return TRIMMINGS[k].minV <= leg.V; });
            while (room-- > 0 && budget > 0 && fits.length && rng() < 0.55) {
                leg.entries.push({ set: TRIMMINGS, key: fits[Math.floor(rng() * fits.length)] });
                budget--;
            }
            leg.entries = shuffled(rng, leg.entries);
        });

        var hole = {
            tee: tee, hole: cup,
            walls: [divider], water: [], sand: [], rough: [], ice: [],
            bumpers: [], slopes: []
        };

        var used = [];
        for (L = 0; L < legs.length; L++) {
            var leg = legs[L];
            if (!leg.entries.length) continue;
            var slots = HOLE_SLOTS[leg.entries.length];
            var lo = Math.min(leg.f.teeU, leg.f.cupU);
            var hi = Math.max(leg.f.teeU, leg.f.cupU);
            var spans = [];
            for (var i = 0; i < leg.entries.length; i++) {
                var entry = leg.entries[i];
                var frac = slots[i] + between(rng, -0.03, 0.03);
                var part = entry.set[entry.key].build(rng, leg.f, leg.f.at(frac),
                    leg.aim[0] + (leg.aim[1] - leg.aim[0]) * frac);
                if (!part) return null;

                // The tee or the cup at one end, the mouth of the turn at the
                // other, and 60px between anything and its neighbour.
                var span = footprint(leg.f, part);
                if (span.lo < lo + 80 || span.hi > hi - 80) return null;
                for (var j = 0; j < spans.length; j++) {
                    if (span.lo < spans[j].hi + 60 && spans[j].lo < span.hi + 60) return null;
                }
                spans.push(span);

                FAMILIES.forEach(function (k) {
                    if (part[k]) hole[k] = hole[k].concat(part[k]);
                });
                used.push(entry);
            }
        }

        /* Par starts at three rather than two: the wall is between the tee and
           the cup, so getting round it is a shot before anything else on the
           hole has been considered. */
        var route = Math.abs(turnU - teeU) + Math.abs(cupU - turnU) +
                    (laneA - teeV) + DIVIDER_T + cupV;
        var par = 3;
        if (route > 1000) par++;
        if (used.some(function (e) { return COSTLY[e.key] && e.set === FEATURES; })) par++;
        hole.par = Math.max(2, Math.min(5, par));

        hole.primary = primary;
        hole.names = ELBOW_NAMES[hairpin ? 'hairpin' : 'bend'];
        hole.phrases = [ELBOW_PHRASE[hairpin ? 'hairpin' : 'bend']].concat(
            used.map(function (e) { return e.set[e.key].phrase; }));
        return hole;
    }

    function fallbackHole(rng, primary) {
        /* The hole that cannot fail: a straight one with a collar of rough
           and nothing else on it. Twelve re-rolls of a feature that will not
           fit is vanishingly rare and not worth an infinite loop, and a dull
           hole is a better answer than a hung boot or an illegal one. */
        var f = makeFrame(true, 130, 830);
        return {
            primary: primary,
            phrases: ['nothing but the length of it'],
            par: 3,
            tee: f.point(130, between(rng, 160, 480)),
            hole: f.point(830, between(rng, 160, 480)),
            walls: [], water: [], sand: [],
            rough: [f.rect(0, 960, 0, 80), f.rect(0, 960, 560, 80)],
            ice: [], bumpers: [], slopes: []
        };
    }

    function capitalise(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    /* An elbow brings its own names, because the shape of it is the thing
       worth naming: a hairpin whose primary feature is a bunker is The
       Hairpin, not Sandy Lie. Everything else is named off its feature, so a
       hole called The Ford has water on it. */
    function nameHole(rng, pool, used) {
        var start = Math.floor(rng() * pool.length);
        for (var i = 0; i < pool.length; i++) {
            var name = pool[(start + i) % pool.length];
            if (!used[name]) { used[name] = true; return name; }
        }
        var n = 2;
        while (used[pool[start] + ' ' + n]) n++;
        used[pool[start] + ' ' + n] = true;
        return pool[start] + ' ' + n;
    }

    function blurbFor(hole) {
        var p = hole.phrases;
        if (p.length === 1) return capitalise(p[0]) + '.';
        return capitalise(p[0]) + ', then ' + p.slice(1).join(', then ') + '.';
    }

    /* Twelve goes at a hole, and the last of them asks for less than the
       first did. A three-band hole on a 700px field fails the spacing rules
       often; giving up on a hole that misses twice would fill a draw with
       one-band holes, and giving up on it entirely would drop the feature
       the deck dealt it — which is what guarantees the card carries every
       hazard. So the cap comes down instead, and the primary feature, the
       one the deck cares about, is the last thing to go. */
    function makeHole(rng, primary, used) {
        /* Which shape this hole wants, decided once rather than per attempt:
           a card that re-rolled the shape every go would come out straight
           almost always, because a straight hole is the easier thing to fit.
           Four goes at an elbow and then the straight one — the shape is
           worth some of the budget and not all of it, and a hole is never
           dropped for the want of it. */
        var wantsElbow = rng() < ELBOW_SHARE;
        var hole = null;
        for (var attempt = 0; attempt < 12 && !hole; attempt++) {
            var cap = attempt < 6 ? 3 : attempt < 9 ? 2 : 1;
            var candidate = (wantsElbow && attempt < 4)
                ? tryElbow(rng, primary, cap)
                : tryHole(rng, primary, cap);
            if (candidate && validateHole(candidate, { strict: true }).length === 0) hole = candidate;
        }
        if (!hole) hole = fallbackHole(rng, primary);
        hole.name = nameHole(rng, hole.names || FEATURES[hole.primary].names, used);
        hole.blurb = blurbFor(hole);
        delete hole.phrases;
        delete hole.primary;
        delete hole.names;
        return hole;
    }

    /* ── a course ───────────────────────────────────────────────────────

       One feature per hole, dealt from a shuffled deck rather than drawn
       fresh each time. That is what guarantees the card carries every hazard
       the game has: nine features, nine holes, each used once. Drawing
       independently would sooner or later deal a course with no water on it,
       which is not a course, it is a field. */
    function generateCourse(seed, count) {
        seed = seedFrom(seed);
        if (seed === null) seed = randomSeed();
        var rng = mulberry32(seed ^ 0x9E3779B9);
        var holes = [];
        var used = {};
        var deck = shuffled(rng, PRIMARY_KEYS);
        var n = count || DRAW_HOLES;
        for (var i = 0; i < n; i++) holes.push(makeHole(rng, deck[i % deck.length], used));

        return {
            id: DRAW_ID,
            name: 'Random Draw',
            blurb: 'Nine holes nobody has played, dealt from seed ' + seedLabel(seed) + '.',
            seed: seed,
            /* A draw is not a course you can hold a record on: no two of them
               are the same field, so a best round across them measures which
               seeds were kind rather than who played well. The round in
               progress is still kept — that is about not losing your evening
               to a refresh — and scoring.js discards it when the seed under
               it changes. */
            record: false,
            /* The endless card, and so the last rung of the ladder: nine
               holes nobody has played are the reward for having played the
               ones somebody built. See progress.js. */
            unlock: 66,
            holes: holes
        };
    }

    /* Put a draw on the rack, replacing the one that is there. The pointer
       matters: if the draw is the course being played, GOLF.COURSE has to
       follow it to the new holes or the game goes on playing a card that is
       no longer on the rack. */
    function installDraw(seed) {
        var course = generateCourse(seed);
        for (var i = 0; i < GOLF.COURSES.length; i++) {
            if (GOLF.COURSES[i].id !== DRAW_ID) continue;
            GOLF.COURSES[i] = course;
            if (GOLF.COURSE_ID === DRAW_ID) GOLF.selectCourse(DRAW_ID);
            return course;
        }
        GOLF.COURSES.push(course);
        return course;
    }

    GOLF.generator = {
        mulberry32: mulberry32,
        randomSeed: randomSeed,
        seedFrom: seedFrom,
        seedLabel: seedLabel,
        features: PRIMARY_KEYS,
        course: generateCourse,
        DRAW_ID: DRAW_ID,
        DRAW_HOLES: DRAW_HOLES
    };

    GOLF.generateCourse = generateCourse;
    GOLF.installDraw = installDraw;
    GOLF.validateHole = validateHole;
    GOLF.circleTouches = circleTouches;

})(window.GOLF);
