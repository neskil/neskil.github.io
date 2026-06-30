# Workspace Rules for Niklas Billgren's Portfolio

Welcome to the `neskil.github.io` portfolio workspace. 

## 🏗️ Project & Page Structure

This repository uses a simple folder-based routing structure. Each major page or application is fully isolated in its own directory with its own `index.html`.

- **Main Portfolio (`/index.html`)**: The root landing page featuring links (cards) to completed projects.
- **Content Pages**:
  - `/cv/`: Curriculum Vitae page.
  - `/games/`: Interactive library of completed games.
  - `/math/` & `/converter/`: Utility and reference applications.
- **Isolated Applications**: Complex projects like `/cargo-lander/`, `/space-trucking/`, and `/supply-chain/` contain their own dedicated HTML, logic (`/js`), assets, and styling.
- **Release Flow**: Develop new projects in their own directories. Do NOT add links to the root `index.html` until the project is completely finished, tested, and approved.

## 🛠️ Technology Stack & Styling

- **Vanilla Core**: Strictly client-side HTML, CSS, and JS (ES6+). Zero build tooling, bundlers, or frameworks (e.g., no React, no Tailwind).
- **Styling Guidelines**: 
  - Define styles using CSS variables (`:root`) in each page's `<style>` block or local `.css` file.
  - **Theme**: Dark slate backgrounds (`#0f172a`), translucent glassmorphism cards (`backdrop-filter: blur`), and vibrant accents.
  - **Typography**: Google Fonts `Outfit` (headings) and `Inter` (body).
- **Analytics**: Ensure the Google Analytics tag (`G-9GP823TGLB`) is included in the `<head>` of any newly released public page.

## 💻 Git & Version Control

- **Conventional Commits**: Use descriptive prefixes for commits (e.g., `feat:`, `fix:`, `perf:`, `chore:`).
- **Local Settings**: Never commit the `.claude/` directory; verify it remains excluded via `.gitignore`.
