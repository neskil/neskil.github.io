// Level 7 — The Deep Haul
// Biome: Bioluminescent Underground / Cyan-Blue.
// The longest level — ~4.2 km horizontal cave system with a full ceiling and floor, now
// undulating continuously rather than stepping between flat shelves.
// Key layout (left → right):
//   Start: HQ + collection depot at x:300
//   x:1200 — Deep Node (blue cargo)
//   x:1600 — Fuel Pump (refuel station)
//   x:2100 — Valley Base (green cargo)
//   x:2280-2450 — a glowing underground lake fills the valley basin (scenery)
//   x:2550-2900 — a double-bend squeeze corridor (an S-curve, not a single narrow gap),
//                 with wrecked-hauler debris marking the approach as a warning
//   x:2900 — Reserve Tank (second refuel — the return leg needs it too)
//   x:3300 — Magma Chute (chute hub, wide catch zone)
//   x:3500 — Far East Depot (normal cargo)
// Fuel discipline is everything: there are now two pumps, and the second one exists
// specifically so the *return* trip is also a fuel-routing decision, not just the outbound one.
// The two laser gauntlets that used to guard the Fuel Pump and Valley Base were cut
// (2026-07-10 design pass) — lasers in a cave read as anti-theme, and dying late on a 4km
// run to a hard timer was more frustrating than skillful. Their job is done instead by two
// drifting gas pockets, relocated to sit directly in each hub's approach corridor.

