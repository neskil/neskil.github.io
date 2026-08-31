/* Every texture in the game, drawn into a canvas at load. No image files to
   ship, no requests to fail, and the palette moves with the theme.

   This file exists so that "what a surface is made of" is one place and
   "where the surfaces go" is another. It also owns the one rule that keeps
   the texture count down:

   **A surface texture is shared, and the tiling lives in the geometry.**

   Each pad used to get its own clone of the grass with `repeat` set to that
   pad's size, which is one GPU texture per pad — a 512² green uploaded a
   dozen times over for a hole with a dozen pads, and a fresh dozen on every
   hole load. Instead the pad's own UVs are written when it is built (see
   `render.worldUv`), so one texture serves every pad of a kind at every size.
   `SCALE` is the world size one tile covers and is the number both halves
   have to agree on, which is why it lives here beside the textures rather
   than beside the geometry.

   Those UVs are anchored to the **world**, not to the pad. A pad-anchored
   tiling restarts its pattern at every seam, which on a green means the mow
   bands stop and start again at each join; anchored to the world they run
   unbroken across a whole hole, and two pads of the same size stop being
   copies of each other.

   The one thing that still needs `repeat` is the green's bump map, which
   tiles finer than its colour map. That ratio is a constant rather than a
   pad size, so a single shared texture carries it. */
