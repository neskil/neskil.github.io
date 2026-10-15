// levels.js — Level registry and shared helpers
// Load order: after level1..levelN.js, before audio/shaders/physics/game.js
//
// Each levelN.js calls registerLevel(cfg) to add itself in order.
// game.js reads the global `levels` array and `upgradeCatalog`.

const levels = [];
function registerLevel(cfg) { levels.push(cfg); }

// ── Upgrade catalog ────────────────────────────────────────────────────────
// Moved to upgrades.js

// ── Quest helpers ──────────────────────────────────────────────────────────
// Convenience constructors so level files stay DRY.

function questPrimary(text) {
    return { id: 'primary', text, type: 'primary' };
}
function questNoCrash(reward = 300) {
    return { id: 'no_crash', text: 'Zero crashes', type: 'bonus', reward };
}
function questNoCargoLost(text = 'No cargo lost', reward = 250) {
    return { id: 'no_cargo_lost', text, type: 'bonus', reward };
}
// timeGoal is the time still LEFT on the mission clock when you extract
// (missionTimer counts down) — not the elapsed time. "Under 60s" on a 180s
// mission is timeGoal 120. tests.html checks every level's text against this.
function questQuick(text, timeGoal, reward = 200) {
    return { id: 'quick', text, type: 'bonus', reward, timeGoal };
}
function questSurviveWorm(reward = 500) {
    return { id: 'survive_worm', text: 'Survive the worm', type: 'bonus', reward };
}
