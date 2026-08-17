/* Tuning constants for Loft Links. Everything the simulation reads lives here,
   so physics.js holds no magic numbers and the tests reason about the same
   values the game runs on. Same arrangement as the 2D game next door.

   Units are world units and seconds. One unit is roughly a metre; the ball is
   deliberately oversized (16cm) because a real 4cm ball is invisible from a
   camera far enough back to show a hole. Nothing here is resolution dependent
   — the renderer scales to the viewport, the simulation never sees a pixel. */
window.G3 = window.G3 || {};

G3.VERSION = '1.0.0';

G3.CONFIG = {
    BALL_R: 0.16,
    HOLE_R: 0.30,

    /* Positive downward acceleration. Real gravity makes a lofted shot hang
       for ages at this scale; 18 keeps an arc inside a second or so, which is
       what a mini golf chip should feel like. */
    GRAVITY: 18,

    /* Friction per surface, expressed as "the fraction of its speed the ball
       keeps after one second", applied as pow(k, dt). Exponential decay rather
       than a per-frame subtraction, so a 144Hz monitor and a 30fps phone roll
       the ball exactly the same distance — which is also what lets the
       headless tests step at a fixed dt and trust the result. */
    FRICTION: {
        green: 0.30,
        wood: 0.55,    // bridges and ramps: slick, you carry your speed
        sand: 0.004,   // a bunker eats a shot
        rough: 0.06
    },
    FRICTION_DEFAULT: 0.30,

    /* At full power the ball coasts v0 / -ln(k) ≈ 11.6 units on grass. The
       longest hole is a little over that, so the big fields need two shots and
       the short ones are drivable — the skill is in not overcooking it. */
    MAX_POWER: 14,
    MIN_POWER: 0.9,
    DRAG_MAX: 190,        // px of screen pull-back that equals MAX_POWER
    MAX_LOFT: 45 * Math.PI / 180,

    RESTITUTION: 0.62,    // horizontal speed kept after a rail bounce
    BOUNCE: 0.34,         // vertical speed kept after landing
    LAND_GRIP: 0.86,      // horizontal speed kept on each landing
    LAND_REST: 0.55,      // slower than this after a bounce and it settles
    STOP_SPEED: 0.24,     // below this on a flat lie the ball is at rest
    SLOPE_SETTLE: 0.4,    // …and this long at that speed settles it on a slope

    /* A lip the ball climbs rather than bounces off — kerbs between adjacent
       pads. Anything taller has to be authored as a wall or it stops the ball
       dead. DROP is the matching downward figure: a bigger fall than this and
       the ball leaves the ground instead of following the surface. */
    STEP_UP: 0.14,
    DROP: 0.10,

    CUP_PULL: 11,         // inward acceleration while the ball is over the cup
    CAPTURE_SPEED: 3.1,   // faster than this and the rim spits it back out
    CUP_HEIGHT: 0.40,     // vertical slop allowed when testing for a capture

    SIM_DT: 1 / 120,
    MAX_SUBSTEPS: 32,
    MAX_SHOT_SECONDS: 22,

    OOB_Y: -6,            // fall past this and the shot is lost
    WATER_PENALTY: 1,
    OOB_PENALTY: 1,

    SAVE_KEY: 'loftLinks.save.v1',
    MUTE_KEY: 'loftLinks.muted'
};
