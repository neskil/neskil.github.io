/* Seven courses of six holes, forty-two in all.

   `GOLF.COURSES` is the rack — each entry `{ id, name, blurb, holes }` — and
   `GOLF.COURSE` is whichever card is being played, which is what every
   consumer downstream reads. Only `GOLF.selectCourse` moves it, so nothing
   else in the codebase has to know there is more than one course.

   The rack is a ladder. Every card is six holes, drawn in a place of its
   own and built round one thing that place does — the garden's basics, the
   parkland's corners and posts, the sea's water, the wood's hills and
   sweeping bars, the meadow's tunnels, the mountain's avalanches, the
   volcano's lava and geysers — and within a card the holes get harder as
   they go. A hole that was the same idea as another one somewhere else on
   the rack is not on it any more.

   A hole is pure data: rectangles, a handful of circles, two points — and,
   since a hole may now be drawn on the slant, capsules and polygons. That is
   still a deliberate limit. Circle-vs-box, circle-vs-circle and circle-vs-
   capsule are the collision tests cheap enough to run at 24 substeps and
   simple enough to be obviously correct (the closest point on a segment is a
   clamp and a dot product), and a polygon is only ever asked whether a point
   is inside it. The interesting shapes still come from how those are
   arranged rather than from fancier geometry.

     walls    solid, bounces. Give one a `move` and it oscillates on a sine,
              along `y` (a gate that rises and falls) or `x` (a sliding door).
     water    center of the ball inside -> splash, one penalty stroke, replay
              the shot from where it was taken.
     lava     water that never lets a ball skip: any pace, it is gone.
     sand     heavy friction while the ball's center is inside.
     rough    half the roll of grass — shapes a fairway without walling it in.
     ice      almost no friction — close to three times the roll of grass. The
              ball goes where it was sent, not where it was aimed.
     bumpers  round posts, {x, y, r}. Bouncier than the cushions, and being
              round they answer a one-degree difference in approach with a
              thirty-degree difference in departure.
     slopes   constant acceleration while the ball's center is inside, which is
              how a breaking green is faked in a top-down game.
     tunnels  two mouths, {x, y, tx, ty}: in one, out the other, same shot.
     rails    a wall at any angle, rail(x, y, tx, ty, w): its spine and its
              thickness, collided as a capsule — round at both ends.
     avalanches  a chute, chute(x, y, w, h, dir, every, at): a slide comes
              down it every `every` seconds and carries what it is over to
              the foot. See physics.js.
     vents    a geyser, vent(x, y, every, at, run): blowing for `run` seconds
              of every `every`, it throws a ball over whatever is beyond.

   Water, lava, sand, rough and ice may be polygons, poly(x0, y0, x1, y1, …),
   for a bank or a bunker that runs on the slant. Walls, slopes and chutes
   stay rectangles: a wall at an angle is a rail, and a slope's and a chute's
   rules are written for edges that run with the axes.

   Every rectangle, rail and polygon is at least 20px thick and every bumper
   at least BUMPER_MIN_R across the radius. The substepping in physics.js caps ball
   travel at half a radius (~3.75px) per step, so nothing can tunnel through
   an obstacle built to those minimums. Thinner ones would be a bug, and
   tests.html asserts the rules rather than trusting anyone to remember them.

   A hole only lists the hazards it actually uses; the normaliser at the foot
   of this file fills in the empty arrays — for every course on the rack — so
   physics.js and render.js never have to ask whether a list exists. */
