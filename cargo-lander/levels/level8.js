// Level 8 — Orbital Gauntlet
// Biome: Derelict orbital station / void-violet.
//
// 2026-10-16 rebuild. The old L8 was a row of seven slabs with three vertical
// beams and a crusher between them — a left-to-right timing test that played
// like L10 and L13 (both also gates on a beat). Playtest: "no fun", "too many
// similar ones". This station is about LASER GEOMETRY in low gravity instead:
//
//   • The station has two tiers hung from the hull truss on cables. Low
//     gravity (0.08) makes climbing between them cheap, so routes are 2-D.
//   • A pylon drops from the truss at x:970-1000 and seals the upper-right
//     concourse off from the rest. The only way up to Terminus Dock is from
//     BELOW, through a horizontal laser floor (Beam 2) — you time a climb,
//     not a crossing.
//   • The lower right is split by a DIAGONAL beam (Beam 3), so the safe gap
//     is a slanted strip, not a column.
//   • Beam 1 is the classic curtain between the west docks and the rest.
//   • The reactor well still orbits in the void below and drags at anything
//     flying the lower tier.
// No crushers here any more — presses belong to L13.
//
// Layout (y grows down; truss underside y:215, void surface y:1250):
//   HQ Dock        x -330..-60   upper   (start)
//   Cargo Module   x   40..340   lower   (depot)
//   ── Beam 1, x:450, truss → void ──
//   Fuel Pod       x  550..715   lower   (refuel $4, next to the reactor)
//   Command Deck   x  650..945   upper   (red)
//   ── pylon x:970-1000, truss → y:665 ──
//   Cryo Bay       x 990..1260   lower   (blue)
//   ── Beam 3, diagonal (1320,640) → (1440,1250) ──
//   Salvage Chute  x 1390..1620  lower   (tethered only)
//   ── Beam 2, horizontal y:640, x 1000 → 1980 ──
//   Terminus Dock  x 1590..1930  upper   (normal) — reached from below only

