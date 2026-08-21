/* Tuning constants for Pocket Links. Everything the simulation reads lives
   here so the physics module stays free of magic numbers and the tests can
   reason about the same values the game runs on.

   Units are world pixels and seconds. The course is a fixed 960x640 field
   that the canvas scales to fit, so a "pixel" means the same thing on a phone
   and on a desktop and none of the tuning below is resolution dependent. */
window.GOLF = window.GOLF || {};

GOLF.VERSION = '1.3.0';

GOLF.CONFIG = {
    WORLD_W: 960,
    WORLD_H: 640,

    BALL_R: 7.5,
    HOLE_R: 15,

    /* Friction is expressed as "the fraction of its speed the ball keeps after
       one second" and applied as pow(k, dt). Exponential decay rather than a
       per-frame subtraction, so a 144Hz monitor and a 30fps phone roll the ball
       exactly the same distance — which is also what lets the headless tests
       step at a fixed dt and trust the result. */
    FRICTION_GRASS: 0.40,
    FRICTION_SAND: 0.02,
    /* Ice keeps close to three times the roll of grass (the ratio is
       ln 0.40 / ln 0.72). Deliberately not slicker than that: friction is the
       only thing that ends a shot, and a rink the ball never leaves has to
       still bring it to rest inside MAX_SHOT_SECONDS — a shot that has to be
       waited out is not a shot. tests.html measures the worst case. */
    FRICTION_ICE: 0.72,
    /* Rough is the missing middle. Sand is a punishment and grass is free, so
       every hole was a binary: on the fairway, or in the bunker. Rough halves
       the roll instead of ending it, which is what lets a hole be shaped
       rather than merely walled — a wide line costs you a stroke's worth of
       distance and nothing more. */
    FRICTION_ROUGH: 0.15,

    /* The dial runs past what you can control.

       Up to SAFE_POWER the ball goes exactly where the arrow points, and that
       is still the whole of the old game: 1080 coasts v0 / -ln(k) ≈ 1180px,
       more than the 960px field, so every hole stays reachable in one clean
       shot. The last fifth of the dial is the overswing — 1400 reaches
       ≈ 1530px, and buys that extra roll with the only currency the game has
       left to charge in, which is accuracy. See physics.spread. */
    MAX_POWER: 1400,
    SAFE_POWER: 1080,
    MIN_POWER: 35,
    DRAG_MAX: 210,        // world px of pull-back that equals MAX_POWER

    /* Radians of scatter at the very top of the dial: ±0.13 is about 7.5°,
       which over a 400px carry is ±52px — enough to miss a cup with, not
       enough to feel like the game took the shot away from you. The curve
       between SAFE_POWER and MAX_POWER is quadratic, so the first sliver past
       the line is nearly free and the last one is genuinely wild. */
    SPREAD_MAX: 0.13,

    RESTITUTION: 0.74,    // speed kept after a cushion bounce
    /* Bumpers are livelier than a cushion but still under 1, which is what
       guarantees a shot ends: nothing in the simulation may hand the ball
       energy, or a ball wedged between a bumper and a wall would rattle
       there for ever and the hole would never return to the aim phase. */
    BUMPER_RESTITUTION: 0.94,
    BUMPER_MIN_R: 14,     // smaller than this and the substep cap cannot protect it
    STOP_SPEED: 14,       // below this the ball is considered at rest

    CUP_PULL: 900,        // inward acceleration while the ball is over the cup
    CAPTURE_SPEED: 250,   // faster than this and the rim spits it back out

    /* The aim arrow. It was once the ball's simulated path, which answered the
       only two questions the game asks — how hard, and off which cushion — and
       then it was a fixed length at every power, which answered neither and
       made a gentle tap and a full swing look identical.

       It now grows with the shot, but only from 54px to 108px while the ball
       itself rolls up to 1530px: a hint you can feel, at a twelfth of the
       scale of the thing it is hinting at, on a square-root curve that spends
       most of its travel in the bottom half of the dial where the touch shots
       live. You can see that this one is harder than the last one. You still
       cannot read a distance off it. */
    AIM_ARROW: 54,
    AIM_ARROW_FULL: 108,

    /* The guide ray runs on past the arrowhead to the edge of the field, thin
       and faint. It is pure direction — no bounce, no distance, no stopping
       where the ball would stop — and it is the whole of the leniency: lining
       a putt up across a 960px field off a 100px arrow was asking players to
       extend a line by eye that the screen could simply draw. */
    AIM_GUIDE_ALPHA: 0.17,

    /* The power gauge used to be a 16px arc hugging the ball, which is a
       readable *shape* and an unreadable *value* — at a glance you could tell
       it was filling, not how far. It is now a proper ring, and the arrow
       starts outside it so the two never overlap. */
    AIM_RING_R: 27,
    AIM_RING_W: 9,

    SIM_DT: 1 / 120,
    MAX_SUBSTEPS: 24,
    MAX_SHOT_SECONDS: 20,

    WATER_PENALTY: 1,

    SAVE_KEY: 'miniGolf.save.v1',
    ROUND_KEY: 'miniGolf.round.v1'
};
