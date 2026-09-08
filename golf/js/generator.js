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
       else. */
    function makeFrame(horizontal, teeU, cupU) {
        var f = {
            horizontal: horizontal,
            U: horizontal ? C.WORLD_W : C.WORLD_H,   // the along extent of the field
            V: horizontal ? C.WORLD_H : C.WORLD_W,   // the cross extent
            teeU: teeU,
            cupU: cupU,
            span: Math.abs(cupU - teeU)
        };

        f.at = function (frac) { return teeU + (cupU - teeU) * frac; };

        f.rect = function (u, du, v, dv) {
            return horizontal
                ? { x: u, y: v, w: du, h: dv }
                : { x: v, y: u, w: dv, h: du };
        };

        f.point = function (u, v) {
            return horizontal ? { x: u, y: v } : { x: v, y: u };
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
       you see one; these read as a course. */

    var FEATURES = {
        gate: {
            names: ['The Doorway', 'Threadneedle', 'Keyhole', 'The Gap'],
            phrase: 'a mouth in the wall to thread',
            build: function (rng, f, u, v) {
                var mouth = between(rng, 150, 210);
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
            build: function (rng, f, u) {
                var depth = between(rng, 140, 200);
                return { ice: [f.rect(u - depth / 2, depth, 0, f.V)] };
            }
        },

        bunker: {
            names: ['The Beach', 'Sandy Lie', 'The Waste', 'Heavy Going'],
            phrase: 'sand sat on the line',
            build: function (rng, f, u, v) {
                var depth = between(rng, 130, 190);
                var width = between(rng, 150, 300);
                // Sand sat on the line, which is what the blurb promises.
                var c = clamp(v, 40 + width / 2, f.V - 40 - width / 2);
                return { sand: [f.rect(u - depth / 2, depth, c - width / 2, width)] };
            }
        },

        pocket: {
            names: ['Two Guards', 'The Gateposts', 'Narrow Minds', 'The Sentries'],
            phrase: 'two posts to be putted between',
            build: function (rng, f, u, v) {
                var rad = between(rng, 22, 26);
                var mouth = between(rng, 110, 160);
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
       lesson hole one of the eighteen teaches, and it is worth repeating. */
    var TRIMMINGS = {
        collar: {
            phrase: 'rough down both cushions',
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
        var rects = [].concat(h.walls || [], h.water || [], h.sand || [],
                              h.rough || [], h.ice || [], h.slopes || []);
        var posts = h.bumpers || [];

        rects.forEach(function (r) {
            if (Math.min(r.w, r.h) < 20) bad.push('a rectangle thinner than 20px');
        });
        posts.forEach(function (b) {
            if (b.r < C.BUMPER_MIN_R) bad.push('a post under BUMPER_MIN_R');
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

        if (strict) {
            (h.slopes || []).forEach(function (s) {
                if (!s.ax && !s.ay) { bad.push('a slope with nowhere to fall'); return; }

                // Nothing solid inside a slope zone. A ball inside one is
                // never counted as at rest, so a ball the hill holds against
                // a post is a hole that never hands itself back.
                var pinned = posts.some(function (b) {
                    return P.circleRect(b.x, b.y, b.r + C.BALL_R, s) !== null;
                }) || (h.walls || []).some(function (w) {
                    return overlaps(travelEnvelope(w), grow(s, 60));
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
        }) || P.zoneAt(h.water, x, y) !== null;
    }

    function grow(r, by) {
        return { x: r.x - by, y: r.y - by, w: r.w + by * 2, h: r.h + by * 2 };
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
        // Across the field far more often than up it, which is the shape of
        // the hand-built rack: one hole of the eighteen is played up the
        // field and one of the Wild Nine, and both are the better for being
        // the exception.
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
           Bunker Hill on the eighteen is exactly that. */
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
            walls: [], water: [], sand: [], rough: [], ice: [], bumpers: [], slopes: []
        };
        parts.forEach(function (p) {
            ['walls', 'water', 'sand', 'rough', 'ice', 'bumpers', 'slopes'].forEach(function (k) {
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

    function nameHole(rng, primary, used) {
        var pool = FEATURES[primary].names;
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
        var hole = null;
        for (var attempt = 0; attempt < 12 && !hole; attempt++) {
            var cap = attempt < 6 ? 3 : attempt < 9 ? 2 : 1;
            var candidate = tryHole(rng, primary, cap);
            if (candidate && validateHole(candidate, { strict: true }).length === 0) hole = candidate;
        }
        if (!hole) hole = fallbackHole(rng, primary);
        hole.name = nameHole(rng, hole.primary, used);
        hole.blurb = blurbFor(hole);
        delete hole.phrases;
        delete hole.primary;
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

})(window.GOLF);
