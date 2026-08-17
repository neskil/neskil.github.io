/* The Short Course — nine holes for the 3D mode.

   Laid out in metres, playing roughly north: the tee sits near z=0 and the pin
   is at +z, so an aim heading of 0 points straight down the hole. Holes run
   95-200m, which is a real short course: every one is reachable, and the
   interest is in what sits between you and the green rather than in raw length.

   A hole is again pure data, but the vocabulary is circles and bumps instead of
   boxes:

     bumps    gaussian hills and hollows. These *are* the terrain — a raised
              back to a green, a punchbowl, a plateau. Since the ball rolls on
              gravity along the real surface, every contour here is also the
              putting break; none of it is scripted.
     green    the putting surface. Fast.
     fairway  mown, rolls well. Everything outside is rough.
     sand     bunkers.
     water    ponds. Note surfaceAt() resolves water before green, so an island
              green is built as a *ring* of overlapping ponds around the green
              rather than one big pond with a green drawn on top.
     trees    solid cylinders. They block, and they hurt. */
(function (GOLF) {
    'use strict';

    function c(x, z, r) { return { x: x, z: z, r: r }; }
    function bump(x, z, r, h) { return { x: x, z: z, r: r, h: h }; }
    function tree(x, z, r, h) { return { x: x, z: z, r: r || 0.5, h: h || 7 }; }

    // A ring of ponds, for island greens and moats.
    function moat(cx, cz, radius, pondR, count) {
        var out = [];
        for (var i = 0; i < count; i++) {
            var a = (i / count) * Math.PI * 2;
            out.push(c(cx + Math.cos(a) * radius, cz + Math.sin(a) * radius, pondR));
        }
        return out;
    }

    // A line of trees, for tree belts down a dogleg.
    function belt(x0, z0, x1, z1, n, r, h) {
        var out = [];
        for (var i = 0; i < n; i++) {
            var t = n === 1 ? 0 : i / (n - 1);
            out.push(tree(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, r, h));
        }
        return out;
    }

    GOLF.COURSE3D = [
        {
            name: 'Opening Tee',
            blurb: 'Short and honest. The green falls back toward you — leave it below the hole.',
            par: 3,
            tee: { x: 0, z: 0 }, pin: { x: 0, z: 105 },
            bounds: { minX: -60, maxX: 60, minZ: -25, maxZ: 155 },
            baseY: 0, tilt: { ax: 0, az: 0 },
            bumps: [bump(0, 122, 22, 2.2)],
            green: c(0, 105, 15),
            fairway: [c(0, 45, 20), c(0, 78, 20)],
            sand: [c(-14, 92, 7)],
            water: [],
            trees: belt(-34, 40, -34, 96, 4).concat(belt(34, 40, 34, 96, 4))
        },
        {
            name: 'The Elbow',
            blurb: 'Dogleg right. Cut the corner over the trees, or lay up and take three.',
            par: 4,
            tee: { x: 0, z: 0 }, pin: { x: 42, z: 172 },
            bounds: { minX: -55, maxX: 100, minZ: -25, maxZ: 220 },
            baseY: 0, tilt: { ax: 0, az: 0 },
            bumps: [bump(42, 186, 20, 1.6), bump(10, 120, 26, -1.1)],
            green: c(42, 172, 14),
            fairway: [c(-2, 55, 19), c(4, 95, 20), c(22, 132, 20), c(38, 158, 17)],
            sand: [c(28, 160, 6.5), c(4, 108, 6)],
            water: [],
            trees: belt(26, 78, 34, 120, 7).concat(belt(44, 128, 62, 150, 4), belt(-26, 60, -26, 120, 5))
        },
        {
            name: 'Pond Crossing',
            blurb: 'All carry. Come up short and you are reloading from the drop zone.',
            par: 3,
            tee: { x: 0, z: 0 }, pin: { x: 2, z: 132 },
            bounds: { minX: -60, maxX: 60, minZ: -25, maxZ: 185 },
            baseY: 0, tilt: { ax: 0, az: 0 },
            bumps: [bump(0, 100, 26, -2.6), bump(6, 146, 18, 1.4)],
            green: c(2, 132, 15),
            fairway: [c(0, 45, 18)],
            sand: [c(18, 124, 6)],
            water: [c(0, 100, 20), c(-12, 104, 12), c(12, 104, 12)],
            trees: belt(-38, 60, -38, 130, 5).concat(belt(38, 60, 38, 130, 5))
        },
        {
            name: 'The Punchbowl',
            blurb: 'Anything on the mounds funnels down. Being roughly right is enough.',
            par: 3,
            tee: { x: 0, z: 0 }, pin: { x: 0, z: 96 },
            bounds: { minX: -55, maxX: 55, minZ: -25, maxZ: 145 },
            baseY: 0, tilt: { ax: 0, az: 0 },
            // A bowl, ringed by mounds that feed it.
            bumps: [
                bump(0, 96, 17, -3.4),
                bump(-22, 92, 13, 3.0), bump(22, 92, 13, 3.0),
                bump(0, 118, 15, 3.4), bump(-16, 74, 11, 2.0), bump(16, 74, 11, 2.0)
            ],
            green: c(0, 96, 15),
            fairway: [c(0, 48, 18), c(0, 72, 14)],
            sand: [],
            water: [],
            trees: belt(-36, 30, -36, 110, 5).concat(belt(36, 30, 36, 110, 5))
        },
        {
            name: 'Long Way Home',
            blurb: 'The longest hole here. Two good ones or three ordinary ones.',
            par: 4,
            tee: { x: 0, z: 0 }, pin: { x: -8, z: 205 },
            bounds: { minX: -65, maxX: 65, minZ: -25, maxZ: 255 },
            baseY: 0, tilt: { ax: 0, az: -0.012 },   // gently uphill all the way
            bumps: [bump(-8, 220, 20, 1.5), bump(20, 120, 30, 2.2)],
            green: c(-8, 205, 15),
            fairway: [c(0, 60, 20), c(6, 105, 20), c(0, 150, 20), c(-6, 185, 18)],
            sand: [c(-22, 128, 7), c(20, 152, 7), c(4, 196, 6)],
            water: [],
            trees: belt(-40, 50, -40, 190, 8).concat(belt(40, 50, 40, 190, 8))
        },
        {
            name: 'Plateau',
            blurb: 'The green sits up on a shelf. Short is dead, long is worse.',
            par: 3,
            tee: { x: 0, z: 0 }, pin: { x: 0, z: 122 },
            bounds: { minX: -55, maxX: 55, minZ: -25, maxZ: 175 },
            baseY: 0, tilt: { ax: 0, az: 0 },
            bumps: [bump(0, 122, 20, 5.2), bump(0, 150, 16, -2.0)],
            green: c(0, 122, 14),
            fairway: [c(0, 50, 18), c(0, 84, 16)],
            sand: [c(-16, 108, 6.5), c(16, 108, 6.5)],
            water: [],
            trees: belt(-34, 40, -34, 110, 5).concat(belt(34, 40, 34, 110, 5))
        },
        {
            name: 'Split Fairway',
            blurb: 'Left is short and tight, right is long and safe. Pick a side.',
            par: 4,
            tee: { x: 0, z: 0 }, pin: { x: -6, z: 186 },
            bounds: { minX: -70, maxX: 80, minZ: -25, maxZ: 235 },
            baseY: 0, tilt: { ax: 0, az: 0 },
            bumps: [bump(-6, 200, 20, 1.4), bump(0, 110, 22, 1.8)],
            green: c(-6, 186, 15),
            fairway: [c(-26, 105, 15), c(-20, 145, 16), c(26, 95, 18), c(22, 140, 18), c(2, 175, 16), c(0, 50, 18)],
            sand: [c(-10, 168, 7), c(12, 172, 6)],
            water: [],
            // The belt down the middle is what makes it a choice rather than a corridor.
            trees: belt(2, 88, 2, 158, 9).concat(belt(-48, 80, -48, 170, 6), belt(52, 70, 52, 165, 6))
        },
        {
            name: 'Island Green',
            blurb: 'One hundred and fifteen metres, and nowhere to miss. Trust the club.',
            par: 3,
            tee: { x: 0, z: 0 }, pin: { x: 0, z: 116 },
            bounds: { minX: -55, maxX: 55, minZ: -25, maxZ: 165 },
            baseY: 0, tilt: { ax: 0, az: 0 },
            bumps: [bump(0, 116, 30, -2.2), bump(0, 116, 15, 2.4)],
            green: c(0, 116, 13),
            fairway: [c(0, 45, 18)],
            sand: [],
            water: moat(0, 116, 21, 10, 12),
            trees: belt(-38, 40, -38, 120, 5).concat(belt(38, 40, 38, 120, 5))
        },
        {
            name: 'The Finish',
            blurb: 'Dogleg, water short, and a green that leans to the left. Good luck.',
            par: 4,
            tee: { x: 0, z: 0 }, pin: { x: -30, z: 190 },
            bounds: { minX: -80, maxX: 70, minZ: -25, maxZ: 240 },
            baseY: 0, tilt: { ax: 0, az: 0 },
            bumps: [bump(-38, 196, 22, 2.4), bump(-14, 150, 24, -1.8), bump(18, 90, 24, 1.6)],
            green: c(-30, 190, 15),
            fairway: [c(2, 55, 19), c(-2, 100, 19), c(-14, 140, 18), c(-26, 172, 16)],
            sand: [c(-16, 182, 7), c(-44, 178, 6)],
            water: [c(-8, 162, 11), c(-18, 158, 10)],
            trees: belt(-30, 70, -34, 120, 6).concat(belt(24, 120, 30, 170, 5))
        }
    ];

    GOLF.course3dPar = function () {
        return GOLF.COURSE3D.reduce(function (t, h) { return t + h.par; }, 0);
    };

    // Straight-line length of a hole, for the HUD and the scorecard.
    GOLF.holeLength = function (h) {
        return Math.round(Math.hypot(h.pin.x - h.tee.x, h.pin.z - h.tee.z));
    };

})(window.GOLF);
