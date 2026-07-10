// Level 7 — The Deep Haul
// Biome: Bioluminescent Underground / Cyan-Blue.
// The longest level — ~4.2 km horizontal cave system with a full ceiling and floor.
// Key layout (left → right):
//   Start: HQ + collection depot at x:300
//   x:1200 — Blue Node (blue cargo)
//   x:1600 — Fuel Pump (refuel station — critical on this run)
//   x:2100 — Valley Base (green cargo)
//   x:3300 — Magma Chute (chute hub, wide catch zone)
//   x:3500 — Far East Depot (normal cargo)
// The floor and ceiling both undulate — tight squeezes at x:700 (rise) and x:2600 (squeeze corridor).
// Fuel discipline is everything: the Fuel Pump at x:1600 exists for a reason.
// Two floating hazard pockets (vented gas) sit in open air near x:1400 and x:2950 — easy to
// avoid with a steady line, punishing if you drift while distracted by fuel/cargo management.

registerLevel({
    name: "L7: The Deep Haul",
    missionTitle: "Bioluminescent Depths — Long Haul",
    description: "The Bioluminescent Depths stretch nearly 4 km underground. Multiple delivery nodes are buried deep in the cave network — each accepting a different cargo type. Fuel is tight; there's a refuel pump roughly halfway through. Navigate the undulating squeeze corridors without touching the glowing rock walls.",
    weather: 'bubbles',

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.16,
    wind: 0,
    heavyCargo: true, // Cargo weight affects lander handling

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Floor — undulates dramatically along the full 4.2 km run
        [
            // Start zone — HQ and collection depot at x:300; wide flat floor
            {x: -400, y: 550}, {x: 600, y: 550},
            // Rise — floor lifts sharply; Blue Node hub is near this shelf at x:1200
            {x: 700, y: 400}, {x: 900, y: 400},
            // Deep drop — floor plunges to a basin; Fuel Pump at x:1600 sits on the far lip
            {x: 1000, y: 700}, {x: 1300, y: 700},
            // High peak — floor surges back up; Valley Base hub (green) at x:2100 is just past this
            {x: 1500, y: 350}, {x: 1700, y: 350},
            // Valley — floor drops again into a wide flat valley; room to breathe
            {x: 1900, y: 600}, {x: 2300, y: 600},
            // Squeeze approach — floor rises to meet the ceiling; tightest corridor in the cave
            {x: 2500, y: 450}, {x: 2800, y: 450},
            // End base shelf — floor drops to a wide flat run; Magma Chute (x:3300) + Far East Depot (x:3500)
            {x: 3200, y: 650}, {x: 3800, y: 650},
            // Enclosure
            {x: 3800, y: 1500}, {x: -400, y: 1500}
        ],
        // Ceiling — mirrors the floor profile to create the cave volume
        [
            // Top boundary — flat cap sealing the whole cave
            {x: -400, y: -200}, {x: 3800, y: -200},
            // Above end base — ceiling drops to a moderate height above the final hubs
            {x: 3800, y: 250}, {x: 3200, y: 250},
            // Squeeze corridor ceiling — meets the floor rise; this is the narrowest gap
            {x: 2800, y: 150}, {x: 2500, y: 150},
            // Valley ceiling — lifts to give more headroom over the valley floor
            {x: 2300, y: 200}, {x: 1900, y: 200},
            // High peak ceiling — very low; floor peak + ceiling dip = minimal clearance
            {x: 1700, y: -50}, {x: 1500, y: -50},
            // Deep drop ceiling — ceiling rises to allow access to the basin floor hubs
            {x: 1300, y: 350}, {x: 1000, y: 350},
            // Rise ceiling — ceiling dips as the floor also rises; tighter than the start
            {x: 900, y: 100}, {x: 700, y: 100},
            // Start ceiling — generous clearance over the HQ zone
            {x: 600, y: 200}, {x: -400, y: 200}
        ]
    ],

    // ── Hazards — vented gas pockets in open stretches between hubs; a jolt of
    // knockback + damage if you drift into one while crossing at speed. Placed
    // clear of every hub/collection x-range so they add risk without blocking
    // any landing approach ─────────────────────────────────────────────────────
    hazards: [
        // Between Blue Node (x:1200) and the high peak (x:1500-1700) — floats in the
        // open-air gap over the basin, well clear of the floor/ceiling on both sides
        {
            pts: [
                {x: 1380, y: 220}, {x: 1460, y: 220},
                {x: 1460, y: 340}, {x: 1380, y: 340}
            ]
        },
        // Between the squeeze corridor exit (x:2800) and the end base shelf (x:3200)
        {
            pts: [
                {x: 2900, y: 280}, {x: 3000, y: 280},
                {x: 3000, y: 480}, {x: 2900, y: 480}
            ]
        },
        // Laser gauntlet protecting Fuel Pump (x:1600)
        { type: 'laser', pts: [{ x: 1550, y: -400 }, { x: 1550, y: 350 }], onMs: 1500, offMs: 2500, warnMs: 400, damagePerSec: 40, thickness: 12 },
        // Laser gauntlet protecting Valley Base (x:2100)
        { type: 'laser', pts: [{ x: 2050, y: -400 }, { x: 2050, y: 600 }], onMs: 1200, offMs: 2000, warnMs: 400, damagePerSec: 40, thickness: 12 }
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
        { x: 1600, width: 60, color: "#f59e0b", type: "refuel", name: "Fuel Pump" }
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
    hint: "Stop at the Fuel Pump (x:1600) before pushing east — the far hubs are too far to reach on a single tank. Timed laser gates guard both the Fuel Pump and Valley Base, so watch the warning flash before committing. Navigate below the ceiling through the squeeze corridors, don't graze the glowing rock, and steer clear of the drifting gas pockets. Return to HQ to extract.",

    quests: [
        questPrimary('Deliver 3 cargos across the cave'),
        questNoCargoLost('No cargo lost in the depths', 500),
        questNoCrash(700),
        questQuick('Finish in under 4 minutes', 120, 1000),
    ],
});

