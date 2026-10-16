// Level 7 — The Drowned Grotto
// Biome: Bioluminescent flooded cave.
//
// 2026-10-16 rebuild. The old L7 ("The Deep Haul") was a 4km wavy tunnel —
// a long straight fuel run with nothing to look at and nothing to learn.
// Playtest verdict: "no fun". The new identity is WATER: the grotto is half
// drowned, and twice the only way on is to DIVE — the ceiling plunges below
// the waterline and you fly a flooded siphon, slowed by drag and lifted by
// buoyancy (physics/mechanics.js applyWaterBounce), before surfacing in the
// next dry chamber. Nothing else in the campaign flies underwater.
//
// Layout (left → right; y grows downward):
//   x -500..640    UPPER GALLERY — HQ (x:-200) and the depot (x:250), miners'
//                  lamps, mushrooms. Dry.
//   x  640..1240   SIPHON ONE — waterline y:600. The ceiling dives to y:680 at
//                  x:960; you go under, ~160px of water between rock and rock.
//   x 1240..1900   THE CATHEDRAL — tall dry chamber. Deep Node (blue) on a
//                  hanging shelf up at y:360, the Fuel Pump ($3) on the floor,
//                  a waterfall from a roof crack, a mushroom grove.
//   x 1900..3170   THE LAKE — one body of water, surface y:640, under a low
//                  roof. Valley Base (green) on the island rock in the middle;
//                  a geyser vent puffs up through the lake on a beat.
//   x 2740..3080   SIPHON TWO — the lake's far end: the roof dives under again,
//                  deeper and longer than the first.
//   x 3170..3800   THE AIR POCKET — dry grotto: Far East Depot (normal) and the
//                  Reserve Tank ($6, you pay for convenience this deep).
//
// Every pad y is explicit (the cave has a roof, so surface snapping can find
// the wrong edge). Water slows crates on the deck too — keep your line.

