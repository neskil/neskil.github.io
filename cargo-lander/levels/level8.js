// Level 8 — Orbital Gauntlet
// Biome: Derelict Orbital Station / Void-Violet.
// The finale: a chain of seven detached station platforms drifting in a zero-atmosphere
// void, connected by nothing but open space. There is no continuous ground — miss a
// platform and you fall into the abyss between them.
// NEW MECHANIC: laser hazards (hazard.type:'laser') — a defense grid of turret beams
// strung between platforms. Each fires on a telegraphed duty cycle (dim idle line →
// fast-flashing charge warning → solid firing beam) rather than being a static zone;
// physics.js checks lander distance to the beam segment only while `active`. Timing
// the crossing, not just dodging position, is the skill test here.
// Layout (left → right):
//   Platform A — HQ (startX: -160)
//   Platform B — Collection depot (collectionX: 200)
//   [Gauntlet Laser 1 — x:340-390]
//   Platform C — Command Deck (red hub, x:520)
//   [Gauntlet Laser 2 — x:660-710]
//   Platform D — Cryo Bay (blue hub, x:840), sits lower — forces a descent under Laser 2
//   Platform E — Fuel Cache (refuel, x:1060) — orbited by the unstable reactor gravity well
//   Platform F — Salvage Chute (chute hub, wide catch zone, x:1300)
//   [Gauntlet Laser 3 — x:1440-1490, the return gauntlet]
//   Platform G — Terminus Dock (normal hub, x:1660) — deliver, then thread all three
//               lasers again on the way back to HQ for extraction.
// A drifting reactor gravity well between E and F adds pull to the fuel-stop approach.

