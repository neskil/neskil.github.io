/* Tuning constants for Loft Links. Everything the simulation reads lives here,
   so physics.js holds no magic numbers and the tests reason about the same
   values the game runs on. Same arrangement as the 2D game next door.

   Units are world units and seconds. One unit is roughly a metre; the ball is
   deliberately oversized (16cm) because a real 4cm ball is invisible from a
   camera far enough back to show a hole. Nothing here is resolution dependent
   — the renderer scales to the viewport, the simulation never sees a pixel. */
window.G3 = window.G3 || {};

G3.VERSION = '1.15.0';

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
        fairway: 0.22, // mown, but not shaved: a driver runs about a fifth less
        wood: 0.55,    // bridges and ramps: slick, you carry your speed
        sand: 0.004,   // a bunker eats a shot
        rough: 0.06,
        cup: 0.004     // the bottom of the hole: whatever lands here stays
    },
    FRICTION_DEFAULT: 0.30,

    /* Static friction, as the steepest gradient each surface will hold a
       stopped ball on. Friction above is drag — proportional to speed, and
       therefore zero at zero speed — which is right for a rolling ball and
       says nothing at all about a stationary one. Without a second number a
       ball can never rest on a slope, however gentle, because gravity always
       wins against nothing; the game used to paper over that with a timer that
       simply froze anything slow for long enough, and a ball would sit halfway
       up a ramp looking like a bug because it was one.

       These are the tangents of an angle of repose, so 0.18 is about ten
       degrees. That is steep for a green and it is not a free choice: the
       cup on Tidewater's 'Short Side' sits on a lie of 0.16, and a green that
       will not hold a ball beside its own hole is a green nobody can putt on.
       Everything coarser holds more, sand holds nearly anything, and a plank
       holds almost nothing — which is what makes a ramp a ramp.

       What this buys, beyond honesty: a hole can now be built out of slopes
       rather than out of walls, because a slope can be somewhere the ball
       *stays*. Whinstone Links is entirely that. It also quietly fixed two
       older holes that had been lying — Step Up's blurb has always promised
       that half measures roll back to you, and until now they stopped on the
       ramp instead. */
    HOLD: {
        green: 0.18,
        fairway: 0.26,
        wood: 0.05,    // slick: a ball left on a ramp goes back down it
        sand: 0.55,    // whatever lands in a bunker stays where it lands
        rough: 0.40,
        cup: 4         // and the bottom of the hole holds anything at all
    },
    HOLD_DEFAULT: 0.18,

    /* At full power the ball coasts v0 / -ln(k) ≈ 27 units on grass. That is
       longer than any mini golf hole here and shorter than most of a links
       one, which is the split the number has to serve now: everything on the
       first five courses is reachable with one swing and most of it with half
       of one, so the skill there is entirely in not overcooking it — the cup
       will not take a ball arriving much above 7. On the long courses the same
       number is a tee shot, and the skill is in what the ground does with it
       afterwards. */
    MAX_POWER: 32,
    MIN_POWER: 0.9,

    /* Past a full swing the meter keeps going. OVERDRAW is how much further,
       as a fraction of the club's own ceiling, and what you get for it is a
       straight trade:

         base power   grows with the meter into the overdraw, exactly as it
                      does below it — a driver wound to 130% leaves at 130% of
                      28, and that is real distance you cannot get any other
                      way.
         control      goes, and it goes fast. Anything at or inside a full
                      swing sprays by nothing at all: the ball leaves on the
                      line the cone is pointing at, every time, which is what
                      makes a full swing the honest shot. Past it both the line
                      and the weight start wandering, on a curve that bends
                      rather than climbing in step with the meter — the first
                      sliver of overdraw is nearly free and the last of it is
                      a shot nobody can aim.

       SPRAY_YAW and SPRAY_POWER are the worst of it, reached at the very end
       of the overdraw: half a cone of about seven degrees either side, and a
       sixth of the weight either way. SPRAY_CURVE is how hard the curve bends
       — it is the k in (e^kt - 1) / (e^k - 1), so 0 would be a straight line
       and this is emphatically not that. */
    OVERDRAW: 0.30,
    SPRAY_YAW: 7 * Math.PI / 180,
    SPRAY_POWER: 0.16,
    SPRAY_CURVE: 3.2,

    /* The ceiling on launch angle. It used to be 45°, which is the angle
       that carries furthest on flat ground and so reads like the right
       number — but it is a *clamp*, and the bag's highest club sat one
       degree under it. Anything genuinely lofted was quietly flattened
       back to a wedge. A lob wedge is 58° in the real bag and it is 58°
       here, so the ceiling has to be above it. */
    MAX_LOFT: 62 * Math.PI / 180,

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
            loft: 4 * Math.PI / 180, power: 32,
            blurb: 'The reach club. Barely off the ground, and it runs.'
        },
        /* The one club that is neither reach nor loft but a real amount of
           both, and the reason it exists is carry. A driver is in the air for
           a quarter of a second and a chipper flies eight units at the very
           most; an iron flies eleven and still runs when it lands, which is
           what a green with water in front of it needs and what nothing else
           in the bag could do. It is also the club for a long second shot:
           two thirds of a driver, and it stops. */
        {
            id: 'iron', name: '7 Iron', short: '7i', key: '3',
            loft: 16 * Math.PI / 180, power: 18,
            blurb: 'The long approach. Carries what the driver runs into.'
        },
        /* The top of the bag is set at the lofts these clubs really carry:
           a pitching wedge is 45° and a lob wedge is 58°, and at 22° and 42°
           neither of them was doing what its name says — the pitch flew like
           a long chip and the wedge could not get over anything the iron
           could not.

           The power came with them. Carry goes as p² sin 2θ, so lifting the
           face without touching the ceiling would have moved every landing
           spot on the course: 11.7 at 45° and 12.1 at 58° carry what 14 at
           22° and 11.5 at 42° carried. What changes is the height and the
           stopping, which is the whole reason to reach for either. */
        {
            id: 'chipper', name: 'Pitch', short: 'PW', key: '4',
            loft: 45 * Math.PI / 180, power: 11.7,
            blurb: 'Up steep and down steeper. Stops near where it lands.'
        },
        {
            id: 'wedge', name: 'Wedge', short: 'LW', key: '5',
            loft: 58 * Math.PI / 180, power: 12.1,
            blurb: 'The lob. Straight up over water, sand and trees.'
        }
    ],

    /* Clubs that are not in the default bag, and are handed out a hole at a
       time (courses `bag`, G3.bagFor).

       The mallet exists because of the holes that take the loft away. A lane
       you may only putt down is a good hole and a putter is the wrong club for
       it: 10.5 of power runs about nine units, which is most of a mini golf
       lane and nowhere near a hole in one, so a putting hole played with the
       putter is two safe taps and no decision in either of them. Seventeen
       runs the length of one, which turns the same hole into a single
       committed shot that is either in or fifteen units past — and that is the
       hole. It is not in the default bag because a flat club with that much
       reach would quietly become the answer to half the course. */
    EXTRA_CLUBS: [
        {
            id: 'mallet', name: 'Mallet', short: 'ML', key: '6',
            loft: 0, power: 17,
            blurb: 'A putter with a hammer behind it. Rolls flat, and rolls a long way.'
        }
    ],
    DEFAULT_CLUB: 'driver',

    RESTITUTION: 0.62,    // horizontal speed kept after a rail bounce
    BOUNCE: 0.34,         // vertical speed kept after landing
    LAND_GRIP: 0.86,      // horizontal speed kept on each landing
    LAND_REST: 0.55,      // slower than this after a bounce and it settles
    STOP_SPEED: 0.24,     // below this on a lie that will hold it, the ball is at rest

    /* Two timers for the two ways a ball stops without the lie deciding it.
       SLOPE_SETTLE is for a ball that is not standing on anything — leaning on
       a rail, or perched on the lip of the cup with the ground missing under
       it — where there is no lie to ask. STUCK is the backstop under that:
       a grounded ball on a slope too steep to hold it should be rolling, so if
       it has crept at under STOP_SPEED for this long it is not on a slope, it
       is jammed against something, and the shot is over. Long enough that a
       ball genuinely rolling downhill never trips it — at that speed it would
       have to cover half a unit to get there. */
    SLOPE_SETTLE: 0.4,
    STUCK: 2.4,

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

    /* The aiming cone — the shape drawn out in front of the ball. It is a cone
       and not a line because a shot is a direction and a weight and neither is
       promised beyond a full swing: its half-angle is whatever spray the
       physics will actually apply (physics.spray), plus CONE_ANGLE so that an
       honest shot, which sprays by nothing, still reads as a wedge rather than
       a hairline.

       And it stops. CONE_RANGE is how far in front of the ball it is allowed
       to reach; CONE_FADE is the last fraction of that which fades out, so the
       picture ends by going quiet rather than by being chopped off. A preview
       that ran the length of a driver's roll looked like a promise about where
       the ball would stop, and it was never able to keep one. */
    CONE_ANGLE: 2.5 * Math.PI / 180,
    CONE_WIDTH: 0.15,     // half-width at the ball itself, before the angle
    CONE_RANGE: 9,        // world units of forward reach, whatever the club
    CONE_FADE: 0.42,      // the tail of it that fades to nothing

    SAVE_KEY: 'loftLinks.save.v1',
    MUTE_KEY: 'loftLinks.muted',
    MUSIC_KEY: 'loftLinks.music',
    SEEN_KEY: 'loftLinks.seenHowTo',
    FS_PROMPT_KEY: 'loftLinks.fsPromptDismissed',
    /* Remembered off rather than remembered on: the pretty sea is the default,
       so the only thing worth storing is a player who has turned it off — and
       storing it that way means a machine that has never been asked gets the
       good one. */
    WATER_KEY: 'loftLinks.plainWater'
};

/* Every club the game knows about, default bag first. A hole's `bag` names
   ids out of this list; nothing else may. */
G3.CONFIG.ALL_CLUBS = G3.CONFIG.CLUBS.concat(G3.CONFIG.EXTRA_CLUBS);
