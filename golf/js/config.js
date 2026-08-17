/* Tuning constants for Pocket Links. Everything the simulation reads lives
   here so the physics module stays free of magic numbers and the tests can
   reason about the same values the game runs on.

   Units are world pixels and seconds. The course is a fixed 960x640 field
   that the canvas scales to fit, so a "pixel" means the same thing on a phone
   and on a desktop and none of the tuning below is resolution dependent. */
window.GOLF = window.GOLF || {};

GOLF.VERSION = '1.0.0';

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

    /* At full power the ball coasts v0 / -ln(k) ≈ 1250px, comfortably more than
       the 960px field, so every hole is reachable in one shot and the skill is
       in not overcooking it. */
    MAX_POWER: 1150,
    MIN_POWER: 35,
    DRAG_MAX: 190,        // world px of pull-back that equals MAX_POWER

    RESTITUTION: 0.74,    // speed kept after a cushion bounce
    STOP_SPEED: 14,       // below this the ball is considered at rest

    CUP_PULL: 900,        // inward acceleration while the ball is over the cup
    CAPTURE_SPEED: 250,   // faster than this and the rim spits it back out

    SIM_DT: 1 / 120,
    MAX_SUBSTEPS: 24,
    MAX_SHOT_SECONDS: 20,

    WATER_PENALTY: 1,

    SAVE_KEY: 'miniGolf.save.v1'
};

/* The 3D mode. Metres and seconds throughout — a real ball is 42.7mm across
   and a real cup is 108mm, and once those are the actual numbers the rest of
   the tuning (how far a wedge flies, how fast a putt has to be to lip out)
   can be reasoned about instead of guessed at. */
GOLF.CONFIG3D = {
    BALL_R: 0.0213,
    CUP_R: 0.054,
    GRAVITY: 9.81,

    /* Aerodynamics, lumped. A real ball's drag and lift both depend on spin
       and Reynolds number; this keeps the shape of the physics (quadratic
       drag, backspin lift, sidespin curve) with coefficients tuned by flying
       the actual clubs until the carries came out right. */
    DRAG: 0.0031,          // acceleration = DRAG * |v|^2, opposing travel
    LIFT: 0.021,         // backspin -> upward force, the reason a ball carries
    MAGNUS: 0.021,       // sidespin -> sideways force, i.e. hook and slice
    SPIN_DECAY: 0.93,      // fraction of spin kept per second in flight

    ROLL_STOP: 0.14,       // m/s below which a roll on gentle ground ends
    REST_SLOPE: 0.11,      // sin of the steepest slope a ball can sit still on
    CAPTURE_SPEED: 1.55,   // faster than this over the cup and the rim spits it out
    CUP_PULL: 9.0,

    TREE_RESTITUTION: 0.42,

    SIM_DT: 1 / 240,
    MAX_SUBSTEPS: 48,
    MAX_SHOT_SECONDS: 30,

    WATER_PENALTY: 1,
    OB_PENALTY: 1,

    SAVE_KEY: 'miniGolf.save3d.v1'
};

/* Clubs. `speed` is the ball speed at 100% power, `loft` the launch angle and
   `spin` the backspin that turns that launch into a carry. The putter is the
   odd one out: no loft, no spin, and the swing meter drives it far more gently. */
GOLF.CLUBS = [
    { id: 'wood',   name: 'Wood',    speed: 67, loft: 15, spin: 2900, carry: '~185m' },
    { id: 'iron7',  name: '7 Iron',  speed: 42, loft: 27, spin: 4200, carry: '~135m' },
    { id: 'iron9',  name: '9 Iron',  speed: 35, loft: 37, spin: 5400, carry: '~105m' },
    { id: 'wedge',  name: 'Wedge',   speed: 28, loft: 52, spin: 7200, carry: '~60m' },
    { id: 'putter', name: 'Putter',  speed: 4.8, loft: 0, spin: 0,    carry: 'green' }
];