registerLevel({
    name: "L7: The Drowned Grotto",
    missionTitle: "Bioluminescent Depths — Drowned Grotto",
    description: "The lower grotto flooded overnight. Two of the passages now dip under the waterline — the only way through is to dive, swim the siphon, and surface on the far side. Deliver blue cargo to the Deep Node on the Cathedral shelf, green to the island in the lake, and the rest to the Far East Depot in the air pocket beyond the second siphon.",
    hint: "To get through a siphon, dive in steep and keep thrusting forward: water drags you and lifts you, so a lazy entry stalls under the roof. Surface in the open water past the roof dip before you hover. The Cathedral's Fuel Pump is cheap ($3); the Reserve Tank past the second siphon charges $6. The lake geyser flashes before it blows — cross it between puffs.",

    weather: 'bubbles',
    backgroundType: 'cave',

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.12,
    wind: 0,
    windVarianceEnabled: false,
    heavyCargo: true,
    maxFuel: 170,

    // ── Mission parameters ────────────────────────────────────────────────────
    targetCargo: 4,
    deposit: 1000,
    fee: 350,
    timeLimit: 330,
    allowedTypes: ["normal", "blue", "green"],
    startX: -200,
    startY: 500,
    collectionX: 250,
    collectionY: 500,

    quests: [
        questPrimary('Deliver 4 cargo through the flooded grotto'),
        questNoCargoLost('No cargo lost in the depths', 500),
        questNoCrash(700),
        questQuick('Finish in under 4 minutes', 90, 900),
    ],

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Floor — gallery, siphon one's U, the Cathedral, the lake bed, siphon
        // two's U, and the air pocket.
        [
            {x: -500, y: 500}, {x: -60, y: 500}, {x: 60, y: 520}, {x: 140, y: 500},
            {x: 380, y: 500}, {x: 470, y: 530}, {x: 560, y: 520}, {x: 640, y: 560},
            {x: 720, y: 640}, {x: 800, y: 760}, {x: 880, y: 830}, {x: 1000, y: 840},
            {x: 1080, y: 800}, {x: 1140, y: 700}, {x: 1190, y: 620}, {x: 1240, y: 600},
            {x: 1600, y: 600}, {x: 1660, y: 620}, {x: 1760, y: 600}, {x: 1860, y: 610},
            {x: 1920, y: 660}, {x: 1990, y: 780}, {x: 2080, y: 880}, {x: 2400, y: 890},
            {x: 2560, y: 860}, {x: 2660, y: 820}, {x: 2760, y: 860}, {x: 2900, y: 910},
            {x: 3020, y: 900}, {x: 3120, y: 850}, {x: 3200, y: 740}, {x: 3250, y: 630},
            {x: 3280, y: 560}, {x: 3310, y: 515}, {x: 3350, y: 485}, {x: 3390, y: 472},
            {x: 3400, y: 470}, {x: 3520, y: 470}, {x: 3550, y: 440}, {x: 3800, y: 440},
            {x: 3800, y: 1500}, {x: -500, y: 1500}
        ],
        // Roof — dives below the waterline twice (x 860-1090 and x 2760-3075).
        // Its two end walls run down past the floor, so the grotto is sealed:
        // no flying out of either end and over the top.
        [
            {x: -700, y: -400}, {x: 4000, y: -400}, {x: 4000, y: 1500}, {x: 3800, y: 1500},
            {x: 3800, y: 250},
            {x: 3600, y: 230}, {x: 3300, y: 250}, {x: 3160, y: 350}, {x: 3100, y: 480},
            {x: 3070, y: 600}, {x: 3040, y: 690}, {x: 2960, y: 750}, {x: 2860, y: 740}, {x: 2740, y: 620},
            {x: 2640, y: 500}, {x: 2500, y: 450}, {x: 2300, y: 420}, {x: 2150, y: 440},
            {x: 2000, y: 430}, {x: 1900, y: 330}, {x: 1800, y: 200}, {x: 1600, y: 140},
            {x: 1400, y: 150}, {x: 1240, y: 260}, {x: 1160, y: 380}, {x: 1100, y: 520},
            {x: 1040, y: 650}, {x: 960, y: 680}, {x: 880, y: 600}, {x: 800, y: 420},
            {x: 700, y: 330}, {x: 600, y: 260}, {x: 480, y: 190}, {x: 300, y: 210},
            {x: 100, y: 170}, {x: -100, y: 190}, {x: -500, y: 180},
            {x: -500, y: 1500}, {x: -700, y: 1500}
        ],
        // The Cathedral shelf — hangs off the roof's flank; Deep Node lands on it.
        [
            {x: 1290, y: 360}, {x: 1450, y: 360}, {x: 1430, y: 395},
            {x: 1380, y: 425}, {x: 1330, y: 418}, {x: 1300, y: 395}
        ],
        // The lake island — Valley Base on the summit, 80px clear of the water.
        [
            {x: 2200, y: 900}, {x: 2210, y: 620}, {x: 2230, y: 560},
            {x: 2350, y: 560}, {x: 2370, y: 620}, {x: 2385, y: 900}
        ]
    ],

    // ── Water — siphon one, and the lake + siphon two as one body ──────────────
    waterBodies: [
        {
            hasBoat: false,
            color: 'rgba(20, 184, 166, 0.45)',
            surfaceColor: '#14b8a6',
            pts: [{x: 670, y: 600}, {x: 1245, y: 600}, {x: 1245, y: 900}, {x: 670, y: 900}]
        },
        {
            hasBoat: false,
            color: 'rgba(20, 184, 166, 0.45)',
            surfaceColor: '#14b8a6',
            pts: [{x: 1895, y: 640}, {x: 3250, y: 640}, {x: 3250, y: 960}, {x: 1895, y: 960}]
        }
    ],

    // ── Hazards ───────────────────────────────────────────────────────────────
    hazards: [
        // Lake geyser — a column of bubbles that blows upward on a beat. It
        // flashes before it puffs (repulsor gustMs/calmMs). Caught in a puff
        // you are tossed toward the low roof, so read it and cross in the calm.
        {
            type: 'repulsor',
            color: 'rgba(45, 212, 191, 0.16)',
            travelX: 0, travelY: -0.22,
            gustMs: 1000, calmMs: 2200, warnMs: 600,
            pts: [{x: 2520, y: 470}, {x: 2600, y: 470}, {x: 2600, y: 860}, {x: 2520, y: 860}]
        }
    ],

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 1320, y: 360, width: 80, color: "#3b82f6", type: "blue",   name: "Deep Node" },
        { x: 2240, y: 560, width: 80, color: "#10b981", type: "green",  name: "Valley Base" },
        { x: 3410, y: 470, width: 90, color: "#38bdf8", type: "normal", name: "Far East Depot" },
        { x: 1535, y: 600, width: 60, color: "#f59e0b", type: "refuel", name: "Fuel Pump",    pricePerUnit: 3 },
        { x: 3620, y: 440, width: 60, color: "#f59e0b", type: "refuel", name: "Reserve Tank", pricePerUnit: 6 }
    ],

    // ── Collectibles ──────────────────────────────────────────────────────────
    collectibles: [
        { type: 'cash', x: 960,  y: 780, value: 400 },  // the bottom of siphon one
        { type: 'fuel', x: 1640, y: 260, amount: 40 },  // up in the Cathedral vault
        { type: 'cash', x: 2460, y: 790, value: 500 },  // deep in the lake, east of the island
        { type: 'fuel', x: 2930, y: 840, amount: 40 },  // halfway through siphon two
        { type: 'cash', x: 3700, y: 330, value: 300 }   // air-pocket ceiling
    ],

    // ── Decals (render/decals.js) ─────────────────────────────────────────────
    decals: [
        // Upper gallery: a working mine face
        { type: 'hanglamp', x: -260, y: 186, len: 70 }, { type: 'hanglamp', x: 60, y: 172, len: 90 },
        { type: 'hanglamp', x: 330, y: 206, len: 80 },
        { type: 'crates', x: 420, y: 512, n: 3 }, { type: 'barrels', x: -400, y: 500, n: 4 },
        { type: 'stalactite', x: 180, y: 180, len: 60 }, { type: 'stalactite', x: 520, y: 205, len: 45 },
        { type: 'mushroom', x: 560, y: 520, n: 3 }, { type: 'sign', x: 620, y: 550, s: 0.9 },
        // Siphon one
        { type: 'kelp', x: 900, y: 834, len: 120 }, { type: 'kelp', x: 1040, y: 820, len: 90, n: 2 },
        { type: 'coral', x: 980, y: 840 }, { type: 'stalactite', x: 760, y: 375, len: 50 },
        // The Cathedral
        { type: 'waterfall', x: 1720, y: 160, x2: 1720, y2: 604, w: 30 },
        { type: 'mushroom', x: 1280, y: 600, n: 4, color: '#a78bfa' }, { type: 'mushroom', x: 1660, y: 618, n: 3 },
        { type: 'mushroom', x: 1830, y: 606, n: 4, color: '#f472b6' }, { type: 'mushroom', x: 1440, y: 360, n: 2, s: 0.8 },
        { type: 'vine', x: 1340, y: 422, len: 70, color: '#2dd4bf' }, { type: 'vine', x: 1400, y: 426, len: 100 },
        { type: 'vine', x: 1520, y: 145, len: 130, color: '#a78bfa' }, { type: 'vine', x: 1590, y: 142, len: 90 },
        { type: 'stalactite', x: 1460, y: 148, len: 80 }, { type: 'stalactite', x: 1840, y: 260, len: 60 },
        { type: 'crystal', x: 1880, y: 610, color: '#2dd4bf', s: 0.8 },
        // The lake
        { type: 'stalactite', x: 2060, y: 434, len: 70 }, { type: 'stalactite', x: 2180, y: 436, len: 50 },
        { type: 'stalactite', x: 2420, y: 430, len: 85 }, { type: 'stalactite', x: 2690, y: 560, len: 40 },
        { type: 'kelp', x: 2100, y: 884, len: 140 }, { type: 'kelp', x: 2460, y: 888, len: 160, n: 4 },
        { type: 'coral', x: 2150, y: 886, color: '#fbbf24' }, { type: 'coral', x: 2500, y: 880 },
        { type: 'bones', x: 2650, y: 822, s: 0.8 },
        { type: 'mushroom', x: 2260, y: 560, n: 2, s: 0.7, color: '#a78bfa' },
        { type: 'hanglamp', x: 2290, y: 422, len: 60, color: '#34d399' },
        // Siphon two
        { type: 'kelp', x: 2860, y: 885, len: 110 }, { type: 'kelp', x: 3010, y: 900, len: 90 },
        { type: 'coral', x: 2950, y: 905, color: '#38bdf8' },
        // The air pocket
        { type: 'crystal', x: 3540, y: 458, color: '#2dd4bf' }, { type: 'mushroom', x: 3780, y: 440, n: 3 },
        { type: 'vine', x: 3420, y: 245, len: 110, color: '#2dd4bf' }, { type: 'stalactite', x: 3700, y: 238, len: 70 },
        { type: 'barrels', x: 3730, y: 440, n: 3, color: '#0e7490' }
    ],

    // ── Environment ───────────────────────────────────────────────────────────
    worldBounds: {
        bottomY: 1300,
        bottomAction: 'monster',
        leftMargin: 3000,
        rightMargin: 3000
    },

    // ── Palette (Bioluminescent Grotto) ───────────────────────────────────────
    palette: {
        skyTop:      '#020617',
        skyMid:      '#03141a',
        skyBot:      '#062a2a',
        terrainFill: '#01080a',
        rockEdge:    '#2dd4bf',
        rockGlow:    'rgba(45,212,191,',
        fog:         'rgba(45,212,191,0.08)',
    },
});
