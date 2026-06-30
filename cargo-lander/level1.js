// Level 1 — Local Distribution
// Biome: Grasslands / Verdant Basin.
// Your first contract: a rolling highland with a single receiving hub.
// Gently sloping terrain teaches the player that tilt kills cargo before anything else.
// The lake in the lower-right is purely decorative (rendered by game.js on L1 only).

registerLevel({
    name: "L1: Local Distribution",
    missionTitle: "Verdant Basin — First Delivery",
    description: "Welcome to the Verdant Basin, your first posting as a certified cargo pilot. A nearby logistics hub needs a routine freight drop — nothing exotic, just get the packages there in one piece. Tilt too far and they slide off the deck.",

    // ── Physics ──────────────────────────────────────────────────────────────
    gravity: 0.15,
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        [
            { x: -420, y: 660 },
            { x: -110, y: 710 },
            { x: 70, y: 690 },
            { x: 180, y: 700 },
            { x: 290, y: 660 },
            { x: 410, y: 680 },
            { x: 500, y: 620 },
            { x: 620, y: 560 },
            { x: 720, y: 570 },
            { x: 850, y: 580 },
            { x: 1000, y: 650 },
            { x: 1290, y: 720 },
            { x: 1700, y: 590 },
            { x: 4010, y: 2010 },
            { x: -1680, y: 2010 },
            { x: -920, y: 760 }
        ]
    ],
    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 1.5,
    targetCargo: 2,
    budget: 1000,
    timeLimit: 180,
    allowedTypes: ["normal"],

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'water',
        color: 'rgba(14, 165, 233, 0.4)',
        mistColor: 'rgba(14, 165, 233, 0.2)',
        surfaceY: 1300,
        drag: 0.92,
        buoyancy: -0.15,
        monsterDepth: 1600
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 750, color: "#38bdf8", type: "normal", name: "Verdant Depot" }
    ],

    // ── Palette (Grasslands) ──────────────────────────────────────────────────
    palette: {
        skyTop: '#04071a',
        skyMid: '#0a1628',
        skyBot: '#0d2010',
        terrainFill: '#0a1a08',
        rockEdge: '#4ade80',
        rockGlow: 'rgba(74,222,128,',
        fog: 'rgba(74,222,128,0.04)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Land slowly (< 2.0 m/s) or you'll bounce the cargo off the deck. When both crates are delivered, fly back to HQ to extract.",

    quests: [
        questPrimary('Deliver 2 cargo to Verdant Depot'),
        questNoCrash(300),
        questQuick('Finish with 1+ min remaining', 60, 200),
    ],
});
