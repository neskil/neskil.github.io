/* render/palette.js — the three courses' colour schemes, and how weather bends
 * them.
 *
 * A theme is everything about a course that is a colour or a light: what the
 * sky fades between, where the sun is, what the grass and the rails are made
 * of, and what the course is standing in. A hole names one, in `courses.js`,
 * and nothing else decides any of it — so a fourth course is an entry here and
 * a `theme:` on the course, with no other file needing to learn the name.
 *
 * The weather never replaces a palette, it scales one. That is what keeps the
 * three courses telling themselves apart in every sky: an overcast seaside is
 * still recognisably the seaside. `tint()` is where that happens, and the sky,
 * the fog and the horizon all go through it together.
 *
 * Read by render/textures.js, render/sky.js, render/water.js, render/hole.js
 * and render.js itself. Holds no state and touches nothing in the scene.
 */
(function (G3) {
    'use strict';

    var THEMES = {
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

    /* The lit materials in this game hand three.js an sRGB hex as if it were a
       linear albedo and have always looked the way they look because of it —
       that is the palette, and changing it now would be a different game. The
       two *unlit* shaders, the sky and the water, have no lighting to bring
       them back down, so a raw hex out of one of those comes out a stop and a
       half too pale. They get the conversion the palette never had. */
    function lin(hex) {
        var c = new THREE.Color(hex);
        return c.convertSRGBToLinear ? c.convertSRGBToLinear() : c;
    }

    /* The sky, the fog and the horizon are one colour scheme and the weather
       has to be allowed to move all three together. A golden hour that warms
       the light but leaves a noon-blue sky behind it reads as a filter over a
       photograph rather than as an evening. */
    function skyTint(hex, weather, linear) {
        var c = linear ? lin(hex) : new THREE.Color(hex);
        if (weather && weather.tintSky) {
            c.lerp(linear ? lin(weather.tintSky) : new THREE.Color(weather.tintSky),
                weather.tintAmt === undefined ? 0.4 : weather.tintAmt);
        }
        return c;
    }

    G3.palette = {
        themes: THEMES,
        lin: lin,
        tint: skyTint
    };

})(window.G3);
