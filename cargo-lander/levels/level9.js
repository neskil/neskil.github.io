// Level 9 — The Cauldron
// Biome: Cavernous Void
// A highly chaotic level featuring a massive sandworm pit, high traffic, gravity anomalies,
// destructible buildings, acid lakes, and heavy weather.
// Terrain rebuilt (2026-07-10 design pass) from five flat rectangles into a ragged cavern:
// the worm pit reads as an obvious scar (crumbling shelf edge), the suspended hub gets a
// hanging crystal-spire tail for a dramatic anchor, and both ceiling chunks are jagged.
// Hazards stay spatially zoned — worm owns the center pit, blackhole+acid+silo own the
// eastern rim — with a new destructible structure and a fuel pickup added to the western/
// central half so the level doesn't read as empty on that side.
// Also fixes a silent bug: the left-shelf tower's building `type: 'comms'` had no matching
// branch in render/entities.js's drawBuildings() (only 'antenna'/'silo'/'refinery' render),
// so it was invisible in-game with no error — same failure class CLAUDE.md's headless
// verification section calls out. Swapped to 'antenna', which is what it visually was.

registerLevel({
    name: "L9: The Cauldron",
    missionTitle: "The Cauldron — Absolute Chaos",
    description: "Welcome to The Cauldron. A massive sandworm has carved out a massive pit below the main thoroughfare. Acid lakes line the cavern, a gravity well is causing chaos, and ambient traffic is completely out of control. Your mission: recover 3 heavy cargo crates and drop them at the suspended delivery hub above the pit. Good luck.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.18,           // Slightly heavier gravity
    wind: -0.06,              // Crosswind blowing left; scales up hard during gusts (see windGust)
    windGust: { calm: 4, warn: 1.5, gust: 8, gustMult: 4.5 }, // storm surges — short lulls, long violent gusts
    weather: 'snow',
    weatherParticles: 200,   // Heavy weather
    heavyCargo: true,
    ambientTrafficRate: 4,   // Maximum traffic frequency
    terrainType: 'worm-lair',// Enables the giant Sandworm hazard (zone defined by the
                              // `sandworm`-type hazard polygon below, centered on 800,900 r:300)
    outOfBounds: true,       // Thick lateral fog on the sides

    // ── Mission parameters ────────────────────────────────────────────────────
    deposit: 1000,
    fee: 450,
    timeLimit: 240,
    allowedTypes: ['heavy'],

    // ── Palette (Cavernous Void — near-black with acid-green and ember accents) ─
    palette: {
        skyTop:      '#050107',
        skyMid:      '#0c0410',
        skyBot:      '#14040a',
        terrainFill: '#020102',
        rockEdge:    '#34d399',
        rockGlow:    'rgba(52,211,153,',
        fog:         'rgba(239,68,68,0.06)',
    },

    // ── Quest Definition ─────────────────────────────────────────────────────
    targetCargo: 3,
    quests: [
        questPrimary("Deliver 3 cargo crates to the Cauldron Hub"),
        questNoCrash(400),
        questNoCargoLost("Don't drop cargo in the acid", 500)
    ],

    // ── Terrain Polygons ──────────────────────────────────────────────────────
    terrainPolygons: [
        // Left starting shelf (HQ) — crumbles diagonally into the worm pit instead
        // of a sheer rectangle edge; surface stays flat/near-flat out to x:450 for
        // the depot/cargo spawn and the refinery building, then breaks up right at
        // the worm zone's western edge (sandworm hazard centered 800,900 r:300 -> zone starts x:500)
        [
            { x: -200, y: 650 }, { x: -100, y: 600 }, { x: 0, y: 630 }, { x: 100, y: 600 },
            { x: 250, y: 610 }, { x: 350, y: 600 }, { x: 450, y: 615 },
            { x: 500, y: 640 },
            { x: 540, y: 720 }, { x: 480, y: 820 },
            { x: 500, y: 1200 }, { x: -200, y: 1200 }
        ],
        // Top cavern ceiling (left side) — jagged stalactite dip
        [
            { x: -200, y: 0 }, { x: 200, y: -30 }, { x: 350, y: 20 }, { x: 500, y: 0 },
            { x: 430, y: 200 }, { x: 380, y: 350 }, { x: 250, y: 300 }, { x: -200, y: 350 }
        ],
        // Top cavern ceiling (right side) — jagged stalactite dip
        [
            { x: 1100, y: 0 }, { x: 1350, y: -20 }, { x: 1550, y: 30 }, { x: 1800, y: 0 },
            { x: 1800, y: 350 }, { x: 1600, y: 300 }, { x: 1450, y: 380 }, { x: 1200, y: 350 }
        ],
        // The perilous Suspended Hub — floating rock with a hanging crystal-spire
        // tail reaching toward the pit for a dramatic anchor look (top edge at
        // y:500 is unchanged so physics.createDeliveryHub(800,500,...) still lines up)
        [
            { x: 700, y: 500 }, { x: 900, y: 500 },
            { x: 880, y: 560 }, { x: 820, y: 650 }, { x: 800, y: 750 }, { x: 780, y: 650 }, { x: 720, y: 560 }
        ],
        // The Acid Pool rim (Right side) — slightly jagged top edge
        [
            { x: 1200, y: 700 }, { x: 1450, y: 680 }, { x: 1650, y: 720 }, { x: 1800, y: 700 },
            { x: 1800, y: 1200 }, { x: 1200, y: 1200 }
        ]
    ],

    // ── Water Bodies (Acid) ───────────────────────────────────────────────────
    // drawWaterBodies() (render/terrain.js) only reads the pts-polygon shape —
    // the old {x,y,w,h} rect this used to be shaped as was silently never
    // rendered (no crash, just invisible). Expressed as a rect-shaped polygon.
    waterBodies: [
        {
            pts: [
                { x: 1250, y: 690 }, { x: 1750, y: 690 },
                { x: 1750, y: 940 }, { x: 1250, y: 940 },
            ],
            color: 'rgba(52, 211, 153, 0.4)', // Acid green
            surfaceColor: '#10b981',
            drag: 0.05,
            density: 0.003,
            isAcid: true
        }
    ],

    // ── Hazards ───────────────────────────────────────────────────────────────
    hazards: [
        // Pulsing Gravity Well above the acid pool pulling ships downwards —
        // stays zoned to the eastern acid side; the worm owns the center pit
        {
            type: 'gravwell',
            pts: [
                { x: 1450, y: 500 },
                { x: 1550, y: 450 },
                { x: 1650, y: 550 },
                { x: 1550, y: 600 }
            ],
            speed: 120,
            radius: 180,
            startForce: 1.0,
            endForce: 0.2
        },
        // Worm danger zone — 12-point circle (cx:800, cy:900, r:300) around the
        // central pit, replacing the old wormPitCX/CY/wormZoneR legacy fields.
        {
            type: 'sandworm',
            spawnRate: 1.0,
            comment: 'Worm danger zone (central pit)',
            pts: [
                {x: 1100, y: 900}, {x: 1060, y: 1050}, {x: 950,  y: 1160}, {x: 800, y: 1200},
                {x: 650,  y: 1160}, {x: 540,  y: 1050}, {x: 500,  y: 900}, {x: 540, y: 750},
                {x: 650,  y: 640},  {x: 800,  y: 600},  {x: 950,  y: 640}, {x: 1060, y: 750}
            ]
        }
    ],

    // ── Buildings ─────────────────────────────────────────────────────────────
    buildings: [
        // Destructible antenna tower on the left shelf (was mistyped 'comms',
        // a building type drawBuildings() doesn't render — see header note)
        { x: 150, y: 600, type: 'antenna', destructible: true, health: 50 },
        // Destructible refinery on the center-left shelf, past the depot —
        // balances the blackhole+acid+silo cluster that otherwise owns the
        // whole eastern half of the map
        { x: 450, y: 640, type: 'refinery', destructible: true, health: 60 },
        // Destructible silo near the acid
        { x: 1300, y: 700, type: 'silo', destructible: true, health: 80 }
    ],

    // ── Collectibles (Fuel / Cash) ────────────────────────────────────────────
    collectibles: [
        { type: 'cash', x: 800, y: 400, value: 500 }, // Risky flythrough cash above suspended hub
        { type: 'fuel', x: 525, y: 650, amount: 40 },
        { type: 'fuel', x: 1040, y: 600, amount: 40 },
        { type: 'fuel', x: 800, y: 650, amount: 35 } // Dead center of the worm zone — highest risk, dead below the hub
    ],

    // ── Setup & Spawns ────────────────────────────────────────────────────────
    startX: 0,               // Player starts on the left shelf

    setupPhysics: function(physics) {
        // Create the Cargo Pickup Depot
        physics.createSourcingDepot(200, 600, 3, ['drone']);

        // Delivery Hub is on the suspended rock above the worm. Needs to be 'heavy' type!
        physics.createDeliveryHub(800, 500, 3, 'heavy', 'Cauldron Hub', true);

        // Spawn 3 heavy crates on the left shelf inside the depot bounds — big/
        // oversized single-load crates (drone already only ever grapples one
        // box at a time, so this is mostly thematic here, but it's the natural
        // first level for the mechanic per the roadmap: drone-only depot,
        // already the "heavy" cargo type).
        for (let i = 0; i < 3; i++) {
            physics.spawnCargo('heavy', 170 + i * 40, '🏋️', 560, { big: true });
            const box = physics.boxes[physics.boxes.length - 1];
            const body = physics.boxBodyMap.get(box.id);
            if (body) {
                Matter.Body.setDensity(body, 0.005);
            }
        }
    }
});
