/* Every texture in the game, drawn into a canvas at load. No image files to
   ship, no requests to fail, and the palette moves with the theme.

   This file exists so that "what a surface is made of" is one place and
   "where the surfaces go" is another. It also owns the one rule that keeps
   the texture count down:

   **A surface texture is shared, and the tiling lives in the geometry.**

   Each pad used to get its own clone of the grass with `repeat` set to that
   pad's size, which is one GPU texture per pad — a 512² green uploaded a
   dozen times over for a hole with a dozen pads, and a fresh dozen on every
   hole load. Instead the pad's own UVs are scaled when it is built (see
   `render.addPad`), so one texture serves every pad of a kind at every size.
   `SCALE` is the world size one tile covers and is the number both halves
   have to agree on, which is why it lives here beside the textures rather
   than beside the geometry.

   The one thing that still needs `repeat` is the green's bump map, which
   tiles finer than its colour map. That ratio is a constant rather than a
   pad size, so a single shared texture carries it. */
(function (G3) {
    'use strict';

    /* How many world units one tile of each surface covers. Change one of
       these and the pads retile; nothing else has to be told. */
    var SCALE = { green: 3.5, sand: 2, wood: 2, rough: 2 };
    var GRASS_BUMP_SCALE = 0.8;      // the blades are finer than the mow bands

    var maxAniso = 1;
    var shared = {};                  // the per-theme surface set, disposed together
    var rocks = {};                   // by tint, kept for the life of the page
    var extras = {};                  // dimple, dot — built once, never rebuilt

    function canvasTex(size, draw) {
        var cv = document.createElement('canvas');
        cv.width = cv.height = size;
        draw(cv.getContext('2d'), size);
        var t = new THREE.CanvasTexture(cv);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        return t;
    }

    /* Grass is three things stacked: a mow pattern, a mat of blades, and dirt.
       The mow bands are what make a green read as a surface rather than a flat
       colour when the camera is low, the blades give it something for the light
       to catch at close range, and the mottling stops the tiling from showing
       as a grid on the big pads. */
    function grassTexture(theme) {
        return canvasTex(512, function (g, s) {
            var i, n, x, y, a;
            g.fillStyle = theme.grass[0];
            g.fillRect(0, 0, s, s);

            // Mow bands, with a soft seam so the roller looks like a roller.
            for (i = 0; i < s; i += 64) {
                var grd = g.createLinearGradient(0, i, 0, i + 32);
                grd.addColorStop(0, theme.grass[1]);
                grd.addColorStop(1, theme.grass[0]);
                g.fillStyle = grd;
                g.fillRect(0, i, s, 32);
            }

            // Broad mottling: light and shade at a scale bigger than a blade.
            for (n = 0; n < 90; n++) {
                g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255,' : '0,0,0,') +
                    (0.015 + Math.random() * 0.03) + ')';
                g.beginPath();
                g.arc(Math.random() * s, Math.random() * s, 20 + Math.random() * 70, 0, 6.283);
                g.fill();
            }

            // Blades: short strokes leaning a few degrees off vertical.
            g.lineWidth = 1;
            for (n = 0; n < 5200; n++) {
                x = Math.random() * s; y = Math.random() * s;
                a = (Math.random() - 0.5) * 0.5;
                g.strokeStyle = Math.random() < 0.5
                    ? 'rgba(255,255,255,' + (0.02 + Math.random() * 0.05) + ')'
                    : 'rgba(0,0,0,' + (0.02 + Math.random() * 0.05) + ')';
                g.beginPath();
                g.moveTo(x, y);
                g.lineTo(x + Math.sin(a) * 6, y - Math.cos(a) * 6);
                g.stroke();
            }
        });
    }

    /* A height field for the same blades, so the light rakes across the green
       instead of lying on it flat. Cheap: one greyscale canvas, no normal maths
       — three.js turns a bump map into normals for us. */
    function grassBump() {
        return canvasTex(256, function (g, s) {
            var n, x, y;
            g.fillStyle = '#808080';
            g.fillRect(0, 0, s, s);
            for (n = 0; n < 5000; n++) {
                x = Math.random() * s; y = Math.random() * s;
                g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
                g.fillRect(x, y, 2, 3);
            }
        });
    }

    function sandTexture() {
        return canvasTex(128, function (g, s) {
            g.fillStyle = '#d8c391';
            g.fillRect(0, 0, s, s);
            for (var n = 0; n < 4000; n++) {
                g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(150,120,70,0.28)';
                g.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5);
            }
        });
    }

    function woodTexture() {
        return canvasTex(128, function (g, s) {
            g.fillStyle = '#a97c4c';
            g.fillRect(0, 0, s, s);
            for (var i = 0; i < s; i += 16) {
                g.fillStyle = 'rgba(0,0,0,0.16)';
                g.fillRect(0, i, s, 2);
                g.fillStyle = 'rgba(255,220,180,0.10)';
                g.fillRect(0, i + 3, s, 3);
            }
            for (var n = 0; n < 900; n++) {
                g.fillStyle = 'rgba(80,50,20,0.12)';
                g.fillRect(Math.random() * s, Math.random() * s, 3, 1);
            }
        });
    }

    function roughTexture() {
        return canvasTex(128, function (g, s) {
            g.fillStyle = '#3c6b34';
            g.fillRect(0, 0, s, s);
            for (var n = 0; n < 2200; n++) {
                g.fillStyle = Math.random() < 0.5 ? 'rgba(40,90,35,0.5)' : 'rgba(120,150,80,0.25)';
                g.fillRect(Math.random() * s, Math.random() * s, 3, 3);
            }
        });
    }

    function rockTexture(tint) {
        return canvasTex(256, function (g, s) {
            g.fillStyle = tint;
            g.fillRect(0, 0, s, s);
            for (var n = 0; n < 900; n++) {
                var r = 3 + Math.random() * 14;
                g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.13) + ')';
                g.beginPath();
                g.arc(Math.random() * s, Math.random() * s, r, 0, 6.283);
                g.fill();
                g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.08) + ')';
                g.beginPath();
                g.arc(Math.random() * s, Math.random() * s, r * 0.6, 0, 6.283);
                g.fill();
            }
        });
    }

    function dotTexture() {
        return canvasTex(64, function (g, s) {
            var grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
            grd.addColorStop(0, 'rgba(255,255,255,1)');
            grd.addColorStop(0.55, 'rgba(255,255,255,0.75)');
            grd.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = grd;
            g.fillRect(0, 0, s, s);
        });
    }

    /* Dimples, as a bump map. Modelling them as geometry would cost a few
       thousand triangles on the one object the camera is always closest to;
       a hex grid of soft circles in a canvas costs nothing and reads the same
       at every distance the game ever uses. */
    function dimpleTexture() {
        return canvasTex(256, function (g, s) {
            var cols = 16, r = s / cols / 2, row, col, cx, cz, grd;
            g.fillStyle = '#b4b4b4';
            g.fillRect(0, 0, s, s);
            for (row = 0; row < cols * 2; row++) {
                for (col = 0; col < cols; col++) {
                    cx = col * (s / cols) + (row % 2 ? r : 0) + r;
                    cz = row * (s / (cols * 2)) + r / 2;
                    grd = g.createRadialGradient(cx, cz, 0, cx, cz, r * 0.92);
                    grd.addColorStop(0, '#3a3a3a');
                    grd.addColorStop(0.72, '#a0a0a0');
                    grd.addColorStop(1, '#ffffff');
                    g.fillStyle = grd;
                    g.beginPath();
                    g.arc(cx, cz, r * 0.92, 0, 6.283);
                    g.fill();
                }
            }
        });
    }

    /* ── the shared set ─────────────────────────────────────────────────── */

    function dress(t, repeat) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = maxAniso;      // the grazing angles are most of the view
        if (repeat) t.repeat.set(repeat, repeat);
        return t;
    }

    /* Called once the renderer exists, because the anisotropy limit is a
       property of the context and every texture wants it. */
    function prepare(renderer) {
        maxAniso = renderer.capabilities.getMaxAnisotropy();
        extras.dimple = dimpleTexture();
        extras.dot = dotTexture();
    }

    /* The surfaces for one theme. Only the grass changes with the theme, but
       they are built and thrown away together so there is one lifetime to
       reason about rather than five. */
    function surfaces(theme) {
        if (shared.theme === theme) return shared;
        disposeSurfaces();
        shared = {
            theme: theme,
            green: dress(grassTexture(theme)),
            // The one texture that still tiles by `repeat`: the blades are
            // finer than the mow bands by a fixed ratio, and a ratio is a
            // constant rather than a pad size.
            greenBump: dress(grassBump(), SCALE.green / GRASS_BUMP_SCALE),
            sand: dress(sandTexture()),
            wood: dress(woodTexture()),
            rough: dress(roughTexture())
        };
        return shared;
    }

    function disposeSurfaces() {
        var k;
        for (k in shared) {
            if (k !== 'theme' && shared[k] && shared[k].dispose) shared[k].dispose();
        }
        shared = {};
    }

    /* The surround, which is one huge plane and so keeps its own repeat.
       Cached by tint: two holes on the same course ask for the same rock, and
       rebuilding it was a 256² canvas thrown away every hole load. */
    function rock(tint) {
        if (!rocks[tint]) rocks[tint] = dress(rockTexture(tint), 150);
        return rocks[tint];
    }

    G3.textures = {
        SCALE: SCALE,
        canvas: canvasTex,
        prepare: prepare,
        surfaces: surfaces,
        disposeSurfaces: disposeSurfaces,
        rock: rock,
        get dimple() { return extras.dimple; },
        get dot() { return extras.dot; },
        // How many tiles a pad of this size gets, which is what the pad's UVs
        // are scaled by. Never below one, or a small pad magnifies its texture.
        tiles: function (kind, size) {
            return Math.max(1, size / (SCALE[kind] || SCALE.green));
        }
    };

})(window.G3);
