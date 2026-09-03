/* Data Room — the shell.
 *
 * One renderer, one requestAnimationFrame loop, one HUD, and a registry of
 * scenes. A scene never touches the canvas, the loop or the chrome; it hands
 * back a THREE.Scene and a camera and gets told when to update. That is the
 * whole contract, and it is what lets the four visualizations in PLAN.md be
 * written one at a time without any of them growing shell code of its own.
 *
 * Classic <script> tags, no modules: the rest of the site is loaded this way
 * (see golf3d/, 3d-engine-poc/) so the page still opens over file:// without
 * tripping module CORS rules.
 */
window.VizApp = (function () {
    'use strict';

    /* The roadmap, in switcher order. A scene that hasn't been written yet
     * still gets a chip — greyed out and unclickable — so the switcher doubles
     * as the plan while this is a proof of concept. Ids match PLAN.md. */
    var ROSTER = [
        { id: 'globe',     label: 'Trade flows' },
        { id: 'city',      label: 'Site as a city' },
        { id: 'particles', label: 'Particle field' },
        { id: 'nebula',    label: 'Nebula' }
    ];

    var scenes = {};        // id -> scene module
    var current = null;     // the live scene module
    var built = null;       // { scene, camera } from the live module

    var renderer = null;
    var clock = null;
    var running = false;
    var rafId = 0;

    var el = {};
    var pointer = { x: 0, y: 0, px: 0, py: 0, inside: false };
    var reducedMotion = false;

    /* ---------- perf counter ---------- */

    var fpsAcc = 0, fpsFrames = 0;

    function tickFps(dt) {
        fpsAcc += dt;
        fpsFrames++;
        if (fpsAcc >= 0.5) {
            var fps = Math.round(fpsFrames / fpsAcc);
            if (el.fps) el.fps.textContent = fps + ' fps';
            fpsAcc = 0;
            fpsFrames = 0;
        }
    }

    /* ---------- accent ---------- */

    /* Scenes declare an accent and the chrome retints to match, so switching
     * scenes doesn't leave the HUD glowing in the last scene's colour. */
    function setAccent(hex) {
        var n = parseInt(String(hex).replace('#', ''), 16);
        var rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        var root = document.documentElement;
        root.style.setProperty('--accent', hex);
        root.style.setProperty('--accent-rgb', rgb.join(', '));
        var theme = document.querySelector('meta[name="theme-color"]');
        if (theme) theme.setAttribute('content', '#070b16');
    }

    /* ---------- the readout panel ---------- */

    var readout = {
        /* rows is [label, value] pairs. An optional link turns the panel into
         * something you can act on — the city scene uses it so clicking a
         * tower offers to open that project rather than navigating on a
         * mis-click. A link makes the panel interactive, so pointer-events
         * come back on only in that case. */
        show: function (title, rows, link) {
            if (!el.readout) return;
            var html = '<div class="readout-title">' + esc(title) + '</div>';
            for (var i = 0; i < rows.length; i++) {
                html += '<div class="readout-row"><span>' + esc(rows[i][0]) +
                        '</span><b>' + esc(rows[i][1]) + '</b></div>';
            }
            if (link) {
                html += '<a class="readout-link" href="' + esc(link.href) + '">' +
                        esc(link.label) + ' <span aria-hidden="true">&#8594;</span></a>';
            }
            el.readout.innerHTML = html;
            el.readout.style.pointerEvents = link ? 'auto' : 'none';
            el.readout.classList.add('show');
        },
        hide: function () {
            if (!el.readout) return;
            el.readout.classList.remove('show');
            el.readout.style.pointerEvents = 'none';
        }
    };

    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    /* ---------- scene lifecycle ---------- */

    function register(mod) {
        scenes[mod.id] = mod;
    }

    function ctx() {
        return {
            THREE: window.THREE,
            renderer: renderer,
            width: window.innerWidth,
            height: window.innerHeight,
            dpr: renderer ? renderer.getPixelRatio() : 1,
            canvas: renderer ? renderer.domElement : null,
            readout: readout,
            reducedMotion: reducedMotion,
            pointer: pointer
        };
    }

    function select(id, viaUser) {
        var mod = scenes[id];
        if (!mod || mod === current) return;

        if (current) {
            readout.hide();
            if (typeof current.dispose === 'function') current.dispose();
            if (built && built.scene) disposeTree(built.scene);
        }

        current = mod;
        built = mod.init(ctx()) || {};
        setAccent(mod.accent || '#38bdf8');
        paintCaption(mod);
        paintChips();
        resize();

        if (viaUser) {
            try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// */ }
        }
    }

    /* three.js won't free GPU memory on its own — dropping the JS reference to
     * a scene leaves its buffers and textures resident. Every scene switch
     * walks what it is replacing and releases it, or four switches back and
     * forth leak four sets of geometry. */
    function disposeTree(root) {
        root.traverse(function (obj) {
            if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
            var mats = obj.material;
            if (!mats) return;
            if (!Array.isArray(mats)) mats = [mats];
            for (var i = 0; i < mats.length; i++) {
                var m = mats[i];
                if (!m) continue;
                for (var k in m) {
                    if (m[k] && m[k].isTexture && m[k].dispose) m[k].dispose();
                }
                if (m.dispose) m.dispose();
            }
        });
    }

    var captionTimer = 0;

    function paintCaption(mod) {
        if (!el.caption) return;
        /* Cancel any swap still in flight. Two scene changes inside the fade
         * would otherwise leave two timers racing, and the caption settles on
         * whichever lands last rather than on the scene you are looking at. */
        if (captionTimer) window.clearTimeout(captionTimer);
        el.caption.classList.add('swapping');
        captionTimer = window.setTimeout(function () {
            captionTimer = 0;
            el.captionTitle.textContent = mod.title || mod.label;
            el.captionText.textContent = mod.blurb || '';
            el.captionHint.textContent = mod.hint || '';
            el.captionHint.style.display = mod.hint ? '' : 'none';
            el.caption.classList.remove('swapping');
        }, reducedMotion ? 0 : 180);
    }

    function paintChips() {
        var chips = el.switcher.querySelectorAll('.scene-chip');
        for (var i = 0; i < chips.length; i++) {
            var on = current && chips[i].dataset.scene === current.id;
            chips[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
    }

    function buildSwitcher() {
        var html = '';
        for (var i = 0; i < ROSTER.length; i++) {
            var r = ROSTER[i];
            var ready = !!scenes[r.id];
            html += '<button type="button" class="scene-chip" data-scene="' + r.id + '"' +
                    (ready ? '' : ' data-pending="true" disabled') +
                    ' aria-pressed="false" title="' +
                    (ready ? esc(r.label) : esc(r.label) + ' — not built yet') + '">' +
                    '<span class="dot"></span>' + esc(r.label) + '</button>';
        }
        el.switcher.innerHTML = html;
        el.switcher.addEventListener('click', function (e) {
            var chip = e.target.closest ? e.target.closest('.scene-chip') : null;
            if (!chip || chip.disabled) return;
            select(chip.dataset.scene, true);
        });
    }

    /* ---------- loop ---------- */

    function frame() {
        rafId = requestAnimationFrame(frame);
        if (!running) return;

        var dt = Math.min(clock.getDelta(), 0.1);  // clamp: a backgrounded tab
        var t = clock.elapsedTime;                 // must not resume with a jump

        if (current && typeof current.update === 'function') current.update(dt, t);
        if (built && built.scene && built.camera) renderer.render(built.scene, built.camera);

        tickFps(dt);
    }

    function resize() {
        if (!renderer) return;
        var w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h, false);
        if (current && typeof current.resize === 'function') current.resize(w, h);
    }

    /* ---------- pointer ---------- */

    function onPointerMove(e) {
        pointer.px = e.clientX;
        pointer.py = e.clientY;
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
        pointer.inside = true;
        if (current && current.onPointerMove) current.onPointerMove(pointer);
    }

    function onPointerDown(e) {
        onPointerMove(e);
        if (current && current.onPointerDown) current.onPointerDown(pointer);
    }

    function onPointerUp(e) {
        if (current && current.onPointerUp) current.onPointerUp(pointer, e);
    }

    function onPointerLeave() {
        pointer.inside = false;
        if (current && current.onPointerLeave) current.onPointerLeave();
    }

    /* ---------- boot ---------- */

    function fail(title, text) {
        if (!el.boot) return;
        el.boot.classList.remove('gone');
        var sp = document.getElementById('boot-spinner');
        if (sp) sp.style.display = 'none';
        document.getElementById('boot-title').textContent = title;
        document.getElementById('boot-text').innerHTML = text;
    }

    function start() {
        el.stage = document.getElementById('stage');
        el.switcher = document.getElementById('switcher');
        el.caption = document.getElementById('caption');
        el.captionTitle = document.getElementById('caption-title');
        el.captionText = document.getElementById('caption-text');
        el.captionHint = document.getElementById('caption-hint');
        el.readout = document.getElementById('readout');
        el.fps = document.getElementById('fps');
        el.boot = document.getElementById('boot');

        reducedMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!window.THREE) {
            fail('Renderer missing', 'three.js did not load. If you opened this from a ' +
                 'file path, serve the repo root instead — <code>python -m http.server</code>.');
            return;
        }

        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        } catch (e) {
            renderer = null;
        }
        if (!renderer || !renderer.getContext()) {
            fail('WebGL unavailable', 'This browser will not give the page a WebGL context, ' +
                 'so there is nothing to draw. Everything here needs one.');
            return;
        }

        /* Retina phones will happily hand out a 3x buffer and then run the
         * whole thing at 20fps. Two is the point past which nobody can see the
         * difference on this kind of content. */
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        renderer.outputEncoding = THREE.sRGBEncoding;
        el.stage.appendChild(renderer.domElement);

        clock = new THREE.Clock();
        buildSwitcher();

        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', function () { setTimeout(resize, 120); });
        el.stage.addEventListener('pointermove', onPointerMove);
        el.stage.addEventListener('pointerdown', onPointerDown);
        el.stage.addEventListener('pointerup', onPointerUp);
        el.stage.addEventListener('pointerleave', onPointerLeave);

        /* A hidden tab still fires rAF in some browsers and burns battery in
         * all of them; stop the clock rather than the frames so no scene sees
         * a thirty-second delta when it comes back. */
        document.addEventListener('visibilitychange', function () {
            running = !document.hidden;
            if (running) clock.getDelta();
        });

        /* A deep link should work when it is edited as well as when it is
         * opened: changing only the fragment does not reload the page, so
         * without this #city typed into the bar of a running Data Room does
         * nothing at all. */
        window.addEventListener('hashchange', function () {
            var id = (location.hash || '').replace('#', '');
            if (scenes[id]) select(id, false);
        });

        var wanted = (location.hash || '').replace('#', '');
        var first = scenes[wanted] ? wanted : firstReady();
        if (!first) {
            fail('Nothing to show', 'No visualization has registered itself. ' +
                 'Check the &lt;script&gt; tags in index.html.');
            return;
        }

        running = true;
        select(first, false);
        frame();

        el.boot.classList.add('gone');
        window.setTimeout(function () { el.boot.style.display = 'none'; }, 600);
    }

    function firstReady() {
        for (var i = 0; i < ROSTER.length; i++) {
            if (scenes[ROSTER[i].id]) return ROSTER[i].id;
        }
        return null;
    }

    /* ---------- orbit controller ----------
     *
     * Home-grown rather than vendored OrbitControls, for one reason: r128's
     * controls expose getAzimuthalAngle but no setter, so a scene cannot
     * animate the camera to a chosen point — which is exactly what "click a
     * port and it turns to face you" needs. Spherical state kept here, eased
     * toward a target every frame, is a few dozen lines and gives scenes the
     * setter they need. Shared, because the city scene wants the same thing.
     *
     * Angles follow the mapping in the globe scene: theta is longitude,
     * phi is measured down from +Y, so facing a lat/lon is a straight
     * assignment rather than a conversion.
     */
    function makeOrbit(camera, dom, opt) {
        opt = opt || {};
        var o = {
            theta: opt.theta || 0,
            phi: opt.phi != null ? opt.phi : Math.PI / 2,
            radius: opt.radius || 3.2,
            tTheta: opt.theta || 0,
            tPhi: opt.phi != null ? opt.phi : Math.PI / 2,
            tRadius: opt.radius || 3.2,
            minRadius: opt.minRadius || 1.6,
            maxRadius: opt.maxRadius || 8,
            minPhi: opt.minPhi != null ? opt.minPhi : 0.22,
            maxPhi: opt.maxPhi != null ? opt.maxPhi : Math.PI - 0.22,
            spin: opt.spin || 0,
            target: opt.target || new THREE.Vector3(0, 0, 0),
            dragging: false,
            moved: 0,
            hold: 0          /* seconds of auto-spin suppression after a nudge */
        };

        var pts = new Map();
        var last = { x: 0, y: 0 };
        var pinch = 0;

        function down(e) {
            pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pts.size === 1) {
                o.dragging = true;
                o.moved = 0;
                last.x = e.clientX;
                last.y = e.clientY;
                if (dom.setPointerCapture) { try { dom.setPointerCapture(e.pointerId); } catch (err) {} }
            } else if (pts.size === 2) {
                pinch = spread();
            }
        }

        function move(e) {
            if (!pts.has(e.pointerId)) return;
            pts.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (pts.size >= 2) {
                var d = spread();
                if (pinch > 0 && d > 0) {
                    o.tRadius = clamp(o.tRadius * (pinch / d), o.minRadius, o.maxRadius);
                }
                pinch = d;
                o.hold = 1.6;
                return;
            }
            if (!o.dragging) return;

            var dx = e.clientX - last.x, dy = e.clientY - last.y;
            last.x = e.clientX;
            last.y = e.clientY;
            o.moved += Math.abs(dx) + Math.abs(dy);
            o.tTheta -= dx * 0.005;
            o.tPhi = clamp(o.tPhi - dy * 0.005, o.minPhi, o.maxPhi);
            o.hold = 1.6;
        }

        function up(e) {
            pts.delete(e.pointerId);
            if (pts.size < 2) pinch = 0;
            if (pts.size === 0) o.dragging = false;
        }

        function wheel(e) {
            e.preventDefault();
            o.tRadius = clamp(o.tRadius * Math.exp(e.deltaY * 0.0012), o.minRadius, o.maxRadius);
            o.hold = 1.2;
        }

        function spread() {
            var a = null, b = null;
            pts.forEach(function (v) { if (!a) a = v; else if (!b) b = v; });
            if (!a || !b) return 0;
            return Math.hypot(a.x - b.x, a.y - b.y);
        }

        dom.addEventListener('pointerdown', down);
        dom.addEventListener('pointermove', move);
        dom.addEventListener('pointerup', up);
        dom.addEventListener('pointercancel', up);
        dom.addEventListener('wheel', wheel, { passive: false });

        o.focus = function (theta, phi) {
            /* Take the short way round: without unwrapping, focusing a port
             * just west of the date line spins the globe most of a turn. */
            var t = theta;
            while (t - o.tTheta > Math.PI) t -= Math.PI * 2;
            while (t - o.tTheta < -Math.PI) t += Math.PI * 2;
            o.tTheta = t;
            o.tPhi = clamp(phi, o.minPhi, o.maxPhi);
            o.hold = 3.0;
        };

        o.update = function (dt) {
            if (o.hold > 0) o.hold -= dt;
            if (o.spin && !o.dragging && o.hold <= 0) o.tTheta += o.spin * dt;

            var k = Math.min(1, dt * 6);
            o.theta += (o.tTheta - o.theta) * k;
            o.phi += (o.tPhi - o.phi) * k;
            o.radius += (o.tRadius - o.radius) * k;

            var sp = Math.sin(o.phi);
            camera.position.set(
                o.target.x + o.radius * sp * Math.sin(o.theta),
                o.target.y + o.radius * Math.cos(o.phi),
                o.target.z + o.radius * sp * Math.cos(o.theta)
            );
            camera.lookAt(o.target);
        };

        o.dispose = function () {
            dom.removeEventListener('pointerdown', down);
            dom.removeEventListener('pointermove', move);
            dom.removeEventListener('pointerup', up);
            dom.removeEventListener('pointercancel', up);
            dom.removeEventListener('wheel', wheel);
            pts.clear();
        };

        return o;
    }

    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

    /* How far a camera has to sit for a sphere of the given radius to fit on
     * BOTH axes. A perspective camera's fov is vertical only, so on a portrait
     * phone the horizontal field is the narrow one and anything sized to the
     * vertical gets its sides cut off — which is what a globe filling a laptop
     * does the moment it meets a handset. */
    function fitDistance(camera, radius) {
        var vHalf = camera.fov * Math.PI / 360;
        var hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
        return radius / Math.sin(Math.min(vHalf, hHalf));
    }

    return {
        ROSTER: ROSTER,
        register: register,
        makeOrbit: makeOrbit,
        clamp: clamp,
        fitDistance: fitDistance,
        select: select,
        start: start,
        setAccent: setAccent,
        readout: readout
    };
})();
