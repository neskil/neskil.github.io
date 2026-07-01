# Claude Code — Project Context

See **[README.md](README.md)** for full project documentation: architecture, file roles, load order, level/upgrade definitions, known bugs, and design decisions.

## Standing instructions
- After making a code change in this project, test it (browser preview + `tests.html` smoke suite at minimum; exercise any new mechanic directly via `preview_eval` against `game`/`game.physics` if it's not easily reachable by clicking through the UI), fix any bugs found, then commit and push — without waiting to be asked each time.
- The mission-select grid in `index.html` (`#mission-grid`) and the Dev-panel level-jump buttons are **hardcoded per level**, not generated from `levels[]`. Adding a new `levelN.js` requires manually adding its `<script>` tag in `index.html` *and* a corresponding button in both of those places, or it'll load but be unreachable from the menu.
