// Level 5 — Rush Hour
// Biome: Neon Downtown / Magenta-Cyan megacity at night.
//
// Rebuilt 2026-08-02 (was "The Needle's Eye", a crystal-cavern winch-drop level).
// The old level's premise never actually existed in its geometry: the "shaft" was a
// downward wedge in the ceiling polygon, not an enclosed passage, so the lander could
// simply fly around the "throat" and set cargo down by hand — the winch, the funnel and
// the alcove were all decorative. Rather than patch a mechanic the terrain didn't
// support, this is a full replacement built around ambient traffic as the primary
// obstacle.
//
// Layout (left → right), street level y:1300, rooftops y:560-1010:
//   x -640..-380  West parapet block (map edge)
//   x -380..180   HQ Tower — rooftop helipad (startX -260, startY 640)
//   x  180..330   Service slot down to street
//   x  330..800   Depot Tower — cargo depot (collectionX 430) + rooftop Fuel Rig (x 650)
//   x  800..1580  THE GAP — old canal district, no towers. The sky-lane crossing.
//                 Floor dips into two flooded basins with a raised quay between them;
//                 Undercity Dock (blue cargo) sits on the quay at y:1200.
//   x 1580..2080  Skyport Tower — Skyport 9 (normal cargo) at x:1780, y:560.
//                 A rooftop flare vent guards the western approach lip.
//   x 2080..2230  East slot (cash pickup at the bottom)
//   x 2230..2600  East block + a decorative comms needle spiking to y:220
//
// Why the traffic works as an obstacle (physics/atmosphere.js updateAmbientTraffic):
// trucks hold `targetY = min(baseY, highestTerrainAhead - 140)` with a ±500px lookahead,
// so the lane altitude is set by the ROOF HEIGHTS, not by the config band alone. With
// roofs at 560-700 the lane settles ~420-500 — i.e. 60-280px directly above every pad in
// the level. ambientTrafficMinY/MaxY (240/600) bound the band; the roofs do the rest.
// The comms needle at x:2300 (top y:220) deliberately yanks EASTBOUND trucks up to ~80
// over the Skyport approach, so they come diving back down across it — the lane
// undulates instead of being a flat conveyor.
// Corollary: this level must NOT get a ceiling terrain polygon. `obstacleHeight` takes
// the min y of every segment in range, so a ceiling would make safeAlt hugely negative
// and every truck would climb into it (the same reason L4 sets ambientTrafficRate:0).
// The altitude cap is instead the existing police mechanic — updatePolice() spawns a
// cruiser after ~4s above y:-400, which is 640px clear of the lane top, plus a hard
// worldBounds ceiling at -900 for anyone who outruns the cruiser.
//
// Two routes, two hubs, so both altitudes get used:
//   HIGH ROAD — roof to roof at lane altitude, straight through the traffic → Skyport 9.
//   LOW ROAD  — drop into the Gap under the lane → Undercity Dock. Traffic can't reach
//               down there, so the tax is a horizontal security beam over the quay
//               (time it and drop straight in) or a longer sideways thread past the
//               vertical beam in the west basin.

