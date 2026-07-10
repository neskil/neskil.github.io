# Claude Code — Project Context

See **[README.md](README.md)** for full project documentation: architecture, file roles, load order, level/upgrade definitions, known bugs, and design decisions.

## Standing instructions
- After making a code change in this project, test it (browser preview + `tests.html` smoke suite at minimum; exercise any new mechanic directly via `preview_eval` against `game`/`game.physics` if it's not easily reachable by clicking through the UI), fix any bugs found, then commit and push — without waiting to be asked each time.
- The mission-select grid (`#mission-grid`) and Dev-panel level-jump buttons are auto-generated from `levels[]` by `game.js`'s `generateMissionUI()` — no manual button wiring needed. Adding a new `levelN.js` still requires manually adding its `<script>` tag in `index.html`, or it won't be registered at all.
