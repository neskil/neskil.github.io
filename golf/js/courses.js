/* The eighteen— no, nine. Nine holes.

   A hole is pure data: axis-aligned rectangles and two points. That is a
   deliberate limit. Circle-vs-AABB is the one collision test that is cheap
   enough to run at 24 substeps and simple enough to be provably correct, so
   the whole course vocabulary is built from boxes and the interesting shapes
   (doglegs, corridors, islands) come from how they are arranged rather than
   from fancier geometry.

     walls   solid, bounces. Give one a `move` and it oscillates on a sine.
     water   center of the ball inside -> splash, one penalty stroke, replay
             the shot from where it was taken.
     sand    heavy friction while the ball's center is inside.
     slopes  constant acceleration while the ball's center is inside, which is
             how a breaking green is faked in a top-down game.

   Every rectangle is at least 20px thick. The substepping in physics.js caps
   ball travel at half a radius (~3.75px) per step, so nothing can tunnel
   through a wall built to that minimum. Thinner walls would be a bug, and
   tests.html asserts the rule rather than trusting anyone to remember it. */
(function (GOLF) {
    'use strict';

    function r(x, y, w, h) { return { x: x, y: y, w: w, h: h }; }

    GOLF.COURSE = [
        {
            name: 'Opening Drive',
            blurb: 'Straight through the gate. No excuses.',
            par: 2,
            tee: { x: 140, y: 320 },
            hole: { x: 820, y: 320 },
            walls: [r(450, 110, 24, 130), r(450, 400, 24, 130)],
            water: [], sand: [], slopes: []
        },
        {
            name: 'The Dogleg',
            blurb: 'Round the corner, and mind the bunker on the turn.',
            par: 3,
            tee: { x: 140, y: 530 },
            hole: { x: 830, y: 130 },
            walls: [r(300, 0, 240, 430)],
            water: [],
            sand: [r(560, 450, 150, 130)],
            slopes: []
        },
        {
            name: 'Bunker Hill',
            blurb: 'Go the long way round, or take your chances in the sand.',
            par: 3,
            tee: { x: 110, y: 320 },
            hole: { x: 860, y: 320 },
            walls: [r(400, 0, 24, 110), r(400, 530, 24, 110)],
            water: [],
            sand: [r(400, 130, 180, 380)],
            slopes: []
        },
        {
            name: 'The Narrows',
            blurb: 'A hundred and forty pixels of dry land. Good luck.',
            par: 3,
            tee: { x: 110, y: 320 },
            hole: { x: 855, y: 320 },
            walls: [],
            water: [r(300, 0, 370, 250), r(300, 390, 370, 250)],
            sand: [], slopes: []
        },
        {
            name: 'Bank Shot',
            blurb: 'Nothing goes in off the straight line. Use the cushions.',
            par: 3,
            tee: { x: 140, y: 490 },
            hole: { x: 840, y: 500 },
            walls: [r(400, 300, 24, 340), r(700, 0, 24, 300)],
            water: [], sand: [],
            slopes: []
        },
        {
            name: 'Traffic',
            blurb: 'Two gates, two rhythms. Wait for your window.',
            par: 3,
            tee: { x: 110, y: 320 },
            hole: { x: 870, y: 320 },
            walls: [
                { x: 400, y: 220, w: 26, h: 200, move: { axis: 'y', amp: 175, speed: 1.1, phase: 0 } },
                { x: 640, y: 220, w: 26, h: 200, move: { axis: 'y', amp: 175, speed: 1.45, phase: Math.PI / 2 } }
            ],
            water: [], sand: [], slopes: []
        },
        {
            name: 'The Break',
            blurb: 'The whole middle falls away south. Aim high and let it ride.',
            par: 3,
            tee: { x: 140, y: 545 },
            hole: { x: 840, y: 105 },
            walls: [],
            water: [r(330, 575, 300, 65)],
            sand: [],
            slopes: [{ x: 300, y: 0, w: 380, h: 640, ax: 0, ay: 250 }]
        },
        {
            name: 'Island Green',
            blurb: 'One causeway in. Overcook it and you are swimming.',
            par: 3,
            tee: { x: 130, y: 320 },
            hole: { x: 780, y: 320 },
            walls: [],
            water: [
                r(620, 180, 60, 80), r(620, 340, 60, 120),   // moat, with the gap at y 260-340
                r(620, 180, 300, 60), r(620, 400, 300, 60),  // top and bottom
                r(860, 180, 60, 280)                         // far bank
            ],
            sand: [], slopes: []
        },
        {
            name: 'The Finale',
            blurb: 'Everything this course knows how to do, in one hole.',
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
        }
    ];

    GOLF.coursePar = function () {
        return GOLF.COURSE.reduce(function (t, h) { return t + h.par; }, 0);
    };

})(window.GOLF);
