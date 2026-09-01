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
     machine    what the marks on a travelator, a launch pad and a pipe mouth
                are painted (render.js, "the machinery"). They have to be the
                first thing read from the tee, and what colour does that
                depends on what the ground is: hot pink at a fair, cold cyan on
                the ice. Left out, they are the amber everything else uses.
     birds      false to keep them out of the sky.
     ridge      the ranges on the horizon, two hundred units out and built:
                `colour` the rock or heather of them, `cap` what the tops catch
                — snow on a mountain, bare sun on a mesa — `peak` how tall the
                tallest is in world units, and `rough` how broken the skyline
                is (0.4 is a moor, 0.6 is an alp). `peak` is a small number, and
                it is arithmetic rather than modesty: at two hundred units and
                an eye four above the ground, seventeen units is already most
                of the sky this camera has above the horizon. 7 is a coast
                across the water, 12 is an alp. Leave it out and the horizon is flat, which is
                what a course played indoors or inside a works wants.
     relief     how many units the surrounding ground rolls, out where it can
                no longer touch the hole. Leave it out for a floor that is
                meant to be a floor.

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
            /* A coast on the far side of the water, low and blue with
               distance. It is scenery, not a place you can reach — but it is
               what turns the sea from a floor into a sea. */
            ridge: { colour: '#5c7686', cap: '#a8c0cc', peak: 8, rough: 0.44 },
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
            /* Mesa country: the quarry is a bite out of a desert, and the
               rest of that desert is on the horizon. Tall, broken, and capped
               with the same bare sun that is on the sand. */
            ridge: { colour: '#8a5f37', cap: '#d9ab6b', peak: 11, rough: 0.55 },
            relief: 3.4,
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
            ridge: { colour: '#4e7d80', cap: '#9fcfc4', peak: 7, rough: 0.42 },
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
            /* The one course with real mountains behind it, and the only
               one with snow on them: high, broken and cold enough that the
               tops stay white under a sun that is warming everything else. */
            ridge: { colour: '#3f4f70', cap: '#e6eef7', peak: 12, rough: 0.60 },
            relief: 4.2,
            water: 0x2b6d8d,
            side: '#7d7566'
        },
        parkland: {
            /* The one course that is not mini golf, and the palette says so:
               a long summer afternoon over a lot of grass. The surround is a
               `floor` rather than water or rock because what lies beyond the
               boundary fence of a parkland course is more of the same country
               — so it is tinted grass-green and left to fade into the fog. */
            sky: [0x4a92d8, 0xd7ecf6],
            fog: 0xd7ecf6,
            sun: 0xfff2d6, sunPos: [10, 18, 8], ambient: 0xa8d4ea, ambientI: 0.56,
            grass: ['#57ae52', '#4a9f49'],
            rail: 0x8a7355,
            surroundY: -0.9, surround: 'floor', floor: '#33582f',
            ridge: { colour: '#3f5c42', cap: '#7a9670', peak: 9, rough: 0.40 },
            relief: 2.6,
            water: 0x2a7ea6,
            side: '#8f7a55'
        },
        links: {
            /* Open country under a big cold sky. The one theme whose surround
               matters: on every other course it is scenery beyond a fence, and
               here it is the horizon the hole runs into, so it is tinted to
               the same turf as the rough and sits just under the ground rather
               than a metre below it. Get that wrong and the course reads as a
               tray of grass sitting on a table. */
            sky: [0x5f8fc4, 0xd3e4ee],
            fog: 0xd3e4ee,
            /* A low sun, and the only one on the course list that is low on
               purpose. Everything interesting about this course is the shape
               of the ground, and a sun overhead lights a dune and a lawn
               identically — it is the raking light that turns a hump into
               something you can read from the tee and from the overview. */
            sun: 0xfff0d8, sunPos: [-13, 8.5, 11], ambient: 0xb4cbdd, ambientI: 0.52,
            grass: ['#7aa657', '#6e9b4e'],
            rail: 0xe8ece4,
            /* Tinted to the rough and sitting a hand's breadth under it, both
               so that the seam where the hole's own ground ends and the
               country beyond begins is a change of mowing rather than a
               cliff. It is the only place on the course where that seam is
               visible at all, and it is thirty units out and in haze. */
            surroundY: -0.55, surround: 'floor', floor: '#456b39',
            ridge: { colour: '#4e6540', cap: '#87996a', peak: 9, rough: 0.45 },
            relief: 3.0,
            water: 0x2c6f92,
            side: '#8a7c58'
        },
        /* The arcade. A basement at night with the lights left on: a black
           ceiling, one warm neon over the table and a floor that is not
           pretending to be ground at all. The grass is the baize on a table
           rather than a lawn, so it is darker and bluer than any of the
           daylight courses, and the rails are painted the colour of the
           cabinet. Stars, because the roof is nominally the sky and a flat
           black one reads as a bug. */
        arcade: {
            sky: [0x120a20, 0x3a1c52],
            fog: 0x3a1c52,
            sun: 0xffc8f0, sunPos: [5, 15, 5], ambient: 0x8a5ec4, ambientI: 0.85,
            grass: ['#1f6b63', '#1a5d57'],
            rail: 0xf472b6,
            stars: 0.7,
            cloudLum: 0.16,
            surroundY: -2.2, surround: 'floor', floor: '#20122e',
            water: 0x1c5f8f,
            side: '#3b2a4a'
        },
        /* Brass and dusk. The court is a machine and it is lit like one — a
           low warm sun off to one side so every blade and every gate throws a
           long shadow across the floor, which is the one thing that makes a
           mechanism readable from the tee. The surround is workshop floor, and
           the rails are the same brass as the works. */
        clockwork: {
            sky: [0x4a2f14, 0xe0a45c],
            fog: 0xe0a45c,
            sun: 0xffd79a, sunPos: [-11, 9, 6], ambient: 0xc08c50, ambientI: 0.62,
            grass: ['#4a7f45', '#40713d'],
            rail: 0xc9974a,
            cloudLum: 0.85,
            surroundY: -2.5, surround: 'floor', floor: '#3a2b1e',
            water: 0x2d6a86,
            side: '#6b543a'
        },
        /* Heathland, early and grey-blue. The point of the course is that the
           ground you want is narrow and the ground you get is everywhere else,
           and that only reads if the light is flat enough to show the mown
           line against the heather rather than drowning it in contrast. So:
           a high thin overcast, a cool sun, and a surround tinted to the
           heather so the hole runs out into more of the same country. */
        heath: {
            sky: [0x6b7fa8, 0xd6d2df],
            fog: 0xd6d2df,
            /* Low, for the same reason Whinstone's is low and it matters more
               here: everything interesting about this course is the shape of
               the ground, and a sun overhead lights a crest and a lawn exactly
               alike. Under a raking light a hump has a lit side and a shaded
               one and can be read from the tee; under a high one it is a patch
               of grass the same colour as the grass around it. */
            sun: 0xf6ecdc, sunPos: [-13, 7.5, 10], ambient: 0xb8b6c8, ambientI: 0.58,
            grass: ['#5f9a4e', '#548c46'],
            rail: 0x8a7f93,
            /* Lower than the other drawn courses, and for a reason the other
               drawn courses do not have: Dunmore has a ravine on it, and the
               floor of that ravine is nearly a unit below the hole. A surround
               at the usual hand's breadth would be drawn straight across it and
               the one landform on the course you can actually fall into would
               be invisible from the tee. */
            surroundY: -1.5, surround: 'floor', floor: '#5a4a63',
            ridge: { colour: '#4d4763', cap: '#8f86a6', peak: 11, rough: 0.50 },
            relief: 3.6,
            water: 0x35657f,
            side: '#7a6a58'
        },
        /* ── the adventure courses ──────────────────────────────────────

           Two palettes for the two things a course made of machinery can be.

           Icehouse Yard is lit like a cold clear morning and it is the one
           theme in the file where the *specular* is the subject: ice reads as
           ice because of what the light does on top of it, so the sun is low
           and off to one side where it can lie along the surface, and the
           surround is snow — a rock surround tinted almost white, rolling a
           little, with alps behind it. The turf is a frosted green rather than
           a summer one, because a bright lawn beside a sheet of ice looks like
           two different courses photographed together. */
        icehouse: {
            sky: [0x4d84be, 0xd9eaf6],
            fog: 0xd9eaf6,
            sun: 0xfff2e4, sunPos: [-12, 7, 9], ambient: 0xc2daec, ambientI: 0.8,
            grass: ['#7fae97', '#74a28c'],
            rail: 0xeaf4fa,
            machine: 0x39c8ff,
            surroundY: -1.5, surround: 'rock', ground: '#c4d6e2',
            relief: 3.5,
            ridge: { colour: '#8ba2b6', cap: '#f4fafd', peak: 13, rough: 0.62 },
            water: 0x2a6f9c,
            side: '#8aa9bd'
        },
        /* And the fair, which is the other half of adventure golf and has to
           look like somewhere you would queue up to play: dusk over a pier,
           lamps rather than sun, and the machinery in hot pink so a belt and a
           launch pad are the brightest things on the hole. That last part is
           the whole reason `machine` is a theme key at all — the marks on the
           ground have to be the first thing you see from the tee, and what
           colour does that depends entirely on what the ground is. */
        fairground: {
            sky: [0x241b47, 0xef7f72],
            fog: 0xef7f72,
            sun: 0xffd7a4, sunPos: [8, 10, -7], ambient: 0x9c74c2, ambientI: 0.85,
            grass: ['#2f8f60', '#288056'],
            rail: 0xf7e267,
            machine: 0xff5aa0,
            stars: 0.45,
            cloudLum: 0.55,
            surroundY: -2.4, surround: 'floor', floor: '#2c2039',
            water: 0x2b6f8f,
            side: '#5b4070'
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