(function (G3) {
    'use strict';

    /* How many world units one tile of each surface covers. Change one of
       these and the pads retile; nothing else has to be told. */
    /* Fairway is not a texture of its own: it is the green's own sheets tiled
       bigger, so the mow bands come out wider, which is most of what tells a
       fairway from a green at a glance. The renderer darkens it and grows it
       longer (buildSurfaces, SHELL_HEIGHT) and that is the whole difference —
       one number here and two there, rather than another canvas per theme. */
    var SCALE = { green: 3.5, fairway: 6, sand: 2, wood: 2, rough: 2 };
    var GRASS_BUMP_SCALE = 0.8;      // the blades are finer than the mow bands

    /* The width of one pass of the mower, in world units, and the one number
       three separate things have to agree on: the pale-and-dark banding drawn
       into the green's colour map, the direction the blades are combed in the
       shell sheet below, and the stripe the renderer's turf shader brightens.
       Get them out of step and a green has two sets of stripes on it. */
    var MOW = 0.875;

    // A shell tile is one there-and-back of the mower, so the sheet can carry
    // the comb — one band leaning up the green, the next leaning back down.
    var SHELL_SCALE = { green: MOW * 2, fairway: MOW * 3.4, rough: 1.6 };

    var maxAniso = 1;
    var shared = {};                  // the per-theme surface set, disposed together
    var rocks = {};                   // by tint, kept for the life of the page
    var extras = {};                  // dimple, dot, the blade sheets — built once

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

            /* Mow bands, with a soft seam so the roller looks like a roller
               — one pass of the mower wide, which is what the shell sheet is
               combed to and what the turf shader brightens. `band` is that
               width in texels: MOW world units of a tile that covers
               SCALE.green of them. */
            var band = Math.round(s * MOW / SCALE.green);
            for (i = 0; i < s; i += band * 2) {
                var grd = g.createLinearGradient(0, i, 0, i + band);
                grd.addColorStop(0, theme.grass[1]);
                grd.addColorStop(1, theme.grass[0]);
                g.fillStyle = grd;
                g.fillRect(0, i, s, band);
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

    /* ── the shells ─────────────────────────────────────────────────────

       Shell texturing, which is the one thing in this file that is not a
       picture painted flat. The green is drawn again half a dozen times at
       rising heights and each copy keeps only the blades tall enough to reach
       it, so what the camera looks through is a field of tapering blades with
       air between them — six two-triangle planes and one texture, and it is
       how fur has been drawn in real time for twenty years.

       **The alpha channel is a height field, and that is the whole technique.**
       Layer *n* of *N* keeps a texel only where alpha ≥ n/N (three.js's
       `alphaTest`). Everything below is about what to write into it.

       A blade is *not* a vertical stroke of constant alpha. That was the first
       attempt and it is why the first version read as speckle: a stroke with
       one alpha value is either wholly in a layer or wholly out of it, so
       every shell was the same mat with a different number of dots in it and
       nothing ever tapered. What a blade actually occupies is a *smear*: at
       height y it stands at its root plus its lean times y, narrowing as it
       goes. So the texel at the root end belongs to the bottom of the blade
       and the texel at the far end to its tip — which is to say **alpha has to
       climb along the blade, from nothing at the root to the blade's full
       height at the tip, while the blade narrows.** Do that and a low shell
       keeps the whole smear, a high one keeps only the tip, and the mat
       tapers and leans at the same time, for free.

       Which is one tapered triangle under a gradient per blade, ten thousand
       of them. Ten thousand `createLinearGradient` calls is a quarter of a
       second, so the blade is drawn *once* into a small sprite and stamped —
       rotated, scaled and with `globalAlpha` set to its height, which scales
       the whole ramp and so sets the blade's height in one number.

       Under the blades is the **thatch**: two-by-four texel strands written
       straight into an ImageData, dense enough to hide the ground and low
       enough in the height field that only the bottom shell or two keep any of
       it. Ten thousand blades cover about a quarter of the sheet; the thatch
       covers most of the rest, and a lawn you can see the soil through is a
       lawn in August.

       And the **comb**: the top half of the sheet leans one way and the bottom
       half the other, because a tile is `MOW * 2` across and a mower goes up
       one stripe and back down the next. That is where the stripes on a green
       come from, and it is the reason the sheet is anchored to the world
       rather than to the pad (see `render.worldUv`) — so the bands run
       unbroken across every pad of a hole instead of restarting at each seam.

       None of this depends on the theme — the blades are a pale neutral green
       and the course's own colour arrives as the material's — so the sheets
       are built once at start-up and never rebuilt. */

    // Light, and spread from yellow-green to a cooler blue-green. The material
    // multiplies the theme's own colour through these, so they are a variation
    // rather than a palette.
    var BLADE_TINTS = [
        '214,224,178', '196,214,164', '228,228,186', '178,204,158',
        '206,208,192', '188,198,152', '224,232,200', '170,192,150'
    ];

    /* One blade, as a sprite: a triangle wide at the root and narrow at the
       tip, under a gradient that runs from transparent at the root to solid at
       the tip. Stamping this *is* writing a height ramp along the blade. */
    function bladeSprite(rgb) {
        var cv = document.createElement('canvas');
        cv.width = 16; cv.height = 48;
        var g = cv.getContext('2d');
        var grd = g.createLinearGradient(0, 48, 0, 0);
        grd.addColorStop(0, 'rgba(' + rgb + ',0)');
        grd.addColorStop(0.4, 'rgba(' + rgb + ',0.34)');
        grd.addColorStop(1, 'rgba(' + rgb + ',1)');
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(0.5, 48);
        g.lineTo(15.5, 48);
        g.lineTo(9.4, 0);
        g.lineTo(6.6, 0);
        g.closePath();
        g.fill();
        return cv;
    }

    var blades = null;
    function bladeSprites() {
        if (!blades) {
            blades = [];
            for (var i = 0; i < BLADE_TINTS.length; i++) blades.push(bladeSprite(BLADE_TINTS[i]));
        }
        return blades;
    }

    /* The mat under the blades. Strands two texels wide and four tall, most of
       them present, none of them tall — so this is what the bottom shell is
       made of and what every shell above it throws away. Written as raw pixels
       rather than drawn: a million texels through putImageData is forty
       milliseconds, and forty thousand more little fills is not. */
    function thatch(g, s, cover, top) {
        var sw = s >> 1, sh = s >> 2;
        var seed = new Float32Array(sw * sh), i;
        for (i = 0; i < seed.length; i++) seed[i] = Math.random();

        var img = g.createImageData(s, s);
        var d = img.data;
        var x, y, v, a, tint;
        for (y = 0; y < s; y++) {
            for (x = 0; x < s; x++) {
                v = seed[(y >> 2) * sw + (x >> 1)];
                i = (y * s + x) * 4;
                tint = 186 + ((v * 71) | 0);
                d[i] = tint;
                d[i + 1] = tint + 12;
                d[i + 2] = tint - 26;
                /* Below the cover fraction there is no strand — but not alpha
                   zero either. A canvas keeps its colours multiplied by their
                   own alpha, so a fully transparent texel has no colour left
                   to remember and the filtering between a blade and the gap
                   beside it would fade towards black. A hair of alpha, well
                   under the lowest cutoff, gives every texel a colour without
                   letting any of it survive the alphaTest. */
                a = v < cover ? 0.012 : 0.05 + (v - cover) / (1 - cover) * top;
                d[i + 3] = (a * 255) | 0;
            }
        }
        g.putImageData(img, 0, 0);
    }

    /* `cells` blades across the sheet, `per` in each jittered cell. `comb`
       splits the sheet into the mower's two directions; without it the blades
       lie every way at once, which is what long grass does. */
    function shellTexture(size, opts) {
        return canvasTex(size, function (g, s) {
            var sp = bladeSprites();
            var px = s / 1024;                 // the sizes below are for 1024²
            var step = s / opts.cells;
            var gx, gy, k, x, y, h, len, wide, ang;

            thatch(g, s, opts.cover, opts.thatch);

            for (gy = 0; gy < opts.cells; gy++) {
                for (gx = 0; gx < opts.cells; gx++) {
                    for (k = 0; k < opts.per; k++) {
                        x = (gx + Math.random()) * step;
                        y = (gy + Math.random()) * step;
                        // Biased short: a handful of blades standing well above
                        // the rest is what gives the mat a silhouette.
                        h = Math.pow(Math.random(), opts.bias);
                        len = (opts.len + h * opts.grow) * px;
                        wide = len * opts.wide;
                        // The comb. Half the sheet lies up the green and half
                        // lies back down it, and the spread on top of that is
                        // what stops a stripe looking brushed.
                        ang = (opts.comb && y > s / 2 ? Math.PI : 0) +
                            (Math.random() - 0.5) * opts.spread;
                        if (!opts.comb && Math.random() < 0.5) ang += Math.PI;
                        g.globalAlpha = h;
                        g.setTransform(Math.cos(ang), Math.sin(ang),
                            -Math.sin(ang), Math.cos(ang), x, y);
                        g.drawImage(sp[(Math.random() * sp.length) | 0],
                            -wide / 2, -len, wide, len);
                    }
                }
            }
            g.setTransform(1, 0, 0, 1, 0, 0);
            g.globalAlpha = 1;
        });
    }

    /* Sand, raked.

       The first version of this was a flat wash of #d8c391 with white grit
       thrown at it, and on the screen it was not sand — it was paper. Two
       things were missing and both of them are about light rather than colour.

       A bunker is *raked*, and the furrows are the only thing at a scale the
       eye can measure: without them there is nothing in the picture to say how
       big the sand is or which way it faces, and a dished floor and a flat one
       look identical. They are drawn as a wave rather than as straight lines,
       because a rake follows the shape of the bunker and a ruled grating reads
       as corduroy.

       And it was too *pale*. The palette here is written in sRGB and handed to
       three.js as if it were linear (render.js says why), so a light sand
       arrives on screen lighter still and clips to white — which is what threw
       away the shading on every slope cut into it. The base is a couple of
       stops down from where it was and the grit does the rest; the sand ends
       up the same brightness it always looked and now has somewhere to go when
       the light falls off it. */
    function sandTexture() {
        return canvasTex(128, function (g, s) {
            var n, i, x, y;
            g.fillStyle = '#b99b68';
            g.fillRect(0, 0, s, s);
            // The furrows: eight per tile, which at SCALE.sand is a pass of the
            // rake every twenty-five centimetres.
            for (i = 0; i < 8; i++) {
                y = (i + 0.5) * s / 8;
                g.beginPath();
                for (x = 0; x <= s; x += 4) {
                    var wob = Math.sin(x / s * Math.PI * 2 + i) * 2.2 +
                              Math.sin(x / s * Math.PI * 6 + i * 2.3) * 1.1;
                    if (x === 0) g.moveTo(x, y + wob); else g.lineTo(x, y + wob);
                }
                g.strokeStyle = 'rgba(96,74,42,0.30)';
                g.lineWidth = 3;
                g.stroke();
                g.strokeStyle = 'rgba(255,238,200,0.30)';
                g.lineWidth = 2;
                g.translate(0, 3);
                g.stroke();
                g.setTransform(1, 0, 0, 1, 0, 0);
            }
            for (n = 0; n < 5200; n++) {
                g.fillStyle = Math.random() < 0.5
                    ? 'rgba(255,246,222,0.30)' : 'rgba(120,92,48,0.26)';
                g.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5);
            }
        });
    }

    /* And the same furrows as a height field, so the sun rakes across them
       instead of lying on a picture of them. Grey is flat; the light side of
       each furrow is the ridge and the dark side the trough. Grain goes in
       too, finer and weaker, which is what stops a bunker looking like a
       moulded plastic tray under a low sun. */
    function sandBump() {
        return canvasTex(128, function (g, s) {
            var i, x, y, n;
            g.fillStyle = '#808080';
            g.fillRect(0, 0, s, s);
            for (i = 0; i < 8; i++) {
                y = (i + 0.5) * s / 8;
                g.beginPath();
                for (x = 0; x <= s; x += 4) {
                    var wob = Math.sin(x / s * Math.PI * 2 + i) * 2.2 +
                              Math.sin(x / s * Math.PI * 6 + i * 2.3) * 1.1;
                    if (x === 0) g.moveTo(x, y + wob); else g.lineTo(x, y + wob);
                }
                g.strokeStyle = '#3a3a3a';
                g.lineWidth = 3.5;
                g.stroke();
                g.strokeStyle = '#d2d2d2';
                g.lineWidth = 3;
                g.translate(0, 3.5);
                g.stroke();
                g.setTransform(1, 0, 0, 1, 0, 0);
            }
            for (n = 0; n < 3000; n++) {
                g.fillStyle = Math.random() < 0.5
                    ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)';
                g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
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

    /* The ground beyond the course, and the one texture in here that is asked
       to cover a hundred metres rather than a pad.

       It used to be nine hundred soft blobs all cut from the same fourteen-unit
       stencil, which at any distance is one grey wash and up close is nine
       hundred identical bruises — and, worst of all, a *period*: one blob size
       means one scale, and one scale is the scale at which the eye finds the
       tile. It is now three passes of the same idea at three sizes an octave
       and a bit apart, so what the shader's own noise adds on top (SUR_* in
       shaders.js) lands on grain rather than on wallpaper.

       The last pass is pixel-fine grit, which is what stops the ground under
       the player's feet from being a smooth gradient — and it is drawn as
       single texels rather than as arcs because a hundred and sixty thousand
       one-pixel `arc()` calls is a page freeze and a `fillRect` is not. */
    function rockTexture(tint) {
        return canvasTex(512, function (g, s) {
            var n, r, x, y;
            g.fillStyle = tint;
            g.fillRect(0, 0, s, s);
            // Three scales: boulders, stones, gravel.
            var passes = [[46, 26, 0.10, 0.05], [220, 11, 0.13, 0.07], [900, 4, 0.15, 0.09]];
            for (var p = 0; p < passes.length; p++) {
                var count = passes[p][0], big = passes[p][1];
                for (n = 0; n < count; n++) {
                    r = big * (0.35 + Math.random() * 0.65);
                    x = Math.random() * s; y = Math.random() * s;
                    g.fillStyle = 'rgba(0,0,0,' + (Math.random() * passes[p][2]) + ')';
                    g.beginPath();
                    g.arc(x, y, r, 0, 6.283);
                    g.fill();
                    // The lit side of the same stone, offset rather than
                    // concentric: a ring round a shadow is a bubble, a crescent
                    // beside one is a rock with the sun on it.
                    g.fillStyle = 'rgba(255,255,255,' + (Math.random() * passes[p][3]) + ')';
                    g.beginPath();
                    g.arc(x - r * 0.30, y - r * 0.30, r * 0.62, 0, 6.283);
                    g.fill();
                }
            }
            for (n = 0; n < 9000; n++) {
                g.fillStyle = Math.random() < 0.5
                    ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.09)';
                g.fillRect(Math.random() * s | 0, Math.random() * s | 0, 1, 1);
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

        /* The blade sheets. Ten thousand stamps and a million texels of
           thatch is about a quarter of a second, paid once here rather than
           on every change of course — the blades are a neutral green and the
           course's own colour arrives as the material's, so there is nothing
           theme-shaped in them to rebuild. A coarse pointer gets half the
           resolution, which is the one thing on the page that scales with how
           much GPU there is likely to be.

           The rough is a quarter of the work of the green's, and it is the
           sheet that does the most: it is what makes missing a parkland
           fairway look like a mistake rather than a change of colour. */
        var big = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ? 512 : 1024;
        extras.greenShell = dress(shellTexture(big, {
            cells: 100, per: 1, bias: 0.85, len: 11, grow: 9, wide: 0.30,
            comb: true, spread: 1.5, cover: 0.30, thatch: 0.30
        }));
        extras.roughShell = dress(shellTexture(big >> 1, {
            cells: 46, per: 1, bias: 0.6, len: 16, grow: 20, wide: 0.26,
            comb: false, spread: 2.6, cover: 0.42, thatch: 0.38
        }));
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
            sandBump: dress(sandBump()),
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

    /* The surround. Its tiling is baked into the mesh's own UVs the way a
       pad's is (render.js, SUR_TILE), so the texture itself repeats once and
       every course can share the one upload.
       Cached by tint: two holes on the same course ask for the same rock, and
       rebuilding it was a canvas thrown away every hole load. */
    function rock(tint) {
        if (!rocks[tint]) rocks[tint] = dress(rockTexture(tint));
        return rocks[tint];
    }

    G3.textures = {
        SCALE: SCALE,
        SHELL_SCALE: SHELL_SCALE,
        MOW: MOW,
        canvas: canvasTex,
        prepare: prepare,
        surfaces: surfaces,
        disposeSurfaces: disposeSurfaces,
        rock: rock,
        get dimple() { return extras.dimple; },
        get dot() { return extras.dot; },
        get greenShell() { return extras.greenShell; },
        get roughShell() { return extras.roughShell; },
        // Which blade sheet a surface wears. Two kinds grow; everything else
        // gets nothing back and grows nothing.
        shellFor: function (kind) {
            return kind === 'rough' ? extras.roughShell : extras.greenShell;
        }
    };

})(window.G3);
