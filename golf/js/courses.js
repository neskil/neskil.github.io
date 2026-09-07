/* Two courses, twenty-seven holes.

   `GOLF.COURSES` is the rack — each entry `{ id, name, blurb, holes }` — and
   `GOLF.COURSE` is whichever card is being played, which is what every
   consumer downstream reads. Only `GOLF.selectCourse` moves it, so nothing
   else in the codebase has to know there is more than one course.

   A hole is pure data: axis-aligned rectangles, a handful of circles and two
   points. That is a deliberate limit. Circle-vs-AABB and circle-vs-circle are
   the two collision tests cheap enough to run at 24 substeps and simple enough
   to be provably correct, so the whole course vocabulary is built from boxes
   and posts and the interesting shapes (doglegs, corridors, islands, mazes)
   come from how they are arranged rather than from fancier geometry.

     walls    solid, bounces. Give one a `move` and it oscillates on a sine,
              along `y` (a gate that rises and falls) or `x` (a sliding door).
     water    center of the ball inside -> splash, one penalty stroke, replay
              the shot from where it was taken.
     sand     heavy friction while the ball's center is inside.
     rough    half the roll of grass — shapes a fairway without walling it in.
     ice      almost no friction — close to three times the roll of grass. The
              ball goes where it was sent, not where it was aimed.
     bumpers  round posts, {x, y, r}. Bouncier than the cushions, and being
              round they answer a one-degree difference in approach with a
              thirty-degree difference in departure.
     slopes   constant acceleration while the ball's center is inside, which is
              how a breaking green is faked in a top-down game.

   Every rectangle is at least 20px thick and every bumper at least
   BUMPER_MIN_R across the radius. The substepping in physics.js caps ball
   travel at half a radius (~3.75px) per step, so nothing can tunnel through
   an obstacle built to those minimums. Thinner ones would be a bug, and
   tests.html asserts the rules rather than trusting anyone to remember them.

   A hole only lists the hazards it actually uses; the normaliser at the foot
   of this file fills in the empty arrays — for every course on the rack — so
   physics.js and render.js never have to ask whether a list exists. */