registerLevel({
    name: "L7: The Deep Haul",
    missionTitle: "Bioluminescent Depths — Long Haul",
    description: "The Bioluminescent Depths stretch nearly 4 km underground. Multiple delivery nodes are buried deep in the cave network — each accepting a different cargo type. Fuel is tight; there are two refuel pumps along the route, one just past the halfway point and one deep in the squeeze corridor beyond it. Navigate the undulating cave without touching the glowing rock walls, and don't drift into the drifting gas pockets guarding the two mid-route hubs.",
    weather: 'bubbles',

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.16,
    wind: 0,
    heavyCargo: true, // Cargo weight affects lander handling

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Floor — undulates continuously along the full 4.2 km run; a double-bend
        // S-curve squeeze corridor around x:2600-2900 replaces the old single narrows
        [
            {x: -400, y: 550}, {x: 450, y: 550},
            {x: 600, y: 480}, {x: 750, y: 400}, {x: 950, y: 430}, {x: 1120, y: 380},
            {x: 1200, y: 390}, {x: 1280, y: 410}, {x: 1400, y: 520}, {x: 1550, y: 600},
            {x: 1600, y: 610}, {x: 1700, y: 560}, {x: 1850, y: 400}, {x: 1950, y: 330},
            {x: 2050, y: 350}, {x: 2100, y: 360}, {x: 2200, y: 400}, {x: 2280, y: 480},
            {x: 2450, y: 480}, {x: 2600, y: 420}, {x: 2680, y: 320}, {x: 2760, y: 420},
            {x: 2840, y: 320}, {x: 2900, y: 400}, {x: 3000, y: 450}, {x: 3100, y: 550},
            {x: 3200, y: 650}, {x: 3800, y: 650},
            // Enclosure
            {x: 3800, y: 1500}, {x: -400, y: 1500}
        ],
        // Ceiling — mirrors the floor's undulation, keeping a tight but positive gap
        // through both narrows of the S-curve squeeze
        [
            {x: -400, y: -200}, {x: 3800, y: -200},
            {x: 3800, y: 250}, {x: 3300, y: 250}, {x: 3200, y: 250},
            {x: 2900, y: 200},
            {x: 2840, y: 170}, {x: 2760, y: 270}, {x: 2680, y: 170}, {x: 2600, y: 270},
            {x: 2450, y: 300}, {x: 2280, y: 300}, {x: 2200, y: 250},
            {x: 2100, y: 210}, {x: 2050, y: 200}, {x: 1950, y: 180}, {x: 1850, y: 250},
            {x: 1700, y: 360}, {x: 1600, y: 410}, {x: 1550, y: 400},
            {x: 1400, y: 320}, {x: 1280, y: 260}, {x: 1200, y: 240}, {x: 1120, y: 230},
            {x: 950, y: 280}, {x: 750, y: 250}, {x: 600, y: 330},
            {x: 450, y: 200}, {x: -400, y: 200}
        ]
    ],

    // ── Hazards — two drifting gas pockets guarding the Fuel Pump and Valley Base
    // approaches (relocated from open mid-air stretches to do the lasers' old job) ──
    hazards: [
        // Guards the Fuel Pump (x:1600) approach — floats in the open corridor before the pad
        {
            pts: [
                {x: 1500, y: 440}, {x: 1580, y: 440},
                {x: 1580, y: 560}, {x: 1500, y: 560}
            ]
        },
        // Guards the Valley Base (x:2100) approach
        {
            pts: [
                {x: 2000, y: 230}, {x: 2080, y: 230},
                {x: 2080, y: 360}, {x: 2000, y: 360}
            ]
        }
    ],

    // ── Segments — wrecked hauler debris marking the squeeze corridor as a warning ──
    segments: [
        { x1: 2550, y1: 380, x2: 2600, y2: 420 },
        { x1: 2580, y1: 340, x2: 2630, y2: 380 },
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    targetCargo: 3,
    budget: 4500,
    timeLimit: 360,
    allowedTypes: ["normal", "blue", "green", "tethered"],
    collectionX: 300,        // collection depot on the left side

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'goo',
        color: '#10b981',
        mistColor: 'rgba(16, 185, 129, 0.3)',
        surfaceY: 1000,
        drag: 0.95,
        buoyancy: -0.1,
        monsterDepth: 1200
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 1200, width: 80, color: "#3b82f6", type: "blue", name: "Deep Node" },
        { x: 2100, width: 80, color: "#10b981", type: "green", name: "Valley Base" },
        { x: 3300, width: 140, color: "#f59e0b", type: "chute", name: "Magma Chute" },
        { x: 3500, width: 80, color: "#38bdf8", type: "normal", name: "Far East Depot" },
        { x: 1600, width: 60, color: "#f59e0b", type: "refuel", name: "Fuel Pump" },
        { x: 2900, width: 60, color: "#f59e0b", type: "refuel", name: "Reserve Tank" }
    ],

    // ── Water Bodies ──────────────────────────────────────────────────────────
    // Glowing bioluminescent lake pooling in the valley basin just past Valley Base —
    // pure scenery, no mechanical effect beyond standard water drag
    waterBodies: [
        {
            hasBoat: false,
            color: 'rgba(56, 189, 248, 0.45)',
            surfaceColor: '#38bdf8',
            pts: [
                {x: 2280, y: 480}, {x: 2450, y: 480},
                {x: 2450, y: 440}, {x: 2280, y: 440}
            ]
        }
    ],

    // ── Palette (Bioluminescent Cave) ─────────────────────────────────────────
    palette: {
        skyTop:      '#020617',
        skyMid:      '#040b16',
        skyBot:      '#051114',
        terrainFill: '#010204',
        rockEdge:    '#38bdf8',
        rockGlow:    'rgba(56,189,248,',
        fog:         'rgba(56,189,248,0.1)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Stop at the Fuel Pump (x:1600) before pushing east, and don't skip the Reserve Tank (x:2900) either — the return trip needs it as much as the outbound leg. A drifting gas pocket guards each of the Fuel Pump and Valley Base approaches, so read your line early. Thread the double-bend squeeze past the wrecked hauler debris without grazing the glowing rock. Return to HQ to extract.",

    quests: [
        questPrimary('Deliver 3 cargos across the cave'),
        questNoCargoLost('No cargo lost in the depths', 500),
        questNoCrash(700),
        questQuick('Finish in under 4 minutes', 120, 1000),
    ],
});
