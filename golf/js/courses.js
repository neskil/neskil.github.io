/* Eighteen holes.

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
     ice      almost no friction — about four times the roll of grass. The
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
   of this file fills in the empty arrays so physics.js and render.js never
   have to ask whether a list exists. */
(function (GOLF) {
    'use strict';

    function r(x, y, w, h) { return { x: x, y: y, w: w, h: h }; }
    function post(x, y, rad) { return { x: x, y: y, r: rad }; }

    GOLF.COURSE = [
        /* ── the front nine: one idea per hole ──────────────────────────── */
        {
            name: 'Opening Drive',
            blurb: 'Straight through the gate. No excuses.',
            par: 2,
            tee: { x: 140, y: 320 },
            hole: { x: 820, y: 320 },
            walls: [r(450, 110, 24, 130), r(450, 400, 24, 130)]
        },
        {
            name: 'The Dogleg',
            blurb: 'Round the corner, and the bunker on the turn is bigger than it looks.',
            par: 3,
            tee: { x: 140, y: 530 },
            hole: { x: 830, y: 130 },
            walls: [r(300, 0, 240, 430)],
            sand: [r(540, 440, 220, 200)]
        },
        {
            name: 'Bunker Hill',
            blurb: 'Go the long way round, or take your chances in the sand.',
            par: 3,
            tee: { x: 110, y: 320 },
            hole: { x: 860, y: 320 },
            walls: [r(400, 0, 24, 110), r(400, 530, 24, 110)],
            sand: [r(400, 130, 230, 380)]
        },
        {
            name: 'The Narrows',
            blurb: 'A hundred and ten pixels of dry land. Good luck.',
            par: 3,
            tee: { x: 110, y: 320 },
            hole: { x: 855, y: 320 },
            water: [r(300, 0, 370, 265), r(300, 375, 370, 265)]
        },
        {
            name: 'Bank Shot',
            blurb: 'Nothing goes in off the straight line. Use the cushions.',
            par: 3,
            tee: { x: 140, y: 490 },
            hole: { x: 840, y: 500 },
            walls: [r(400, 300, 24, 340), r(700, 0, 24, 300)]
        },
        {
            name: 'Traffic',
            blurb: 'Two gates, two rhythms, and neither of them is waiting.',
            par: 3,
            tee: { x: 110, y: 320 },
            hole: { x: 870, y: 320 },
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
            tee: { x: 110, y: 320 },
            hole: { x: 800, y: 320 },
            water: [r(880, 0, 80, 640)],
            ice: [r(320, 90, 340, 460)]
        },
        {
            name: 'Pinball',
            blurb: 'Eight posts and no straight line. Something is going to hit something.',
            par: 3,
            tee: { x: 100, y: 320 },
            hole: { x: 870, y: 320 },
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
            tee: { x: 100, y: 320 },
            hole: { x: 890, y: 320 },
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

    /* Fill in what a hole did not bother to declare. Hole data reads better
       when it lists only the hazards it uses, and every consumer downstream
       gets to loop without a guard. */
    GOLF.COURSE.forEach(function (h) {
        ['walls', 'water', 'sand', 'ice', 'bumpers', 'slopes'].forEach(function (key) {
            if (!h[key]) h[key] = [];
        });
    });

    GOLF.coursePar = function () {
        return GOLF.COURSE.reduce(function (t, h) { return t + h.par; }, 0);
    };

})(window.GOLF);
