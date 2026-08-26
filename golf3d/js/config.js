/* Tuning constants for Loft Links. Everything the simulation reads lives here,
   so physics.js holds no magic numbers and the tests reason about the same
   values the game runs on. Same arrangement as the 2D game next door.

   Units are world units and seconds. One unit is roughly a metre; the ball is
   deliberately oversized (16cm) because a real 4cm ball is invisible from a
   camera far enough back to show a hole. Nothing here is resolution dependent
   — the renderer scales to the viewport, the simulation never sees a pixel. */
window.G3 = window.G3 || {};

G3.VERSION = '1.5.1';

G3.CONFIG = {
    BALL_R: 0.16,
    /* Ball and cup are in the proportion the real game uses — a 108mm cup and
       a 42mm ball, near enough — because that ratio is what decides whether a
       rolling ball drops or rides the far lip, and there is no capture rule
       here to paper over a bad one. */
    HOLE_R: 0.40,
    CUP_DEPTH: 0.42,      // the ball is 0.32 across, so it is well under the rim
    CUP_RESTITUTION: 0.35,// what the rim and the shaft wall give back

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
        rough: 0.06,
        cup: 0.004     // the bottom of the hole: whatever lands here stays
    },
    FRICTION_DEFAULT: 0.30,

    /* At full power the ball coasts v0 / -ln(k) ≈ 23 units on grass — longer
       than any hole here. Everything is reachable with one swing and most
       things are reachable with half of one, so the skill is entirely in not
       overcooking it: the cup will not take a ball arriving much above 7, and a
       driver that has only run half its length is still doing about 12. */
    MAX_POWER: 28,
    MIN_POWER: 0.9,

    MAX_LOFT: 45 * Math.PI / 180,

    /* The bag. A club is a loft and a ceiling on power, and that is the whole
       of it — the simulation never hears the word "club", it is handed a launch
       angle and a speed like before. Picking one is picking a trade: the driver
       has the reach, the wedge has the height to clear what the driver would
       bounce off, and the putter's ceiling is low enough that full power is
       still a tap.

       Order matters: it is the order they appear in the bag and the order the
       number keys select. */
    CLUBS: [
        {
            id: 'putter', name: 'Putter', short: 'PT', key: '1',
            loft: 0, power: 10.5,
            blurb: 'Rolls flat and true. Nothing else stops where you tell it.'
        },
        {
            id: 'driver', name: 'Driver', short: 'DR', key: '2',
            loft: 4 * Math.PI / 180, power: 28,
            blurb: 'The reach club. Barely off the ground, and it runs.'
        },
        {
            id: 'chipper', name: 'Chipper', short: 'CH', key: '3',
            loft: 22 * Math.PI / 180, power: 14,
            blurb: 'Hops a rail and keeps running. The all-rounder.'
        },
        {
            id: 'wedge', name: 'Wedge', short: 'WG', key: '4',
            loft: 42 * Math.PI / 180, power: 11.5,
            blurb: 'Up and over water, sand and anything else in the way.'
        }
    ],
    DEFAULT_CLUB: 'driver',

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


    SIM_DT: 1 / 120,
    MAX_SUBSTEPS: 32,
    MAX_SHOT_SECONDS: 22,

    OOB_Y: -6,            // fall past this and the shot is lost
    WATER_PENALTY: 1,
    OOB_PENALTY: 1,

    /* Feel. None of this touches the simulation — it is what the shot looks
       and sounds like while you are winding it up and after you let go. */
    OVERSWING: 0.85,      // past this fraction the meter turns and the arrow reddens
    KICK: 0.55,           // camera punch on impact, in units of pull-back
    TRAIL: 56,            // ball trail samples

    SAVE_KEY: 'loftLinks.save.v1',
    MUTE_KEY: 'loftLinks.muted',
    MUSIC_KEY: 'loftLinks.music',
    SEEN_KEY: 'loftLinks.seenHowTo',
    FS_PROMPT_KEY: 'loftLinks.fsPromptDismissed'
};
