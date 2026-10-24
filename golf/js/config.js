/* Tuning constants for Pocket Links. Everything the simulation reads lives
   here so the physics module stays free of magic numbers and the tests can
   reason about the same values the game runs on.

   Units are world pixels and seconds. The course is a fixed 960x640 field
   that the canvas scales to fit, so a "pixel" means the same thing on a phone
   and on a desktop and none of the tuning below is resolution dependent. */
window.GOLF = window.GOLF || {};

GOLF.VERSION = '1.13.2';

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
       is still the whole of the old game: 1134 coasts v0 / -ln(k) ≈ 1240px,
       more than the 960px field, so every hole stays reachable in one clean
       shot. The last fifth of the dial is the overswing — 1470 reaches
       ≈ 1605px, and buys that extra roll with the only currency the game has
       left to charge in, which is accuracy. See physics.spread. (Both were
       raised 5% from 1080 and 1400: a full swing felt a touch short.) */
    MAX_POWER: 1470,
    SAFE_POWER: 1134,
    MIN_POWER: 35,
    DRAG_MAX: 210,        // world px of pull-back that equals MAX_POWER
    PINCH_MAX_ZOOM: 3,    // how far two fingers can blow the board up while held
    COACH_WAIT_MS: 6000,  // a first tee this long without a shot gets the stroke in words

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

    /* The cup is a hole, not a target. Everywhere else the ball rolls on
       the plane of the green; over the cup there is nothing under it, so it
       falls, and the edge of the hole is a circle it can lean on, ride
       round, hit and climb back out over — see physics.cup. These are the
       numbers that fall is made of. Gravity is well under the real thing
       for a ball this size (about 3400px/s²) on purpose: it is what sets
       how firm a putt may be and still drop, and at 800 the cup takes as
       many of the lines and paces a ball can arrive on as the old flat
       capture rule did — more of them firm at the middle, fewer off the
       edge, where it now rides the lip instead. */
    CUP_GRAVITY: 800,
    RIM_RESTITUTION: 0.42, // of the speed into the lip, what it gives back
    RIM_KNOCK: 40,         // slower into the lip than this is leaning on it, not hitting it
    RIM_KEEP: 0.7,         // of the ball's whole speed, what a knock on the lip leaves it
    RIM_DRAG: 0.0016,      // speed scrubbed off along the lip, per px/s of knock
    CUP_DOWN: 0.35,        // once the ball's centre is this many radii below the green, it is in
    CUP_BEVEL: 6,          // how far out from the lip the green slopes down into the cup
    CUP_FALL: 1.5,         // and how far down it slopes over that width

    /* The aim arrow. It was once the ball's simulated path, which answered the
       only two questions the game asks — how hard, and off which cushion — and
       then it was a fixed length at every power, which answered neither and
       made a gentle tap and a full swing look identical.

       It now grows with the shot, but only from 54px to 108px while the ball
       itself rolls up to 1605px: a hint you can feel, at a fifteenth of the
       scale of the thing it is hinting at, on a square-root curve that spends
       most of its travel in the bottom half of the dial where the touch shots
       live. You can see that this one is harder than the last one. You still
       cannot read a distance off it. */
    AIM_ARROW: 54,
    AIM_ARROW_FULL: 108,

    /* The guide ray runs on past the arrowhead for AIM_GUIDE_LEN and fades
       out. It used to reach the edge of the field, which turned every putt
       into laying a ruler on the cup; a short stub keeps the direction
       readable at the arrow and leaves the line to be judged. */
    AIM_GUIDE_ALPHA: 0.17,
    AIM_GUIDE_LEN: 110,
    /* Past SAFE_POWER the scatter cone reaches further than the plain guide:
       it is the warning, and a warning a hand's width long is easy to miss
       at the top of the dial where it matters most. Its centre line is not
       drawn past the guide, so it still says "this may go anywhere in here",
       not "the cup is there". */
    AIM_CONE_LEN: 300,

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

    /* Skipping. Water used to take any ball that reached it; now a fast one
       skips off the top like a flat stone. At SKIP_SPEED or more the ball
       keeps SKIP_KEEP of its speed and is in the air for SKIP_AIR seconds if
       it met the water at MAX_POWER, less in proportion below it — so the
       hop's length goes with the square of the speed. In the air it is over
       the water, the sand and the slopes alike; walls still stop it. Where it
       comes down is asked the same question again.

       Tuned so that water is still water. A full-dial shot struck from the
       very edge of a pond skips about 130px, comes down at 860, skips
       another 50 and sinks — about 175px is the most anything will cross,
       and only with the dial in the overswing. A firm safe-zone shot from
       the tee clears 40 to 80px: the near corner of a pond, a creek, not a
       lake. A ball that has rolled 500px to the water arrives under
       SKIP_SPEED and goes in as it always did. SKIP_KEEP under 1 is what
       keeps the invariant: a skip never hands the ball energy, so a chain
       of them always ends. tests.html pins both ends. */
    SKIP_SPEED: 650,
    SKIP_KEEP: 0.62,
    SKIP_AIR: 0.15,
    // Speed kept after one second in the air. A hop lasts a tenth of that,
    // so this is felt as "barely slows" rather than as a number.
    FRICTION_AIR: 0.8,

    /* Avalanches — see physics.js. A slide runs down its chute at SPEED,
       a band LEN deep unless the chute says otherwise, and takes whatever it
       is over to its own pace at GRIP per second: fast enough that a ball
       caught by one is plainly caught, slow enough to watch it happen. WARN
       is how long before a slide the head of the chute starts to smoke and
       the mountain rumbles — a hazard you have to time has to be readable a
       beat before it arrives. CLEAR is the least time any point of a chute
       must lie open in each cycle, which is what the rule book holds every
       chute on the rack to. */
    AVALANCHE_SPEED: 320,
    AVALANCHE_LEN: 110,
    AVALANCHE_GRIP: 9,
    AVALANCHE_WARN: 1.1,
    AVALANCHE_CLEAR: 1.4,

    /* Geysers. A ball over a vent while it blows is thrown up for AIR
       seconds and carries on in the air on the line it had: at a putt's
       400px/s that is about 270px, over a lava channel and down the far
       side. R is the vent, drawn and caught alike; WARN the steam that
       comes before it blows. */
    VENT_R: 20,
    VENT_AIR: 0.7,
    VENT_WARN: 0.9,

    /* The pick-up. A hole gives you par plus this many strokes; if the ball
       is not down after the last of them you pick it up and write down one
       more. Friction ends every shot, but nothing used to end a *hole*, and
       the twelfth putt on a par two is not a harder version of the game — it
       is the game refusing to let you play the next one. It is also what
       stops one player holding up a party. The last stroke still matters:
       holed, it scores par + 3; missed, par + 4. */
    STROKE_ALLOWANCE: 3,

    /* The caddie — Autoplay, see game.js and bot.js. What is tuned here is a
       watcher's patience rather than the bot: PAUSE is the beat it stands
       over a ball that has just stopped, TURN the most the arrow takes to
       swing round to the line (at no more than TURN_RATE radians a second, so
       a small correction is quick and the rest of TURN is spent standing
       still), WIND how long the ring takes to fill, and HOLD how long a
       holed ball is left on the banner before the next tee.

       SLACK is the one that is not taste. The plan times every shot after
       the first on the beat PAUSE + TURN + WIND after the last one stopped,
       but the game only moves on from a pause on a frame, so it can arrive a
       frame late; SLACK is longer than the most world time a frame is let
       step under the caddie (0.1s), which is what keeps a planned instant in
       front of the caddie rather than behind it. BUDGET is shots simulated per read of the hole —
       every one a whole world settled while the frame waits. */
    BOT_PAUSE: 0.9,
    BOT_TURN: 0.6,
    BOT_TURN_RATE: 3.0,
    BOT_WIND: 0.5,
    BOT_SLACK: 0.2,
    BOT_HOLD: 2.4,
    BOT_BUDGET: 2400,

    /* A tunnel mouth: the ball's centre over the dark disc drops it in, and
       it comes out of the other mouth at the same speed and heading. The
       radius is the drawn mouth, so what you see is what catches the ball —
       a touch wider than the cup, because a tunnel is a door, not a target. */
    TUNNEL_R: 17,

    /* One colour per player in a party, ball and trail and name chip alike.
       Picked to stand off fairway green, bunker sand and each other; every
       ball also wears a dark rim, which is what carries it over the ice. */
    PLAYER_COLORS: ['#f8fafc', '#fb923c', '#f472b6', '#38bdf8'],
    MAX_PLAYERS: 4,
    /* One colour per tunnel on a hole, board and plan alike — the only
       question a tunnel asks before you putt into it is where it comes out,
       and the matching colour is the answer. */
    TUNNEL_COLORS: ['#a78bfa', '#2dd4bf', '#facc15'],

    SAVE_KEY: 'miniGolf.save.v1',
    ROUND_KEY: 'miniGolf.round.v1',
    /* Which of the two cards you were last playing. Only the choice is kept
       here — the round and the record for each course live under keys of
       their own, qualified by the course id. See scoring.js. */
    COURSE_KEY: 'miniGolf.course.v1',
    /* The seed the procedural card was last dealt from. Kept so a refresh
       gives you back the course you were playing rather than a new one —
       the holes themselves are never stored, because the seed *is* them. */
    DRAW_KEY: 'miniGolf.draw.v1',
    /* Stars, unlocks and the first-run lessons — see progress.js. Stars
       themselves are not stored here: they are read off each course's own
       per-hole bests, so there is one record and one way to read it. */
    PROGRESS_KEY: 'miniGolf.progress.v1',
    /* A party round in progress, and the last roster typed in. */
    PARTY_KEY: 'miniGolf.party.v1',
    PLAYERS_KEY: 'miniGolf.players.v1',
    /* The scenery picked for every course, or nothing for each course's
       own. A preference, like the sound: starting over leaves it alone. */
    SCENERY_KEY: 'miniGolf.scenery.v1'
};