(function (GOLF) {
    'use strict';

    var W = GOLF.CONFIG.WORLD_W;

    function r(x, y, w, h) { return { x: x, y: y, w: w, h: h }; }
    function post(x, y, rad) { return { x: x, y: y, r: rad }; }
    // Two mouths, and it runs both ways. See physics.js → tunnels.
    function tunnel(x, y, tx, ty) { return { x: x, y: y, tx: tx, ty: ty }; }
    // A wall at any angle: its spine from (x, y) to (tx, ty), w thick.
    function rail(x, y, tx, ty, w) { return { x: x, y: y, tx: tx, ty: ty, w: w || 24 }; }
    // A zone with corners that are not right angles: x, y pairs, in order.
    function poly() { return { pts: Array.prototype.slice.call(arguments) }; }
    // An avalanche chute: the lane, which way is downhill, and its clock.
    function chute(x, y, w, h, dir, every, at) { return { x: x, y: y, w: w, h: h, dir: dir, every: every, at: at || 0 }; }
    // A geyser: where, and blowing for `run` seconds of every `every`.
    function vent(x, y, every, at, run) { return { x: x, y: y, every: every, at: at || 0, run: run || 1 }; }

    /* The same hole played the other way, right to left. Nine holes in ten
       on the old rack were teed off on the left and holed on the right, and
       a run of them reads as one corridor however different the furniture
       is; turning a few round is the cheapest variety there is. The hole is
       written the way it was designed and flipped here, so its comments
       still describe it. A slope's pull and a chute's downhill turn with it,
       and a door's sine is put half a turn on so it opens the same way. */
    function mirror(h) {
        function zone(z) {
            if (z.pts) {
                for (var i = 0; i < z.pts.length; i += 2) z.pts[i] = W - z.pts[i];
            } else {
                z.x = W - z.x - z.w;
            }
            return z;
        }
        h.tee.x = W - h.tee.x;
        h.hole.x = W - h.hole.x;
        ['water', 'lava', 'sand', 'rough', 'ice'].forEach(function (k) { (h[k] || []).forEach(zone); });
        (h.walls || []).forEach(function (w) {
            zone(w);
            if (w.move && w.move.axis === 'x') {
                var p = (w.move.phase || 0) + Math.PI;
                w.move.phase = p > Math.PI ? p - 2 * Math.PI : p;
            }
        });
        (h.slopes || []).forEach(function (s) { zone(s); s.ax = -s.ax; });
        (h.avalanches || []).forEach(function (a) {
            zone(a);
            if (a.dir === 'left') a.dir = 'right'; else if (a.dir === 'right') a.dir = 'left';
        });
        (h.bumpers || []).concat(h.vents || []).forEach(function (b) { b.x = W - b.x; });
        (h.tunnels || []).concat(h.rails || []).forEach(function (t) { t.x = W - t.x; t.tx = W - t.tx; });
        return h;
    }

    /* ── The Short Six — the garden ─────────────────────────────────────

       The card for the twenty minutes you actually have, and the first one
       anybody is handed. Nothing on it is hidden: every hole is one question
       asked in the open, the whole of it visible from the tee, and par is
       two or three all the way round — a gate, a bunker, an island, a bar to
       time, a tilt, and a close that puts three of those together. Every
       idea the rest of the rack builds on is met here first, gently. */

    var SHORT = [
        {
            name: 'Front Door',
            blurb: 'Wide open, one gate, and the walls lean in to find it for you.',
            par: 2,
            /* A gate with the door taken off its hinges: a 180px mouth, and
               rough down both cushions saying the thing the whole game says
               — the middle of the field is where the ball wants to be. The two halves of the gate lean in towards
               the mouth, so a first putt that wanders comes off the rail
               still heading for the door: the first hole anybody plays should
               forgive the first thing they get wrong. */
            tee: { x: 140, y: 320 },
            hole: { x: 830, y: 320 },
            rails: [rail(470, 0, 540, 218, 24), rail(470, 640, 540, 422, 24)],
            rough: [r(0, 0, 960, 80), r(0, 560, 960, 80)]
        },
        {
            name: 'Teacup',
            blurb: 'A saucer of sand across the straight line. Round it, or through it and short.',
            par: 3,
            /* One bunker, sat exactly on the line from tee to cup, and no
               wall anywhere: the hole is a choice about weight rather than a
               problem about geometry. Through the sand is the short way and
               costs you the roll; round it is free and costs you the angle. */
            tee: { x: 120, y: 540 },
            hole: { x: 840, y: 140 },
            sand: [r(330, 180, 300, 300)],
            rough: [r(0, 0, 300, 70)]
        },
        {
            name: 'Little Island',
            blurb: 'A ninety-pixel causeway, and a rink in front of it to make the weight hard.',
            par: 3,
            /* An island green in one shot, plus the one thing that makes a
               short hole worth playing twice: the approach is iced, so the
               ball arrives at the causeway carrying whatever it left the tee
               with. */
            tee: { x: 120, y: 320 },
            hole: { x: 760, y: 320 },
            water: [
                r(600, 190, 60, 90), r(600, 370, 60, 80),    // near bank, causeway at y 280-370
                r(600, 190, 300, 60), r(600, 390, 300, 60),  // top and bottom
                r(840, 190, 60, 260)                         // far bank
            ],
            ice: [r(380, 240, 180, 160)]
        },
        {
            name: 'Metronome',
            blurb: 'One bar, one rhythm, and all the room in the world either side of it.',
            par: 3,
            /* A gate hole for somebody who has never timed a gate: a single
               bar on a slow sine with 220px of daylight above or below it at
               every phase, so the shot is there whenever you are ready for
               it. Sliding Doors asks the same question with the daylight
               taken away; Avalanche Pass asks it with snow. */
            tee: { x: 120, y: 320 },
            hole: { x: 860, y: 320 },
            walls: [
                { x: 480, y: 200, w: 26, h: 200, move: { axis: 'y', amp: 180, speed: 1.2, phase: 0 } }
            ],
            rough: [r(0, 0, 960, 70), r(0, 570, 960, 70)]
        },
        {
            name: 'Tilt',
            blurb: 'The middle leans south. Aim north of the flag and let the field do the rest.',
            par: 3,
            /* A breaking green at a gentle gradient, and the rule every slope
               on the rack keeps underneath it: the slope stops 40px short of the rough and 180px short of
               the cushion, so everything it sheds comes to rest on the collar
               rather than rattling at the bottom of the hill for ever. */
            tee: { x: 110, y: 540 },
            hole: { x: 850, y: 180 },
            rough: [r(240, 500, 480, 140)],
            slopes: [{ x: 300, y: 120, w: 340, h: 340, ax: 0, ay: 140 }]
        },
        {
            name: 'Last Round',
            blurb: 'A wall to go round, a bunker to miss and two posts on the doorstep.',
            par: 3,
            /* Six holes is too short a card to close with one of everything,
               so this closes with one of three: the blocker from hole one,
               the sand from hole two, and a pair of posts that turn a
               straight approach into a bank shot. */
            tee: { x: 100, y: 560 },
            hole: { x: 860, y: 120 },
            walls: [r(420, 300, 26, 340)],
            sand: [r(560, 380, 220, 180)],
            rough: [r(0, 0, 380, 80)],
            bumpers: [post(700, 180, 24), post(820, 300, 24)]
        }
    ];

    /* ── The Old Course — parkland ──────────────────────────────────────

       What the game always was, boiled down to the six that were each a
       different idea: up the field through a bunker, round a corner, a
       field of posts, the cushions, two doors to time and a room whose door
       faces away. Walls and posts and nothing else that moves the ball —
       the angles are the hazard. */

    var LINKS = [
        {
            name: 'Bunker Hill',
            blurb: 'Straight up through the sand, or thread one of the two side doors.',
            par: 3,
            /* Played up the field rather than across it. A card whose every
               hole reads left to right stops being a course after a while and
               starts being a corridor, so the Old Course opens the other way. */
            tee: { x: 480, y: 590 },
            hole: { x: 480, y: 70 },
            walls: [r(0, 300, 150, 26), r(810, 300, 150, 26)],
            sand: [r(210, 250, 540, 130)]
        },
        {
            name: 'The Dogleg',
            blurb: 'Round the corner, and the bunker on the turn is bigger than it looks.',
            par: 3,
            tee: { x: 140, y: 530 },
            hole: { x: 830, y: 130 },
            walls: [r(300, 0, 240, 430)],
            sand: [r(540, 440, 220, 200)],
            rough: [r(560, 0, 400, 70)]
        },
        mirror({
            name: 'Pinball',
            blurb: 'Eight posts and no straight line. Something is going to hit something.',
            par: 3,
            tee: { x: 100, y: 320 },
            hole: { x: 870, y: 320 },
            rough: [r(0, 0, 960, 90), r(0, 550, 960, 90)],
            bumpers: [
                post(370, 160, 26), post(370, 320, 26), post(370, 480, 26),
                post(540, 240, 26), post(540, 400, 26),
                post(710, 160, 26), post(710, 320, 26), post(710, 480, 26)
            ]
        }),
        {
            name: 'Bank Shot',
            blurb: 'Nothing goes in off the straight line. Use the cushions.',
            par: 3,
            tee: { x: 140, y: 490 },
            hole: { x: 840, y: 500 },
            walls: [r(400, 300, 24, 340), r(700, 0, 24, 300)],
            rough: [r(700, 570, 260, 70)]
        },
        mirror({
            name: 'Sliding Doors',
            blurb: 'Two doorways, and the doors linger shut. Go when you can see daylight.',
            par: 4,
            /* A door is anchored so that the shut position is one end of its
               travel, not the middle of it. A sine spends most of its time
               near the extremes, so a door parked mid-swing over its doorway
               would be open almost always and the gate would be scenery; hung
               this way it closes, dwells, and opens again. */
            tee: { x: 110, y: 320 },
            hole: { x: 890, y: 300 },
            walls: [
                r(400, 0, 26, 240), r(400, 400, 26, 240),
                { x: 270, y: 250, w: 26, h: 140, move: { axis: 'x', amp: 130, speed: 1.25, phase: -Math.PI / 2 } },
                r(700, 0, 26, 200), r(700, 360, 26, 280),
                { x: 550, y: 210, w: 26, h: 140, move: { axis: 'x', amp: 150, speed: 1.7, phase: -Math.PI / 2 } }
            ]
        }),
        {
            name: 'The Keep',
            blurb: 'One way in, and it faces the far cushion. Go past the flag to reach it.',
            par: 4,
            /* A room whose door is on the side you cannot come at directly.
               The two posts outside the mouth are not there to block it —
               they line the approach up, so a ball banked off the right
               cushion is funnelled in rather than merely passing by. */
            tee: { x: 90, y: 560 },
            hole: { x: 470, y: 300 },
            walls: [
                r(300, 180, 380, 24), r(300, 416, 380, 24),   // roof and floor
                r(300, 180, 24, 260),                          // the blind side
                r(656, 180, 24, 100), r(656, 364, 24, 76)      // the doorway, y 280-364
            ],
            rough: [r(700, 0, 260, 160), r(700, 480, 260, 160)],
            bumpers: [post(770, 250, 22), post(770, 394, 22)]
        }
    ];

    /* ── The Tidewater Six — the seaside ────────────────────────────────

       Water on every hole, which is the one hazard that does not slow the
       ball down or push it about — it simply takes the shot off you and asks
       for it again. A course made of it is a course about weight: rough,
       sand and ice all forgive a stroke that is merely too much, and water
       does not.

       So the crossings are wide — ninety pixels at the tightest, and most of
       them a hundred and twenty — because a hole that punishes a miss that
       hard cannot also demand a thread. And every one has a way to choose:
       the gap or the rocks, the sandbar, the skip or the footbridge, the
       staircase, the door. */

    var TIDE = [
        {
            name: 'Low Tide',
            blurb: 'A channel through the middle, and rough on the far bank for anything that overcooks it.',
            par: 3,
            /* The opener states the terms: the water is crossable in one
               ordinary shot, and the penalty for the shot after it running
               on is a stroke's worth of roll rather than a stroke. */
            tee: { x: 110, y: 320 },
            hole: { x: 860, y: 320 },
            water: [r(380, 0, 180, 230), r(380, 410, 180, 230)],
            rough: [r(600, 0, 360, 110), r(600, 530, 360, 110)]
        },
        mirror({
            name: 'The Skerries',
            blurb: 'Four rocks in open water, and none of them where you want one.',
            par: 3,
            /* Pinball with the cushions taken away: the posts are the same
               posts, but a ricochet off one of them costs a stroke rather
               than a yard, so the hole is about which of them you are
               willing to be near. */
            tee: { x: 100, y: 320 },
            hole: { x: 870, y: 320 },
            // Four pools rather than two banks: the channel through the rocks
            // is 300px wide at the pinch and the whole of it is over water,
            // so a ricochet has somewhere to be lost.
            water: [
                r(360, 0, 240, 140), r(360, 500, 240, 140),
                r(760, 0, 200, 170), r(760, 470, 200, 170)
            ],
            rough: [r(0, 0, 300, 90), r(0, 550, 300, 90)],
            bumpers: [
                post(430, 250, 24), post(520, 390, 24),
                post(640, 250, 24), post(730, 390, 24)
            ]
        }),
        {
            name: 'The Bar',
            blurb: 'A sandbar is the only way across, and sand is the only brake you get.',
            par: 3,
            /* Two hundred pixels of bunker between two lakes. Anything that
               reaches the bar stops on it, which is the point — the crossing
               is generous and the shot off it is from a lie that gives you
               nothing back. */
            tee: { x: 120, y: 320 },
            hole: { x: 840, y: 320 },
            water: [r(360, 0, 220, 220), r(360, 420, 220, 220)],
            sand: [r(360, 220, 220, 200)],
            rough: [r(620, 0, 340, 90), r(620, 550, 340, 90)]
        },
        {
            name: 'Ducks and Drakes',
            blurb: 'A creek right across the field. Skip it if you dare, or walk round by the footbridge.',
            par: 3,
            /* The one hole on the rack built round the skip. The creek runs
               cushion to cushion but for a footbridge in the rough at the far
               end, so there is a long way round that costs nothing but a
               stroke — and a short way straight over it that only a hard,
               flat ball can take: from the tee it wants the overswing and all
               the risk that comes with it, from the near bank a firm putt
               will do. Soft and it goes in. The bunker behind the cup is
               there for the ball that skipped and kept going. */
            tee: { x: 480, y: 70 },
            hole: { x: 480, y: 540 },
            water: [r(90, 290, 870, 70)],
            sand: [r(360, 600, 240, 40)],
            rough: [r(0, 250, 90, 150)]
        },
        {
            name: 'The Narrows',
            blurb: 'A causeway between two lakes, climbing in three landings. The banks run on the slant.',
            par: 4,
            /* A straight channel is one shot, aimed once. A staircase is the
               same width of dry land and a different problem: the line that
               clears the first landing is in the water at the second, so the
               distance has to be judged as well as the angle.

               It was six rectangles once, and looked it — a diagram of a
               staircase rather than a causeway. The lakes are two polygons
               now: the landings are level and a hundred and twenty pixels
               wide, and the banks between them climb on a steep slant. Steep
               on purpose: at forty-five degrees the three landings line up
               into one diagonal band a straight putt can thread, which is a
               different and easier hole. Pitched at two in one, the riser
               pinches to fifty-odd pixels square across — the forty-pixel
               step the rectangles left, given back its shape — and the
               straight line from the tee is in the north lake before it. */
            tee: { x: 140, y: 360 },
            hole: { x: 850, y: 200 },
            water: [
                poly(280, 0, 960, 0, 960, 140, 740, 140, 700, 220, 520, 220, 480, 300, 280, 300),
                poly(280, 640, 280, 420, 480, 420, 520, 340, 700, 340, 740, 260, 960, 260, 960, 640)
            ],
            rough: [r(0, 0, 230, 80), r(0, 560, 230, 80)]
        },
        mirror({
            name: 'Harbour Gate',
            blurb: 'The gate slides up into the wall and lingers shut. Wait for the daylight.',
            par: 4,
            /* A sliding door hung the way Sliding Doors hangs its two: shut
               is one end of the travel rather than the middle of it, so the
               gate closes, dwells, and opens again. Vertical, this time —
               the door slides up into the top wall and leaves the whole
               doorway open when it does. */
            tee: { x: 110, y: 540 },
            hole: { x: 880, y: 180 },
            walls: [
                r(460, 0, 26, 240), r(460, 460, 26, 180),     // the doorway, y 240-460
                { x: 460, y: 145, w: 26, h: 200, move: { axis: 'y', amp: 105, speed: 1.2, phase: Math.PI / 2 } }
            ],
            water: [r(560, 380, 300, 140)],
            rough: [r(560, 0, 400, 90)]
        })
    ];

    /* ── The Wild Six — the woodland ────────────────────────────────────

       The ground itself moves the ball here. Hills that break, a hill that
       runs back at you, a green that sheds everything you leave on it, and
       the one mechanic that arrives on this card rather than being
       recombined: a moving wall does not only block, it *pushes* (physics.js
       adds the wall's own velocity along the contact normal, so a gate
       cannot swallow a resting ball). Wiper Blades makes that the hole. */

    var WILD = [
        {
            name: 'The Chute',
            blurb: 'Two arms closing to a throat seventy pixels wide. Arrive too fast and it spits you back.',
            par: 3,
            /* Two straight arms closing to a seventy-pixel throat. They were
               built as ten overlapping steps once, when the vocabulary had no
               diagonals — each step lapping the next so there was no seam to
               slip through — and the steps threw the ball off their corners
               in directions the funnel never meant. As rails they are what
               they always stood for. The funnel is a wide target that does
               the aiming for you, which is the point: it hands the hole back
               to weight. Too hard and the ball comes off the far cushion and
               straight back out of the throat it came in by. */
            tee: { x: 100, y: 320 },
            hole: { x: 870, y: 320 },
            rails: [rail(385, 73, 805, 273, 24), rail(385, 567, 805, 367, 24)],
            /* The shoulders outside the arms, cut on the same slant. Going
               over the top is still allowed and is the whole choice the hole
               offers: the throat is the fast line and it has to be earned,
               the high road is free and costs a stroke's worth of roll. */
            rough: [
                poly(0, 0, 960, 0, 960, 260, 800, 260, 380, 60, 0, 60),
                poly(0, 640, 0, 580, 380, 580, 800, 380, 960, 380, 960, 640)
            ]
        },
        {
            name: 'Saddleback',
            blurb: 'Two hills, back to back, breaking opposite ways. The straight line is not the line.',
            par: 3,
            /* Tilt falls one way and asks you to aim above it. This asks the
               question twice in opposite directions, which is a different
               shot: the correction that holds the first half of the roll is
               exactly wrong for the second. Both slopes stop well short of a
               cushion — a ball they shed has somewhere to come to rest. */
            tee: { x: 100, y: 320 },
            hole: { x: 880, y: 320 },
            sand: [r(820, 0, 140, 200), r(820, 440, 140, 200)],
            // A slope may not reach a cushion, so both hills stop short and
            // the lane past them is rough — which doubles as the collar the
            // hills shed into.
            rough: [r(240, 0, 500, 90), r(240, 550, 500, 90)],
            slopes: [
                { x: 240, y: 100, w: 250, h: 440, ax: 0, ay: -150 },
                { x: 490, y: 100, w: 250, h: 440, ax: 0, ay: 150 }
            ]
        },
        mirror({
            name: 'Wiper Blades',
            blurb: 'Two bars sweeping the middle of the field. They do not block the shot — they hit it.',
            par: 3,
            /* The one hole built on the push rather than the block. A gate
               that meets the ball while travelling hands it the gate's own
               velocity, so a ball nudged by a descending bar leaves faster
               and lower than it arrived. Both bars are hung so their travel
               ends 95px short of the top cushion and 219px short of the
               bottom one: they can shove the ball about, but they can never
               trap it against anything. */
            tee: { x: 100, y: 380 },
            hole: { x: 880, y: 240 },
            walls: [
                { x: 330, y: 245, w: 220, h: 26, move: { axis: 'y', amp: 150, speed: 1.1, phase: 0 } },
                { x: 620, y: 245, w: 220, h: 26, move: { axis: 'y', amp: 150, speed: 1.45, phase: Math.PI / 2 } }
            ],
            // The lanes the bars cannot reach, in rough. Without them the hole
            // is walked round the outside for nothing and the bars are scenery.
            rough: [r(280, 0, 680, 90), r(280, 440, 680, 200)]
        }),
        {
            name: 'The Cascade',
            blurb: 'Twenty posts and no lane that runs all the way through. Played up the field.',
            par: 3,
            /* Pinball on the Old Course is a corridor with posts in it. This
               is the same posts arranged as a lattice: three staggered rows,
               each gap covered by a post in the row behind, so no line from
               the tee reaches the flag without touching something. The rows
               are 100 apart and the posts 130, which leaves every mouth
               comfortably wider than the ball — it is a maze, not a sieve. */
            tee: { x: 480, y: 600 },
            hole: { x: 480, y: 70 },
            // The band across the top stops a ball rattling back down off the
            // cushion; the two side lanes are the ones the lattice cannot
            // reach, and rough is what stops them being a free way round it.
            rough: [r(0, 0, 960, 45), r(0, 200, 80, 320), r(880, 200, 80, 320)],
            bumpers: [
                post(100, 460, 22), post(230, 460, 22), post(360, 460, 22), post(490, 460, 22),
                post(620, 460, 22), post(750, 460, 22), post(880, 460, 22),
                post(165, 360, 22), post(295, 360, 22), post(425, 360, 22),
                post(555, 360, 22), post(685, 360, 22), post(815, 360, 22),
                post(100, 260, 22), post(230, 260, 22), post(360, 260, 22), post(490, 260, 22),
                post(620, 260, 22), post(750, 260, 22), post(880, 260, 22)
            ]
        },
        mirror({
            name: 'Sisyphus',
            blurb: 'The middle runs back at you. Nothing you leave there stays there.',
            par: 4,
            tee: { x: 110, y: 320 },
            hole: { x: 850, y: 320 },
            sand: [r(880, 200, 80, 240)],
            slopes: [{ x: 300, y: 0, w: 420, h: 640, ax: -150, ay: 0 }]
        }),
        {
            name: 'Crown Green',
            blurb: 'The green sheds everything you leave on it. Only the cup itself holds.',
            par: 4,
            /* A crowned green, which every other slope on the rack is the
               opposite of: four bands around the cup, each pushing away from
               it, so a ball that finishes near the flag does not stay near
               the flag. It is still holeable and not by luck — the cup pulls
               at 900 against the crown's 160, so anything that actually
               reaches the rim slowly enough drops. Nothing else does. */
            tee: { x: 100, y: 570 },
            hole: { x: 480, y: 320 },
            // A collar of rough all the way round. What the crown sheds has to
            // land somewhere, and rough stops it in a stride — so the next
            // putt is from beside the green rather than from across the field.
            rough: [
                r(240, 80, 480, 60), r(240, 500, 480, 60),
                r(240, 140, 60, 360), r(660, 140, 60, 360)
            ],
            slopes: [
                { x: 300, y: 200, w: 180, h: 240, ax: -160, ay: 0 },
                { x: 480, y: 200, w: 180, h: 240, ax: 160, ay: 0 },
                { x: 300, y: 140, w: 360, h: 60, ax: 0, ay: -160 },
                { x: 300, y: 440, w: 360, h: 60, ax: 0, ay: 160 }
            ]
        }
    ];

    /* ── The Warren — the meadow ────────────────────────────────────────

       The one card built on a door. A tunnel keeps the shot and changes the
       place: whatever speed and heading the ball goes down one mouth with,
       it comes up the other with. That one sentence is the whole course,
       and each hole reads a different consequence off it — that it can be
       aimed through (Rabbit Hole), that weight survives the trip (Snow
       Globe), that heading survives it too (Crossed Wires), that a door can
       be a trap as easily as a shortcut (Snakes and Ladders).

       Every mouth keeps a ball's width and a half of clear grass around it,
       and none sits on a slope: a ball the hill held over a mouth would go
       down it without being played, which is a shot nobody took. */

    var WARREN = [
        {
            name: 'Rabbit Hole',
            blurb: 'One wall, one way through it. In one end, out the other — same speed, same line.',
            par: 2,
            /* The terms, stated once and plainly: the wall runs cushion to
               cushion, the two mouths sit on the line from the tee to the
               cup, and a putt of the right weight goes in, comes out and
               drops as if the wall were not there. */
            tee: { x: 130, y: 320 },
            hole: { x: 830, y: 320 },
            walls: [r(460, 0, 40, 640)],
            rough: [r(0, 0, 960, 90), r(0, 550, 960, 90)],
            tunnels: [tunnel(320, 320, 640, 320)]
        },
        mirror({
            name: 'Snow Globe',
            blurb: 'The cup is shut in a box of ice. The only door is a tunnel, and it opens both ways.',
            par: 3,
            /* A room with no door, an ice floor and a cup in it. Whatever
               the ball carries into the tunnel it carries onto the rink,
               and the rink triples it — so the putt is a whisper. Too firm
               and it rattles round the walls, which is not always a
               disaster: a ball that comes back off the far wall and finds
               its own exit goes home to the tee. */
            tee: { x: 110, y: 320 },
            hole: { x: 790, y: 320 },
            walls: [
                r(560, 140, 330, 30), r(560, 470, 330, 30),
                r(560, 170, 30, 300), r(860, 170, 30, 300)
            ],
            ice: [r(590, 170, 270, 300)],
            rough: [r(0, 0, 520, 110), r(0, 530, 520, 110)],
            tunnels: [tunnel(330, 320, 640, 320)]
        }),
        mirror({
            name: 'Crossed Wires',
            blurb: 'Two tunnels under one wall, and each comes up where the other went in. Heading survives the trip.',
            par: 3,
            /* The lesson the first hole hid: a tunnel keeps the heading
               as well as the speed. The cup sits square in front of one
               exit, and the straight line from the tee into either mouth
               comes out on a diagonal that runs both of them into the same
               bunker. The cure is to go in level — which means a first
               putt to somewhere that can see the mouth square on. */
            tee: { x: 120, y: 320 },
            hole: { x: 840, y: 170 },
            walls: [r(460, 0, 40, 640)],
            sand: [r(760, 250, 170, 140)],
            tunnels: [tunnel(300, 170, 660, 470), tunnel(300, 470, 660, 170)]
        }),
        {
            name: 'Snakes and Ladders',
            blurb: 'Two tunnels in the open. One carries you to the flag; the other is waiting on the straight line.',
            par: 3,
            /* Nothing to stop the plain approach except what sits on it: the
               snake's mouth is on the line from the tee to the cup, and it
               comes up in the rough in the far corner. The ladder is off the
               line and carries you two thirds of the way — its far mouth
               looks past the flag on the heading the tee sees it at, so it
               is a birdie for a putt you trust and not an ace for nothing. */
            tee: { x: 110, y: 540 },
            hole: { x: 850, y: 110 },
            rough: [r(0, 0, 300, 220), r(860, 400, 100, 240)],
            sand: [r(380, 520, 200, 120)],
            tunnels: [tunnel(280, 357, 660, 250), tunnel(500, 313, 140, 100)]
        },
        {
            name: 'Burrow Mouth',
            blurb: 'A wall with a way round the bottom, and a burrow that cuts the corner — if you can get past the guards.',
            par: 3,
            /* A pocket of posts round a mouth, open towards the tee. The
               long way is under the end of the wall and back up; the short
               one is through the gap in the posts, and posts are livelier
               than wood, so a putt that clips the pocket is sent somewhere
               of their choosing. The far mouth faces the cup on the line
               the gap is cut on. */
            tee: { x: 120, y: 500 },
            hole: { x: 840, y: 140 },
            walls: [r(440, 0, 30, 470)],
            rough: [r(470, 560, 490, 80)],
            // Five posts on a 52px ring round the mouth, each touching the
            // next, with the sixth left out on the side that faces the tee.
            bumpers: [
                post(290, 243, 27), post(312, 195, 27), post(282, 153, 27),
                post(230, 157, 27), post(208, 205, 27)
            ],
            tunnels: [tunnel(260, 200, 755, 321)]
        },
        {
            name: 'Warren End',
            blurb: 'Three rooms, two tunnels between them, and one that goes back the way you came.',
            par: 4,
            /* One of everything the card has taught, and three rooms to put
               it in. The first tunnel comes up pointing at a bunker if you
               go in on the obvious line; the second room has two mouths in
               it and only one of them goes on; the last room has a pond on
               the far side of the flag for whatever arrives too quickly. */
            tee: { x: 100, y: 520 },
            hole: { x: 860, y: 160 },
            walls: [r(300, 0, 30, 640), r(630, 0, 30, 640)],
            sand: [r(370, 250, 200, 110)],
            water: [r(880, 330, 80, 220)],
            tunnels: [
                tunnel(200, 160, 400, 520),
                tunnel(560, 140, 760, 500),
                tunnel(560, 520, 110, 150)
            ]
        }
    ];

    /* ── Avalanche Pass — the mountain ──────────────────────────────────

       The card of the clock. A chute is a lane down the mountain, and every
       few seconds a slide comes down it and carries off whatever it is over
       — into a drift if you are lucky, into a crevasse if you are not. It is
       a band you can watch coming, with a rumble and a plume at the head of
       the chute a second before, and the gap behind it is the shot. In
       between: a frozen tarn, an iced slalom, and a summit reached by a
       hairpin through an avalanche gully. */

    var ALPINE = [
        {
            name: 'First Tracks',
            blurb: 'One chute across the fairway. Watch a slide come down, then go in behind it.',
            par: 3,
            /* The terms, stated once and plainly: a chute runs down the
               middle of the field, a slide comes down it every four seconds,
               and anything it is over goes with it into the drift at the
               foot. The gap between two slides is three and a half seconds
               wide and a putt crosses the chute in a third of one, so the
               shot is always there — the hole is learning to wait for it. */
            tee: { x: 110, y: 320 },
            hole: { x: 850, y: 320 },
            avalanches: [chute(430, 0, 120, 540, 'down', 4.2, 0.6)],
            sand: [r(400, 540, 180, 100)],
            rough: [r(0, 0, 430, 70), r(550, 0, 410, 70), r(0, 570, 400, 70), r(580, 570, 380, 70)]
        },
        {
            name: 'Cold Snap',
            blurb: 'The rink will not slow you down, and the far bank is a lake.',
            par: 3,
            /* A frozen tarn the shot crosses before it can stop, and open
               water beyond it. The rink keeps nearly all of what the putt
               had, so the weight that reaches the cup off grass runs into
               the lake off ice. */
            tee: { x: 110, y: 540 },
            hole: { x: 790, y: 150 },
            water: [r(880, 0, 80, 640)],
            ice: [r(300, 80, 380, 470)]
        },
        {
            name: 'Crevasse',
            blurb: 'The chute runs out into a crevasse. Cross it between slides, or climb round the top in the deep snow.',
            par: 3,
            /* First Tracks with the drift taken away: the foot of this chute
               is open water, so a slide that catches the ball costs a stroke
               rather than a yard. That makes the line across it a gamble on
               timing, and the hole offers the other bet too — the chute stops
               short of the top cushion, and the way over its head is long,
               slow and safe, through deep snow and past a boulder. Played
               right to left. */
            tee: { x: 850, y: 380 },
            hole: { x: 110, y: 380 },
            avalanches: [chute(420, 120, 110, 320, 'down', 3.6, 0)],
            water: [r(390, 440, 170, 200)],
            rough: [r(320, 0, 310, 120)],
            bumpers: [post(475, 62, 24)]
        },
        {
            name: 'Rush Hour',
            blurb: 'Two chutes across the slope, running opposite ways on different clocks. Played up the field.',
            par: 3,
            /* Two lanes of traffic and a verge between them: each chute runs
               the width of the field into a drift of its own, one slide going
               right and the other left, every 3.8 and every 4.6 seconds. One
               putt can cross both if it is timed for both; two putts with a
               stop on the verge only ever have to time one. */
            tee: { x: 480, y: 590 },
            hole: { x: 480, y: 70 },
            avalanches: [
                chute(0, 370, 850, 100, 'right', 3.8, 0),
                chute(110, 170, 850, 100, 'left', 4.6, 1.7)
            ],
            sand: [r(850, 350, 110, 140), r(0, 150, 110, 140)]
        },
        {
            name: 'Glass Slalom',
            blurb: 'Four fingers to weave, and the floor between them is ice.',
            par: 4,
            /* A slalom, as on any mountain, and the whole of it iced, which
               changes what the fingers are for: on grass
               they are a line to be threaded, on ice they are what the ball
               ricochets off on its way through, and the shot that gets down
               the lane is the soft one rather than the straight one. */
            tee: { x: 100, y: 560 },
            hole: { x: 880, y: 90 },
            walls: [
                r(300, 0, 24, 340), r(450, 300, 24, 340),
                r(600, 0, 24, 340), r(750, 300, 24, 340)
            ],
            sand: [r(820, 200, 140, 160)],
            ice: [r(270, 0, 520, 640)]
        },
        {
            name: 'Summit',
            blurb: 'A hairpin up the mountain. The turn is an avalanche gully, and the last leg is a frozen ledge.',
            par: 4,
            /* Out along the foot of a long rock band, up through the gully at
               its end and back along the top to the flag. The gully is a chute
               the whole height of the turn, so the climb through it has to go
               between slides, and whatever is caught comes back down to the
               drift at the bottom. The top leg is iced and the cup has a pair
               of boulders in front of it: the shot that arrives is the soft
               one. */
            tee: { x: 860, y: 560 },
            hole: { x: 860, y: 130 },
            walls: [r(250, 290, 710, 26)],
            avalanches: [chute(30, 40, 190, 500, 'down', 4.0, 0)],
            sand: [r(0, 540, 250, 100)],
            ice: [r(330, 60, 360, 190)],
            rough: [r(760, 316, 200, 120)],
            bumpers: [post(760, 80, 22), post(760, 230, 22)]
        }
    ];

    /* ── Ember Ridge — the volcano ──────────────────────────────────────

       The last card, and the one most made of choices. Lava is water that
       never lets a ball skip, so every crossing is a risk taken or a long
       way round; and the geysers are the risk. A vent blows for a second in
       every three, and a ball rolling over it then is thrown up and over
       whatever is beyond — the lava channel, the moat round an island, the
       river. Every hole here has a safe way that costs strokes and a quick
       way that costs nerve, and par is set for the player who takes one
       chance in the round, not all of them. */

    var EMBER = [
        {
            name: 'Hot Foot',
            blurb: 'A path of black rock between two lava flows. Nothing skips on lava.',
            par: 3,
            /* The terms: lava is water that never lets the ball skip. A ball
               that reaches it at any pace is gone, a stroke and a replay. The
               path is wide — a hundred and fifty pixels at the pinch — and it
               kinks round a tongue of the upper flow that sits on the line
               from the tee, so the first putt is played to the bend rather
               than at the flag. */
            tee: { x: 110, y: 540 },
            hole: { x: 840, y: 120 },
            lava: [
                poly(0, 0, 640, 0, 560, 90, 500, 200, 470, 330, 410, 300, 330, 280, 180, 330, 0, 380),
                poly(260, 640, 380, 500, 560, 460, 640, 330, 760, 260, 960, 240, 960, 640)
            ]
        },
        {
            name: 'Lava Tube',
            blurb: 'A flow from cushion to cushion and no way over it. The old lava tube goes under.',
            par: 3,
            /* The Warren's word, found where it occurs in nature: a tunnel
               the lava left behind. It is the only way across, and it keeps
               the heading, so the putt into it is aimed at the cup on the far
               side as much as at the mouth on this one. */
            tee: { x: 110, y: 500 },
            hole: { x: 850, y: 200 },
            lava: [poly(380, 0, 560, 0, 640, 640, 460, 640)],
            tunnels: [tunnel(330, 420, 700, 260)]
        },
        {
            name: 'Old Faithful',
            blurb: 'A geyser in front of a lava channel. Catch it blowing and it throws you over. Or take the long way.',
            par: 3,
            /* The geyser blows for a second in every three, and a ball that
               rolls over it then is thrown up and carried on over the
               channel; a ball that rolls over it quiet rolls on into the
               lava. So the straight line is two judgements at once — when,
               and how hard, because the ball flies further the faster it
               arrives — and the bunker behind the cup catches the ones that
               were early enough and too firm. The bridge in the rough at the
               foot of the channel is the way round for anyone who would
               rather not. */
            tee: { x: 110, y: 320 },
            hole: { x: 800, y: 320 },
            lava: [r(470, 0, 120, 500)],
            sand: [r(880, 220, 80, 200)],
            rough: [r(440, 500, 180, 140)],
            vents: [vent(390, 320, 3.2, 0, 1.1)]
        },
        {
            name: 'Stepping Vents',
            blurb: 'Two lava pools up the middle, a geyser in front of each. Played up the field.',
            par: 4,
            /* Old Faithful twice, and in a row: the second vent blows nearly
               a second after the first, which is about how long a ball thrown
               by the first takes to reach it. Strung together it is a hole in
               two; one at a time it is three; round the ends of the pools
               through the rough it is four, and nothing on the way can burn
               you. */
            tee: { x: 480, y: 600 },
            hole: { x: 480, y: 60 },
            lava: [r(200, 380, 560, 90), r(200, 150, 560, 90)],
            rough: [r(0, 130, 160, 360), r(800, 130, 160, 360)],
            vents: [vent(480, 525, 3.0, 0, 1.0), vent(480, 305, 3.0, 0.9, 1.0)]
        },
        {
            name: 'Caldera',
            blurb: 'The cup on an island in a ring of lava. One causeway, round the back — or the geyser out front.',
            par: 4,
            /* An island green with its bridge on the far side. The safe way
               is all the way round the ring to a causeway that faces away
               from the tee, and back in. The quick way is the vent in front
               of the near bank, which throws a ball onto the island — and
               straight off the far side of it into the lava unless the
               weight was right. The bunker on the island is the only brake
               it has. */
            tee: { x: 110, y: 320 },
            hole: { x: 700, y: 320 },
            lava: [
                r(560, 160, 280, 70),                      // the far rim
                r(560, 410, 120, 70), r(740, 410, 100, 70), // the near rim, causeway at x 680-740
                r(560, 230, 70, 180), r(770, 230, 70, 180)  // the two sides
            ],
            sand: [r(720, 260, 50, 120)],
            vents: [vent(490, 320, 3.4, 0, 1.0)]
        },
        {
            name: 'The Furnace',
            blurb: 'A river of lava across the whole field and one footbridge at the far end. Two geysers, if you are brave.',
            par: 5,
            /* Everything the card has said, at once. The river runs from the
               footbridge on the left to the far cushion, so the safe hole is
               a long one: out to the bridge, over, and back along the top to
               a flag guarded by a rock wall and an ash bunker — par, and not
               a stroke less. The two vents on the near bank are the strokes
               less: each throws a ball over the river if it blows as the
               ball arrives, the second straight at the flag, and they blow
               on opposite beats. */
            tee: { x: 100, y: 560 },
            hole: { x: 860, y: 90 },
            walls: [r(520, 0, 30, 170)],
            lava: [poly(80, 230, 300, 170, 520, 290, 700, 250, 960, 180, 960, 300, 700, 370, 520, 410, 300, 290, 80, 350)],
            sand: [r(640, 40, 110, 90)],
            rough: [r(0, 200, 80, 180)],
            vents: [vent(330, 450, 3.6, 0, 1.0), vent(760, 460, 3.6, 1.8, 1.0)]
        }
    ];

    /* The rack. `GOLF.COURSE` is whichever card is being played — the first
       one unless something says otherwise — and every consumer downstream
       keeps reading exactly that, so a course is chosen in one place and
       nowhere else has to know there is a choice.

       The order is the order the picker shows and the die draws from, and it
       is meant to be read: a ladder from the gentlest card to the hardest,
       each opened by the stars of the ones above it. The order is not
       load-bearing for the save file — `BARE_KEY_COURSE` is (see scoring.js)
       — so a card can move up or down the ladder without taking anybody's
       record with it. */
    GOLF.COURSES = [
        {
            id: 'short',
            theme: 'garden',
            name: 'The Short Six',
            blurb: 'Six holes, nothing hidden, and a round inside twenty minutes.',
            // Where a first visit is pointed. Par two or three all the way
            // round and every hole visible from the tee: the tutorial that
            // does not say it is one.
            starter: true,
            holes: SHORT
        },
        {
            id: 'links',
            theme: 'parkland',
            name: 'The Old Course',
            blurb: 'Corners, cushions, posts and doors. The classics, six of them.',
            unlock: 4,
            holes: LINKS
        },
        {
            id: 'tide',
            theme: 'seaside',
            name: 'The Tidewater Six',
            blurb: 'Water on every hole. Carry it, skip it, or go the long way round.',
            unlock: 10,
            holes: TIDE
        },
        {
            id: 'wild',
            theme: 'woodland',
            name: 'The Wild Six',
            blurb: 'Hills that break, bars that sweep and a green that sheds everything.',
            unlock: 18,
            holes: WILD
        },
        {
            id: 'warren',
            theme: 'meadow',
            name: 'The Warren',
            blurb: 'Six holes riddled with tunnels. Go in one, come out another.',
            unlock: 26,
            holes: WARREN
        },
        {
            id: 'alpine',
            theme: 'alpine',
            name: 'Avalanche Pass',
            blurb: 'Ice, crevasses and chutes that slide on a clock. Wait for the gap.',
            unlock: 34,
            holes: ALPINE
        },
        {
            id: 'ember',
            theme: 'volcanic',
            name: 'Ember Ridge',
            blurb: 'Lava nothing skips across, and geysers that throw you over it if you time them.',
            unlock: 42,
            holes: EMBER
        }
    ];

    /* The card that keeps the bare save keys. It was the only course there
       was when the save file was first written, and a record a player has had
       since then should stay where they left it — and where the landing page
       reads it. Every other card's keys carry its id. See scoring.js. */
    GOLF.BARE_KEY_COURSE = 'links';

    /* Every list a hole may carry. Fill in what a hole did not bother to
       declare: hole data reads better when it lists only the hazards it
       uses, and every consumer downstream gets to loop without a guard. The
       playtest hand-off in index.html fills a drawn hole from the same list. */
    GOLF.HAZARD_KEYS = ['walls', 'water', 'sand', 'rough', 'ice', 'bumpers', 'slopes', 'tunnels', 'rails',
                        'lava', 'avalanches', 'vents'];
    GOLF.COURSES.forEach(function (c) {
        c.holes.forEach(function (h) {
            GOLF.HAZARD_KEYS.forEach(function (key) {
                if (!h[key]) h[key] = [];
            });
        });
    });

    GOLF.COURSE_ID = GOLF.COURSES[0].id;
    GOLF.COURSE = GOLF.COURSES[0].holes;
    /* Only a generated card has one. It is what tells a stored round which
       draw it was written for — see scoring.js — and it is null for every
       hand-built course, which is the same as saying "there is only one of
       you". */
    GOLF.COURSE_SEED = null;

    /* Swap the card being played. Returns the course, or null for an id that
       is not on the rack — a stored preference from a course that has since
       been renamed should put you back on the first card, not break the boot. */
    GOLF.selectCourse = function (id) {
        for (var i = 0; i < GOLF.COURSES.length; i++) {
            if (GOLF.COURSES[i].id !== id) continue;
            GOLF.COURSE_ID = id;
            GOLF.COURSE = GOLF.COURSES[i].holes;
            GOLF.COURSE_SEED = typeof GOLF.COURSES[i].seed === 'number' ? GOLF.COURSES[i].seed : null;
            return GOLF.COURSES[i];
        }
        return null;
    };

    /* Par for a card. The one being played unless another is named — the
       picker prices the whole rack at once and cannot move the pointer to do
       it. */
    GOLF.coursePar = function (holes) {
        return (holes || GOLF.COURSE).reduce(function (t, h) { return t + h.par; }, 0);
    };

})(window.GOLF);
