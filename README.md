# neskil.github.io

Niklas Billgren's personal site, hosted on GitHub Pages. Static HTML/CSS/JS, no build step — each folder is a self-contained page served directly from the repo.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Landing page / portfolio hub linking out to the sections below. |
| `cv/` | Curriculum vitae site. |
| `cargo-lander/` | CargoLander — a browser-based 2D lander/logistics game with a custom physics engine. See [cargo-lander/README.md](cargo-lander/README.md) for internals. |
| `games/` | Interactive game library — a browsable/filterable catalog of games (`data.js` holds the entries). |
| `math/` | US → Metric mental math trainer. |
| `converter/` | Quick mental unit converter. |
| `car/` | Lease vs. finance vs. cash vs. monthly rental — US car cost-of-ownership calculator. Linked from the card grid on the landing page. |
| `supply-chain/` | Supply Chain Tycoon — a Mini-Metro-style logistics mini-game (roads, trucks, factories, orders). See [supply-chain/README.md](supply-chain/README.md). |
| `surprise/` | Misc. personal page ("Bacons lilla hörna"). |
| `favicon.ico` | Site-wide favicon. |

## Development

No build tooling — open any `index.html` directly, or serve the repo root with a static file server (recommended so relative `<script>`/`<link>` paths resolve correctly), e.g.:

```
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

Each subfolder is independent; check its own `index.html` (and any local README) before making changes.
