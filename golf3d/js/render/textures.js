/* render/textures.js — everything the course is made of, painted at load.
 *
 * No image files ship with this game and none are fetched, so every surface is
 * a canvas drawn once here and handed to three.js. Two things fall out of that
 * and both are the point: nothing can fail to load, and a palette swap is a
 * theme entry rather than a new set of files.
 *
 * Everything in here is pure in the way that matters: give it a theme, get a
 * texture. Nothing reads the scene, the camera or the ball, and nothing is
 * cached between calls — `hole.js` holds the ones it wants and disposes them
 * with the hole. The one exception is `grass`, which the renderer keeps for
 * the length of a hole because every pad's material clones it.
 *
 * Sizes are powers of two so the mip chain is exact, and everything that tiles
 * sets `RepeatWrapping` here rather than at the call site.
 */
(function (G3) {
    'use strict';

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

    G3.textures = {
        canvas: canvasTex,
        grass: grassTexture,
        grassBump: grassBump,
        sand: sandTexture,
        wood: woodTexture,
        rough: roughTexture,
        rock: rockTexture,
        dot: dotTexture,
        dimple: dimpleTexture
    };

})(window.G3);
