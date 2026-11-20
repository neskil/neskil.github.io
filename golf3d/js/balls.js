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
        { id: 'novelty', name: 'Other Sports' },
        { id: 'shader',  name: 'Shader FX' },
        { id: 'glass',   name: 'Glass & Void' }
    ];

    /* The economy: 330 stars in the game (270 on the fifteen courses, 60 on
       the World Tour). The twenty-five balls cost 217, the nine club finishes
       79 and the eight hole-in celebrations 32, so 328 buys everything with
       a little to spare; early favourites unlock in a hole or two and
       anything can be bought in any order. The eight other-sports balls
       (category 'novelty') are priced at two and three stars, and the
       celebrations went in by taking a star or a few off the dearer balls and
       clubs: a new item past them means re-pricing, not loosening the test.

       Stars are not the only price at the top. A ball with a `lock` also needs
       the achievement of that name met (LOCKS below, judged by
       `scoring.lockStatus`), so the showpieces are earned by playing the game
       widely rather than by grinding one course for stars. */
    var BALLS = [
        {
            id: 'tour-white',
            name: 'Tour White',
            cost: 0,
            category: 'tour',
            badge: 'Classic',
            inspired: 'Classic Cast Urethane Tour',
            blurb: 'Crisp pearlescent white urethane, 492 geodesic dimples, equatorial seam and brass sight line.',
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
            id: 'tennis',
            name: 'Baseline Fuzz',
            cost: 2,
            category: 'novelty',
            badge: 'Tennis',
            inspired: 'Pressurised Tennis Ball',
            blurb: 'Optic-yellow felt you can almost feel, wrapped in the white rubber seam of a fresh can. Plays like a golf ball, sounds like one too.',
            mode: 'tennis',
            colors: ['#cfe23a', '#f4f4ea', '#9fb21c'],
            swatch: { type: 'plain', base: '#cfe23a' }
        },
        {
            id: 'beach-ball',
            name: 'Beach Day',
            cost: 2,
            category: 'novelty',
            badge: 'Beach',
            inspired: 'Inflatable Beach Ball',
            blurb: 'Six bright vinyl gores and two white caps, straight off the sand. It keeps the weight of a golf ball, sadly for the windmill.',
            mode: 'beach',
            colors: ['#e2302a', '#2a6ad8', '#f5c71f'],
            swatch: { type: 'plain', base: '#e2302a' }
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
            id: 'basketball',
            name: 'Full Court',
            cost: 3,
            category: 'novelty',
            badge: 'Hoops',
            inspired: 'Pebbled Basketball',
            blurb: 'Pebble-grain orange leather with black channel ribs. The only thing in the bag that wants to be bounced.',
            mode: 'basketball',
            colors: ['#d65d1c', '#141210', '#a8461a'],
            swatch: { type: 'plain', base: '#d65d1c' }
        },
        {
            id: 'baseball',
            name: 'Seventh Inning',
            cost: 3,
            category: 'novelty',
            badge: 'Diamond',
            inspired: 'Stitched Baseball',
            blurb: 'White horsehide and a hundred and eight red stitches in a double row, scuffed just enough to look used.',
            mode: 'baseball',
            colors: ['#f3efe2', '#c41c22', '#d8d2c0'],
            swatch: { type: 'plain', base: '#f3efe2' }
        },
        {
            id: 'eight-ball',
            name: 'Behind the Eight',
            cost: 3,
            category: 'novelty',
            badge: 'Billiards',
            inspired: 'Black Eight Ball',
            blurb: 'Lacquered black with the white roundel and the eight on it. Sink it last.',
            mode: 'eightball',
            pose: [0.2, -0.45],   // the shop thumbnail turns the marking to face you
            colors: ['#0d0d10', '#f4f2ea', '#2a2a30'],
            swatch: { type: 'plain', base: '#0d0d10' }
        },
        {
            id: 'football',
            name: 'Classic Panel',
            cost: 3,
            category: 'novelty',
            badge: 'Football',
            inspired: 'Black-and-White Panel Football',
            blurb: 'Twelve black pentagons, twenty white hexagons, stitched along every seam: the ball everyone draws when they draw a football.',
            mode: 'football',
            colors: ['#f4f4ef', '#111114', '#bfc2c4'],
            swatch: { type: 'plain', base: '#f4f4ef' }
        },
        {
            id: 'bowling',
            name: 'Strike Night',
            cost: 3,
            category: 'novelty',
            badge: 'Bowling',
            inspired: 'Reactive Resin Bowling Ball',
            blurb: 'Polished purple resin swirled with magenta, three finger holes drilled into it. Rolls true; knocks over nothing.',
            mode: 'bowling',
            pose: [0.2, -0.45],   // the shop thumbnail turns the marking to face you
            colors: ['#3b1666', '#c43a8e', '#120a24'],
            swatch: { type: 'plain', base: '#3b1666' }
        },
        {
            id: 'disco',
            name: 'Mirror Ball',
            cost: 3,
            category: 'novelty',
            badge: 'Disco',
            inspired: 'Mirrored Disco Ball',
            blurb: 'Hundreds of flat mirror tiles that catch the sun one at a time and throw it back as it turns.',
            mode: 'disco',
            colors: ['#c8ccd4', '#8e939c', '#ffffff'],
            swatch: { type: 'plain', base: '#c8ccd4' }
        },
        {
            id: 'triple-track',
            name: 'Triple Track',
            cost: 4,
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
            cost: 5,
            category: 'tour',
            badge: 'Spin',
            inspired: '50/50 Dual-Tone Divide',
            blurb: 'Ruby crimson fused 50/50 with championship gold so every degree of topspin and sidespin reads.',
            mode: 'divide',
            colors: ['#c92b39', '#eab63e', '#261d19'],
            swatch: { type: 'divide', left: '#c92b39', right: '#eab63e' }
        },
        {
            id: 'featherie',
            name: 'Featherie',
            cost: 6,
            category: 'tour',
            badge: 'Heritage',
            inspired: 'Hand-Stitched Leather, c. 1840',
            blurb: 'Before dimples: oiled cowhide stitched tight over a hatful of boiled feathers, with a waxed-linen seam all round.',
            mode: 'featherie',
            colors: ['#b98a55', '#6b4527', '#efe2c4'],
            swatch: { type: 'featherie', base: '#b98a55', dark: '#6b4527', thread: '#efe2c4' }
        },
        {
            id: 'pix-tour',
            name: 'Pix Diamond',
            cost: 7,
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
            cost: 7,
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
            cost: 9,
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
            cost: 10,
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
            cost: 12,
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
            cost: 13,
            lock: 'kinds',
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
            cost: 15,
            lock: 'ace',
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
            cost: 16,
            lock: 'tour',
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
            cost: 18,
            lock: 'rounds',
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
            id: 'aurora',
            name: 'Northern Lights',
            cost: 20,
            lock: 'under',
            category: 'shader',
            badge: 'Animated',
            inspired: 'Arctic Midnight Links',
            blurb: 'A night sky in urethane: green and violet aurora curtains rippling slowly over a starfield.',
            mode: 'aurora',
            animated: true,
            colors: ['#0a1430', '#3cf0a0', '#a46bff'],
            swatch: { type: 'aurora' }
        },
        {
            id: 'crystal-glass',
            name: 'Crystal Glass',
            cost: 22,
            lock: 'courses',
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
            cost: 26,
            lock: 'perfect',
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

    /* Achievements a top-shelf item asks for besides its stars. `need` is the
       target, and scoring.lockStatus counts the player's progress to it. */
    var LOCKS = {
        kinds:   { need: 4,  title: 'All-Rounder',      text: 'Finish a round in all four kinds of course: mini, crazy, adventure and the long game' },
        /* Five different holes, not five aces: one generous hole could be
           played until it gave an ace (the owner, v1.201.0: "hole in one is
           quite easy on the right map"), and could hand out all five. */
        ace:     { need: 5,  title: 'Ace Hunter',       text: 'Make a hole in one on five different holes' },
        tour:    { need: 6,  title: 'Globetrotter',     text: 'Earn stars on six World Tour holes' },
        rounds:  { need: 10, title: 'Regular',          text: 'Finish ten rounds' },
        under:   { need: 1,  title: 'Under Par',        text: 'Finish a round under par' },
        courses: { need: 8,  title: 'Course Collector', text: 'Finish a round on eight different courses' },
        perfect: { need: 6,  title: 'Perfect Card',     text: 'Three stars on all six holes of one course' }
    };
    /* The order the Achievements list shows them in: roughly the order a
       player meets them, from the one a good first round can give to the
       one that takes a course learned by heart. (Aces moved down the list
       when they became five different holes, v1.201.0.) */
    var LOCK_ORDER = ['under', 'kinds', 'tour', 'rounds', 'ace', 'courses', 'perfect'];

    /* Club finishes: the second tab of the Pro Shop. A finish repaints every
       club in the bag at once — the lacquered `paint` panels, a tint on the
       head's steel, and the grips — and `paint: null` keeps each club's own
       colour, which is how the bag ships. Bought with the same stars as the
       balls and kept in the same list (`save.balls`), so the wallet is one
       wallet. */
    var CLUB_FINISHES = [
        {
            id: 'club-stock', kind: 'club', name: 'Factory Colours', cost: 0, badge: 'Classic',
            blurb: 'Every club in its own colour, as the bag ships: blue driver, orange five iron, gold wedge.',
            paint: null, head: null, grip: 0x1d2127,
            colors: ['#1f6fff', '#f97316', '#eab308', '#22c55e']
        },
        {
            id: 'club-brass', kind: 'club', name: 'Clubhouse Brass', cost: 3, badge: 'Finish',
            blurb: 'Brass inlays, warm satin steel and oxblood leather grips — the set behind the bar.',
            paint: 0xc9a352, head: 0xb8a27a, grip: 0x4a2620,
            colors: ['#c9a352', '#b8a27a', '#4a2620']
        },
        {
            id: 'club-blackout', kind: 'club', name: 'Blackout', cost: 4, badge: 'Finish',
            blurb: 'Gunmetal heads, black paint fills and black cord grips. Nothing catches the light but the face.',
            paint: 0x2a2d33, head: 0x3f444c, grip: 0x101113,
            colors: ['#2a2d33', '#3f444c', '#101113']
        },
        {
            id: 'club-copper', kind: 'club', name: 'Raw Copper', cost: 5, badge: 'Finish',
            blurb: 'Copper-plated heads left to warm with age, burnt-orange fills and tan grips.',
            paint: 0xd0703c, head: 0xc07a52, grip: 0x7a5434,
            colors: ['#d0703c', '#c07a52', '#7a5434']
        },
        {
            id: 'club-racing', kind: 'club', name: 'Racing Green', cost: 6, badge: 'Finish',
            blurb: 'Deep green lacquer over bright steel with cream grips, like an old roadster.',
            paint: 0x1f6b45, head: 0xa6b0b8, grip: 0xe8dfc8,
            colors: ['#1f6b45', '#a6b0b8', '#e8dfc8']
        },
        {
            id: 'club-glacier', kind: 'club', name: 'Glacier', cost: 8, badge: 'Finish',
            blurb: 'Ice-blue fills, frosted silver heads and white grips.',
            paint: 0x7fd3ff, head: 0xcfdde8, grip: 0xeef2f5,
            colors: ['#7fd3ff', '#cfdde8', '#eef2f5']
        },
        {
            id: 'club-rose', kind: 'club', name: 'Rose Gold', cost: 10, badge: 'Finish',
            blurb: 'Rose-gold heads with blush fills and ivory grips.',
            paint: 0xe39a8f, head: 0xd9a48c, grip: 0xf1e9dd,
            colors: ['#e39a8f', '#d9a48c', '#f1e9dd']
        },
        {
            id: 'club-tour-gold', kind: 'club', name: 'Tour Gold', cost: 12, badge: 'Trophy', lock: 'under',
            blurb: 'Gold-plated heads and black fills: the set they hand you with the trophy.',
            paint: 0x16181c, head: 0xe0b44a, grip: 0x16181c,
            colors: ['#e0b44a', '#16181c', '#f5d37a']
        },
        {
            id: 'club-frostbite', kind: 'club', name: 'Frostbite', cost: 15, badge: 'Extreme', lock: 'tour',
            blurb: 'Heads frosted in hoarfrost, fills glowing glacier-cyan and breathing slowly, grips white as a snowfield.',
            paint: 0x9ff3ff, head: 0x9fd8f5, grip: 0xf4f9fc, glow: 'ice', emissive: 0x3cc8f0, headGlow: 0x1f6e94,
            colors: ['#9ff3ff', '#d8f1ff', '#2fb8e8']
        },
        {
            id: 'club-inferno', kind: 'club', name: 'Inferno', cost: 16, badge: 'Extreme', lock: 'perfect',
            blurb: 'Charred black heads split by ember-orange fills that flicker like a forge, on scorched leather grips.',
            paint: 0xff6a1a, head: 0x2a1f1b, grip: 0x3a1a10, glow: 'fire', emissive: 0xff4a0a, headGlow: 0x8a2a06,
            colors: ['#ff6a1a', '#2a1f1b', '#ffd15c']
        }
    ];

    /* Hole-in celebrations: the third shelf. What goes off over the cup on a
       hole in one — the equipped one, in the ace's replay (any other drop
       gets the plain pop). How each one moves is js/celebrate.js; this is what
       they are called and what they cost. Kept in `save.balls` like the
       rest, equipped on `save.cele`. */
    var CELEBRATIONS = [
        {
            id: 'cele-classic', kind: 'cele', name: 'Cup Sparkle', cost: 0, badge: 'Classic',
            blurb: 'A pop of gold sparks off the lip and a ring across the green. Quiet, tidy, the clubhouse way.',
            colors: ['#ffd36a', '#fff8e8']
        },
        {
            id: 'cele-confetti', kind: 'cele', name: 'Confetti Cannon', cost: 1, badge: 'Party',
            blurb: 'Three cannon shots of paper out of the cup, fluttering down on the green round the flag.',
            colors: ['#ff4d6d', '#ffd23f', '#3ec1ff', '#7be067']
        },
        {
            id: 'cele-geyser', kind: 'cele', name: 'Geyser', cost: 2, badge: 'Nature',
            blurb: 'The cup blows: a column of spray five units high, a splash ring and the drops raining back.',
            colors: ['#4fb6ff', '#9fe2ff', '#ffffff']
        },
        {
            id: 'cele-shockwave', kind: 'cele', name: 'Shockwave', cost: 3, badge: 'Impact',
            blurb: 'A flash, three rings racing out across the green and a skirt of sparks and dust thrown off it.',
            colors: ['#ffcf6a', '#c9a352', '#ff7a2a']
        },
        {
            id: 'cele-fireworks', kind: 'cele', name: 'Fireworks', cost: 4, badge: 'Show',
            blurb: 'Three rockets out of the cup on fizzing trails, each bursting in its own colour over the flag.',
            colors: ['#ff4d5e', '#45d0ff', '#ffd447', '#7dff8a']
        },
        {
            id: 'cele-ember', kind: 'cele', name: 'Ember Spiral', cost: 5, badge: 'Elemental',
            blurb: 'A fire twister winds up out of the cup in a column of light and bursts into embers at the top.',
            colors: ['#ffa53a', '#c4200a', '#fff0a0']
        },
        {
            id: 'cele-supernova', kind: 'cele', name: 'Supernova', cost: 7, badge: 'Extreme', lock: 'rounds',
            blurb: 'A white flash, a pillar of light ten units tall and a shell of ice-blue and gold blown out in every direction.',
            colors: ['#9fe9ff', '#ffd36a', '#ffffff']
        },
        {
            id: 'cele-singularity', kind: 'cele', name: 'Singularity', cost: 10, badge: 'Ace Hunter', lock: 'ace',
            blurb: 'A real black hole tears open over the cup, bends the course round it and drinks a spiral of light — then shuts, and lets it all go in a ripple through space.',
            colors: ['#b27bff', '#5fa8ff', '#ffc44d']
        },
        /* The Easter egg. Free, and not for sale: `secret` keeps it a "???"
           card on the shelf that buyBall refuses, until the save has finished
           `unlock.need` different holes (scoring.lockProgress 'holes'), when
           it turns up by itself (game.js → checkSecrets, the owner: "auto
           unlock after you played 20 maps"). `hint` is all the card says. */
        {
            id: 'cele-ducks', kind: 'cele', name: 'Rubber Duck Parade', cost: 0, badge: 'Secret', secret: true,
            unlock: { key: 'holes', need: 20 },
            hint: 'Finish twenty different holes and something will turn up.',
            blurb: 'Mother Duck rises out of the cup, a flock of ducklings drops in around her and waddles round the flag in a squeaking parade — then everybody jumps, and pop.',
            colors: ['#ffd21f', '#ff7a1a', '#9fe2ff']
        }
    ];

    var BY_ID = {};
    for (var i = 0; i < BALLS.length; i++) BY_ID[BALLS[i].id] = BALLS[i];

    function ballById(id) {
        return (id && BY_ID[id]) ? BY_ID[id] : BALLS[0];
    }

    var CLUB_BY_ID = {};
    for (i = 0; i < CLUB_FINISHES.length; i++) CLUB_BY_ID[CLUB_FINISHES[i].id] = CLUB_FINISHES[i];
    function clubFinishById(id) {
        return (id && CLUB_BY_ID[id]) ? CLUB_BY_ID[id] : CLUB_FINISHES[0];
    }

    var CELE_BY_ID = {};
    for (i = 0; i < CELEBRATIONS.length; i++) CELE_BY_ID[CELEBRATIONS[i].id] = CELEBRATIONS[i];
    function celebrationById(id) {
        return (id && CELE_BY_ID[id]) ? CELE_BY_ID[id] : CELEBRATIONS[0];
    }

    G3.BALL_CATEGORIES = CATEGORIES;
    G3.BALLS = BALLS;
    G3.ballById = ballById;
    G3.CLUB_FINISHES = CLUB_FINISHES;
    G3.clubFinishById = clubFinishById;
    // Everything the one wallet buys: what scoring's spentStars counts.
    G3.CELEBRATIONS = CELEBRATIONS;
    G3.celebrationById = celebrationById;
    G3.SHOP_ITEMS = BALLS.concat(CLUB_FINISHES, CELEBRATIONS);
    G3.SHOP_LOCKS = LOCKS;
    G3.SHOP_LOCK_ORDER = LOCK_ORDER;

})(window.G3);
