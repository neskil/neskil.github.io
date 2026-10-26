/* Eleven courses of six holes, sixty-six in all.

   `GOLF.COURSES` is the rack — each entry `{ id, name, blurb, holes }` — and
   `GOLF.COURSE` is whichever card is being played, which is what every
   consumer downstream reads. Only `GOLF.selectCourse` moves it, so nothing
   else in the codebase has to know there is more than one course.

   The rack is a ladder. Every card is six holes, drawn in a place of its
   own and built round one thing that place does — the parkland's corners
   and posts, the sea's water, the wood's hills and sweeping bars, the
   meadow's tunnels, the mountain's avalanches, the volcano's lava and
   geysers — and within a card the holes get harder as they go. The first
   card walks through all of those places, a hole in each. A hole that was
   the same idea as another one somewhere else on the rack is not on it any
   more.

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
     arcs     a curved wall, arc(x, y, r, from, to, w): laid as a chain of
              short rails round the arc, so a ball can ride the inside of it.
     blocks   a solid shape, block(look, pts, w): every edge a rail, and the
              inside scenery — a bed, a hedge, a rock, a windmill, a fan.
     hills    mound(x, y, r, a) or bowl(x, y, r, a): round ground, steepest
              halfway out, shedding the ball or gathering it in.
     spinners spinner(x, y, r, arms, speed, phase, w): a turnstile laid flat,
              its arms batting the ball on as they come round.
     belts    belt(x, y, w, h, dir, speed): ground that moves, carrying the
              ball along at its own pace.

   A slope may say `wind: true` — the same pull, shown as air blowing out of
   the fan block at its head — and a hole may name a `theme` of its own.

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

    /* Curves. Everything below is still rails and polygons by the time
       physics.js sees it; these only save writing the corners out. */

    // A curved wall: the arc of radius r round (x, y), from `from` to `to`
    // degrees, clockwise on the screen with 0 pointing right.
    function arc(x, y, r, from, to, w) { return { x: x, y: y, r: r, from: from, to: to, w: w || 24 }; }
    // A solid shape, its outline as x, y pairs, and what stands in it — a
    // flower bed, a hedge, a rock, a windmill, a fan. Its every edge is a
    // rail w thick; `look` is the renderer's business only.
    function block(look, pts, w) { return { look: look, pts: pts, w: w || 20 }; }
    // A round hill, steepest halfway out where it pulls `a` px/s²: a mound
    // sheds the ball away from its middle, a bowl gathers it in.
    function mound(x, y, r, a) { return { x: x, y: y, r: r, a: a }; }
    function bowl(x, y, r, a) { return { x: x, y: y, r: r, a: -a }; }
    // A zone from a list of corners rather than an argument per number.
    function shape(pts) { return { pts: pts }; }
    // A turnstile laid flat: `arms` arms r long round (x, y), turning at
    // `speed` radians a second, clockwise when positive, from `phase`.
    function spinner(x, y, r, arms, speed, phase, w) {
        return { x: x, y: y, r: r, arms: arms, speed: speed, phase: phase || 0, w: w || 20 };
    }
    // Ground that moves: a rectangle carrying the ball `dir` at `speed` px/s.
    function belt(x, y, w, h, dir, speed) { return { x: x, y: y, w: w, h: h, dir: dir, speed: speed }; }
    /* Corners cut round: Chaikin's corner cutting, which replaces every
       corner of a closed outline with two points a quarter of the way along
       its edges. Twice over, a hexagon is a pebble — a bunker or a bed drawn
       with six numbers instead of forty, and with no corner a ball can find. */
    function smooth(pts, passes) {
        for (var k = 0; k < (passes || 2); k++) {
            var out = [], n = pts.length;
            for (var i = 0; i < n; i += 2) {
                var ax = pts[i], ay = pts[i + 1], bx = pts[(i + 2) % n], by = pts[(i + 3) % n];
                out.push(ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25, ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75);
            }
            pts = out;
        }
        return pts.map(Math.round);
    }
    // An ellipse as n corners, clockwise on the screen.
    function oval(x, y, rx, ry, n) {
        var pts = [];
        n = n || 24;
        for (var i = 0; i < n; i++) {
            var t = i / n * Math.PI * 2;
            pts.push(Math.round(x + Math.cos(t) * rx), Math.round(y + Math.sin(t) * ry));
        }
        return pts;
    }

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
        (h.avalanches || []).concat(h.belts || []).forEach(function (a) {
            zone(a);
            if (a.dir === 'left') a.dir = 'right'; else if (a.dir === 'right') a.dir = 'left';
        });
        // A spinner turns the other way in a mirror, and its arms start
        // reflected: an angle θ becomes π − θ.
        (h.spinners || []).forEach(function (sp) {
            sp.x = W - sp.x;
            sp.speed = -sp.speed;
            sp.phase = Math.PI - (sp.phase || 0);
        });
        (h.blocks || []).forEach(zone);
        (h.bumpers || []).concat(h.vents || [], h.hills || []).forEach(function (b) { b.x = W - b.x; });
        (h.tunnels || []).concat(h.rails || []).forEach(function (t) { t.x = W - t.x; t.tx = W - t.tx; });
        // A curve's angles turn about the vertical: θ becomes 180° - θ.
        (h.arcs || []).forEach(function (a) {
            var from = a.from;
            a.x = W - a.x;
            a.from = 180 - a.to;
            a.to = 180 - from;
        });
        return h;
    }

    /* The helpers, for anything else that writes a hole down the way this
       file does — the suite's own test holes among them. */
    GOLF.helpers = { r: r, post: post, tunnel: tunnel, rail: rail, poly: poly, chute: chute, vent: vent,
                     arc: arc, block: block, mound: mound, bowl: bowl, shape: shape, smooth: smooth, oval: oval,
                     spinner: spinner, belt: belt, mirror: mirror };

    /* ── The Short Six — a walk through every place on the rack ─────────

       The card a first visit is handed, and the trailer for everything
       after it. Each hole is set in a different place — the garden, the
       park, the beach, the wood, the meadow, the mountain — in the order
       the rack climbs through them, so six holes in, a player has seen
       where the game goes and met each place's trick gently, one at a time.

       Every hole is built the same way, which is the oldest rule of golf
       architecture: a safe way that anybody can take, and a bold one that
       pays. The safe way is two or three easy putts; the bold one is an
       ace, and on every hole it is a shot — a weight to judge, a bank to
       read, a door to find, a wind to aim into — rather than a fluke. Par
       is set for the safe way, so the stars are there for anybody who
       finishes, and the aces are there for anybody who looks.

       And nothing is a box. The holes are shaped by flower beds, curved
       walls, hills and dunes, because a field with furniture in it reads
       as a diagram; a garden with a gate in it reads as a place. */

    var SHORT = [
        {
            name: 'Garden Gate',
            blurb: 'A walled garden with its gate facing you. Through the gate, and let the green bring it home.',
            par: 2,
            theme: 'garden',
            /* The first shot anybody plays. The cup sits in a round walled
               garden whose gate faces the tee, on a green dished gently
               towards the cup — so a straight putt through the gate at
               about the right weight is an ace, and is meant to be: the
               first hole should show that a hole in one is a thing this
               game gives out. Wide of the gate, the wall turns it away;
               too firm, the back wall sends it home again. The corners are
               flower beds and the cushions are rough: the middle of the
               field is where the ball wants to be. */
            tee: { x: 140, y: 320 },
            hole: { x: 780, y: 320 },
            arcs: [arc(780, 320, 140, 201, 519, 22)],
            blocks: [
                block('bed', smooth([0, 0, 200, 0, 150, 70, 60, 130, 0, 180])),
                block('bed', smooth([0, 640, 0, 460, 60, 510, 150, 570, 200, 640])),
                block('bed', smooth([560, 0, 960, 0, 960, 120, 900, 90, 700, 60])),
                block('bed', smooth([560, 640, 700, 580, 900, 550, 960, 520, 960, 640]))
            ],
            hills: [bowl(780, 320, 100, 32)],
            rough: [r(200, 0, 360, 60), r(200, 580, 360, 60)]
        },
        {
            name: 'Bank Holiday',
            blurb: 'Round the copse to the flag. Or hit it hard along the bottom and let the curve carry it round.',
            par: 3,
            theme: 'parkland',
            /* A dogleg round a copse, and the parkland's idea — angles —
               met for the first time. The safe way is two putts, one to the
               turn and one up to the flag. The bold way is one: the outside
               of the turn is a curved wall, and a firm ball sent along the
               bottom rides it round and comes off it running up the right
               side at the cup. The curve does the turning; the weight is
               yours. There are other banks off the copse for anybody who
               goes looking. */
            tee: { x: 300, y: 565 },
            hole: { x: 905, y: 160 },
            blocks: [
                block('bed', smooth([0, 0, 650, 0, 700, 100, 700, 330, 600, 440, 300, 470, 0, 470])),
                block('bed', smooth([0, 520, 140, 500, 200, 560, 200, 640, 0, 640]))
            ],
            arcs: [arc(760, 420, 180, 0, 90, 24)]
        },
        {
            name: 'Sandcastles',
            blurb: 'A gap between two dunes points straight at the flag. Weigh it right; the sea is behind the cup.',
            par: 3,
            theme: 'seaside',
            /* Sand and water, the beach's two hazards, met where they cost
               the least. The dunes leave a gap that lines up with the cup,
               and the sea is close behind it: a putt down the gap with the
               right weight is an ace, a firm one is wet. Soft is safe —
               short of the flag, two putts — and the sandcastles either side
               are there to be banked off, or into. */
            tee: { x: 840, y: 560 },
            hole: { x: 200, y: 175 },
            water: [shape(smooth([0, 0, 360, 0, 330, 50, 230, 80, 120, 110, 70, 220, 0, 290]))],
            sand: [
                shape(smooth([470, 250, 560, 215, 640, 240, 630, 300, 540, 320, 480, 300])),
                shape(smooth([400, 410, 470, 380, 560, 410, 540, 470, 450, 490, 390, 460]))
            ],
            blocks: [
                block('rock', smooth([960, 0, 960, 140, 900, 120, 860, 60, 880, 0])),
                block('rock', smooth([0, 640, 0, 470, 70, 500, 120, 580, 150, 640])),
                block('castle', smooth([655, 265, 725, 265, 725, 335, 655, 335], 1)),
                block('castle', smooth([295, 435, 365, 435, 365, 505, 295, 505], 1))
            ]
        },
        {
            name: 'Molehill',
            blurb: 'A mole has been busy on the line. Over the top, round the shoulder, or the long way.',
            par: 3,
            theme: 'woodland',
            /* The wood's idea is ground that moves the ball, and a hill is
               the gentlest way in: a mound sheds a ball off whichever side
               it meets, so the shoulder of it is a curve you can aim with.
               Straight over the top holds its line if it is firm enough;
               off the shoulder it bends; round the outside is long and
               safe. Two log walls make a ring round the hill, so whatever
               it sheds comes back into play. The cup sits in a dip. */
            tee: { x: 110, y: 330 },
            hole: { x: 830, y: 260 },
            hills: [mound(470, 340, 140, 170), bowl(830, 260, 70, 40)],
            arcs: [arc(470, 340, 250, 205, 335, 24), arc(470, 340, 250, 25, 155, 24)],
            blocks: [
                block('bed', smooth([0, 0, 260, 0, 200, 80, 60, 120, 0, 160])),
                block('bed', smooth([0, 640, 0, 500, 80, 540, 200, 640])),
                block('bed', smooth([960, 640, 700, 640, 760, 560, 900, 520, 960, 480]))
            ]
        },
        {
            name: 'The Windmill',
            blurb: 'The door goes right through the mill. In the front, out the back — on the same line.',
            par: 3,
            theme: 'meadow',
            /* The oldest hole in mini golf, and the meadow's idea — a door
               that keeps the shot — in its most famous clothes. The mill
               stands in the middle of the field and a tunnel runs through
               it from the front door to the back: whatever line and pace
               the ball goes in with, it comes out with. The flag is not
               straight behind the mill but off on the line from the tee
               through the door, so the ace is the putt that trusts that.
               Round the mill either side is two putts and no secrets. */
            tee: { x: 300, y: 585 },
            hole: { x: 605, y: 112 },
            blocks: [
                block('windmill', oval(480, 330, 56, 56, 20)),
                block('bed', smooth([0, 0, 260, 0, 230, 120, 120, 260, 0, 300])),
                block('bed', smooth([960, 640, 960, 330, 880, 380, 800, 520, 760, 640]))
            ],
            tunnels: [tunnel(480, 460, 480, 200)],
            rough: [r(0, 360, 130, 280)]
        },
        {
            name: 'Snow Cannon',
            blurb: 'The snow cannon blows across the piste, and the flag is on a frozen tarn. Aim into the wind.',
            par: 3,
            theme: 'alpine',
            /* The last hole of the walk is on the mountain, where the rack
               ends up, and it asks the question the mountain asks: what will
               the ball do on its way? A snow cannon blows a lane of wind
               across the middle of the field, and the cup is on a frozen
               tarn that keeps whatever pace arrives. A straight putt drifts
               downwind and slides off the ice; the ace is aimed upwind of the
               flag and struck softly enough for the tarn. Two putts — one to
               the near side of the lane, one across it short — is safe. */
            tee: { x: 140, y: 560 },
            hole: { x: 790, y: 130 },
            blocks: [
                block('fan', [880, 255, 960, 255, 960, 385, 880, 385]),
                block('rock', smooth([0, 0, 280, 0, 230, 90, 90, 140, 0, 160])),
                block('bed', smooth([960, 640, 640, 640, 700, 560, 860, 520, 960, 480]))
            ],
            slopes: [{ x: 150, y: 265, w: 700, h: 110, ax: -140, ay: 0, wind: true }],
            ice: [shape(smooth([600, 80, 760, 50, 900, 90, 900, 200, 760, 230, 620, 190]))]
        }
    ];

    /* ── The Old Course — parkland ──────────────────────────────────────

       What the game always was, boiled down to the six that were each a
       different idea: up the field through a bunker, round a corner, a
       table of posts, the cushions, two doors to time and a room whose
       door faces away. Walls and posts and nothing else that moves the
       ball — the angles are the hazard.

       Its second pass gave it the angles it was always about. The corner
       has a bank board at it, the cushion shot has a curve to bank off,
       the posts stand on a pinball table, and the keep is round. Four of
       the six have an ace in them for the player who reads the angle; the
       last two are honest par fours — a hole you play in stages is a
       different pleasure from one you play in a stroke, and a card needs
       both. */

    var LINKS = [
        {
            name: 'Bunker Hill',
            blurb: 'Up the field, and the sand has a neck of grass through it. Thread it, or go round the ends.',
            par: 3,
            /* Played up the field rather than across it. Two kidneys of sand
               lie across the middle with a strip of grass between them on
               the straight line: a putt down it is an ace if the weight is
               right and a bunker if the line is not. Round either end is wide
               and free, and two putts. */
            tee: { x: 480, y: 590 },
            hole: { x: 480, y: 80 },
            sand: [
                shape(smooth([120, 300, 260, 250, 420, 270, 440, 330, 400, 390, 240, 400, 130, 370])),
                shape(smooth([520, 270, 680, 240, 840, 290, 830, 370, 700, 400, 540, 380, 510, 330]))
            ],
            blocks: [
                block('bed', smooth([0, 0, 220, 0, 160, 90, 60, 150, 0, 170])),
                block('bed', smooth([960, 0, 960, 170, 900, 150, 800, 90, 740, 0]))
            ],
            rough: [r(0, 560, 300, 80), r(660, 560, 300, 80)]
        },
        {
            name: 'The Dogleg',
            blurb: 'Round the corner, and the corner has a bank board. Hit it firm along the top and let it turn you.',
            par: 3,
            /* A right-angled dogleg round a copse, with a board set across
               the outside corner at forty-five degrees. Two putts round the
               turn is par. One putt off the board is an ace: a cushion keeps
               less than it is given, so the board turns a ball sent along the
               top down the right side rather than straight back at you, and
               it wants a firm one. The bunker sits on the inside of the turn
               for the putt that cuts it. */
            tee: { x: 330, y: 110 },
            hole: { x: 905, y: 540 },
            blocks: [
                block('bed', smooth([0, 230, 560, 220, 690, 300, 700, 640, 0, 640])),
                block('bed', smooth([0, 0, 200, 0, 220, 90, 140, 190, 0, 200]))
            ],
            rails: [rail(790, 0, 960, 170, 26)],
            sand: [shape(smooth([720, 340, 800, 330, 830, 390, 790, 450, 730, 430]))]
        },
        {
            name: 'Pinball',
            blurb: 'A pinball table: a dome, two flippers and five posts. Something is going to hit something.',
            par: 3,
            /* The posts stood in a corridor once. They stand on a table now:
               a curved dome over the cup, two inlanes and the flipper rails
               down to the tee, and five posts between — the middle one on the
               straight line. Posts are livelier than wood, so the hole is
               about which of them you are willing to be near; and the dome
               brings back whatever goes over the top. */
            tee: { x: 480, y: 590 },
            hole: { x: 480, y: 140 },
            arcs: [arc(480, 300, 300, 180, 360, 24)],
            rails: [rail(180, 300, 180, 470, 24), rail(780, 300, 780, 470, 24), rail(180, 470, 330, 560, 24), rail(780, 470, 630, 560, 24)],
            bumpers: [post(380, 330, 26), post(580, 330, 26), post(480, 250, 26), post(300, 220, 22), post(660, 220, 22)],
            blocks: [
                block('bed', smooth([0, 640, 0, 380, 120, 470, 230, 640])),
                block('bed', smooth([960, 640, 960, 380, 840, 470, 730, 640]))
            ]
        },
        {
            name: 'Bank Shot',
            blurb: 'A hedge sits on the straight line. Bank it off the curve over the top, or go round.',
            par: 3,
            /* Nothing goes in off the straight line: a clipped hedge, cut as
               a diamond, stands square on it. Over it hangs a curved timber
               rail, and a ball sent up at the rail comes off it and down onto
               the green — each point of a curve is a cushion at a different
               angle, so where you hit it is the line you get. Round the
               bottom of the hedge is the long, safe way. */
            tee: { x: 200, y: 440 },
            hole: { x: 760, y: 440 },
            blocks: [block('hedge', [480, 260, 610, 430, 480, 600, 350, 430])],
            arcs: [arc(480, 430, 290, 220, 320, 24)],
            rough: [r(0, 610, 960, 30)]
        },
        mirror({
            name: 'Sliding Doors',
            blurb: 'Two doorways, and the doors linger shut. Watch them run along their tracks; go when you see daylight.',
            par: 4,
            /* A door is anchored so that the shut position is one end of its
               travel, not the middle of it. A sine spends most of its time
               near the extremes, so a door parked mid-swing over its doorway
               would be open almost always and the gate would be scenery; hung
               this way it closes, dwells, and opens again. Each runs in a
               track sunk in the grass under its whole travel, so a door is
               known for one before it is ever seen to move. */
            tee: { x: 110, y: 320 },
            hole: { x: 890, y: 300 },
            walls: [
                r(400, 0, 26, 240), r(400, 400, 26, 240),
                { x: 270, y: 250, w: 26, h: 140, move: { axis: 'x', amp: 130, speed: 1.25, phase: -Math.PI / 2 } },
                r(700, 0, 26, 200), r(700, 360, 26, 280),
                { x: 550, y: 210, w: 26, h: 140, move: { axis: 'x', amp: 150, speed: 1.7, phase: -Math.PI / 2 } }
            ],
            blocks: [
                block('bed', smooth([960, 0, 780, 0, 820, 90, 960, 140])),
                block('bed', smooth([960, 640, 960, 470, 840, 520, 770, 640]))
            ]
        }),
        {
            name: 'The Keep',
            blurb: 'A round keep with its one door facing away. Go past it and come back in.',
            par: 4,
            /* A tower whose door is on the side you cannot come at directly.
               The two posts outside the door are not there to block it —
               they line the approach up, so a ball brought back off the
               right-hand side is turned in rather than merely passing by.
               Round walls do not stop a ball the way square ones do: it
               runs on round them, which is what makes the long way round
               shorter than it looks. */
            tee: { x: 90, y: 560 },
            hole: { x: 480, y: 300 },
            arcs: [arc(480, 300, 130, -20, 290, 24)],
            bumpers: [post(690, 250, 22), post(690, 380, 22)],
            rough: [r(760, 0, 200, 160), r(760, 480, 200, 160)],
            blocks: [block('bed', smooth([0, 0, 220, 0, 160, 100, 0, 160]))]
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
               doorway open when it does. Shut, it stops 18px short of the
               lower wall rather than 10: a ball caught in a crack narrower
               than itself would be pinned there between the two. */
            tee: { x: 110, y: 540 },
            hole: { x: 880, y: 180 },
            walls: [
                r(460, 0, 26, 240), r(460, 460, 26, 180),     // the doorway, y 240-460
                { x: 460, y: 145, w: 26, h: 200, move: { axis: 'y', amp: 97, speed: 1.2, phase: Math.PI / 2 } }
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

    /* ── Harvest Wind — the autumn farm ─────────────────────────────────

       The card of the air. Every hole has a wind on it, and every wind
       blows out of a fan standing at its head — a force with no cause in
       sight reads as the game cheating, a fan with leaves streaming out of
       it does not. A wind is a slope to the ball, so the trick is the one a
       breaking green asks: aim into it and let it bring the ball round. But
       a wind also brings a ball up to its own pace, whatever pace it came
       in with, and that is the other half of the card — a ball that rides a
       wind arrives at the speed the wind chose. */

    var HARVEST = [
        {
            name: 'Crosswind',
            blurb: 'A fan blows straight across the fairway. Aim upwind of the flag and let it bring you round.',
            par: 3,
            /* The terms, stated once: one lane of wind across the middle of
               the field, blowing down from a fan at the top. A straight putt
               drifts below the flag; one aimed above it comes down onto it. */
            tee: { x: 110, y: 320 },
            hole: { x: 850, y: 320 },
            blocks: [
                block('fan', [400, 0, 560, 0, 560, 70, 400, 70]),
                block('bed', smooth([0, 640, 0, 500, 120, 540, 190, 640])),
                block('bed', smooth([960, 640, 760, 640, 820, 560, 960, 520]))
            ],
            slopes: [{ x: 400, y: 80, w: 160, h: 400, ax: 0, ay: 150, wind: true }],
            rough: [r(380, 560, 200, 80)]
        },
        {
            name: 'Tailwind',
            blurb: 'Two lanes past the hedge: one wind with you, one against. The quick one ends at the duck pond.',
            par: 3,
            /* A hedge splits the field into two lanes, each with a fan at
               its head blowing opposite ways. The bottom lane is the straight
               line and the wind is in your face; the top one is round the
               hedge's end and the wind carries you — up to its own pace, so
               the ace is a ball that rides it and still has a little of its
               own to spare. The pond behind the flag is for one with too
               much. */
            tee: { x: 110, y: 450 },
            hole: { x: 850, y: 190 },
            blocks: [
                block('hedge', smooth([200, 290, 780, 290, 780, 350, 200, 350], 0)),
                block('fan', [0, 120, 80, 120, 80, 260, 0, 260]),
                block('fan', [880, 380, 960, 380, 960, 520, 880, 520])
            ],
            slopes: [
                { x: 90, y: 110, w: 585, h: 160, ax: 145, ay: 0, wind: true },
                { x: 230, y: 370, w: 640, h: 160, ax: -120, ay: 0, wind: true }
            ],
            water: [shape(smooth([900, 60, 960, 40, 960, 300, 920, 300], 0))]
        },
        {
            name: 'The Barn',
            blurb: 'Round the barn, and the wind up its far side blows you to the flag. Mind the pumpkins.',
            par: 3,
            /* A barn in the middle of the yard and a fan behind it blowing up
               its far side: the way round to the right is a lift to the flag,
               the way round to the left is not. Two pumpkins sit where a ball
               that goes wide wants to be. */
            tee: { x: 120, y: 540 },
            hole: { x: 840, y: 120 },
            blocks: [
                block('hut', smooth([400, 230, 560, 230, 560, 410, 400, 410], 0)),
                block('fan', [620, 565, 780, 565, 780, 640, 620, 640])
            ],
            slopes: [{ x: 600, y: 160, w: 200, h: 390, ax: 0, ay: -130, wind: true }],
            bumpers: [post(250, 300, 22), post(530, 500, 22)]
        },
        {
            name: 'Leaf Blower',
            blurb: 'Two fans, two winds, and a corner to be blown round. Let the second one bring you down to the flag.',
            par: 3,
            /* A bed of pumpkins in the middle and two winds at right angles
               round it: one blowing along the top towards the corner, one down
               the right side to the flag. Strung together they turn a ball
               through a corner it was never aimed round — the shot is the one
               that reaches the second wind at the right pace. */
            tee: { x: 120, y: 120 },
            hole: { x: 790, y: 520 },
            blocks: [
                block('bed', smooth([300, 260, 560, 240, 640, 360, 560, 420, 320, 420], 1)),
                block('fan', [0, 330, 70, 330, 70, 470, 0, 470]),
                block('fan', [700, 0, 860, 0, 860, 70, 700, 70])
            ],
            slopes: [
                { x: 80, y: 320, w: 220, h: 160, ax: 140, ay: 0, wind: true },
                { x: 690, y: 80, w: 180, h: 340, ax: 0, ay: 120, wind: true }
            ]
        },
        {
            name: 'Pumpkin Patch',
            blurb: 'Up the field through two winds blowing opposite ways, past three pumpkins.',
            par: 4,
            /* Played up the field across two lanes of wind going opposite
               ways, so a ball that crosses both is pushed one way and then
               back: aimed square, the two nearly cancel; aimed off, one wins.
               Each wind runs out onto open grass, never into the fan of the
               other — a wind that blew a ball into a wall would never let it
               stop. */
            tee: { x: 480, y: 600 },
            hole: { x: 480, y: 70 },
            blocks: [block('fan', [0, 290, 70, 290, 70, 430, 0, 430]), block('fan', [890, 110, 960, 110, 960, 250, 890, 250])],
            slopes: [
                { x: 80, y: 300, w: 620, h: 120, ax: 140, ay: 0, wind: true },
                { x: 260, y: 120, w: 620, h: 120, ax: -140, ay: 0, wind: true }
            ],
            bumpers: [post(300, 480, 24), post(660, 480, 24), post(480, 420, 24)]
        },
        {
            name: 'Windmill Hill',
            blurb: 'A windmill with a door through it, a wind along the top and a hill by the flag.',
            par: 4,
            /* The card's close: the mill stands across the line with a
               tunnel through it from door to door, a wind blows along the top
               of the field from a fan at the left, and a mound by the flag
               sheds what comes in too wide. The straight way is through the
               mill; the windy way is over the top and round. */
            tee: { x: 100, y: 560 },
            hole: { x: 850, y: 300 },
            blocks: [block('windmill', oval(480, 300, 56, 56, 20)), block('fan', [0, 60, 70, 60, 70, 200, 0, 200])],
            hills: [mound(700, 470, 110, 150)],
            slopes: [{ x: 80, y: 50, w: 560, h: 160, ax: 140, ay: 0, wind: true }],
            tunnels: [tunnel(350, 300, 615, 300)]
        }
    ];

    /* ── The Dunes — the desert ────────────────────────────────────────

       The card of the ground's shape. Every hole is built of hills: dunes
       you curve a putt round, a saddle between two of them, sinkholes that
       gather whatever stops short in them, and an oasis at the bottom of a
       bowl that drinks anything that drifts too near. The Wild Six's slopes
       tip one way; a dune tips every way at once, so its shoulder is a
       curve to aim with and its top is a line that only a firm ball holds. */

    var DUNES = [
        {
            name: 'Saddle',
            blurb: 'Two dunes either side of the line and a saddle between them. Straight through it.',
            par: 3,
            /* The terms: a dune sheds a ball off whichever side it meets.
               Two side by side leave a saddle on the straight line, and the
               saddle is a channel — a putt down it is held there by both
               dunes, so the ace is the putt with the right weight. Over the
               shoulder of either is the long way round. */
            tee: { x: 110, y: 330 },
            hole: { x: 850, y: 300 },
            hills: [mound(470, 160, 130, 180), mound(470, 480, 130, 180)],
            blocks: [
                block('rock', smooth([960, 0, 960, 150, 880, 110, 820, 0])),
                block('rock', smooth([0, 640, 0, 520, 100, 560, 140, 640]))
            ]
        },
        {
            name: 'Sinkhole',
            blurb: 'A sinkhole on the line. Carry it with pace, or climb out of it if you come up short.',
            par: 3,
            /* A bowl is a dune turned inside out: whatever stops in it rolls
               to the bottom and waits there, and the putt out is uphill both
               ways. Straight up the field crosses it — a bowl gives back on
               the way out what it took on the way in, so a putt with enough
               pace carries on to the flag as if it were not there. Cacti
               stand either side for anybody going round. */
            tee: { x: 480, y: 590 },
            hole: { x: 480, y: 90 },
            hills: [bowl(480, 330, 150, 130)],
            blocks: [
                block('rock', smooth([0, 0, 220, 0, 160, 120, 0, 180])),
                block('rock', smooth([960, 0, 960, 180, 800, 120, 740, 0]))
            ],
            bumpers: [post(300, 200, 20), post(660, 200, 20)]
        },
        {
            name: 'Oasis',
            blurb: 'The oasis lies at the bottom of a hollow. Skirt the rim and let the slope curve you round — not in.',
            par: 3,
            /* Water at the bottom of a bowl: anything that strays onto the
               slope is drawn down to it. The straight line runs over the
               pond; the safe line goes wide of the whole hollow. The ace is
               between — a putt along the rim, close enough that the slope
               bends it round towards the flag and far enough that it does
               not take it. */
            tee: { x: 120, y: 520 },
            hole: { x: 840, y: 170 },
            hills: [bowl(470, 330, 170, 110)],
            water: [shape(oval(470, 330, 62, 50, 18))],
            blocks: [block('tree', oval(110, 110, 42, 40, 12)), block('tree', oval(860, 540, 46, 42, 12))]
        },
        {
            name: 'Mesa',
            blurb: 'Two mesas and a canyon between them. Round the dune and down the canyon.',
            par: 3,
            /* Two flat-topped rocks stand between the tee and the flag, and a
               dune at the canyon's mouth shoulders the ball either way. It is
               the card's two-shot hole: one to the canyon, one down it, and a
               bunker for the second that runs on too far. */
            tee: { x: 110, y: 120 },
            hole: { x: 860, y: 520 },
            blocks: [
                block('rock', smooth([300, 160, 500, 120, 560, 260, 470, 380, 320, 330], 2)),
                block('rock', smooth([560, 420, 720, 380, 800, 470, 700, 560, 580, 540], 2))
            ],
            hills: [mound(200, 470, 110, 140)],
            sand: [shape(smooth([800, 300, 900, 290, 930, 360, 880, 400, 810, 380], 1))]
        },
        {
            name: 'Pyramid',
            blurb: 'A pyramid on the straight line. Bank off a face, and mind the dunes either side.',
            par: 4,
            /* The pyramid's four faces are four cushions set at forty-five
               degrees, so a putt that meets one comes off it at a right angle
               — the ace banks off a face onto the green behind. Dunes stand
               off its top and bottom corners for the ball that goes round,
               and the cup sits between two drifts of soft sand. */
            tee: { x: 110, y: 320 },
            hole: { x: 850, y: 320 },
            blocks: [block('pyramid', [480, 190, 610, 320, 480, 450, 350, 320])],
            hills: [mound(480, 80, 70, 120), mound(480, 560, 70, 120), bowl(850, 320, 70, 35)],
            sand: [
                shape(smooth([700, 170, 780, 150, 820, 200, 760, 240, 700, 220], 1)),
                shape(smooth([700, 420, 780, 400, 820, 450, 760, 490, 700, 470], 1))
            ]
        },
        {
            name: 'Rolling Dunes',
            blurb: 'A whole field of dunes and a sinkhole on the way. Pick a valley and follow it.',
            par: 4,
            /* Everything the card has said, at once: five hills on the way
               to a flag in the far corner, mounds and one bowl, and the line
               between them a valley that winds. The straight line is over the
               tops; the putt that reads the valleys is shorter than it looks. */
            tee: { x: 100, y: 560 },
            hole: { x: 860, y: 90 },
            hills: [mound(280, 380, 120, 150), mound(500, 520, 100, 140), mound(560, 240, 130, 160), bowl(780, 420, 110, 90), mound(820, 220, 80, 120)],
            blocks: [block('rock', smooth([0, 0, 260, 0, 200, 110, 0, 160]))]
        }
    ];

    /* ── The Ice Run — the winter ──────────────────────────────────────

       The card of the curve. Its walls are bent, its floor is mostly ice,
       and the shots it asks for are rides: sent along the inside of a
       curve, a ball follows it round, and on ice it keeps its pace all the
       way. A ring with a bowl in it is a plughole; a hairpin is a ride round
       and back; the closing hole is a bobsleigh run of two hairpins, played
       in stages or — if you dare — in one. */

    var ICERUN = [
        {
            name: 'Plughole',
            blurb: 'A ring of ice-wall round a hollow. Get inside and it spirals you down to the cup.',
            par: 3,
            /* The card's open door: a ring with one gap and a bowl inside
               it, the cup at the bottom. A ball that gets in rides the wall
               round, and as it slows the hollow draws it inwards — round and
               round and down. Come in too hard and it rides round and out
               again by the door. */
            tee: { x: 860, y: 500 },
            hole: { x: 470, y: 300 },
            arcs: [arc(470, 300, 190, 95, 395, 24)],
            hills: [bowl(470, 300, 120, 42)],
            blocks: [block('bed', smooth([960, 0, 960, 260, 860, 230, 780, 120, 760, 0]))]
        },
        {
            name: 'Curling',
            blurb: 'A long sheet of ice to the house. Weight is everything, and two snowmen guard the button.',
            par: 3,
            /* Curling, near enough: a sheet of ice from the tee to a target
               dished round the cup, and snowbanks either side. Ice keeps three
               times the roll of grass, so the weight that reaches the house is
               a whisper; two snowmen stand guard in front of it. */
            tee: { x: 110, y: 320 },
            hole: { x: 820, y: 320 },
            ice: [shape(smooth([200, 230, 900, 230, 900, 410, 200, 410], 0))],
            hills: [bowl(820, 320, 75, 45)],
            bumpers: [post(640, 290, 20), post(660, 360, 20)],
            rough: [r(0, 0, 960, 120), r(0, 520, 960, 120)]
        },
        {
            name: 'Hairpin',
            blurb: 'Out along the bottom, round the hairpin, back along the top. Firm enough to ride it all the way.',
            par: 3,
            /* A snowbank down the middle and a semicircle of ice-wall at
               its end: the way to the flag is out, round and back, the whole
               of it iced. Two putts — to the turn, and home — is par. One is
               a ride: sent firmly along the bottom, the ball runs into the
               hairpin, follows it round and comes back along the top. */
            tee: { x: 120, y: 520 },
            hole: { x: 150, y: 120 },
            blocks: [block('bed', smooth([0, 270, 560, 260, 640, 300, 640, 340, 560, 380, 0, 370], 1))],
            arcs: [arc(690, 320, 270, -90, 90, 26)],
            ice: [shape([60, 400, 640, 400, 760, 320, 640, 240, 60, 240, 60, 40, 700, 40, 960, 320, 700, 600, 60, 600])]
        },
        {
            name: 'Ice Fishing',
            blurb: 'A frozen lake with fishing holes cut in it. Glide between them — and not too far.',
            par: 3,
            /* A sheet of ice with five holes cut through it, and two fishing
               huts. A ball on ice goes where it was sent, so the line between
               the holes is a line you have to choose before you strike —
               there is no correcting it on the way — and the weight has to
               stop it at the cup rather than in the snow beyond. */
            tee: { x: 110, y: 320 },
            hole: { x: 830, y: 330 },
            ice: [shape(smooth([200, 120, 560, 80, 900, 140, 900, 520, 560, 570, 200, 520], 1))],
            water: [
                shape(oval(380, 250, 26, 24, 14)), shape(oval(470, 400, 28, 26, 14)), shape(oval(580, 290, 26, 26, 14)),
                shape(oval(660, 450, 24, 24, 14)), shape(oval(700, 200, 26, 24, 14))
            ],
            blocks: [
                block('hut', smooth([300, 470, 360, 470, 360, 530, 300, 530], 0)),
                block('hut', smooth([600, 100, 660, 100, 660, 160, 600, 160], 0))
            ],
            rough: [r(920, 0, 40, 640)]
        },
        {
            name: 'The Chicane',
            blurb: 'Two bends, one each way, on a strip of ice. Thread the S.',
            par: 3,
            /* An S of two curved walls across a strip of ice: whichever bend
               the ball meets turns it, and the ice keeps it going into the
               other. The putt that threads both is the ace; one that meets
               only one is turned somewhere else entirely. */
            tee: { x: 110, y: 540 },
            hole: { x: 850, y: 110 },
            arcs: [arc(330, 330, 200, 0, 90, 24), arc(630, 330, 200, 180, 270, 24)],
            ice: [shape(smooth([200, 380, 760, 260, 760, 380, 200, 500], 0))],
            blocks: [
                block('rock', smooth([0, 0, 260, 0, 200, 120, 0, 200])),
                block('rock', smooth([960, 640, 700, 640, 760, 520, 960, 440]))
            ]
        },
        {
            name: 'Bobsleigh',
            blurb: 'A bobsleigh run: two hairpins down the mountain, all of it ice. Three runs, or one heroic one.',
            par: 4,
            /* The card's close: out along the top, round a hairpin, back
               along the middle, round another and down to the flag, every
               inch iced. Played a leg at a time it is three putts and par;
               the ball that rides both hairpins in one go needs every bit of
               a full swing. */
            tee: { x: 100, y: 100 },
            hole: { x: 860, y: 540 },
            blocks: [
                block('bed', smooth([0, 190, 700, 190, 760, 220, 760, 230, 700, 260, 0, 260], 0)),
                block('bed', smooth([960, 380, 260, 380, 200, 410, 200, 420, 260, 450, 960, 450], 0))
            ],
            arcs: [arc(760, 225, 160, -90, 90, 26), arc(200, 415, 160, 90, 270, 26)],
            ice: [shape([0, 0, 960, 0, 960, 640, 0, 640])]
        }
    ];

    /* ── Midnight Funfair — the night ──────────────────────────────────

       Crazy golf, after dark, and the card of things that move by
       themselves. A spinner is a turnstile laid flat whose arms bat the
       ball on as they come round; a belt is ground that runs and carries
       the ball at its own pace. Neither waits for you, and neither can keep
       you: the rule book clears every sweep of anything an arm could crush
       a ball against, and runs every belt out onto open grass. The big top,
       the carousel, the big wheel and the hall of mirrors are what a fair
       has; here they are things to putt round and bank off. */

    var FUNFAIR = [
        {
            name: 'Turnstile',
            blurb: 'A turnstile on the straight line between the big top and the carousel. Go when the arms are clear.',
            par: 3,
            /* The terms: one spinner, two arms, a slow turn, and the straight
               line through the middle of it. A putt timed to pass between
               the arms is an ace; one that meets an arm is batted somewhere
               of the arm's choosing. The lane round the top of the sweep is
               there, narrow, for anybody who would rather not. */
            tee: { x: 110, y: 320 },
            hole: { x: 850, y: 320 },
            spinners: [spinner(480, 320, 100, 2, 1.0, 0, 22)],
            blocks: [
                block('tent', oval(480, 85, 130, 70, 24)),
                block('carousel', oval(480, 555, 130, 70, 24)),
                block('bed', smooth([0, 0, 200, 0, 150, 80, 0, 130])),
                block('bed', smooth([0, 640, 0, 510, 150, 560, 200, 640]))
            ]
        },
        {
            name: 'Travelator',
            blurb: 'Two belts either side of the hedge: one runs your way, one runs back. Ride the right one.',
            par: 3,
            /* The two belts run opposite ways, one each side of a hedge.
               Along the bottom is the straight way and the belt fights you
               all of it; up round the hedge's end, the top belt carries you to
               the flag — and a ball crossing a belt at an angle is dragged
               along it, so a putt that meets it slantwise is bent. */
            tee: { x: 120, y: 545 },
            hole: { x: 860, y: 130 },
            blocks: [block('hedge', smooth([200, 290, 770, 280, 780, 360, 210, 370], 1))],
            belts: [belt(230, 100, 470, 70, 'right', 170), belt(260, 460, 470, 70, 'left', 150)]
        },
        {
            name: 'Big Wheel',
            blurb: 'The big wheel stands on the line, and a turnstile guards each way round it.',
            par: 3,
            /* The wheel's platform blocks the straight line, and each way
               round it goes through a spinner, the two turning opposite ways.
               The wheel turns overhead and goes thin when the ball rolls
               under it. */
            tee: { x: 110, y: 320 },
            hole: { x: 840, y: 320 },
            blocks: [block('wheel', oval(480, 320, 72, 62, 24))],
            spinners: [spinner(480, 120, 62, 2, 1.1, 0, 20), spinner(480, 520, 62, 2, -1.1, 0, 20)]
        },
        {
            name: 'Hall of Mirrors',
            blurb: 'Mirrors at every angle and the flag behind them. Every line is a bank shot.',
            par: 3,
            /* Five mirrors, three of them on the slant, and nothing on the
               straight line but glass. A mirror is a cushion like any other,
               so the hole is a bank shot — or two — and there are more ways
               in than there look. */
            tee: { x: 120, y: 540 },
            hole: { x: 820, y: 150 },
            blocks: [
                block('mirror', [330, 340, 460, 210, 474, 224, 344, 354]),
                block('mirror', [560, 480, 690, 350, 704, 364, 574, 494]),
                block('mirror', [600, 30, 760, 30, 760, 44, 600, 44]),
                block('mirror', [700, 270, 880, 270, 880, 284, 700, 284]),
                block('mirror', [60, 200, 74, 200, 74, 380, 60, 380])
            ],
            bumpers: [post(300, 130, 22), post(560, 580, 22)]
        },
        {
            name: 'Big Top',
            blurb: 'The ring has one way in, and a belt that runs straight at it.',
            par: 3,
            /* The cup is in the circus ring, and the ring's door faces the
               end of a belt. A ball laid on the belt is carried to the door at
               the belt's own pace — the ace is a putt onto the belt on a line
               that the belt then carries through the door. */
            tee: { x: 110, y: 120 },
            hole: { x: 760, y: 400 },
            arcs: [arc(760, 400, 115, 210, 510, 22)],
            belts: [belt(160, 290, 380, 70, 'right', 150)],
            blocks: [block('tent', oval(330, 540, 110, 70, 24))]
        },
        {
            name: 'Grand Finale',
            blurb: 'A belt, a turnstile, a curve and two posts on the way to the flag. The whole fair at once.',
            par: 4,
            /* Everything the fair has, in one hole: a belt to ride, a
               three-armed turnstile to time, a curved wall that turns the ball
               up to the flag, and two posts to stay off. Par is a belt and a
               curve and a putt; the ace rides the lot. */
            tee: { x: 100, y: 560 },
            hole: { x: 860, y: 100 },
            belts: [belt(200, 380, 300, 70, 'right', 160)],
            spinners: [spinner(700, 470, 80, 3, 1.2, 0, 20)],
            arcs: [arc(660, 160, 150, 90, 250, 22)],
            bumpers: [post(420, 180, 24), post(300, 260, 24)],
            blocks: [block('carousel', oval(160, 140, 100, 90, 24))]
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
            blurb: 'Six short holes through every place the game goes — and an ace on every one, if you look.',
            // Where a first visit is pointed. Par two or three all the way
            // round, every hole visible from the tee, and each in a biome
            // of its own: the tutorial that does not say it is one.
            starter: true,
            holes: SHORT
        },
        {
            id: 'links',
            theme: 'parkland',
            name: 'The Old Course',
            blurb: 'Corners, cushions, posts and doors — the classics, with the angles to bank off.',
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
            id: 'harvest',
            theme: 'autumn',
            name: 'Harvest Wind',
            blurb: 'A farm where the fans blow the ball about. Aim into the wind.',
            unlock: 16,
            holes: HARVEST
        },
        {
            id: 'wild',
            theme: 'woodland',
            name: 'The Wild Six',
            blurb: 'Hills that break, bars that sweep and a green that sheds everything.',
            unlock: 22,
            holes: WILD
        },
        {
            id: 'dunes',
            theme: 'desert',
            name: 'The Dunes',
            blurb: 'Dunes to curve round, sinkholes to stay out of, and an oasis that drinks.',
            unlock: 28,
            holes: DUNES
        },
        {
            id: 'warren',
            theme: 'meadow',
            name: 'The Warren',
            blurb: 'Six holes riddled with tunnels. Go in one, come out another.',
            unlock: 34,
            holes: WARREN
        },
        {
            id: 'icerun',
            theme: 'winter',
            name: 'The Ice Run',
            blurb: 'Banked curves on ice. Hit it firm and ride the turns.',
            unlock: 40,
            holes: ICERUN
        },
        {
            id: 'alpine',
            theme: 'alpine',
            name: 'Avalanche Pass',
            blurb: 'Ice, crevasses and chutes that slide on a clock. Wait for the gap.',
            unlock: 46,
            holes: ALPINE
        },
        {
            id: 'funfair',
            theme: 'night',
            name: 'Midnight Funfair',
            blurb: 'Turnstiles, travelators, a big wheel and a hall of mirrors, after dark.',
            unlock: 52,
            holes: FUNFAIR
        },
        {
            id: 'ember',
            theme: 'volcanic',
            name: 'Ember Ridge',
            blurb: 'Lava nothing skips across, and geysers that throw you over it if you time them.',
            unlock: 58,
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
                        'lava', 'avalanches', 'vents', 'arcs', 'blocks', 'hills', 'spinners', 'belts'];
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
