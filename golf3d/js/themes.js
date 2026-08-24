/* What each course looks like, as data.

   A theme is a palette and nothing else: no geometry, no behaviour, no
   three.js. It is the file to open to change how a course *looks* without
   reading a line of the renderer, and the reason it is separate from
   render.js is that those are two different jobs — this one is picking
   colours, and it should not require scrolling past a cloud shader.

     sky        the gradient, top then bottom. The horizon stop is also what
                the water reflects.
     fog        where the ground plane fades to. Matched to the sky's bottom
                stop, or the join across the middle of the picture shows.
     sun        the light's colour; sunPos its direction, as an offset from
                the middle of the hole.
     ambient    the fill from the sky, and ambientI how much of it.
     grass      the two greens the mow bands run between.
     rail       the paint on the fences.
     surroundY  how far below the course the surrounding ground sits, and
                `surround` what it is made of: water, rock or floor.
     side       the earth colour on the cut face of a raised pad.

   Optional, and only where a course needs them:

     stars      how bright, on a course played after dark.
     cloudLum   scales the cloud colours, for the same reason.
     ground     tints the rock, so two rock courses are not the same place.
     floor      the same for a `floor` surround.
     birds      false to keep them out of the sky.

   The weather (weather.js) moves all of this around at run time; these are
   the numbers it starts from. */
(function (G3) {
    'use strict';

    G3.THEMES = {
        seaside: {
            sky: [0x3f93cf, 0xc9e8f7],
            fog: 0xc9e8f7,
            sun: 0xfff3dc, sunPos: [9, 16, 7], ambient: 0x9fd0ea, ambientI: 0.55,
            grass: ['#4fae54', '#43a04a'],
            rail: 0xf4f7f5,
            surroundY: -0.95, surround: 'water',
            water: 0x2079ab,
            side: '#a08a5f'
        },
        quarry: {
            sky: [0xcf9558, 0xf6e2c2],
            fog: 0xf6e2c2,
            sun: 0xffe6bd, sunPos: [-8, 15, 6], ambient: 0xd8b58e, ambientI: 0.6,
            grass: ['#6f9c4e', '#628f45'],
            rail: 0xc7ae8c,
            surroundY: -2.4, surround: 'rock',
            water: 0x2f7fa8,
            side: '#8d7355'
        },
        lagoon: {
            sky: [0x1f86c8, 0xbfe9f4],
            fog: 0xbfe9f4,
            sun: 0xfff7e6, sunPos: [7, 17, -6], ambient: 0x9adfe8, ambientI: 0.62,
            grass: ['#5cba62', '#4faa55'],
            rail: 0xfbf4e4,
            surroundY: -0.78, surround: 'water',
            water: 0x11a5c0,
            side: '#c9b287'
        },
        highland: {
            sky: [0x4d74ab, 0xd9e5f0],
            fog: 0xd9e5f0,
            sun: 0xffeccb, sunPos: [-8, 14, -7], ambient: 0xa6bcd4, ambientI: 0.5,
            grass: ['#4a9159', '#3f8149'],
            rail: 0x99a3ac,
            /* Moor, not quarry: the surround takes a tint of its own so the
               two rock courses do not read as the same place. It lands about
               twice as bright as it looks here once the sun, the hemisphere
               and the tone map have all had a go at it. */
            surroundY: -2.7, surround: 'rock', ground: '#454c3c',
            water: 0x2b6d8d,
            side: '#7d7566'
        },
        works: {
            sky: [0x0d121d, 0x33405e],
            fog: 0x33405e,
            sun: 0xffe0b0, sunPos: [6, 14, -4], ambient: 0x5a6c94, ambientI: 0.75,
            grass: ['#2f7f5c', '#2a7355'],
            rail: 0xd9b36a,
            stars: 0.9,             // the one course played after dark
            cloudLum: 0.20,         // …so its clouds are moonlit, not sunlit
            surroundY: -2.6, surround: 'floor',
            water: 0x2b6f8f,
            floor: '#2b2f39',
            side: '#4a4a55'
        }
    };

    G3.themeFor = function (name) {
        return G3.THEMES[name] || G3.THEMES.seaside;
    };

})(window.G3);
