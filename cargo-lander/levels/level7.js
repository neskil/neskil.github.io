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
//   x:2550-2900 — a double-bend squeeze corridor (an S-curve, not a single narrow gap)
//   x:2900 — Reserve Tank (second refuel — the return leg needs it too)
//   x:3300 — Magma Chute (chute hub, wide catch zone)
//   x:3500 — Far East Depot (normal cargo)
// Fuel discipline is everything: there are now two pumps, and the second one exists
// specifically so the *return* trip is also a fuel-routing decision, not just the outbound one.
// The two laser gauntlets that used to guard the Fuel Pump and Valley Base were cut
// (2026-07-10 design pass) — lasers in a cave read as anti-theme, and dying late on a 4km
// run to a hard timer was more frustrating than skillful. Their job is done instead by two
// gas pockets sitting in each hub's approach corridor.
//
// BUGFIX (2026-07-13): those gas pockets were missing a `type` field, which made them fall
// into physics/atmosphere.js's default 'zone' branch — 25 dmg/frame, i.e. an unmarked
// instakill on a static polygon with zero telegraphing, not the "drift off course" hazard
// the design called for. Given `type:'zone'` a hazard also can't move (only gravwell/crusher
// have motion logic), so the old "drifting" description was never accurate either. Switched
// both to `type:'repulsor'`, which shoves the lander sideways with a constant force while
// inside — survivable, readable (animated flow-arrow render, cyan fill matches the cave
// palette), and does what a "gas pocket" should: push you off your line, not kill you for
// touching it.

//
// ── 2026-10 pass: it ran dry before the first pump ──────────────────────────
// With a stock 120-unit tank and three heavy crates, the depot → Fuel Pump leg
// (1300px of undulating cave) burned the whole tank: a careful pilot ran out at
// x≈1500, and the gas pocket guarding the pump then shoved it DOWN into the
// floor slope. And once refuel pads started charging (v0.28.0) the two pumps
// became an economy without anyone having priced them. Now:
//   • maxFuel 170 — long-range tanks, enough for any single leg with margin.
//   • Fuel Pump $3/unit (the cheap, busy one), Reserve Tank $6/unit (deep in
//     the squeeze, so you pay for the convenience). Fill up early or pay later.
//   • The two approach gas pockets are VENTS now: they puff on a cycle
//     (repulsor gustMs/calmMs — the zone flashes before it blows) instead of
//     blowing constantly, and neither pushes you into rock. The two in the
//     S-curve squeeze were cut: in a 150px bend any puff pins you to the rock. Reading the puff is
//     the skill; a constant shove only ever punished whoever was slowest.

