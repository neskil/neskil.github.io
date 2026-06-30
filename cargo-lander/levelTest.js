// TEST LEVEL — iteration sandbox, not part of the campaign
// Has every game element: wind, gravity well, segments, all cargo types, drone vehicle.
// Jump to it in browser console: game.startLevel(levels.length - 1)
// Or press: game.startTestLevel()

registerLevel({
    name: "TEST: Sandbox",
    missionTitle: "Dev Sandbox",
    description: "All systems active — segments, gravity well, wind, mixed cargo types.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.15,
    wind: 0.04,

    gravityWell: { x: 800, y: 400, strength: 0.5, radius: 160, orbitRadius: 80 },

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainType: "flat",

    // ── Mission ───────────────────────────────────────────────────────────────
    padScale: 1.2,
    targetCargo: 3,
    budget: 9999,
    timeLimit: 600,
    allowedTypes: ["normal", "red", "blue", "green"],

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 500,  color: "#38bdf8", type: "normal", name: "Alpha"   },
        { x: 700,  color: "#ef4444", type: "red",    name: "Beta"    },
        { x: 900,  color: "#3b82f6", type: "blue",   name: "Gamma"   },
        { x: 1100, color: "#10b981", type: "green",  name: "Delta"   },
    ],

    // ── Segments — one floating platform, one ramp, one wall ─────────────────
    segments: [
        { x1: 350, y1: 460, x2: 500, y2: 460 },           // flat platform
        { x1: 260, y1: 520, x2: 350, y2: 460 },           // ramp up to it
        { x1: 950, y1: 350, x2: 950, y2: 500 },           // vertical wall
        { x1: 1050, y1: 420, x2: 1150, y2: 420 },         // another platform
    ],

    // ── Palette (neutral grey/blue — easy on the eyes for long sessions) ──────
    palette: {
        skyTop:      '#04071a',
        skyMid:      '#060d1f',
        skyBot:      '#0a1628',
        terrainFill: '#020408',
        rockEdge:    '#38bdf8',
        rockGlow:    'rgba(56,189,248,',
        fog:         'rgba(56,189,248,0.04)',
    },

    hint: "DEV SANDBOX — all elements active. Console: game.startLevel(levels.length-1)",

    quests: [
        questPrimary('Deliver 3 cargo to any hub'),
        questNoCrash(100),
    ],
});