registerLevel({
    name: "L5: Rush Hour",
    missionTitle: "Neon Downtown — Rush Hour Run",
    description: "Downtown is gridlocked and the sky lanes are worse. Freight traffic streams across the rooftops all night, and the grid runs barely a hundred metres above every pad you need to touch. Standard freight goes up to Skyport 9 on the eastern tower — straight through the lanes. Blue-tagged freight goes down to Undercity Dock on the old canal quay, below the traffic but behind a security beam. Climbing over the grid to skip it will put a patrol cruiser on your tail.",
    hint: "The lanes sit just above the roofs, so you're in traffic the moment you lift off. Watch for the brake-lights and the honk — trucks slow when you're right in front of them, but they will not stop. Take the high road east to Skyport 9 and time the rooftop flare vent on its western lip. Take blue cargo down into the Gap instead: the long beam over the quay is on a duty cycle, so wait for it to go dark and drop straight in — or slip down the narrow window against the depot tower's east wall and thread the vertical beam sideways. Top up at the Fuel Rig on the depot roof between runs. Don't climb above the grid to cheat the crossing — patrol will scramble.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.13,
    wind: 0.03,               // Street-canyon draft
    windGust: { calm: 7, warn: 2, gust: 5, gustMult: 3 },  // downdrafts funnelling between towers
    weather: 'rain',
    backgroundType: 'city',

    // ── Terrain decoration ────────────────────────────────────────────────────
    // The towers ARE the terrain here, so the silhouettes get glazed rather than
    // given the default rock-edge noise (which read as wobbly concrete on a
    // skyline). drawTerrainFacades() works the building extents out from the
    // geometry — windows run from each column's own roof down to the polygon's
    // lowest floor, and the street/basin columns are skipped automatically.
    terrainDecor: 'facade',
    facade: {
        cellW: 32, cellH: 42,
        windowW: 13, windowH: 18,
        litChance: 0.42,
        warmRatio: 0.55,
        warmColor: '#fdba74',
        coolColor: '#67e8f9',   // reads as the palette's cyan rockEdge, lit
        flicker: 0.05,
        depth: 300,
        parapet: true,
        mullions: true,
    },

    // ── Traffic — the level's main hazard ─────────────────────────────────────
    ambientTrafficRate: 5,    // cap: 25 concurrent, ~8 on screen at any moment
    ambientTrafficSpeed: 1.4, // rush hour
    ambientTrafficMinY: 240,  // lane band; roof-clearance clamping pulls the
    ambientTrafficMaxY: 600,  // effective floor of the lane to ~420-500

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Downtown block — one crenellated skyline. Every rooftop x has exactly one
        // upward-facing floor segment, so getPolygonSurfaceY() resolves pads to the
        // roof they sit on rather than to the street below.
        [
            {x: -900, y: 1300},
            {x: -640, y: 1300},
            {x: -640, y: 1010},          // west parapet block
            {x: -380, y: 1010},
            {x: -380, y: 640},           // HQ Tower
            {x:  180, y: 640},           // HQ roof — helipad at x:-260
            {x:  180, y: 1300},          // service slot
            {x:  330, y: 1300},
            {x:  330, y: 700},           // Depot Tower
            {x:  800, y: 700},           // depot roof — cargo pad x:430, fuel rig x:650
            {x:  800, y: 1300},          // down into THE GAP
            {x:  850, y: 1420},          // west basin
            {x: 1120, y: 1420},
            {x: 1160, y: 1200},          // quay ramp
            {x: 1400, y: 1200},          // quay top — Undercity Dock at x:1230
            {x: 1440, y: 1420},          // east basin
            {x: 1540, y: 1420},
            {x: 1580, y: 1300},
            {x: 1580, y: 560},           // Skyport Tower
            {x: 2080, y: 560},           // skyport roof — hub at x:1780
            {x: 2080, y: 1300},          // east slot
            {x: 2230, y: 1300},
            {x: 2230, y: 900},           // east block
            {x: 2600, y: 900},
            {x: 2600, y: 1300},
            {x: 2900, y: 1300},
            // Enclosure
            {x: 2900, y: 2100},
            {x: -900, y: 2100}
        ],
        // Comms needle on the east block. Scenery, but load-bearing for two things:
        // it drags terrainTopY up to 220 so the city parallax layers (render/background.js
        // clamps them to terrainTopY+80) can actually draw a skyline instead of being
        // squashed below the roofline, and it makes eastbound traffic climb over the
        // Skyport approach (see header note).
        [
            {x: 2300, y: 220}, {x: 2350, y: 220},
            {x: 2360, y: 900}, {x: 2290, y: 900}
        ]
    ],

    // ── Hazards ───────────────────────────────────────────────────────────────
    hazards: [
        // Rooftop flare vent on the Skyport's western lip — the high road's approach
        // tax. Comes in from above or from the east to skip it.
        {
            type: 'incinerator',
            pts: [{x: 1596, y: 560}, {x: 1704, y: 560}, {x: 1692, y: 396}, {x: 1608, y: 396}],
            onMs: 1500, offMs: 2100, warnMs: 550, damagePerSec: 30
        },
        // Security grid over the canal district — the low road's tax, and the two
        // beams meet at (940,1010) so there is no third way in. The horizontal run
        // covers everything from the corner east to the Skyport tower wall, so the
        // quay can't just be dropped into from straight above. Both sit far under
        // the sky lane and never interfere with the rooftop crossing.
        {
            type: 'laser',
            pts: [{x: 940, y: 1010}, {x: 1560, y: 1010}],
            onMs: 1200, offMs: 1700, warnMs: 450, damagePerSec: 35, thickness: 14
        },
        // The vertical leg, dropping into the west basin. Leaves a 140px descent
        // window between the depot tower wall (x:800) and the corner — get below
        // the grid there and this beam is still between you and the quay. Offset
        // phase so the two are never dark together for long.
        {
            type: 'laser',
            pts: [{x: 940, y: 1010}, {x: 940, y: 1430}],
            onMs: 1100, offMs: 1800, warnMs: 400, damagePerSec: 30, thickness: 12,
            phaseOffset: 850
        }
    ],

    // ── Water — flooded canal basins either side of the quay ──────────────────
    waterBodies: [
        {
            hasBoat: false, hasFish: false,
            color: 'rgba(34, 197, 94, 0.35)',
            surfaceColor: '#4ade80',
            pts: [
                {x: 855, y: 1350}, {x: 1118, y: 1350},
                {x: 1118, y: 1425}, {x: 855, y: 1425}
            ]
        },
        {
            hasBoat: false, hasFish: false,
            color: 'rgba(34, 197, 94, 0.35)',
            surfaceColor: '#4ade80',
            pts: [
                {x: 1448, y: 1360}, {x: 1536, y: 1360},
                {x: 1536, y: 1425}, {x: 1448, y: 1425}
            ]
        }
    ],

    // ── Scenery ───────────────────────────────────────────────────────────────
    buildings: [
        { x: -60,  type: 'antenna' },   // HQ roof mast
        { x: 730,  type: 'antenna' },   // depot roof mast (clear of both pads)
        { x: 2000, type: 'antenna' },   // skyport roof mast (east of the hub)
        { x: 2470, type: 'silo'    }    // east block tank
    ],

    // ── Collectibles ──────────────────────────────────────────────────────────
    collectibles: [
        // Dead centre of the sky lane over the Gap — the densest traffic on the map.
        { type: 'cash', x: 1180, y: 430, value: 400 },
        // Low-road reward, in the descent window west of the security grid's corner.
        { type: 'fuel', x: 860, y: 1200, amount: 40 },
        // Bottom of the east slot — a detour off the return leg.
        { type: 'cash', x: 2150, y: 1080, value: 250 }
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 1.1,
    targetCargo: 3,
    deposit: 1000,
    fee: 300,
    timeLimit: 280,
    allowedTypes: ["normal", "blue"],

    startX: -260,
    startY: 640,        // explicit: rooftop pads must not snap to the street below
    collectionX: 430,
    collectionY: 700,

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'goo',
        color: 'rgba(74, 222, 128, 0.5)',
        mistColor: 'rgba(74, 222, 128, 0.2)',
        surfaceY: 1520,     // sump below street level — only reachable off the map edges
        drag: 0.9,
        buoyancy: -0.12,
    },
    worldBounds: {
        ceilingY: -900,          // hard cap; the police cruiser already scrambles at -400
        ceilingAction: 'police',
        bottomY: 1900,
        bottomAction: 'pushback',
        leftMargin: 950,
        rightMargin: 500,
        lateralAction: 'pushback'
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 1780, width: 110, color: "#38bdf8", type: "normal", name: "Skyport 9",     y: 560  },
        { x: 1230, width: 110, color: "#3b82f6", type: "blue",   name: "Undercity Dock", y: 1200 },
        { x: 650,  width: 60,  color: "#f59e0b", type: "refuel", name: "Fuel Rig",       y: 700  }
    ],

    // ── Palette (Neon Downtown — magenta haze, cyan-lit concrete) ─────────────
    palette: {
        skyTop:      '#0a0418',
        skyMid:      '#1a0930',
        skyBot:      '#2e0f3e',
        terrainFill: '#080511',
        rockEdge:    '#22d3ee',
        rockGlow:    'rgba(34,211,238,',
        fog:         'rgba(217,70,239,0.10)',
    },

    quests: [
        questPrimary('Deliver 3 cargo across the downtown grid'),
        questNoCrash(500),
        questQuick('Clear the grid in under 3 minutes', 100, 400),
    ],
});