registerLevel({
    name: "L7: The Deep Haul",
    missionTitle: "Bioluminescent Depths — Long Haul",
    description: "The Bioluminescent Depths stretch nearly 4 km underground. Multiple delivery nodes are buried deep in the cave network — each accepting a different cargo type, plus a vacuum chute near the far end for tethered loads you can't land with. You've got long-range tanks, but no tank lasts the round trip: the Fuel Pump past the first hub sells at $3 a unit, the Reserve Tank deep in the squeeze corridor at $6. Gas vents puff across the two mid-route approaches — they flash before they blow and will knock you back down the tunnel, so read them and go between puffs.",
    weather: 'bubbles',

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.13,
    wind: 0.03,       // Cave draft — mild most of the time, see windGust below
    windForce: 5,     // ~200px hands-off drift per draft surge
    windGust: { calm: 9, warn: 2.5, gust: 5, gustMult: 3.2 }, // periodic draft surge through the tunnel
    heavyCargo: true, // Cargo weight affects lander handling
    maxFuel: 170,     // long-range tanks: any one leg fits in a tank, the round trip doesn't
    fogBandBottomY: 200,
    fogBandTopY: -50,
    fogBandColor: '56,189,248',
    fogBandOpacity: 0.45,
    fogBandDamage: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Floor — undulates continuously along the full 4.2 km run; a double-bend
        // S-curve squeeze corridor around x:2600-2900 replaces the old single narrows
        [
            {x: -400, y: 550}, {x: 450, y: 550},
            {x: 600, y: 480}, {x: 750, y: 400}, {x: 950, y: 430}, {x: 1120, y: 380}, {x: 1192, y: 400}, {x: 1288, y: 400}, {x: 1400, y: 520}, {x: 1550, y: 600}, {x: 1592, y: 606}, {x: 1668, y: 606}, {x: 1700, y: 560}, {x: 1850, y: 400}, {x: 1950, y: 330},
            {x: 2050, y: 350}, {x: 2092, y: 376}, {x: 2188, y: 376}, {x: 2200, y: 400}, {x: 2280, y: 480},
            {x: 2450, y: 480}, {x: 2600, y: 420}, {x: 2680, y: 320}, {x: 2760, y: 420},
            {x: 2840, y: 320}, {x: 2892, y: 412}, {x: 2968, y: 412}, {x: 3000, y: 450}, {x: 3100, y: 550},
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

    // ── Hazards — gas vents. Each puffs for gustMs after calmMs of quiet, with
    // a warnMs flash first (repulsor duty cycle, physics/atmosphere.js). Pushes
    // are mostly BACKWARD (west) so a puff costs you ground, not your hull. ──
    hazards: [
        // Fuel Pump (x:1600) approach — puffs you back up the slope you came down.
        {
            type: 'repulsor',
            color: 'rgba(14, 165, 233, 0.18)',
            travelX: -0.2, travelY: -0.06,
            gustMs: 1100, calmMs: 2000, warnMs: 500,
            pts: [
                {x: 1480, y: 450}, {x: 1575, y: 450},
                {x: 1575, y: 560}, {x: 1480, y: 560}
            ]
        },
        // Valley Base (x:2100) approach — same idea, out of phase with the first.
        {
            type: 'repulsor',
            color: 'rgba(14, 165, 233, 0.18)',
            travelX: -0.2, travelY: 0.05,
            gustMs: 1100, calmMs: 2000, warnMs: 500, phaseOffset: 1500,
            pts: [
                {x: 1990, y: 230}, {x: 2075, y: 230},
                {x: 2075, y: 330}, {x: 1990, y: 330}
            ]
        }
        // (The S-curve squeeze used to carry two more vents. In a 150px bend any
        // puff pins you to the rock, so the squeeze is left to the draft surges.)
    ],

    // ── Collectibles (High-value exploration rewards) ─────────────────────────
    collectibles: [
        { type: 'cash', x: 1400, y: 350, value: 500 }, // High vault before Fuel Pump
        { type: 'fuel', x: 1800, y: 430, amount: 40 }, // Alcove after Fuel Pump
        { type: 'cash', x: 2350, y: 330, value: 500 }, // Above the bioluminescent lake
        { type: 'fuel', x: 2700, y: 290, amount: 40 }, // Squeeze corridor midpoint reserve (was y:360 — inside the floor spike)
        { type: 'fuel', x: 3100, y: 400, amount: 40 }  // Approach to Magma Chute
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    targetCargo: 3,
    deposit: 1000,
    fee: 350,
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
    },
    worldBounds: {
        bottomY: 1200,
        bottomAction: 'monster',
        leftMargin: 3000,
        rightMargin: 3000
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 1200, width: 80, color: "#3b82f6", type: "blue", name: "Deep Node" },
        { x: 2100, width: 80, color: "#10b981", type: "green", name: "Valley Base" },
        // Tethered only: it used to take anything, so the whole mission was
        // "fly every crate to the far end and dump it" and the typed hubs never mattered.
        { x: 3300, width: 140, color: "#f59e0b", type: "chute", name: "Magma Chute", accepts: ["tethered"] },
        { x: 3500, width: 80, color: "#38bdf8", type: "normal", name: "Far East Depot" },
        // Priced so the stop is a decision: cheap and early, or dear and deep.
        { x: 1600, width: 60, color: "#f59e0b", type: "refuel", name: "Fuel Pump", pricePerUnit: 3 },
        { x: 2900, width: 60, color: "#f59e0b", type: "refuel", name: "Reserve Tank", pricePerUnit: 6 }
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
    hint: "Fill up at the Fuel Pump ($3/unit) on the way out — the Reserve Tank deep in the squeeze charges double. Gas vents flash before they puff: hang back while one blows, then cross in the calm. Draft surges blow through the whole tunnel too — the wind meter warns you. Tethered boxes can't be landed with — grapple one in and skim it over the Magma Chute (x:3300), which only takes tethered loads. Return to HQ to extract.",

    quests: [
        questPrimary('Deliver 3 cargos across the cave'),
        questNoCargoLost('No cargo lost in the depths', 500),
        questNoCrash(700),
        questQuick('Finish in under 4 minutes', 120, 1000),
    ],
});