registerLevel({
    name: "L8: Orbital Gauntlet",
    missionTitle: "Derelict Station — Defense Grid Breach",
    description: "A scuttled orbital station still runs on backup power — its automated defense grid is very much online. Seven platform sections drift in the void, connected by nothing but vacuum. Four clients have cargo waiting across the wreck. The turret lasers fire on a fixed cycle: watch the flash, time the gap, and don't linger between platforms — there's nothing below you but the dark.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.10,           // Low — station void, but the reactor well fights this
    wind: 0.01,              // Faint atmosphere venting from hull breaches — not real "wind" in vacuum, kept tiny
    heavyCargo: true,


    // ── Terrain — seven detached rock/hull platforms, no continuous ground.
    // Silhouettes now vary more: Command Deck and Salvage Chute are visibly
    // tilted decks, and Cryo Bay's right edge tucks under Fuel Cache's left
    // edge — a genuine stacked overlap that forces a dip-then-climb approach
    // instead of a flat crossing ─────────────────────────────────────────────
    terrainPolygons: [
        // Platform A — HQ. startX:-160
        [
            { x: -320, y: 560 }, { x: -50, y: 560 },
            { x: -30, y: 640 }, { x: -300, y: 660 }
        ],
        // Platform B — Collection depot. collectionX:200
        [
            { x: 90, y: 580 }, { x: 340, y: 580 },
            { x: 360, y: 660 }, { x: 70, y: 680 }
        ],
        // Platform C — Command Deck (red hub, x:520) — tilted deck, low on the left
        [
            { x: 430, y: 470 }, { x: 640, y: 520 },
            { x: 660, y: 600 }, { x: 410, y: 560 }
        ],
        // Platform D — Cryo Bay (blue hub, x:840) — lower shelf, forces a dip under
        // Laser 2; right edge extended to tuck beneath Fuel Cache's left edge
        [
            { x: 740, y: 660 }, { x: 1010, y: 660 },
            { x: 1030, y: 740 }, { x: 720, y: 750 }
        ],
        // Platform E — Fuel Cache (refuel, x:1060) — small, tight approach near the
        // well; sits directly above Cryo Bay's overlapping right edge
        [
            { x: 990, y: 540 }, { x: 1150, y: 580 },
            { x: 1170, y: 660 }, { x: 970, y: 630 }
        ],
        // Platform F — Salvage Chute (chute hub, x:1300) — wide catch deck, tilted
        // down to the right
        [
            { x: 1180, y: 580 }, { x: 1440, y: 620 },
            { x: 1460, y: 700 }, { x: 1160, y: 670 }
        ],
        // Platform G — Terminus Dock (normal hub, x:1660) — final delivery + return
        // leg start, dips slightly lower than the rest for a descending finale
        [
            { x: 1560, y: 580 }, { x: 1800, y: 600 },
            { x: 1820, y: 680 }, { x: 1540, y: 660 }
        ]
    ],

    // ── Hazards — three laser gauntlet lines + one drifting debris-cloud zone ──
    hazards: [
        { type: 'gravwell', pts: [{x: 1180, y: 480}, {x: 1320, y: 620}, {x: 1180, y: 760}, {x: 1040, y: 620}], startForce: 0.6, endForce: 0.6, radius: 170, speed: 140 },
        // Gauntlet Laser 1 — between Collection Depot and Command Deck
        { type: 'laser', pts: [{ x: 360, y: 380 }, { x: 360, y: 700 }], onMs: 1300, offMs: 1700, warnMs: 450, damagePerSec: 35, thickness: 14 },
        // Gauntlet Laser 2 — between Command Deck and Cryo Bay, offset phase so it's
        // never in sync with Laser 1 (forces reading each beam independently)
        { type: 'laser', pts: [{ x: 685, y: 360 }, { x: 685, y: 760 }], onMs: 1300, offMs: 1700, warnMs: 450, damagePerSec: 35, thickness: 14, phaseOffset: 900 },
        // Gauntlet Laser 3 — the return gauntlet near Terminus Dock, fastest cycle
        { type: 'laser', pts: [{ x: 1465, y: 400 }, { x: 1465, y: 720 }], onMs: 1100, offMs: 1400, warnMs: 400, damagePerSec: 40, thickness: 14, phaseOffset: 400 },
        // Massive industrial crusher before the Terminus gauntlet
        {
            type: 'crusher',
            pts: [{ x: 1370, y: 300 }, { x: 1370, y: 750 }],
            waitUnloadedMs: 1200,
            crushMs: 200,
            waitLoadedMs: 600,
            retractMs: 1000,
            thickness: 50,
            color: '#f59e0b'
        },
        // Drifting debris-cloud zone (standard polygon hazard) over the reactor well —
        // stray shrapnel pulled into orbit by the gravity anomaly
        { pts: [{ x: 1100, y: 380 }, { x: 1180, y: 380 }, { x: 1200, y: 470 }, { x: 1080, y: 470 }] }
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 0.65,           // Tightest pads yet — small station decks, high stakes
    targetCargo: 4,
    deposit: 1000,
    fee: 400,
    timeLimit: 300,
    allowedTypes: ["normal", "red", "blue", "tethered"],
    startX: -160,
    collectionX: 200,

    // ── Environment — fall between platforms and there's only the void ───────
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
        bottomAction: 'monster'
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 520,  width: 90,  color: "#ef4444", type: "red",    name: "Command Deck"  },
        { x: 840,  width: 90,  color: "#3b82f6", type: "blue",   name: "Cryo Bay"      },
        { x: 1300, width: 150, color: "#f59e0b", type: "chute",  name: "Salvage Chute" },
        { x: 1660, width: 90,  color: "#38bdf8", type: "normal", name: "Terminus Dock" },
        { x: 1060, width: 60,  color: "#f59e0b", type: "refuel", name: "Fuel Cache"    }
    ],

    // ── Palette (Derelict Station / Void-Violet) ──────────────────────────────
    palette: {
        skyTop:      '#050110',
        skyMid:      '#0c0420',
        skyBot:      '#140430',
        terrainFill: '#03010a',
        rockEdge:    '#a855f7',
        rockGlow:    'rgba(168,85,247,',
        fog:         'rgba(244,114,182,0.08)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Watch each laser turret: a fast flash means it's about to fire, a solid magenta beam means it's live — wait it out, then cross while it's dark. The reactor well near the Fuel Cache pulls off-course, so fight the drift early. There's no ground between platforms, only the abyss — don't stall over a gap. Deliver all 4 cargos, then run the gauntlet again back to HQ.",

    quests: [
        questPrimary('Deliver 4 cargo across the derelict station, then breach the gauntlet home'),
        questNoCargoLost('No cargo lost to the void', 500),
        questNoCrash(800),
        questQuick('Finish in under 4 minutes', 60, 900),
    ],
});
