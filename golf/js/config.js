/* Tuning constants for Pocket Links. Everything the simulation reads lives
   here so the physics module stays free of magic numbers and the tests can
   reason about the same values the game runs on.

   Units are world pixels and seconds. The course is a fixed 960x640 field
   that the canvas scales to fit, so a "pixel" means the same thing on a phone
   and on a desktop and none of the tuning below is resolution dependent. */
window.GOLF = window.GOLF || {};

GOLF.VERSION = '1.2.0';

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

    /* At full power the ball coasts v0 / -ln(k) ≈ 1250px, comfortably more than
       the 960px field, so every hole is reachable in one shot and the skill is
       in not overcooking it. */
    MAX_POWER: 1150,
    MIN_POWER: 35,
    DRAG_MAX: 190,        // world px of pull-back that equals MAX_POWER

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

    /* The aim arrow is a fixed length, on purpose. It used to be drawn from
       the ball's simulated path, which meant the screen answered the only
       question the game asks — how hard, and off which cushion. Direction is
       shown; distance is the player's problem. */
    AIM_ARROW: 58,

    SIM_DT: 1 / 120,
    MAX_SUBSTEPS: 24,
    MAX_SHOT_SECONDS: 20,

    WATER_PENALTY: 1,

    SAVE_KEY: 'miniGolf.save.v1'
};
