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
//   Platform E — Fuel Cache (refuel, x:1060) — the unstable reactor well orbits below it
//   Platform F — Salvage Chute (chute hub, wide catch zone, x:1195)
//   [Crusher x:1350 on F's deck, then Gauntlet Laser 3 in the F-G gap at x:1510]
//   Platform G — Terminus Dock (normal hub, x:1660) — deliver, then thread all three
//               lasers again on the way back to HQ for extraction.
// A drifting reactor gravity well in the void under E and F adds pull to the
// fuel-stop approach and punishes stalling over the gap.
//
// 2026-10-14 fixes (v0.25.0), found by dropping the lander onto every pad:
//   - The well's loop used to pass straight over the Fuel Cache and Salvage Chute
//     decks. At strength 0.6 (force = strength x 3.5 x falloff^2 vs 0.08 thrust)
//     it pulled 5-12x harder than full thrust, so a lander sitting still on either
//     pad was flung off and pinballed to death within a second. The loop now
//     circles in the void beneath the decks at 0.45 — still a real tug on the
//     approach, no longer an unbeatable one.
//   - The crusher (x 1345-1395) stood inside the Salvage Chute pad's footprint
//     (1300-1397 at padScale 0.65). The chute moved west to x:1195 so the
//     crusher guards the deck between it and Laser 3 instead.

//
// 2026-10 pass — the grid had no top or bottom:
//   - Every beam ended in open void (y 360-760), so the "gauntlet" was optional:
//     climb to y:300 and fly over all three lasers and the crusher, or dive
//     under them. A derelict HULL TRUSS now spans the level overhead (y 100-215)
//     with bulkheads closing both ends and an emitter housing over each beam,
//     and the beams run from the truss down into the void (y 1250), so the only
//     way east is through them.
//   - The crusher stood in mid-air with both jaws floating (Level Check warned).
//     It now hangs from the truss and slams onto the Salvage Chute deck.
//   - Return windows were 650-800ms of dark beam on top of a lethal crusher. Each
//     beam now gives >= 900ms dark on the way home, and the crusher stays open
//     1.6s of its 3.25s cycle.
//   - The Salvage Chute took any cargo, so every crate could be dumped there
//     and the Terminus run skipped. It is tethered-only now.

