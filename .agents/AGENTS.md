# Workspace Rules for Niklas Billgren's Portfolio

Welcome to the `neskil.github.io` portfolio workspace. 

## 🏗️ Project & Page Structure

This repository uses a simple folder-based routing structure. Each major page or application is fully isolated in its own directory with its own `index.html`.

- **Main Portfolio (`/index.html`)**: The root landing page featuring links (cards) to completed projects.
- **Content Pages**:
  - `/cv/`: Curriculum Vitae page.
  - `/games/`: Interactive library of completed games.
  - `/math/` & `/converter/`: Utility and reference applications.
- **Isolated Applications**: Complex projects like `/cargo-lander/`, `/supply-chain/`, `/3d-engine-poc/` (Yard Master 3D), and `/car/` contain their own dedicated HTML, logic, assets, and styling. `/car/` keeps its outstanding work in `car/PLAN.md` — read it before changing the cost model. `/cargo-lander/` has its own docs — read `cargo-lander/CLAUDE.md` (agent workflow) and `cargo-lander/README.md` (architecture) before working there. `/3d-engine-poc/` has `CLAUDE.md`, `README.md`, and `PLAN.md`.
- **Release Flow**: Develop new projects in their own isolated directories. Do NOT add active project cards to the root `index.html` until the project is completed, tested, and approved. When a new project is under active development, an "Under Construction" flip card (`#card-wip`, class `.flip-card`) can be added to `<main class="grid">` on `index.html` to offer a peek. Its CSS styles (`#card-wip`, `.flip-card`, `.wip-body`) are preserved in `index.html` so a WIP card can be re-inserted into the HTML grid whenever a new unreleased project is being built.

## 🛠️ Technology Stack & Styling

- **Vanilla Core**: Strictly client-side HTML, CSS, and JS (ES6+). Zero build tooling, bundlers, or frameworks (e.g., no React, no Tailwind).
- **Styling Guidelines**: 
  - Define styles using CSS variables (`:root`) in each page's `<style>` block or local `.css` file.
  - **Theme**: Dark slate backgrounds (`#0f172a`), translucent glassmorphism cards (`backdrop-filter: blur`), and vibrant accents.
    - **Exception — `/car/`**: deliberately opts out, on the owner's instruction, for flat surfaces, hairline borders and a clay accent. Do not "restore" the glassmorphism there; see the palette comment at the top of `car/style.css`.
  - **Typography**: Google Fonts `Outfit` (headings) and `Inter` (body).
- **Analytics**: Ensure the Google Analytics tag (`G-9GP823TGLB`) is included in the `<head>` of any newly released public page.

## 💻 Git & Version Control

- **Conventional Commits**: Use descriptive prefixes for commits (e.g., `feat:`, `fix:`, `perf:`, `chore:`).
- **Local Settings**: Never commit the `.claude/` directory; verify it remains excluded via `.gitignore`.
- **Worktree & Branch Cleanup**: Once a feature branch has been fully merged into `master` and pushed to origin, ask the user if they would like to clean up the branch. If approved, delete the local/remote feature branch and remove the local git worktree.

## 🧪 Testing & Verification
- **No Local Server Needed**: You do not need to run a local server (like python http.server or node) to test the game or run unit tests. You can open and test the application directly using the `file://` protocol.
- **Headless Testing command**:
  `chrome --headless=new --disable-gpu --virtual-time-budget=15000 --dump-dom "file:///c:/AntiGravity/neskil.github.io/supply-chain/tests.html"`