registerLevel({
    name: "L8: Orbital Gauntlet",
    missionTitle: "Derelict Station — Defense Grid Breach",
    description: "A scuttled orbital station still runs on backup power, and its defense grid is very much online. Two tiers of modules hang from the hull truss on cables. A beam curtain splits the west docks from the rest; a diagonal beam cuts across the lower tier; and Terminus Dock, up on the sealed east concourse, can only be reached by climbing through a laser floor. Watch the flash, time the gap.",
    hint: "Beams flash before they fire and stay dark for over a second. To reach Terminus Dock, go LOW past the pylon, hover under the laser floor and climb through it in the dark — low gravity makes the climb quick. The diagonal beam's safe side moves as you climb, so cross it level. The reactor well under the Fuel Pod pulls you down: keep some height on the lower tier. Everything fires faster on the way home.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.08,
    wind: 0,
    windVarianceEnabled: false,
    heavyCargo: true,
    returnGauntlet: true,

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 0.8,
    targetCargo: 4,
    deposit: 1000,
    fee: 400,
    timeLimit: 300,
    allowedTypes: ["normal", "red", "blue", "tethered"],
    startX: -250,
    startY: 430,
    collectionX: 120,
    collectionY: 800,

    quests: [
        questPrimary('Deliver 4 cargo across the station, then breach the grid home'),
        questNoCargoLost('No cargo lost to the void', 500),
        questNoCrash(800),
        questQuick('Finish in under 4 minutes', 60, 900),
    ],

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Hull truss + bulkheads (an inverted U enclosing the station). Emitter
        // housings for Beam 1 and Beam 3's anchor hang off its underside. The
        // outer top edge is invisibleEdge: nothing can reach it, and as the only
        // "floor" over the open gaps it would make getPolygonSurfaceY() report
        // the void as underground (every crate would count as lost).
        [
            { x: -460, y: 100, invisibleEdge: true }, { x: 2060, y: 100 }, { x: 2060, y: 1560 }, { x: 1980, y: 1560 },
            { x: 1980, y: 215 },
            { x: 475, y: 215 }, { x: 465, y: 240 }, { x: 435, y: 240 }, { x: 425, y: 215 },   // Beam 1 emitter
            { x: -380, y: 215 }, { x: -380, y: 1560 }, { x: -460, y: 1560 }
        ],
        // The pylon — seals the east concourse from the truss down to Beam 2.
        [
            { x: 968, y: 210 }, { x: 1002, y: 210 }, { x: 1002, y: 652 },
            { x: 985, y: 660 }, { x: 968, y: 652 }
        ],
        // HQ Dock (upper, west)
        [
            { x: -340, y: 460 }, { x: -330, y: 430 }, { x: -60, y: 430 }, { x: -40, y: 450 },
            { x: -60, y: 480 }, { x: -140, y: 492 }, { x: -170, y: 520 }, { x: -230, y: 520 },
            { x: -260, y: 494 }, { x: -320, y: 488 }
        ],
        // Cargo Module (lower, west) — the depot
        [
            { x: 30, y: 830 }, { x: 40, y: 800 }, { x: 320, y: 800 }, { x: 340, y: 830 },
            { x: 300, y: 870 }, { x: 230, y: 878 }, { x: 210, y: 905 }, { x: 150, y: 905 },
            { x: 130, y: 878 }, { x: 60, y: 870 }
        ],
        // Fuel Pod (lower, over the reactor)
        [
            { x: 550, y: 785 }, { x: 560, y: 760 }, { x: 700, y: 760 }, { x: 715, y: 785 },
            { x: 690, y: 810 }, { x: 640, y: 830 }, { x: 600, y: 830 }, { x: 580, y: 812 }
        ],
        // Command Deck (upper, middle) — red
        [
            { x: 650, y: 450 }, { x: 660, y: 420 }, { x: 920, y: 420 }, { x: 945, y: 445 },
            { x: 920, y: 470 }, { x: 830, y: 486 }, { x: 805, y: 502 }, { x: 760, y: 502 },
            { x: 740, y: 485 }, { x: 690, y: 478 }
        ],
        // Cryo Bay (lower, east) — blue
        [
            { x: 990, y: 885 }, { x: 1000, y: 860 }, { x: 1240, y: 860 }, { x: 1260, y: 885 },
            { x: 1230, y: 915 }, { x: 1160, y: 922 }, { x: 1140, y: 950 }, { x: 1090, y: 950 },
            { x: 1070, y: 922 }, { x: 1020, y: 910 }
        ],
        // Salvage Chute module (lower, far east)
        [
            { x: 1390, y: 825 }, { x: 1400, y: 800 }, { x: 1600, y: 800 }, { x: 1620, y: 825 },
            { x: 1590, y: 860 }, { x: 1520, y: 870 }, { x: 1450, y: 870 }, { x: 1410, y: 850 }
        ],
        // Terminus Dock (upper, the sealed east concourse) — normal
        [
            { x: 1590, y: 465 }, { x: 1600, y: 440 }, { x: 1900, y: 440 }, { x: 1930, y: 465 },
            { x: 1890, y: 500 }, { x: 1800, y: 505 }, { x: 1780, y: 535 }, { x: 1730, y: 535 },
            { x: 1710, y: 505 }, { x: 1620, y: 490 }
        ]
    ],

    // ── Hazards ───────────────────────────────────────────────────────────────
    // Dark window = offMs - warnMs. Every beam is dark >= 1s outbound and
    // >= 0.9s on the way home (returnGauntlet / onReturn).
    hazards: [
        // The reactor — orbits in the void under the west-middle of the station.
        { type: 'gravwell', pts: [{x: 640, y: 1000}, {x: 800, y: 1080}, {x: 640, y: 1160}, {x: 480, y: 1080}], startForce: 0.3, endForce: 0.3, radius: 170, speed: 120 },
        // Beam 1 — the west curtain, truss to void.
        { type: 'laser', pts: [{ x: 450, y: 236 }, { x: 450, y: 1250 }], onMs: 1300, offMs: 1700, warnMs: 450, damagePerSec: 35, thickness: 14, onReturn: { onMs: 1000, offMs: 1400, warnMs: 400 } },
        // Beam 2 — the laser floor under the east concourse, pylon to bulkhead.
        { type: 'laser', pts: [{ x: 1002, y: 640 }, { x: 1980, y: 640 }], onMs: 1200, offMs: 1800, warnMs: 500, damagePerSec: 35, thickness: 14, phaseOffset: 600, onReturn: { onMs: 1000, offMs: 1500, warnMs: 400 } },
        // Beam 3 — the diagonal across the lower east tier, hanging off Beam 2.
        { type: 'laser', pts: [{ x: 1320, y: 640 }, { x: 1440, y: 1250 }], onMs: 1100, offMs: 1600, warnMs: 450, damagePerSec: 40, thickness: 14, phaseOffset: 300, onReturn: { onMs: 900, offMs: 1400, warnMs: 400 } }
    ],

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 720,  y: 420, width: 90,  color: "#ef4444", type: "red",      name: "Command Deck"  },
        { x: 1060, y: 860, width: 90,  color: "#3b82f6", type: "blue",     name: "Cryo Bay"      },
        { x: 1430, y: 800, width: 150, color: "#f59e0b", type: "chute",    name: "Salvage Chute", accepts: ["tethered"] },
        { x: 1700, y: 440, width: 90,  color: "#38bdf8", type: "normal",   name: "Terminus Dock" },
        { x: 600,  y: 760, width: 60,  color: "#f59e0b", type: "refuel",   name: "Fuel Pod", pricePerUnit: 4 }
    ],

    // ── Collectibles ──────────────────────────────────────────────────────────
    collectibles: [
        { type: 'cash', x: 450,  y: 600, value: 500 },  // in Beam 1's line, mid-height
        { type: 'fuel', x: 640,  y: 960, amount: 40 },  // right on the reactor's rim — dive for it
        { type: 'cash', x: 1500, y: 600, value: 600 },  // just under the laser floor
        { type: 'cash', x: 1950, y: 300, value: 400 }   // top corner of the sealed concourse
    ],

    // ── Decals (render/decals.js) ─────────────────────────────────────────────
    decals: [
        // Conduit along the truss and the cables the modules hang from
        { type: 'pipe', x: -380, y: 228, x2: 425, y2: 228, s: 0.8 },
        { type: 'pipe', x: 475, y: 228, x2: 968, y2: 228, s: 0.8 },
        { type: 'pipe', x: 1002, y: 228, x2: 1980, y2: 228, s: 0.8 },
        { type: 'cable', x: -300, y: 236, x2: -300, y2: 432, sag: 4 }, { type: 'cable', x: -90, y: 236, x2: -90, y2: 432, sag: 4 },
        { type: 'cable', x: 690, y: 236, x2: 690, y2: 422, sag: 4 }, { type: 'cable', x: 900, y: 236, x2: 900, y2: 422, sag: 4 },
        { type: 'cable', x: 1640, y: 236, x2: 1640, y2: 442, sag: 4 }, { type: 'cable', x: 1880, y: 236, x2: 1880, y2: 442, sag: 4 },
        { type: 'cable', x: 60, y: 236, x2: 60, y2: 802, sag: 6 }, { type: 'cable', x: 300, y: 236, x2: 300, y2: 802, sag: 6 },
        { type: 'cable', x: 575, y: 236, x2: 575, y2: 762, sag: 6 }, { type: 'cable', x: 690, y: 520, x2: 690, y2: 762, sag: 3 },
        { type: 'cable', x: 1020, y: 670, x2: 1020, y2: 862, sag: 3 }, { type: 'cable', x: 1590, y: 650, x2: 1590, y2: 802, sag: 3 },
        // HQ Dock
        { type: 'solar', x: -310, y: 430 }, { type: 'beacon', x: -50, y: 440, color: '#22c55e' },
        { type: 'dish', x: -140, y: 430, s: 0.8 },
        // Cargo Module
        { type: 'crates', x: 280, y: 800, n: 3 }, { type: 'beacon', x: 330, y: 815 }, { type: 'beacon', x: 45, y: 815 },
        // Fuel Pod
        { type: 'tank', x: 675, y: 760, s: 0.5, color: '#b45309' }, { type: 'sign', x: 560, y: 760, s: 0.7 },
        // Command Deck
        { type: 'dish', x: 880, y: 420 }, { type: 'beacon', x: 940, y: 440 }, { type: 'solar', x: 690, y: 480, s: 0.7 },
        // Cryo Bay
        { type: 'tank', x: 1200, y: 860, s: 0.6, color: '#0ea5e9' }, { type: 'barrels', x: 1015, y: 860, n: 2, color: '#0284c7' },
        { type: 'beacon', x: 1250, y: 875 },
        // Salvage Chute
        { type: 'sign', x: 1595, y: 800, s: 0.8 }, { type: 'beacon', x: 1400, y: 812 },
        // Terminus Dock
        { type: 'solar', x: 1890, y: 440 }, { type: 'dish', x: 1630, y: 440, s: 0.9 }, { type: 'beacon', x: 1925, y: 458, color: '#22c55e' },
        { type: 'flag', x: 1820, y: 440, color: '#a855f7' }
    ],

    // ── Environment — fall between modules and there's only the void ─────────
    outOfBounds: {
        type: 'void',
        color: 'rgba(88, 28, 135, 0.55)',
        mistColor: 'rgba(168, 85, 247, 0.25)',
        surfaceY: 1250,
        drag: 0.9,
        buoyancy: -0.05,
    },
    worldBounds: {
        bottomY: 1500,
        bottomAction: 'monster',
        leftMargin: 3000,
        rightMargin: 3000
    },

    // ── Palette (Derelict Station / Void-Violet) ──────────────────────────────
    palette: {
        skyTop:      '#050110',
        skyMid:      '#0c0420',
        skyBot:      '#140430',
        terrainFill: '#0b0718',
        rockEdge:    '#a855f7',
        rockGlow:    'rgba(168,85,247,',
        fog:         'rgba(244,114,182,0.08)',
    },
});
