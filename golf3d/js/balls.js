/* Golf ball cosmetics catalog and metadata.

   Pure data — no DOM, no three.js, no WebGL — so pure logic tests (`tests.html`),
   shader tests (`shader-tests.html`), the game (`index.html`), turntable and editor
   can all share the exact same catalog and star prices.

   Players earn stars across courses and World Tour holes and may unlock any ball
   in any order as soon as they have enough unspent stars. */
window.G3 = window.G3 || {};
(function (G3) {
    'use strict';

    var CATEGORIES = [
        { id: 'all',     name: 'All' },
        { id: 'tour',    name: 'Tour' },
        { id: 'pattern', name: 'Patterns' },
        { id: 'shader',  name: 'Shader FX' },
        { id: 'glass',   name: 'Glass & Void' }
    ];

    /* Costs sum to 260 stars across all 15 unlockable balls against ~330 total
       stars in the game (and <= 270 on the 15 main courses), so early favorites
       unlock in 1-2 holes and collectors can buy in any order. */
    var BALLS = [
        {
            id: 'tour-white',
            name: 'Tour White',
            cost: 0,
            category: 'tour',
            badge: 'Classic',
            inspired: 'Classic Cast Urethane Tour',
            blurb: 'Crisp pearlescent white urethane, 362 geodesic dimples, equatorial seam and brass sight line.',
            mode: 'tour',
            colors: ['#f7f5ee', '#b9382c', '#c9a352'],
            swatch: { type: 'stripe', base: '#f7f5ee', accent: '#b9382c', trim: '#c9a352' }
        },
        {
            id: 'optic-yellow',
            name: 'Hi-Vis Volt',
            cost: 2,
            category: 'tour',
            badge: 'Tour',
            inspired: 'Pro Optic Yellow',
            blurb: 'High-contrast electric tour yellow-lime engineered to track cleanly against overcast dusk skies.',
            mode: 'optic',
            colors: ['#e8f235', '#1b263b', '#9db316'],
            swatch: { type: 'stripe', base: '#e8f235', accent: '#1b263b', trim: '#9db316' }
        },
        {
            id: 'coral-matte',
            name: 'Crimson Flare',
            cost: 3,
            category: 'tour',
            badge: 'Matte',
            inspired: 'Anodized Matte Tour Red',
            blurb: 'Velvety satin crimson shell with soft polymer scatter and a crisp chalk putting bar.',
            mode: 'matte',
            colors: ['#d9383a', '#f7f5ee', '#8f1d22'],
            swatch: { type: 'stripe', base: '#d9383a', accent: '#f7f5ee', trim: '#8f1d22' }
        },
        {
            id: 'triple-track',
            name: 'Triple Track',
            cost: 5,
            category: 'tour',
            badge: 'Tour',
            inspired: 'Vernier 3-Line Alignment',
            blurb: 'Three parallel putting lines — crimson center flanked by cobalt rails — for dead-straight reads.',
            mode: 'triple',
            colors: ['#f6f4ec', '#cc2936', '#2155b8'],
            swatch: { type: 'triple', base: '#f6f4ec', center: '#cc2936', side: '#2155b8' }
        },
        {
            id: 'tour-divide',
            name: 'Half & Half',
            cost: 7,
            category: 'tour',
            badge: 'Spin',
            inspired: '50/50 Dual-Tone Divide',
            blurb: 'Ruby crimson fused 50/50 with championship gold so every degree of topspin and sidespin reads.',
            mode: 'divide',
            colors: ['#c92b39', '#eab63e', '#261d19'],
            swatch: { type: 'divide', left: '#c92b39', right: '#eab63e' }
        },
        {
            id: 'pix-tour',
            name: 'Pix Diamond',
            cost: 9,
            category: 'pattern',
            badge: 'Tour',
            inspired: 'ClearPath Geometric Clusters',
            blurb: 'Twelve symmetric orange-and-navy diamond clusters framing an unmissable roll pattern.',
            mode: 'pix',
            colors: ['#f5f3ea', '#e86624', '#1b2c4e'],
            swatch: { type: 'dots', base: '#f5f3ea', a: '#e86624', b: '#1b2c4e' }
        },
        {
            id: 'truvis-club',
            name: 'Checkered Classic',
            cost: 11,
            category: 'pattern',
            badge: 'Pattern',
            inspired: 'Soccer-Pentagon Tour Print',
            blurb: 'Sharp dodecahedral pentagons in clubhouse cobalt across bright tour white to make the ball read bigger.',
            mode: 'truvis',
            colors: ['#f6f4ec', '#20457c', '#c9a352'],
            swatch: { type: 'pentagon', base: '#f6f4ec', accent: '#20457c', trim: '#c9a352' }
        },
        {
            id: 'splatter-drip',
            name: 'Clubhouse Drip',
            cost: 13,
            category: 'pattern',
            badge: 'Custom',
            inspired: 'Paint-Splatter Tour Drip',
            blurb: 'Fresh bone urethane flung with teal, coral, brass and midnight paint splatters all round.',
            mode: 'splatter',
            colors: ['#f3f0e6', '#21a698', '#e25c4b', '#d9a441'],
            swatch: { type: 'splatter', base: '#f3f0e6', palette: ['#21a698', '#e25c4b', '#d9a441', '#223866'] }
        },
        {
            id: 'woodland-camo',
            name: 'Woodland Camo',
            cost: 15,
            category: 'pattern',
            badge: 'Camo',
            inspired: 'Tactical Peat & Moss',
            blurb: 'Layered organic camouflage in forest moss, olive sage, bark clay and dark peat.',
            mode: 'camo',
            colors: ['#4b6137', '#7b8b52', '#8f7854', '#22281d'],
            swatch: { type: 'camo', palette: ['#4b6137', '#7b8b52', '#8f7854', '#22281d'] }
        },
        {
            id: 'carbon-gold',
            name: 'Forged Carbon',
            cost: 18,
            category: 'pattern',
            badge: 'Crafted',
            inspired: 'Woven Twill & Brass',
            blurb: 'Anisotropic carbon-fiber twill weave bound by an inlaid brushed-brass meridian ring.',
            mode: 'carbon',
            colors: ['#24272c', '#3d424b', '#d6b25e'],
            swatch: { type: 'carbon', base: '#24272c', weave: '#3d424b', ring: '#d6b25e' }
        },
        {
            id: 'rainbow-tie',
            name: 'Chroma Swirl',
            cost: 21,
            category: 'shader',
            badge: 'Animated',
            inspired: 'Liquid Spectrum Shader',
            blurb: 'Flowing 3D spectral marbling churning beneath a mirror-clear urethane coat.',
            mode: 'rainbow',
            animated: true,
            colors: ['#ff4b6e', '#ffd147', '#35d0ba', '#6f7bff'],
            swatch: { type: 'rainbow' }
        },
        {
            id: 'holo-prism',
            name: 'Prismatic Holo',
            cost: 24,
            category: 'shader',
            badge: 'Shader FX',
            inspired: 'Thin-Film Iridescent Foil',
            blurb: 'View-angle thin-film interference and metallic micro-flakes that flash rainbow across every dimple.',
            mode: 'holo',
            animated: true,
            colors: ['#63e6e2', '#e77fff', '#ffe066'],
            swatch: { type: 'holo' }
        },
        {
            id: 'magma-core',
            name: 'Molten Ember',
            cost: 27,
            category: 'shader',
            badge: 'Emissive',
            inspired: 'Volcanic Obsidian Core',
            blurb: 'Charred basalt crust split by pulsing rivers of incandescent magma.',
            mode: 'magma',
            animated: true,
            colors: ['#1f1918', '#ff591e', '#ffd15c'],
            swatch: { type: 'magma' }
        },
        {
            id: 'cyber-wire',
            name: 'Neon Grid',
            cost: 30,
            category: 'shader',
            badge: 'Shader FX',
            inspired: 'Challenge Mode Synth Grid',
            blurb: 'Deep synthwave obsidian laced with pulsing cyan and magenta laser meridians.',
            mode: 'cyber',
            animated: true,
            colors: ['#131026', '#33f0ff', '#ff47b6'],
            swatch: { type: 'cyber' }
        },
        {
            id: 'crystal-glass',
            name: 'Crystal Glass',
            cost: 35,
            category: 'glass',
            badge: 'Glass Shader',
            inspired: 'Refractive Optical Crystal',
            blurb: 'Translucent faceted optical glass with Fresnel sky reflections, dispersion rim and suspended emerald prism core.',
            mode: 'glass',
            animated: true,
            transparent: true,
            colors: ['#aeeeff', '#34d8b4', '#ffffff'],
            swatch: { type: 'glass' }
        },
        {
            id: 'black-hole',
            name: 'Singularity',
            cost: 40,
            category: 'glass',
            badge: 'Void Shader',
            inspired: 'World Tour Accretion Horizon',
            blurb: 'A pocket gravitational singularity — pitch-dark event horizon framed by a warped golden-violet accretion ring.',
            mode: 'singularity',
            animated: true,
            colors: ['#07060b', '#ffb84d', '#8e5bff'],
            swatch: { type: 'singularity' }
        }
    ];

    var BY_ID = {};
    for (var i = 0; i < BALLS.length; i++) BY_ID[BALLS[i].id] = BALLS[i];

    function ballById(id) {
        return (id && BY_ID[id]) ? BY_ID[id] : BALLS[0];
    }

    G3.BALL_CATEGORIES = CATEGORIES;
    G3.BALLS = BALLS;
    G3.ballById = ballById;

})(window.G3);
