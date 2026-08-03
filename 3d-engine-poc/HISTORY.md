# Changelog

## v0.2.0 — Yard Master

The proof of concept becomes a game.

**Added**

- **Campaign mode** with 12 line missions. Each gives a bay, a manifest and a
  set of terminal regulations; each unlocks the next on any medal.
- **Envelope scoring.** The rank is the volume of the smallest box containing
  every occupied slot — lowest wins. Par is a computed zero-waste pack of the
  same manifest, with gold/silver/bronze at multiples of it.
- **Grid placement** with real gravity, ghost preview, drop-column indicator,
  90° rotation and undo. Illegal placements are refused *and explained*: the
  HUD names the regulation that blocked them.
- **Seven regulations** — support ratio, crane reach, no top loading, heavy at
  the bottom, hazmat separation, reefer power points, and departure order.
- **New cargo:** 10ft boxes, 2×2 breakbulk crates and tank containers, plus
  reefer / hazmat / heavy traits and departure days.
- **Live envelope wireframe** in the scene, a medal track in the HUD, and a
  three-deep queue lookahead.
- **Scorecard** with envelope vs par, medal thresholds and best-result tracking.
- **`core/` logic layer** with no THREE dependency, and `tests.html` — 133
  assertions covering the grid, every rule, scoring, manifests, the save file
  and the whole campaign's validity, runnable headless over `file://`.
- Progress saved to `cargo3d.save.v1`; the portfolio card reads it.

**Changed**

- Restructured from a flat `js/` folder into `core/ · missions/ · render/ ·
  game/ · ui/ · styles/`. See `README.md`.
- Sandbox mode preserved in full — free spawn, reach stacker, train unloading,
  weather, X-ray, tier heatmap — now reachable from the main menu.
- Reach stacker driving is frame-rate independent (was per-frame constants).
- Camera rigs frame the bay by its bounding sphere and ease between presets.

## v0.1.0 — 3D Cargo Yard POC

- Three.js scene, procedural corrugated containers, orbit/isometric/crane
  cameras, click-to-spawn stacking, drivable reach stacker, freight train and
  semi truck props, five weather presets, X-ray view, stress heatmap,
  procedural audio.