registerLevel({
    name: "L8: Orbital Gauntlet",
    missionTitle: "Derelict Station — Defense Grid Breach",
    description: "A scuttled orbital station still runs on backup power — its automated defense grid is very much online. Seven platform sections drift in the void, connected by nothing but vacuum. Four clients have cargo waiting across the wreck. The station's hull truss runs overhead and the turret beams reach from it down into the void, so the only way through is between shots: watch the flash, time the gap, and don't linger between platforms — there's nothing below you but the dark.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.08,           // Low — station void, but the reactor well fights this
    wind: 0.01,              // Faint atmosphere venting from hull breaches — not real "wind" in vacuum, kept tiny
    heavyCargo: true,
    returnGauntlet: true,


    // ── Terrain — seven detached rock/hull platforms, no continuous ground.
    // Silhouettes now vary more: Command Deck and Salvage Chute are visibly
    // tilted decks, and Cryo Bay's right edge tucks under Fuel Cache's left
    // edge — a genuine stacked overlap that forces a dip-then-climb approach
    // instead of a flat crossing ─────────────────────────────────────────────
    terrainPolygons: [
        // Hull truss — the station's spine, overhead the whole run, with bulkhead
        // walls at both ends running down past the void (an inverted U). Its
        // underside carries an emitter housing for each beam and the crusher's
        // upper jaw, so nobody flies over or around the defense grid.
        // The outer top edge is invisibleEdge on purpose: nothing can reach it,
        // and as a floor it would be the ONLY floor over the open gaps, which
        // getPolygonSurfaceY() would then report as the ground there — every
        // crate below y:200 would count as fallen through the map.
        [
            { x: -460, y: 100, invisibleEdge: true }, { x: 1960, y: 100 }, { x: 1960, y: 1560 }, { x: 1880, y: 1560 },
            { x: 1880, y: 215 },
            { x: 1535, y: 215 }, { x: 1525, y: 240 }, { x: 1495, y: 240 }, { x: 1485, y: 215 },   // Laser 3
            { x: 1378, y: 215 }, { x: 1372, y: 248 }, { x: 1328, y: 248 }, { x: 1322, y: 215 },   // crusher
            { x: 710,  y: 215 }, { x: 700,  y: 240 }, { x: 670,  y: 240 }, { x: 660,  y: 215 },   // Laser 2
            { x: 385,  y: 215 }, { x: 375,  y: 240 }, { x: 345,  y: 240 }, { x: 335,  y: 215 },   // Laser 1
            { x: -380, y: 215 }, { x: -380, y: 1560 }, { x: -460, y: 1560 }
        ],
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
        { type: 'gravwell', pts: [{x: 1180, y: 790}, {x: 1290, y: 880}, {x: 1180, y: 970}, {x: 1070, y: 880}], startForce: 0.45, endForce: 0.45, radius: 170, speed: 140 },
        // Beams run from their truss housing (y:236) down into the void (y:1250):
        // no way over, no way under. Dark window = offMs - warnMs.
        // Gauntlet Laser 1 — between Collection Depot and Command Deck (dark 1250ms / 1000ms home)
        { type: 'laser', pts: [{ x: 360, y: 236 }, { x: 360, y: 1250 }], onMs: 1300, offMs: 1700, warnMs: 450, damagePerSec: 35, thickness: 14, onReturn: { onMs: 1000, offMs: 1400, warnMs: 400 } },
        // Gauntlet Laser 2 — between Command Deck and Cryo Bay, offset phase so it's
        // never in sync with Laser 1 (forces reading each beam independently)
        { type: 'laser', pts: [{ x: 685, y: 236 }, { x: 685, y: 1250 }], onMs: 1300, offMs: 1700, warnMs: 450, damagePerSec: 35, thickness: 14, phaseOffset: 900, onReturn: { onMs: 1000, offMs: 1400, warnMs: 400 } },
        // Gauntlet Laser 3 — the return gauntlet near Terminus Dock, fastest cycle (dark 1000ms / 900ms home)
        { type: 'laser', pts: [{ x: 1510, y: 236 }, { x: 1510, y: 1250 }], onMs: 1100, offMs: 1400, warnMs: 400, damagePerSec: 40, thickness: 14, phaseOffset: 400, onReturn: { onMs: 900, offMs: 1300, warnMs: 400 } },
        // Industrial crusher: hangs from the truss and slams onto the Salvage
        // Chute deck (y≈606 at x:1350), between the chute and Laser 3. Laser 3
        // sits in the F-G gap at x:1510, leaving a ~130px pocket between the two
        // to wait in with crates on deck (it was ~60px: nowhere to stand).
        {
            type: 'crusher',
            pts: [{ x: 1350, y: 240 }, { x: 1350, y: 625 }],
            waitUnloadedMs: 1600,
            crushMs: 250,
            waitLoadedMs: 500,
            retractMs: 900,
            thickness: 50,
            color: '#f59e0b'
        },
        // Drifting debris-cloud zone (standard polygon hazard) over the reactor well —
        // stray shrapnel pulled into orbit by the gravity anomaly
        { pts: [{ x: 1100, y: 380 }, { x: 1180, y: 380 }, { x: 1200, y: 470 }, { x: 1080, y: 470 }] }
    ],

    // ── Collectibles (High-stakes void pickups) ───────────────────────────────
    collectibles: [
        { type: 'cash', x: 360, y: 520, value: 600 }, // Inside Laser 1 beam line
        { type: 'cash', x: 780, y: 580, value: 600 }, // Above Cryo Bay void gap
        { type: 'fuel', x: 1180, y: 730, amount: 40 }, // On the reactor well's upper rim — dive for it
        { type: 'fuel', x: 1380, y: 500, amount: 40 }  // Adjacent to industrial crusher
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
        bottomAction: 'monster',
        leftMargin: 3000,
        rightMargin: 3000
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 520,  width: 90,  color: "#ef4444", type: "red",    name: "Command Deck"  },
        { x: 840,  width: 90,  color: "#3b82f6", type: "blue",   name: "Cryo Bay"      },
        { x: 1195, width: 150, color: "#f59e0b", type: "chute",  name: "Salvage Chute", accepts: ["tethered"] },
        { x: 1660, width: 90,  color: "#38bdf8", type: "normal", name: "Terminus Dock" },
        { x: 1060, width: 60,  color: "#f59e0b", type: "refuel", name: "Fuel Cache", pricePerUnit: 4 }
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
    hint: "Watch each laser turret: a fast flash means it's about to fire, a solid magenta beam means it's live — wait it out, then cross while it's dark. The reactor well near the Fuel Cache pulls off-course, so fight the drift early. There's no ground between platforms, only the abyss — don't stall over a gap. The beams run from the hull truss into the void — there is no going over or under. The crusher on the Salvage Chute deck stays open longer than it stays shut: wait for it to lift. Tethered loads go down the Salvage Chute; everything else has a dock. Deliver all 4 cargos, then run the gauntlet again back to HQ — it fires faster on the way home.",

    quests: [
        questPrimary('Deliver 4 cargo across the derelict station, then breach the gauntlet home'),
        questNoCargoLost('No cargo lost to the void', 500),
        questNoCrash(800),
        questQuick('Finish in under 4 minutes', 60, 900),
    ],
});
