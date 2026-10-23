/* Tuning constants for Loft Links. Everything the simulation reads lives here,
   so physics.js holds no magic numbers and the tests reason about the same
   values the game runs on. Same arrangement as the 2D game next door.

   Units are world units and seconds. One unit is roughly a metre; the ball is
   deliberately oversized (16cm) because a real 4cm ball is invisible from a
   camera far enough back to show a hole. Nothing here is resolution dependent
   — the renderer scales to the viewport, the simulation never sees a pixel. */
window.G3 = window.G3 || {};

G3.VERSION = '1.82.0';

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
        /* Ice, and the number is chosen off the length of a lane rather than
           off any physics. A putter at full power coasts v/-ln(k): eight and a
           half units on a green, seventeen on a plank, and thirty-two here —
           twice the length of the longest mini golf hole in the file. That is
           the whole design of Icehouse Yard in one constant. Nothing on that
           course is about reaching the flag; everything is about not sailing
           past it, and a surface where a third of a swing is already too much
           is what makes a tap a decision. */
        ice: 0.72,
        /* Glass, Challenge mode's floor: quicker than a green and well short of
           ice, so a putt runs a little further than the eye expects and the
           shape of the ground does more of the work. */
        glass: 0.40,
        sand: 0.004,   // a bunker eats a shot
        rough: 0.06,
        cup: 0.004     // the bottom of the hole: whatever lands here stays
    },
    FRICTION_DEFAULT: 0.30,

    /* Rolling resistance: a constant deceleration, in units per second per
       second, on top of FRICTION's drag. Drag alone is proportional to speed,
       so it is strong off the club and almost nothing at the end, and every
       roll ended in a long, slow crawl — on a hillside that crawl was the ball
       wandering off down the slope. A constant term is what a real lie adds:
       it barely touches a ball arriving fast and finishes off one that is
       nearly done, so a shot lands, bounces, runs out and *stops*.

       Only the grass has any, and each cut differently: a green a touch, so
       putting still reads as the pace you gave it; a fairway noticeably; the
       rough a lot. Wood and ice have none on purpose — they are the slick
       surfaces and a plank that stopped a ball would not be a ramp. Sand's
       drag already stops anything. Landing bounces never see it: it is
       applied to a rolling ball only. */
    ROLL: {
        green: 0.25,
        glass: 0.15,
        fairway: 1.0,
        rough: 2.0
    },
    ROLL_DEFAULT: 0,

    /* Static friction, as the steepest gradient each surface will hold a
       stopped ball on. Friction above is drag — proportional to speed, and
       therefore zero at zero speed — which is right for a rolling ball and
       says nothing at all about a stationary one. Without a second number a
       ball can never rest on a slope, however gentle, because gravity always
       wins against nothing; the game used to paper over that with a timer that
       simply froze anything slow for long enough, and a ball would sit halfway
       up a ramp looking like a bug because it was one.

       These are the tangents of an angle of repose, so 0.22 is about twelve
       degrees. That is steep for a green and it is not a free choice: the
       cup on Tidewater's 'Short Side' sits on a lie of 0.16, and a green that
       will not hold a ball beside its own hole is a green nobody can putt on.
       It was 0.18 (and the fairway 0.26, the rough 0.40) until a ball that
       had all but stopped on a hillside kept creeping off it once too often;
       a fifth more grip is what makes a slow ball on a bank stay put.
       Everything coarser holds more, sand holds nearly anything, and a plank
       holds almost nothing — which is what makes a ramp a ramp.

       What this buys, beyond honesty: a hole can now be built out of slopes
       rather than out of walls, because a slope can be somewhere the ball
       *stays*. Whinstone Links is entirely that. It also quietly fixed two
       older holes that had been lying — Step Up's blurb has always promised
       that half measures roll back to you, and until now they stopped on the
       ramp instead. */
    HOLD: {
        green: 0.22,
        fairway: 0.32,
        wood: 0.05,    // slick: a ball left on a ramp goes back down it
        /* Lower than a plank by a factor of four, which is what makes an iced
           slope a one-way street: 0.012 is a gradient of about two thirds of a
           degree, so the only ice a ball stays on is ice somebody drew flat. */
        ice: 0.012,
        glass: 0.14,   // slicker than turf: a slope that holds on a green sheds here
        sand: 0.55,    // whatever lands in a bunker stays where it lands
        rough: 0.46,
        cup: 4         // and the bottom of the hole holds anything at all
    },
    HOLD_DEFAULT: 0.22,

    /* The driver's ceiling, and so the top of the meter. At full power the
       ball would coast v0 / -ln(k) ≈ 23 units on grass. That is
       longer than any mini golf hole here and shorter than most of a links
       one, which is the split the number has to serve now: everything on the
       first five courses is reachable with one swing and most of it with half
       of one, so the skill there is entirely in not overcooking it — the cup
       will not take a ball arriving much above 7. On the long courses the same
       number is a tee shot, and the skill is in what the ground does with it
       afterwards. */
    MAX_POWER: 28,
    MIN_POWER: 0.9,

    /* Past a full swing the meter keeps going. OVERDRAW is how much further,
       as a fraction of the club's own ceiling, and what you get for it is a
       straight trade:

         base power   grows with the meter into the overdraw, exactly as it
                      does below it — a driver wound to 130% leaves at 130% of
                      32, and that is real distance you cannot get any other
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

    /* And what the far end of the overdraw is actually worth, over and above
       the meter's own reading. The meter is linear — 130% of the ceiling is
       130% of the ceiling — and on its own that made the last third of the bar
       a poor deal: you took all of the spray for a tenth more reach.

       OVER_GAIN is a bonus on top, and it is squared in the overdraw rather
       than proportional to it, so it lives almost entirely at the end: half
       way up the overdraw is worth 3% and the top of it 14%. That is the shape
       the risk already had — the spray curve is flat at the bottom and near
       vertical at the top — and now the reward has it too, which is what makes
       the top of the bar a decision instead of a mistake. */
    OVER_GAIN: 0.14,

    /* Sidespin, the one thing a shot can carry that is not in its velocity.
       Only the swing gate puts it there (see swing.js): a pull draws and a
       push fades, so a mishit keeps being the same mishit all the way to the
       ground rather than just leaving at a slightly wrong angle.

       ACCEL is per unit of spin per unit of ground speed, because a ball that
       is barely moving does not bend — the curve is strongest off the club and
       eases as the shot runs out, which is the shape a real one has. LAND is
       what survives a bounce: most of it does not, and a ball that kept
       curving along the ground would be a putt with a mind of its own. */
    SPIN_ACCEL: 0.55,
    SPIN_LAND: 0.25,

    /* The swing gate itself — what a shot past a full swing has to do to keep
       its line. All of the difficulty is these numbers.

       WIN_* is the half-width of the strike zone as a fraction of the whole
       bar, at the start of the overdraw and at the end of it; SPEED_* is how
       fast the marker crosses the bar at the same two points.

       Both are set so that the *time* in the zone stays reactable, which is
       the number a player actually experiences and the one worth tuning
       against: 2·WIN/SPEED seconds. At the end of the overdraw that used to
       come out at 60ms — a tenth of the time it takes to see something and
       move — so a full thrash was not a hard shot, it was a coin toss with
       extra steps. It is 160ms there now, and half a second at the bottom.

       CURVE is the gate's own difficulty ramp, and it is deliberately gentler
       than SPRAY_CURVE. Sharing the spray's 3.2 was tidy and it put nearly all
       of the tightening in the last quarter of the meter, so the gate went
       from comfortable to impossible over a few pixels of wind-up. It still
       ramps — the last quarter costs more room than the first, which is what
       makes winding it further a real decision — it just does it over the
       whole bar rather than falling off a cliff at the end.

       ARM is the sliver of overdraw that stays free. A gate over a shot that
       can barely go wrong is a hoop for its own sake, so it is set where the
       spray starts to be worth anything at all.

       MISS_SPAN is how far past the edge of the zone counts as a total miss,
       so there is a graded middle rather than a cliff. TOP_WEIGHT is how much
       of a bad backswing press the strike inherits on the gate that has one.
       SPIN is how much bend a miss puts on the ball, per radian of the line
       error it already cost. */
    SWING: {
        ARM: 0.12,
        WIN_MAX: 0.150,
        WIN_MIN: 0.080,
        SPEED_MIN: 0.60,
        SPEED_MAX: 1.00,
        CURVE: 1.8,
        MISS_SPAN: 0.26,
        TOP_WEIGHT: 0.30,
        FADE_LEAD: 0.10,
        SPIN: 5.5
    },

    /* Shot shaping (swing.js `shape`). TURN is how far a draw or a fade turns
       across its whole flight — the ball starts out half of it to one side of
       the aim and lands back on the line — and SPIN_MAX caps the sidespin, so
       a half-swing is never asked for a corkscrew. FADE_BITE is the backspin a
       fade lands with on top of the club's own; BACKSPIN is what the backspin
       shot adds. A topped shot launches at TOPPED_LOFT of the club's loft and
       TOPPED_POWER of its power.

       GATE is how hard the strike is for a shape asked for inside a full swing,
       on the same 0..1 scale as the overdraw. The misses: MISS_TURN is how much
       of the bend a full-late strike loses (and a full-early one adds),
       MISS_POWER the weight a miss costs the spin shots. */
    SHAPE: {
        TURN: 20 * Math.PI / 180,
        SPIN_MAX: 2.4,
        FADE_BITE: 0.25,
        BACKSPIN: 0.55,
        TOPPED_LOFT: 0.35,
        TOPPED_POWER: 0.88,
        GATE: 0.45,
        MISS_TURN: 1.1,
        MISS_POWER: 0.15
    },

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
            loft: 0, power: 10.5, carry: 0, total: 8.0,
            blurb: 'Rolls flat and true. Nothing else stops where you tell it.'
        },
        /* The long game's clubs fly on their own numbers. At 10° the driver
           peaked under a unit off the ground — two and a half balls — and
           was down in six tenths of a second, which is a skim, not a drive.
           21° and 28 puts the top of the flight near three units and keeps it
           up for over a second: three times the height, half as much again in
           carry, and a quarter more in all, because a ball coming down
           steeper runs out less. The putter, the mallet and both wedges are
           shared with mini golf and are untouched. */
        {
            id: 'driver', name: 'Driver', short: 'DR', key: '2',
            loft: 21 * Math.PI / 180, power: 28, carry: 29.1, total: 39.5,
            shapes: ['draw', 'fade', 'topped'],
            blurb: 'The reach club. Up and away, and it still runs.'
        },
        /* The one club that is neither reach nor loft but a real amount of
           both, and the reason it exists is carry. A chipper flies eight
           units at the very most; an iron flies twelve and still runs when it
           lands, which is
           what a green with water in front of it needs and what nothing else
           in the bag could do. It is also the club for a long second shot:
           under half a driver, and it stops. At 30° it now flies twelve and
           climbs nearly two, so it gets over a tree as well as a pond. */
        {
            id: 'iron', name: '7 Iron', short: '7i', key: '3',
            loft: 30 * Math.PI / 180, power: 16, carry: 12.3, total: 17.8,
            shapes: ['draw', 'fade', 'backspin', 'topped'],
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
            loft: 45 * Math.PI / 180, power: 11.7, carry: 7.6, total: 14.1,
            shapes: ['backspin', 'topped'],
            blurb: 'Up steep and down steeper. Stops near where it lands.'
        },
        {
            id: 'wedge', name: 'Wedge', short: 'LW', key: '5',
            loft: 58 * Math.PI / 180, power: 12.1, carry: 7.3, total: 12.7,
            shapes: ['backspin'],
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
            loft: 0, power: 17, carry: 0, total: 13.3,
            blurb: 'A putter with a hammer behind it. Rolls flat, and rolls a long way.'
        },
        /* The first club in the bag that is not a loft and a ceiling.

           `bite` is backspin: the fraction of the ball's ground speed the
           first landing takes away, spent once and gone. It exists because
           there was no way to write two clubs that differed in what happens
           *after* the ball lands — a bag of loft and power can say how far and
           how high and has nothing at all to say about whether the thing stops
           — and because Icehouse Yard is a course where that is the only
           question. Nothing rolls to a stop on ice. A green you cannot run a
           ball up to has to be flown at, and a ball flown at it has to be
           made to stay.

           So: an iron's carry, three quarters of its run gone on the first
           bounce, and it is not in the default bag. A club that lands and
           stops would be the answer to half the older courses, most of which
           are built on the assumption that arriving and staying are two
           different problems. */
        {
            id: 'checker', name: 'Checker', short: 'CK', key: '7',
            loft: 38 * Math.PI / 180, power: 13.5, bite: 0.78, carry: 9.9, total: 11.4,
            blurb: 'Lands and stops. The one club that gives up its run on purpose.'
        }
    ],
    DEFAULT_CLUB: 'driver',

    /* Mini golf's bag. Mini, crazy and adventure golf are one game and the
       long game is another, and for most of this game's life they shared the
       long game's bag — so the club the bot reached for first on two dozen
       twelve-unit lanes was a 10° driver with thirty-two units of pace in it,
       and a hole built round a bank shot or a gate was played as a skim at
       the flag. A mini hole gets the putter and the two wedges unless it names
       its own `bag`; a hole that is about distance or a club says so there,
       the way the mallet holes always have.

       The putter and the mallet, and no loft, because mini golf is played
       along the floor: given a pitch and a wedge, the bot used them to fly
       over the baffle, the beach and the water on hole after hole, which is
       every hole's design skipped rather than played. A hole that is *about*
       loft says `needsLoft` and gets MINI_LOFT_BAG. The groups the rule covers are
       MINI_GROUPS; anything else — the long game, the range, a hole from the
       editor — keeps CLUBS. */
    MINI_BAG: ['putter', 'mallet'],
    MINI_LOFT_BAG: ['putter', 'mallet', 'chipper', 'wedge'],
    MINI_GROUPS: ['mini', 'crazy', 'adventure'],

    RESTITUTION: 0.62,    // horizontal speed kept after a rail bounce
    BOUNCE: 0.34,         // vertical speed kept after landing
    LAND_GRIP: 0.86,      // horizontal speed kept on each landing
    LAND_REST: 0.55,      // slower than this after a bounce and it settles

    /* What a landing keeps, per surface: `grip` of the ground speed and
       `bounce` of the fall. Everything not named here lands on LAND_GRIP and
       BOUNCE above, which is every surface mini golf is built from — so this
       is a long-game table, and it is the long game's first number of its own.

       Turf takes far more off a drive's first bounce than a felt green does
       off a putt-length hop. With one figure for both, a full driver off a
       four-unit bluff carried thirty units and then hopped another twelve —
       clean over a seven-unit burn laid across the landing zone — so no hazard
       at the end of a drive could ever be in play. Fairway is the firm one
       and still gives a hop and a run; rough is soft and the ball sits down. */
    LANDING: {
        fairway: { grip: 0.70, bounce: 0.24 },
        rough:   { grip: 0.55, bounce: 0.16 }
    },
    LANDING_DEFAULT: null,   // filled in below, from LAND_GRIP and BOUNCE
    STOP_SPEED: 0.24,     // below this on a lie that will hold it, the ball is at rest

    /* Strokes over par at which a hole is picked up: a shot that ends there
       without the ball in the cup ends the hole, scored at par + PICKUP. */
    PICKUP: 5,

    /* ── ground that does something ─────────────────────────────────────

       Three things a pad may carry besides its height, all of them read by
       physics.js and none of them a special case anywhere else: `push` is a
       travelator, `spring` is a launch pad, and a hole's `warps` are pipes.
       The numbers that bound them live here.

       **A spring loses height every time it fires.** Not for realism — for
       termination. A pad that returns a fixed launch speed is a pad a ball can
       bounce on for ever, and the one shot that finds it is a wedge dropped
       dead on the middle of one with no run left to carry it off. So each
       firing within a shot is worth SPRING_DECAY of the last, and once the
       kick would be under LAND_REST the pad is just a pad and the ball lands
       on it. Four bounces takes a spring to a seventh of its rating, which is
       under the floor for anything worth authoring: the ball settles, the shot
       ends, and the clock is never the thing that stops it.

       **A warp is locked for a moment after it fires**, or the ball arrives at
       the far end, finds itself inside a mouth and goes straight back. The
       lock is generous next to how long a ball spends crossing a mouth at any
       speed worth warping at. WARP_MOUTH is how far above the ground the pipe
       still swallows: a rolling ball goes down it and a lofted one flies over,
       which is what makes a pipe something you have to be on the floor to
       use. */
    SPRING_DECAY: 0.62,
    WARP_LOCK: 0.4,
    WARP_MOUTH: 0.18,

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

    /* The seat behind the ball looks a little over it, which is the right
       answer on ground that is flat and the wrong one on ground that climbs.
       The long game now has holes rising four units in twenty-six, and from
       the tee of one the hillside filled the frame: no horizon, no flag, no
       way to judge a line — a wall of grass, and the player aiming at it.

       So the target lifts by however much the ground has risen `AIM_LOOK`
       ahead down the aim, times AIM_TILT, and no more than AIM_RISE. Measured
       rather than guessed, which is what makes it free on every flat hole in
       the file: on level ground the rise is zero and the seat is exactly what
       it always was. Ground that *falls* away is left alone on purpose — an
       aim looking down into a valley is the shot, and dropping the target
       would put the camera's nose in the turf behind the ball. */
    AIM_LOOK: 16,         // how far down the aim the ground is sampled
    AIM_TILT: 1,          // how much of that rise the target takes
    AIM_RISE: 4.5,        // and the ceiling on it

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

    /* The intro flyover (flyover.js): the sweep from over the green back to
       the tee that a new hole opens with. Seconds, and world units.

       The length is off the hole rather than flat — BASE plus PER_UNIT for
       every unit between tee and cup, clamped — because a nine-metre putting
       lane does not need the run that a par five earns. LIFT is the apex as a
       fraction of that same distance, clamped by the two either side of it, so
       a short hole still gets off the ground and a long one does not end up in
       orbit. BOW is how far the middle of the path leans off the tee-to-cup
       line, which is what makes it a fly *over* the hole rather than a dolly
       down the middle of it.

       CLEAR is the one number with a failure behind it: the path is drawn
       between four points and knows nothing about the hill between two of
       them, so the curve is walked LIFT_SAMPLES times, LIFT_PASSES over, and
       any point closer than this to the ground underneath raises the keys it
       sits between. SETTLE is the last fraction of the run where that
       requirement fades out — the arrival is a camera standing on the course,
       and it is the one point in the path that may not be moved. */
    FLY: {
        /* Longer and wider than it was, and both for the same reason: what
           reads as "jumpy" on a phone is angular speed against frame rate.
           Half a second more run and a camera a third further out both cut how
           far the picture moves between two frames, without changing anything
           about the path — which was never the problem. */
        BASE_SECONDS: 3.0,
        PER_UNIT: 0.05,
        MIN_SECONDS: 3.4,
        MAX_SECONDS: 7.2,
        PACE: 0.6,          // how far the time follows the chord lengths
        LIFT: 0.66,         // apex, as a fraction of the hole's length…
        LIFT_MIN: 9,        // …with a floor and a ceiling in world units
        LIFT_MAX: 32,
        BOW: 0.16,          // how far off the line the middle of it leans
        BOW_MAX: 8,
        PAST_CUP: 0.34,     // how far beyond the cup it opens
        PAST_MIN: 5.5,
        PAST_MAX: 15,
        CLEAR: 3.0,         // never nearer than this to whatever is underneath
        SETTLE: 0.18,       // the tail of the run where that stops applying
        LIFT_SAMPLES: 36,
        LIFT_PASSES: 4,
        /* And how much of the overview's cleared air it borrows on the way
           past — see render.js's atmosphere(). Nothing until it is AIR_FROM
           units off the ground, all of AIR_MAX by AIR_FROM + AIR_SPAN, and back
           to the hole's own weather as it comes down. Short of 1 on purpose: a
           sweep is over the course rather than a map of it, and a hole in mist
           should still look like a hole in mist. */
        AIR_FROM: 6,
        AIR_SPAN: 18,
        AIR_MAX: 0.85
    },

    /* The ace replay (replay.js). The shot is played back off the tape the
       live roll left, so these are all about the telling of it, never the
       ball: how long before it is struck, when the picture cuts from chasing
       the ball to waiting for it at the cup, how far into slow motion the last
       of it drops, and how long the drop is held. */
    REPLAY: {
        DELAY: 0.55,        // after the drop, before the replay starts itself
        PRE: 0.25,          // the ball at rest on the tee before it is struck
        HOLD: 1.8,          // after the drop, before the banner comes back
        CUT_SHARE: 0.32,    // the cup camera takes over this far from the cup…
        CUT_MIN: 3,         // …as a share of the hole, clamped to these units
        CUT_MAX: 8,
        CUT_LEAD: 1.1,      // and never with less than this much tape left
        SLOW: 0.38,         // playback speed for the last of it
        SLOW_FROM: 3.2,     // slowing from this far from the cup…
        SLOW_AT: 1.0,       // …to SLOW by this far
        BACK: 5.5,          // the chase camera: behind the ball…
        UP: 2.4,            // …and above it
        SEAT_DIST: 3.0,     // the cup camera: this far from the cup…
        SEAT_UP: 1.15,      // …and this far above it
        MAX_FRAMES: 6000    // a tape longer than this stops recording
    },

    /* The demo's own camera. Nobody is aiming, so the seat behind the ball is
       the one seat the picture does not need: what a demo is for is the hole,
       and a hole is a shape best read from off to one side and moving.

       It frames the whole hole with air around it, turns slowly enough that
       the motion is felt rather than watched, and sits at a tilt that still
       reads as three dimensions rather than as a plan. FOLLOW is the part that
       matters on the long game: a par five does not fit in one frame at any
       distance worth looking at, so past HOLD the look point walks towards the
       ball, and by HOLD + SPAN it is most of the way there. The walk itself is
       not smoothed here — the camera's own lerp in updateCamera does that, and
       it is the same one every other seat is eased on. */
    DEMO_CAM: {
        SPIN: 0.08,         // radians a second: a turn round the hole in ~80s
        TILT: 0.72,         // ~41° down, so it is an orbit and not a map
        FIT: 1.3,           // how much air is left around the hole it frames
        MAX_RADIUS: 30,     // …and the most of a hole it will ever stand back for
        HOLD: 13,           // a hole smaller than this is watched whole
        SPAN: 30,           // …and one this much bigger is followed all but fully
        FOLLOW: 0.85,       // how far towards the ball the look point may walk
        /* And it comes in as it starts following. Standing back far enough to
           hold a par five while looking at the ball halfway down it frames a
           field of grass with a speck in the middle; if the whole hole is not
           what is being shown, what is being shown may as well be near. */
        NEAR_RADIUS: 15,
        LIFT: 0.7           // how much of the overview's cleared air it borrows
    },

    SAVE_KEY: 'loftLinks.save.v1',
    MUTE_KEY: 'loftLinks.muted',
    MUSIC_KEY: 'loftLinks.music',
    FS_PROMPT_KEY: 'loftLinks.fsPromptDismissed',
    /* '0' once somebody switches off starting rounds fullscreen in the
       picker; anything else, including nothing, means on. */
    FS_AUTO_KEY: 'loftLinks.fsAuto',
    // Swing school progress on the range: a count per lesson (school.js).
    SCHOOL_KEY: 'loftLinks.school',
    /* Set the first time a round is played fullscreen, and never unset: it is
       what stops the ⛶ chip reminding someone who already knows. */
    FS_SEEN_KEY: 'loftLinks.fsSeen',
    /* Remembered off rather than remembered on: the pretty sea is the default,
       so the only thing worth storing is a player who has turned it off — and
       storing it that way means a machine that has never been asked gets the
       good one. */
    WATER_KEY: 'loftLinks.plainWater',
    /* Same trick as the water, the other way up for each: the frame-rate
       readout is on unless it has been turned off, and the view row starts
       folded on a phone and open everywhere else, so only a player who has
       actually pressed the thing has anything stored. */
    FPS_KEY: 'loftLinks.hideFps',
    VIEWCTL_KEY: 'loftLinks.viewCtlOpen',
    /* The one setting with three states rather than two: '1' asked for, '0'
       waved off, and nothing at all — which is most players, and which follows
       prefers-reduced-motion instead of guessing. See game.js's flyWanted. */
    FLY_KEY: 'loftLinks.flyover',
    /* The secret. Set once the code has been typed, and never unset: the chip
       that lets the bot play for you is hidden until someone has gone looking
       for it, and then it stays found. */
    /* Shuffle — the course drawn for you rather than chosen. Three settings:
       whether a finished round offers a draw instead of the next course on the
       list (off unless asked for, so nobody is surprised by a surprise),
       which of G3.SHUFFLE_MODES the draw is made under, and which kinds of
       golf it is allowed to reach for. The mode is remembered even while
       shuffle is off, because it is also what the picker's own "Surprise me"
       button draws under.

       The kinds are stored as the ones left *out*, comma-joined — so an empty
       value is "all of them", which is both the default and what every save
       file written before this setting existed says. Stored the other way
       round, as the kinds to include, a fifth group of courses would arrive
       already unticked for every existing player, because their save file
       would be a list that had never heard of it. */
    SHUFFLE_KEY: 'loftLinks.shuffle',
    SHUFFLE_MODE_KEY: 'loftLinks.shuffleMode',
    SHUFFLE_SKIP_KEY: 'loftLinks.shuffleSkip',
    /* How the bot plays when a player is watching rather than when a test
       suite is counting. The fan is narrower than the suite's because every
       candidate is a whole shot simulated inside one frame and the game is
       holding still while it thinks; PAUSE is the beat between shots, which is
       what the mode is for — you are meant to be able to follow it. */
    BOT_FAN: 12,
    BOT_PAUSE: 1.1,
    /* The wind-up: how long the aim takes to swing round to the shot it has
       chosen, and how long the meter then takes to fill. Together they are the
       lead the plan is made for — see planShot — so lengthening either one
       lengthens the moment the gates are simulated forward by, and nothing
       else has to know. Long enough to read as a swing, short enough that a
       hole of them is not a wait. */
    BOT_TURN: 0.7,
    BOT_WIND: 0.55,
    /* How fast the aim is allowed to swing round, in radians a second. A
       half-turn takes all of BOT_TURN and a two-degree correction takes almost
       none of it — what is left over is spent standing still over the ball,
       which is what a player does with it too. The budget the plan is made
       for is BOT_TURN + BOT_WIND either way, so the beat a gate was chosen on
       does not move when the angle does. */
    BOT_TURN_RATE: 3.0,
    BOT_MAX_STROKES: 12,

    /* Demo mode — the same bot, playing to an empty room. What is
       tuned here is a person's patience rather than the bot's: how long the
       game waits before deciding nobody is there, and how long it holds a
       finished hole before drawing the next one.

       IDLE is deliberately long. The screen it is allowed to take back is the
       course list, and seventeen cards with a plan of every hole on them is a
       page somebody may genuinely be reading — a demo that interrupts that is
       not a demo, it is a page that will not sit still. Anything at all
       resets it: a key, a press, a wheel, or a mouse crossing the window. */
    DEMO_IDLE: 45,
    DEMO_HOLD: 2.6
};

/* Every club the game knows about, default bag first. A hole's `bag` names
   ids out of this list; nothing else may. */
G3.CONFIG.ALL_CLUBS = G3.CONFIG.CLUBS.concat(G3.CONFIG.EXTRA_CLUBS);
G3.CONFIG.LANDING_DEFAULT = { grip: G3.CONFIG.LAND_GRIP, bounce: G3.CONFIG.BOUNCE };
