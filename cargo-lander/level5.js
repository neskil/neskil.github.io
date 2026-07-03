// Level 5 — The Needle's Eye
// Biome: Crystal Caverns / Deep Purple.
// Drone-only level. The hub is at the bottom of a shaft that's too narrow to enter directly.
// The player must hover above the opening, extend the winch (E/Q), and lower cargo in by rope.
// Ceiling terrain encloses the map into a true cave — no flying above the canopy.
// Underground easter egg: purple crystal stalagmites pulse beneath the cave floor.

registerLevel({
    name: "L5: The Needle's Eye",
    missionTitle: "Crystal Caverns — Precision Winch Drop",
    description: "The Pit is a crystal-lined shaft deep inside the Cavern Tier — far too narrow for the drone body to enter. Hover above the opening, extend your winch (E/Q keys), and lower each cargo crate down by rope. One slip and the crate swings into the crystal walls.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.10,          // Lighter gravity — easier hovering while managing the rope
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Ground — wide outer shelf slopes down into the deep core basin;
        // the shaft opening is the gap between x:550 and x:800 in the ceiling below
        [
            // Left outer shelf (HQ spawn, cargo collection at x:180)
            {x: -400, y: 700}, {x: 150, y: 700}, {x: 250, y: 800},
            // Central basin floor — The Pit hub sits here
            {x: 450, y: 800}, {x: 600, y: 950}, {x: 1100, y: 950},
            // Right outer shelf — rises back up to match left side
            {x: 1300, y: 800}, {x: 1800, y: 800},
            // Enclosure
            {x: 1800, y: 1800}, {x: -400, y: 1800}
        ],
        // Ceiling — seals the level into a cave; the shaft is the narrow gap around x:700
        [
            {x: -400, y: -400}, {x: 1800, y: -400},
            // Right ceiling drops down to seal the right entry
            {x: 1800, y: 550}, {x: 1200, y: 550},
            // Shaft right wall — narrow gap for the rope starts here
            {x: 950, y: 700}, {x: 750, y: 700},
            // Shaft left wall — rope must thread between these two points
            {x: 620, y: 550}, {x: 350, y: 550},
            // Left ceiling slopes up toward the left wall
            {x: 200, y: 450}, {x: 0, y: 450}, {x: -400, y: 450}
        ]
    ],

    // ── Hazards ───────────────────────────────────────────────────────────────
    hazards: [
        // Laser slicing across the middle of the shaft gap!
        { type: 'laser', pts: [{ x: 620, y: 625 }, { x: 750, y: 625 }], onMs: 1000, offMs: 2200, warnMs: 400, damagePerSec: 50, thickness: 12 }
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    // No padScale — hub has explicit narrow width defined below
    targetCargo: 2,
    budget: 1800,
    timeLimit: 300,
    allowedTypes: ["normal"],
    collectionX: 180,       // Cargo depot further left — player must traverse to reach the shaft

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'acid',
        color: 'rgba(132, 204, 22, 0.7)',
        mistColor: 'rgba(132, 204, 22, 0.3)',
        surfaceY: 1200,     // Acid pool — highly buoyant but the monster still attacks
        drag: 0.9,
        buoyancy: -0.25,
        monsterDepth: 1500
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 700, width: 25, color: "#38bdf8", type: "normal", name: "The Pit" }
    ],

    // ── Palette (Crystal Caverns / Deep Purple) ───────────────────────────────
    palette: {
        skyTop:      '#040210',
        skyMid:      '#080420',
        skyBot:      '#0c0630',
        terrainFill: '#020108',
        rockEdge:    '#a855f7',
        rockGlow:    'rgba(168,85,247,',
        fog:         'rgba(168,85,247,0.08)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Hover directly above the shaft gap in the ceiling. Press E to extend the rope, Q to retract. SPACE releases the cargo. Return to HQ once both crates are in The Pit.",

    quests: [
        questPrimary('Lower 2 cargo into The Pit'),
        questNoCargoLost('No cargo lost in the acid', 450),
        questNoCrash(300),
    ],
});