(function (GOLF) {
    'use strict';

    function r(x, y, w, h) { return { x: x, y: y, w: w, h: h }; }
    function post(x, y, rad) { return { x: x, y: y, r: rad }; }

    /* ── The Old Eighteen ───────────────────────────────────────────── */

    var LINKS = [
        /* ── the front nine: one idea per hole ──────────────────────────── */
        {
            name: 'Opening Drive',
            blurb: 'Straight through the gate. No excuses.',
            par: 2,
            tee: { x: 140, y: 320 },
            hole: { x: 820, y: 320 },
            walls: [r(450, 110, 24, 130), r(450, 400, 24, 130)],
            // Rough along both cushions, so hole one already teaches the
            // lesson the rest of the course examines: the bank shot is not
            // free, and the middle of the field is where the ball wants to be.
            rough: [r(0, 0, 960, 110), r(0, 530, 960, 110)]
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
        {
            name: 'Bunker Hill',
            blurb: 'Straight up through the sand, or thread one of the two side doors.',
            par: 3,
            /* The one hole played up the field rather than across it. Every
               other hole on the front nine reads left to right, which after a
               while stops being a course and starts being a corridor. */
            tee: { x: 480, y: 590 },
            hole: { x: 480, y: 70 },
            walls: [r(0, 300, 150, 26), r(810, 300, 150, 26)],
            sand: [r(210, 250, 540, 130)]
        },
        {
            name: 'The Narrows',
            blurb: 'Three landings, each a hundred and twenty pixels wide, each one step up.',
            par: 4,
            /* A straight channel is one shot, aimed once. A staircase is the
               same width of dry land and a different problem: the line that
               clears the first step is in the water at the second, so the
               distance has to be judged as well as the angle. */
            tee: { x: 140, y: 360 },
            hole: { x: 850, y: 200 },
            water: [
                r(280, 0, 220, 300), r(500, 0, 220, 220), r(720, 0, 240, 140),
                r(280, 420, 220, 220), r(500, 340, 220, 300), r(720, 260, 240, 380)
            ]
        },
        {
            name: 'Bank Shot',
            blurb: 'Nothing goes in off the straight line. Use the cushions.',
            par: 3,
            tee: { x: 140, y: 490 },
            hole: { x: 840, y: 500 },
            walls: [r(400, 300, 24, 340), r(700, 0, 24, 300)],
            rough: [r(700, 570, 260, 70)]
        },
        {
            name: 'Traffic',
            blurb: 'Two gates, two rhythms, and neither of them is waiting.',
            par: 3,
            tee: { x: 110, y: 520 },
            hole: { x: 870, y: 150 },
            walls: [
                { x: 400, y: 220, w: 26, h: 200, move: { axis: 'y', amp: 195, speed: 1.35, phase: 0 } },
                { x: 640, y: 220, w: 26, h: 200, move: { axis: 'y', amp: 195, speed: 1.8, phase: Math.PI / 2 } }
            ]
        },
        {
            name: 'The Break',
            blurb: 'The whole middle falls away south. Aim high and let it ride.',
            par: 3,
            tee: { x: 140, y: 545 },
            hole: { x: 840, y: 105 },
            /* The lake spans the foot of the slope exactly, and the slope stops
               at the shoreline rather than at the cushion. A slope that reaches
               a cushion is a trap: a ball pinned against it is still inside a
               slope zone, and the rest check excludes those, so it would rattle
               at the bottom for ever and never hand the hole back. */
            water: [r(300, 575, 380, 65)],
            slopes: [{ x: 300, y: 0, w: 380, h: 575, ax: 0, ay: 250 }]
        },
        {
            name: 'Island Green',
            blurb: 'One causeway in. Overcook it and you are swimming.',
            par: 3,
            tee: { x: 130, y: 320 },
            hole: { x: 780, y: 320 },
            water: [
                r(620, 180, 60, 80), r(620, 340, 60, 120),   // moat, with the gap at y 260-340
                r(620, 180, 300, 60), r(620, 400, 300, 60),  // top and bottom
                r(860, 180, 60, 280)                         // far bank
            ]
        },
        {
            name: 'The Turn',
            blurb: 'Everything the front nine knows how to do, in one hole.',
            par: 4,
            tee: { x: 110, y: 560 },
            hole: { x: 865, y: 95 },
            walls: [
                r(280, 260, 26, 380),
                { x: 570, y: 130, w: 26, h: 230, move: { axis: 'y', amp: 125, speed: 1.2, phase: 0.6 } }
            ],
            water: [r(650, 430, 230, 150)],
            sand: [r(340, 385, 190, 190)],
            slopes: [{ x: 700, y: 40, w: 260, h: 300, ax: -70, ay: 0 }]
        },

        /* ── the back nine: the same vocabulary, played straight at you ─── */
        {
            name: 'Cold Snap',
            blurb: 'The rink will not slow you down, and the far bank is a lake.',
            par: 3,
            tee: { x: 110, y: 540 },
            hole: { x: 790, y: 150 },
            water: [r(880, 0, 80, 640)],
            ice: [r(300, 80, 380, 470)]
        },
        {
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
        },
        {
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
        },
        {
            name: 'Black Ice',
            blurb: 'The ice runs out at the water. The bunker is the only brake you have.',
            par: 4,
            tee: { x: 120, y: 550 },
            hole: { x: 850, y: 120 },
            water: [r(300, 170, 330, 110)],
            sand: [r(700, 380, 190, 190)],
            ice: [r(250, 300, 420, 300)]
        },
        {
            name: 'The Gauntlet',
            blurb: 'Time the gate, then survive what is behind it.',
            par: 4,
            tee: { x: 100, y: 520 },
            hole: { x: 890, y: 190 },
            walls: [
                { x: 420, y: 200, w: 26, h: 220, move: { axis: 'y', amp: 180, speed: 1.5, phase: 0 } }
            ],
            sand: [r(520, 0, 120, 180), r(520, 460, 120, 180)],
            bumpers: [post(640, 240, 24), post(640, 400, 24), post(770, 320, 24)]
        },
        {
            name: 'Sisyphus',
            blurb: 'The middle runs back at you. Nothing you leave there stays there.',
            par: 4,
            tee: { x: 110, y: 320 },
            hole: { x: 850, y: 320 },
            sand: [r(880, 200, 80, 240)],
            slopes: [{ x: 300, y: 0, w: 420, h: 640, ax: -150, ay: 0 }]
        },
        {
            name: 'Bumper Pool',
            blurb: 'The cup sits in a pocket. There is one mouth, and it faces you.',
            par: 4,
            tee: { x: 110, y: 320 },
            hole: { x: 800, y: 320 },
            sand: [r(390, 240, 190, 160)],
            bumpers: [
                post(710, 258, 22), post(710, 382, 22),
                post(800, 212, 22), post(800, 428, 22),
                post(890, 258, 22), post(890, 382, 22)
            ]
        },
        {
            name: 'Switchback',
            blurb: 'Along the bottom, up the middle, and the corridor is iced.',
            par: 4,
            tee: { x: 110, y: 560 },
            hole: { x: 870, y: 110 },
            walls: [r(300, 0, 26, 470), r(600, 170, 26, 470)],
            sand: [r(650, 210, 160, 130)],
            rough: [r(640, 430, 320, 210)],
            ice: [r(340, 480, 240, 160)]
        },
        {
            name: 'The Reckoning',
            blurb: 'Ice, sand, water, a gate, two posts — and a last green that tilts toward the flag.',
            par: 5,
            tee: { x: 100, y: 580 },
            hole: { x: 880, y: 90 },
            walls: [
                r(300, 300, 26, 340),
                { x: 600, y: 140, w: 26, h: 240, move: { axis: 'y', amp: 130, speed: 1.35, phase: 0.4 } }
            ],
            water: [r(660, 430, 240, 140)],
            sand: [r(350, 380, 180, 180)],
            ice: [r(330, 60, 240, 200)],
            bumpers: [post(770, 270, 24), post(880, 340, 24)],
            slopes: [{ x: 660, y: 180, w: 300, h: 180, ax: 0, ay: -110 }]
        }
    ];

    /* ── The Wild Nine ──────────────────────────────────────────────────

       A second card on the same field, and no second vocabulary: every hole
       below is still boxes, posts and two points. What is new is what they
       are asked to do. The eighteen introduce one idea per hole and explain
       it; these nine assume the explanation and build something out of it —
       a room with its door on the far side, a lattice with no straight line
       through it, a green that sheds everything you put on it.

       One mechanic genuinely arrives here rather than being recombined: a
       moving wall does not only block, it *pushes* (physics.js adds the
       wall's own velocity along the contact normal, so a gate cannot swallow
       a resting ball). The eighteen use that only as a safety valve. Wiper
       Blades makes it the hole. */

    var WILD = [
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
        },
        {
            name: 'The Cascade',
            blurb: 'Twenty posts and no lane that runs all the way through. Played up the field.',
            par: 3,
            /* Pinball on the front nine is a corridor with posts in it. This
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
        {
            name: 'Saddleback',
            blurb: 'Two hills, back to back, breaking opposite ways. The straight line is not the line.',
            par: 3,
            /* The Break falls one way and asks you to aim above it. This asks
               the question twice in opposite directions, which is a different
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
        {
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
        },
        {
            name: 'Stepping Stones',
            blurb: 'Three bridges, none of them opposite each other, and the ground between the first two falls south.',
            par: 4,
            /* The Narrows is a staircase of dry land you cross once. This is
               three crossings that zigzag, and the run between the first and
               second of them tilts south while the second bridge is north.
               Aiming at that bridge misses it; aiming above it does not. */
            tee: { x: 80, y: 320 },
            hole: { x: 900, y: 320 },
            water: [
                r(220, 0, 120, 240), r(220, 360, 120, 280),   // bridge at y 240-360
                r(460, 0, 120, 140), r(460, 260, 120, 380),   // bridge at y 140-260
                r(700, 0, 120, 340), r(700, 460, 120, 180)    // bridge at y 340-460
            ],
            slopes: [{ x: 340, y: 60, w: 120, h: 440, ax: 0, ay: 120 }]
        },
        {
            name: 'Crown Green',
            blurb: 'The green sheds everything you leave on it. Only the cup itself holds.',
            par: 4,
            /* A crowned green, which every slope on the eighteen is the
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
        },
        {
            name: 'The Chute',
            blurb: 'A staircase down either side, narrowing to seventy pixels. Arrive too fast and it spits you back.',
            par: 3,
            /* Diagonals the vocabulary does not have, built as overlapping
               steps: each step laps 20px over the next, so there is no seam
               for the ball to slip through and the pockets between them
               cannot be reached from either side. The funnel is a wide target
               that does the aiming for you, which is the point — it hands the
               hole back to weight. Too hard and the ball comes off the far
               cushion and straight back out of the throat it came in by. */
            tee: { x: 100, y: 320 },
            hole: { x: 870, y: 320 },
            walls: [
                r(380, 60, 100, 24), r(460, 110, 100, 24), r(540, 160, 100, 24),
                r(620, 210, 100, 24), r(700, 260, 100, 24),
                r(380, 556, 100, 24), r(460, 506, 100, 24), r(540, 456, 100, 24),
                r(620, 406, 100, 24), r(700, 356, 100, 24)
            ],
            /* The shoulders outside the arms, stepped to match them. Going
               over the top is still allowed and is the whole choice the hole
               offers: the throat is the fast line and it has to be earned,
               the high road is free and costs a stroke's worth of roll. */
            rough: [
                r(0, 0, 380, 60), r(380, 0, 80, 60), r(460, 0, 80, 110),
                r(540, 0, 80, 160), r(620, 0, 80, 210), r(700, 0, 260, 260),
                r(0, 580, 380, 60), r(380, 580, 80, 60), r(460, 530, 80, 110),
                r(540, 480, 80, 160), r(620, 430, 80, 210), r(700, 380, 260, 260)
            ]
        },
        {
            name: 'Glass Slalom',
            blurb: 'Four fingers to weave, and the floor between them is ice.',
            par: 4,
            /* Switchback runs its corridor on ice for one leg. This ices the
               whole slalom, which changes what the fingers are for: on grass
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
            name: 'Last Orders',
            blurb: 'Ice, a lake, a bunker, a gate and two posts — and a last green that runs to the flag.',
            par: 5,
            /* The Reckoning closes the eighteen with one of everything. This
               closes the nine the same way and keeps its last trick: a green
               tilted at the cup, so the hole finishes by giving something
               back. The tilt stops 74px short of the gate's travel, which is
               the rule about slopes and walls — a ball the tilt pushes at a
               wall has to be out of the slope zone by the time it gets
               there, or it never comes to rest. */
            tee: { x: 90, y: 580 },
            hole: { x: 720, y: 130 },
            walls: [
                r(420, 0, 26, 240),
                { x: 640, y: 240, w: 26, h: 180, move: { axis: 'y', amp: 130, speed: 1.3, phase: 0.5 } }
            ],
            water: [r(300, 380, 260, 120)],
            sand: [r(600, 460, 240, 140)],
            ice: [r(120, 120, 240, 220)],
            bumpers: [post(520, 180, 24), post(830, 300, 24)],
            slopes: [{ x: 740, y: 40, w: 220, h: 180, ax: -90, ay: 0 }]
        }
    ];

    /* Two cards on one field. `GOLF.COURSE` is whichever one is being played
       — the classic eighteen unless something says otherwise — and every
       consumer downstream keeps reading exactly that, so a course is chosen
       in one place and nowhere else has to know there is a choice. */
    GOLF.COURSES = [
        {
            id: 'links',
            name: 'The Old Eighteen',
            blurb: 'One idea per hole, and then all of them at once.',
            holes: LINKS
        },
        {
            id: 'wild',
            name: 'The Wild Nine',
            blurb: 'Nine holes that assume you have played the eighteen.',
            holes: WILD
        }
    ];

    /* Fill in what a hole did not bother to declare. Hole data reads better
       when it lists only the hazards it uses, and every consumer downstream
       gets to loop without a guard. */
    GOLF.COURSES.forEach(function (c) {
        c.holes.forEach(function (h) {
            ['walls', 'water', 'sand', 'rough', 'ice', 'bumpers', 'slopes'].forEach(function (key) {
                if (!h[key]) h[key] = [];
            });
        });
    });

    GOLF.COURSE_ID = GOLF.COURSES[0].id;
    GOLF.COURSE = GOLF.COURSES[0].holes;

    /* Swap the card being played. Returns the course, or null for an id that
       is not on the rack — a stored preference from a course that has since
       been renamed should put you back on the eighteen, not break the boot. */
    GOLF.selectCourse = function (id) {
        for (var i = 0; i < GOLF.COURSES.length; i++) {
            if (GOLF.COURSES[i].id !== id) continue;
            GOLF.COURSE_ID = id;
            GOLF.COURSE = GOLF.COURSES[i].holes;
            return GOLF.COURSES[i];
        }
        return null;
    };

    GOLF.coursePar = function () {
        return GOLF.COURSE.reduce(function (t, h) { return t + h.par; }, 0);
    };

})(window.GOLF);
