// Level 5 — The Needle's Eye
// Biome: Crystal Caverns / Deep Purple.
// Drone-only level. The hub is at the bottom of a shaft that's too narrow to enter directly.
// The player must hover above the opening, extend the winch (E/Q), and lower cargo in by rope.
// Ceiling terrain encloses the map into a true cave — no flying above the canopy.
// The shaft is a proper funnel now (wide mouth, narrow throat) so rope control is the test,
// not a race against a second timer — the crossing laser was cut (2026-07-10 design pass);
// the incinerator vent on the pit floor is the level's one hazard.
// A shallow alcove in the shaft's left wall holds an optional cash pickup, reachable only by
// swinging the winch sideways mid-descent.
// Underground easter egg: purple crystal stalagmites pulse beneath the cave floor.

registerLevel({
    name: "L5: The Needle's Eye",
    missionTitle: "Crystal Caverns — Precision Winch Drop",
    description: "The Pit is a crystal-lined shaft deep inside the Cavern Tier — far too narrow for the drone body to enter. Hover above the opening, extend your winch (E/Q keys), and lower each cargo crate down by rope through the narrow throat. One slip and the crate swings into the crystal walls.",
    weather: 'snow',

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.10,          // Lighter gravity — easier hovering while managing the rope
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Ground — jagged crystal stalagmite floor; The Pit hub sits in the central basin
        [
            // Left outer shelf (HQ spawn, cargo collection at x:180)
            {x: -400, y: 700}, {x: 100, y: 660}, {x: 150, y: 700}, {x: 250, y: 800},
            // Central basin floor — stalagmite bumps flank The Pit hub (x:700)
            {x: 350, y: 770}, {x: 450, y: 800}, {x: 520, y: 880}, {x: 600, y: 950},
            {x: 750, y: 920}, {x: 850, y: 950}, {x: 950, y: 920}, {x: 1100, y: 950},
            // Right outer shelf — rises back up to match left side
            {x: 1200, y: 870}, {x: 1300, y: 800}, {x: 1550, y: 770}, {x: 1800, y: 800},
            // Enclosure
            {x: 1800, y: 1800}, {x: -400, y: 1800}
        ],
        // Ceiling — seals the level into a cave; the shaft is a true funnel now, wide at the
        // mouth (x:700-1050) and narrowing to a tight throat around x:820-860 for precision
        [
            {x: -400, y: -400}, {x: 1800, y: -400},
            // Right ceiling drops down toward the funnel mouth
            {x: 1800, y: 550}, {x: 1200, y: 550},
            // Funnel right wall — narrows down to the throat
            {x: 1050, y: 560}, {x: 970, y: 620}, {x: 900, y: 700}, {x: 860, y: 730},
            // Throat — the tight gap the rope must thread
            {x: 820, y: 730},
            // Funnel left wall — widens back out, with a shallow alcove pocket
            {x: 780, y: 700}, {x: 710, y: 620}, {x: 660, y: 600}, {x: 620, y: 640}, {x: 590, y: 600},
            {x: 550, y: 550}, {x: 350, y: 550},
            // Left ceiling slopes up toward the left wall
            {x: 200, y: 450}, {x: 0, y: 450}, {x: -400, y: 450}
        ]
    ],

    // ── Hazards ───────────────────────────────────────────────────────────────
    hazards: [
        // Incinerator vent on the right side of the pit floor — the level's one timed threat
        { type: 'incinerator', pts: [{x: 800, y: 950}, {x: 880, y: 880}, {x: 1000, y: 950}], onMs: 1500, offMs: 2000, warnMs: 500, damagePerSec: 30 }
    ],

    // ── Collectibles ──────────────────────────────────────────────────────────
    // Cash pickup tucked in the shaft's alcove pocket — needs a sideways winch swing to reach
    collectibles: [
        { type: 'cash', x: 620, y: 610, value: 250 },
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    // No padScale — hub has explicit narrow width defined below
    targetCargo: 2,
    budget: 900,
    timeLimit: 240,
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
    hint: "Hover above the narrow throat in the shaft ceiling. Press E to extend the rope, Q to retract. SPACE releases the cargo. An incinerator vent flares on the pit floor below — time your lower between its cycles. A shallow alcove partway down the shaft's left wall holds a risky cash pickup if you can swing the rope in without snagging. Return to HQ once both crates are in The Pit.",

    quests: [
        questPrimary('Lower 2 cargo into The Pit'),
        questNoCargoLost('No cargo lost in the acid', 450),
        questNoCrash(300),
    ],
});
