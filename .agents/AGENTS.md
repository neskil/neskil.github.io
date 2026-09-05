# Agent Instructions — neskil.github.io

Niklas Billgren's portfolio: a static, no-build-step site. Each folder under
the root is a self-contained page served directly by GitHub Pages.

## Doc map — who owns what

Put a fact in exactly one place; point at it rather than restating it.

| Doc | Owns |
| --- | --- |
| **AGENTS.md** (this file) | Workspace-wide rules: structure, stack, styling, git conventions — what applies to every page. |
| **[README.md](../README.md)** | Site layout table, link-preview (OG image) recipe, local dev server, and the `tools/` checks (what they enforce and why). |
| `cargo-lander/CLAUDE.md`, `supply-chain/CLAUDE.md`, `3d-engine-poc/CLAUDE.md`, `golf3d/CLAUDE.md`, `viz-poc/CLAUDE.md` | Per-project standing instructions, versioning/cache-busting, and headless verification recipes. Read the relevant one before touching that folder — do not re-derive its test commands here, they drift. |
| `car/PLAN.md` | Open TODOs for the car cost calculator, ordered by impact. |

## Project & page structure

Folder-based routing — each major page or app is fully isolated with its own
`index.html`.

- **`/index.html`**: root landing page, card grid linking to completed projects.
- **Content pages**: `/cv/` (résumé), `/games/` (game library), `/math/` and
  `/converter/` (unit reference/conversion utilities).
- **Isolated applications**: `/cargo-lander/`, `/supply-chain/`,
  `/3d-engine-poc/` (Yard Master 3D), `/viz-poc/` (Data Room), and `/car/`
  each own their HTML, logic, assets, and styling — see the doc map above
  before working in any of them.
- **Release flow**: build new projects in their own isolated directory. Do
  NOT add a card for one to the root `index.html` until it's completed,
  tested, and approved. While a project is under active development, an
  "Under Construction" flip card (`#card-wip`, class `.flip-card`) can go in
  `<main class="grid">` on `index.html` to preview it — its CSS
  (`#card-wip`, `.flip-card`, `.wip-body`) stays defined in `index.html`
  even when unused, so a WIP card can be dropped back in without rebuilding
  the styles.

## Stack & styling

- **Vanilla only**: client-side HTML/CSS/JS (ES6+). No build tooling,
  bundlers, or frameworks (no React, no Tailwind).
- Define styles with CSS variables (`:root`) in each page's `<style>` block
  or local `.css` file.
- **Theme**: dark slate backgrounds (`#0f172a`), translucent glassmorphism
  cards (`backdrop-filter: blur`), vibrant accents. Fonts: Google Fonts
  `Outfit` (headings), `Inter` (body).
  - **Exception — `/car/`**: deliberately opts out, on the owner's
    instruction, for flat surfaces, hairline borders and a clay accent. Do
    not "restore" glassmorphism there — see the palette comment at the top
    of `car/style.css` and `car/PLAN.md`.
- **Analytics**: every newly released public page's `<head>` must include
  the Google Analytics tag (`G-9GP823TGLB`).

## Git & version control

- **Conventional commits**: descriptive prefixes (`feat:`, `fix:`, `perf:`,
  `chore:`, `docs:`).
- Never commit `.claude/` — verify it stays excluded via `.gitignore`.
- Once a feature branch is fully merged into `master` and pushed to origin,
  ask before deleting the branch (local + remote) or removing a git worktree
  for it — don't do it unprompted.

## Testing & verification

- **Before pushing, run both checks** — they are what CI runs, so a red one
  is a red build:

  ```
  node tools/run-tests.mjs      # every headless suite (~20s)
  node tools/check-site.mjs     # robots/sitemap/meta/link invariants
  ```

  Neither needs an install step. See README.md → "Checks" for what they
  cover and how suites are discovered.
- Plain pages (`/cv/`, `/games/`, `/math/`, `/converter/`, `/car/`) need no
  local server — open and exercise them directly over `file://`.
- `cargo-lander/`, `supply-chain/`, and `3d-engine-poc/` each have a real
  headless test suite and their own verification recipe — see that
  project's `CLAUDE.md` (do not hand-roll a substitute command here, it will
  go stale the moment their suite changes). `run-tests.mjs` runs them all in
  one go; the per-project recipes are still the ones to reach for when
  debugging a single failure.
- **A new project's test harness needs no wiring.** Name it `*tests.html`,
  give it a `<div id="summary">` that ends up saying "N passed" / "N failed",
  and the runner finds it. It also needs the `noindex` + `robots.txt`
  `Disallow` pair — `check-site.mjs` will fail until it has both.
- Regenerating an OG link-preview screenshot: see README.md → "Link
  previews" for the exact `chromium --headless` invocation and its gotchas
  (crop height, pinning entry animations, suppressing first-run modals).
