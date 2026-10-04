# Working in `cargo-packer/`

Read [`README.md`](README.md) and [`PLAN.md`](PLAN.md) before changing anything here.

## Non-negotiables

1. **`core/` never imports or references THREE.** If an algorithm needs
   `THREE.Vector3` or `THREE.Box3` to calculate placement or collision, the logic
   is in the wrong layer. `tests.html` loads `core/` with no WebGL context and
   will break loudly if this slips.
2. **Deterministic algorithms.** Given an identical manifest and random seed,
   heuristics must generate the exact same placement sequence every time.
3. **No box overlap.** Two placed boxes must never occupy the same volume
   ($AABB_A \cap AABB_B = \emptyset$). Headless tests assert this for all algorithms.
4. **No build step, no bundler, no framework.** Plain `<script>` tags, IIFEs or
   plain objects under `window.CargoPacker`.
5. **Analytics & Viewport.** Every entry page must carry the Google Analytics tag
   (`G-9GP823TGLB`) and `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.

## Running the tests

```sh
node tools/run-tests.mjs cargo-packer
node tools/check-site.mjs
```

Or headless Chrome directly:
```sh
chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=90000 \
  --dump-dom "file:///$(pwd)/cargo-packer/tests.html" | grep -oE 'ALL TESTS PASSED[^<]*|FAILED — [^<]*'
```

`cargo-packer/tests.html` must carry `<meta name="robots" content="noindex">` and
a matching `Disallow: /cargo-packer/tests.html` in `robots.txt` so crawlers never
index the test harness.
