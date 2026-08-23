/* render/hole.js — the course, turned into meshes.
 *
 * One call: `G3.holeMesh.build(hole, opts)`. It is handed a hole out of
 * courses.js and hands back a group with everything in it, plus the handful of
 * objects the frame loop has to keep animating. Nothing here is drawn, timed
 * or updated — this file runs once per hole and then has nothing more to say.
 *
 * Two rules keep the picture honest, and both are checked in render-tests.html
 * rather than merely asked for here:
 *
 * - A moving wall's mesh is placed by render.js from `physics.wallBox()`, the
 *   same function the collision solver calls. A blade you can see and a blade
 *   you can hit therefore cannot drift apart, however the movement is later
 *   retuned. This file only records which mesh belongs to which wall.
 * - The pads are drawn from the same rectangles the ball rolls on, sheared by
 *   the same gradient, so what looks like a ramp is a ramp. If you find
 *   yourself adjusting a pad's mesh to make it "look right", the hole is
 *   wrong, not the drawing of it.
 *
 * ## The build
 *
 * Every helper takes the build in progress as its first argument, `b`, and
 * writes what it makes into it. That is the whole of the state in this file —
 * there is no module-level anything — and it is why the renderer's job is
 * "hold what came back" rather than "remember what was written":
 *
 *     b.group       the hole, ready to add to the scene
 *     b.movers      [{ mesh, wall, h }] — walls the frame loop places
 *     b.waterMats   water shaders whose clock and wind the frame loop advances
 *     b.textures    made for this hole and disposed with it
 *     b.sun         the directional light, and b.sunDir where it points
 *     b.cup, b.pin, b.flagPole, b.flagSwivel, b.flagCloth, b.flagRest
 *     b.fogNear, b.fogFar, b.fogColour
 *
 * Anything added to that list has exactly one other place to go: the block in
 * render.js that copies a finished build into the renderer's state.
 *
 * Depends on render/palette.js, render/textures.js, render/sky.js and
 * render/water.js — and on physics.js, read-only, which is the point rather
 * than a leak: a pad's height and a wall's box come from the same two
 * functions the solver calls, so the drawing cannot disagree with the rules.
 * Nothing here is ever written back. Never depends on the game.
 */
(function (G3) {
    'use strict';

    var C = G3.CONFIG;
    var P = G3.physics;
    var T = G3.textures;
    var skyTint = G3.palette.tint;

    /* A water shader belongs to the hole that made it: the frame loop has to
       advance every one of them, so every one is written down on the way past
       rather than pushed onto something shared. */
    function waterMat(b, theme, opts) {
        var mat = G3.water.material(theme, opts);
        b.waterMats.push(mat);
        return mat;
    }

    /* ── surfaces ──────────────────────────────────────────────────────── */

    function tiled(b, base, w, d, scale) {
        var tex = base.clone();
        tex.needsUpdate = true;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = b.maxAniso;      // the grazing angles are most of the view
        tex.repeat.set(Math.max(1, w / scale), Math.max(1, d / scale));
        return tex;
    }

    // An extruded slab's cap is UV-mapped in the shape's own coordinates —
    // world units — where a box's cap runs 0..1. Same texture, different
    // repeat, or the green around the cup comes out a hundred times too big.
    function tiledCap(b, base, w, d, scale, worldUv) {
        if (!worldUv) return tiled(b, base, w, d, scale);
        var tex = base.clone();
        tex.needsUpdate = true;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = b.maxAniso;
        tex.repeat.set(1 / scale, 1 / scale);    // UVs are already world units
        return tex;
    }

    /* Every surface is Phong now, which sounds like a cost and is not: with a
       black specular a Phong material is a Lambert material, and what it buys
       is one number — how wet the ground is. Rain darkens a surface and makes
       it shine, and doing that to the sand and the boards as well as the green
       is the difference between "it is raining" and "there is rain in front of
       the screen". */
    function padMaterial(b, kind, theme, w, d, worldUv) {
        var wet = b.weather ? (b.weather.wet || 0) : 0;
        var side = new THREE.MeshLambertMaterial({
            color: new THREE.Color(theme.side).multiplyScalar(1 - wet * 0.20)
        });
        var top;
        // Wet ground is darker ground, whatever it is made of.
        function damp() { return new THREE.Color(1, 1, 1).multiplyScalar(1 - wet * 0.24); }
        if (kind === 'sand') {
            top = new THREE.MeshPhongMaterial({
                map: tiledCap(b, b.tex.sand, w, d, 2, worldUv),
                color: damp(), shininess: 4 + wet * 60, specular: new THREE.Color(0x000000).lerp(new THREE.Color(0x9aa4ac), wet)
            });
        } else if (kind === 'wood') {
            top = new THREE.MeshPhongMaterial({
                map: tiledCap(b, b.tex.wood, w, d, 2, worldUv),
                color: damp(), shininess: 8 + wet * 80, specular: new THREE.Color(0x151515).lerp(new THREE.Color(0xb0bcc4), wet)
            });
        } else if (kind === 'rough') {
            top = new THREE.MeshPhongMaterial({
                map: tiledCap(b, b.tex.rough, w, d, 2, worldUv),
                color: damp(), shininess: 3 + wet * 40, specular: new THREE.Color(0x000000).lerp(new THREE.Color(0x7d8a92), wet)
            });
        } else {
            // The greens get the most of everything: a bump map of the same
            // blades that are in the colour map, so the light rakes across the
            // mow bands rather than lying on them flat.
            top = new THREE.MeshPhongMaterial({
                map: tiledCap(b, b.tex.grass, w, d, 3.5, worldUv),
                bumpMap: tiledCap(b, b.tex.grassBump, w, d, 0.8, worldUv),
                bumpScale: 0.035 + wet * 0.02,
                color: damp(),
                // Wet grass is dark and sheeny, not glittery: a bump map under
                // a hard specular puts a white speck on every blade and the
                // green comes out looking like frost.
                shininess: 4 + wet * 22,
                specular: new THREE.Color(0x1c2a18).lerp(new THREE.Color(0x4a5a60), wet)
            });
        }
        // Box material order is +x, -x, +y, -y, +z, -z; an extruded slab has
        // just two groups, caps then walls. Passing six covers both, since the
        // slab only ever reads the first two — so cap first, wall second.
        return worldUv ? [top, side] : [side, side, top, side, side, side];
    }

    var PLANK_THICK = 0.3;

    var FLAG_W = 0.76;

    /* Pads are drawn as boxes whose underside reaches the surrounding ground,
       so a raised green reads as a plateau with a cliff instead of a slab
       hovering in the air. Boards are the exception: a jetty is supposed to
       look like a plank over the water, not a causeway through it. */
    /* The pad that holds the cup is built as an extruded shape with a circular
       hole in it rather than as a box, so the hole in the picture is the hole
       the ball falls through. Everything else stays a box: this costs a
       triangulation, and only one pad per hole needs it. */
    function punchedSlab(pad, thick, cup) {
        var shape = new THREE.Shape();
        var hw = pad.w / 2, hd = pad.d / 2;
        // Built around the pad's centre, in the plane three.js extrudes; after
        // the rotation below, shape-y runs along world -z.
        shape.moveTo(-hw, -hd);
        shape.lineTo(hw, -hd);
        shape.lineTo(hw, hd);
        shape.lineTo(-hw, hd);
        shape.lineTo(-hw, -hd);

        var hole = new THREE.Path();
        var cx = pad.x + hw, cz = pad.z + hd;
        hole.absarc(cup.x - cx, -(cup.z - cz), C.HOLE_R, 0, Math.PI * 2, true);
        shape.holes.push(hole);

        var geo = new THREE.ExtrudeGeometry(shape, {
            depth: thick, bevelEnabled: false, curveSegments: 28
        });
        geo.rotateX(-Math.PI / 2);       // lay it flat: extrusion now runs +y
        geo.translate(0, -thick, 0);     // top face at y = 0, like the box
        return geo;
    }

    function addPad(b, group, pad, theme, cup) {
        var cx = pad.x + pad.w / 2, cz = pad.z + pad.d / 2;
        var sx = pad.sx || 0, sz = pad.sz || 0;
        var cy = P.padHeight(pad, cx, cz);
        var rise = (Math.abs(sx) * pad.w + Math.abs(sz) * pad.d) / 2;
        var thick = pad.kind === 'wood'
            ? PLANK_THICK
            : Math.max(0.6, cy - (theme.surroundY - 0.4) + rise);
        var holed = cup && P.padContains(pad, cup.x, cup.z) &&
            Math.abs(P.padHeight(pad, cup.x, cup.z) - cup.y) < 0.06;
        var geo = holed
            ? punchedSlab(pad, thick, cup)
            : new THREE.BoxGeometry(pad.w, thick, pad.d);
        if (holed) {
            // The box is centred on its own middle; the extruded slab is built
            // that way too, so both share the placement below.
            geo.translate(0, thick / 2, 0);
        }
        if (sx || sz) {
            // Shear about the pad's own centre: y' = y + sx·x + sz·z. Vertical
            // edges stay vertical, so a tilted pad still meets its neighbours.
            var m = new THREE.Matrix4();
            m.set(1, 0, 0, 0,
                  sx, 1, sz, 0,
                  0, 0, 1, 0,
                  0, 0, 0, 1);
            geo.applyMatrix4(m);
            geo.computeVertexNormals();
        }
        var mesh = new THREE.Mesh(geo, padMaterial(b, pad.kind, theme, pad.w, pad.d, holed));
        mesh.position.set(cx, cy - thick / 2, cz);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        group.add(mesh);
    }

    function addWall(b, group, wall, theme) {
        var B = P.wallBox(wall, 0);
        var geo = new THREE.BoxGeometry(wall.w, wall.h, wall.d);
        var color = wall.kind === 'blade' ? 0xd8523f : (wall.kind === 'gate' ? 0xe0a13a : theme.rail);
        var wet = b.weather ? (b.weather.wet || 0) : 0;
        // A painted rail has a sheen on it in any weather and a hard one in the
        // rain; it is also the brightest thing on most holes, which is what
        // gives the bloom something to find.
        var mat = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color).multiplyScalar(1 - wet * 0.16),
            shininess: 22 + wet * 80,
            specular: new THREE.Color(0x2a2f33).lerp(new THREE.Color(0xaab6bd), wet)
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(B.cx, B.base + wall.h / 2, B.cz);
        mesh.rotation.y = B.yaw;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        if (wall.move || wall.spin) {
            b.movers.push({ mesh: mesh, wall: wall, h: wall.h });
            if (wall.spin) {
                // A blade needs something to turn on, or it reads as a floating
                // plank.
                var post = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.16, 0.2, wall.h + 1.5, 12),
                    new THREE.MeshLambertMaterial({ color: 0x6b7280 })
                );
                post.position.set(B.cx, B.base + (wall.h + 1.5) / 2 - 0.3, B.cz);
                post.castShadow = true;
                group.add(post);
            }
        }
    }

    function addWater(b, group, w, theme) {
        // A box rather than a plane: the pads reach down to the surrounding
        // ground, so a pond between two of them is a filled channel, and a
        // sheet floating in the gap would read as a decal. Only the top face
        // gets the water shader; the sides are the murk underneath it.
        var depth = Math.max(0.6, w.y - theme.surroundY + 0.2);
        var murk = new THREE.MeshLambertMaterial({
            color: new THREE.Color(theme.water).multiplyScalar(0.45)
        });
        var top = waterMat(b, theme, { alpha: 0.9 });
        // Box material order: +x, -x, +y, -y, +z, -z.
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, depth, w.d),
            [murk, murk, top, murk, murk, murk]);
        mesh.position.set(w.x + w.w / 2, w.y - depth / 2, w.z + w.d / 2);
        group.add(mesh);
    }

    function addSurround(b, group, hole, theme) {
        var mat;
        if (theme.surround === 'water') {
            mat = waterMat(b, theme, {});
        } else {
            var rt = T.rock(theme.surround === 'rock' ? '#9c8466' : (theme.floor || '#3f4450'));
            rt.wrapS = rt.wrapT = THREE.RepeatWrapping;
            rt.anisotropy = b.maxAniso;
            rt.repeat.set(150, 150);
            // Per-hole and nobody else's, so it goes on the list the
            // renderer disposes with the hole rather than onto the
            // shared cache, where it used to sit and leak.
            b.textures.push(rt);
            mat = new THREE.MeshLambertMaterial({ map: rt });
        }
        // Big enough that its edge is beyond the fog, so the horizon is a fade
        // and not a line.
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set((hole.bounds.minX + hole.bounds.maxX) / 2, theme.surroundY, (hole.bounds.minZ + hole.bounds.maxZ) / 2);
        group.add(mesh);
    }

    /* ── the cup, the pin and the tee ──────────────────────────────────── */

    /* The hole through the green is real geometry (see punchedSlab); what is
       added here is the liner that makes the shaft read as a shaft, the floor
       the ball comes to rest on, the white rim, and the pin.

       **The pin stands in the cup**, which is where a pin stands. It used to
       be planted beside it, on the grounds that a flagstick down the middle of
       a hole this size is something the ball ought to hit and would instead go
       straight through — an honest dodge that made every hole look wrong. It
       stands vertical, as a real flagstick does; the ball passes through the
       green geometry around the cup, not through the pin itself.

       The pin also does a job nothing else on the course does: it is the only
       instrument telling you what the wind is doing. The cloth streams
       downwind, snaps in a gust and hangs limp when it drops — so a glance at
       the flag is a reading, not a decoration. */
    function addCup(b, group, hole) {
        var cup = hole.cup;

        var liner = new THREE.Mesh(
            new THREE.CylinderGeometry(C.HOLE_R - 0.004, C.HOLE_R - 0.004, C.CUP_DEPTH, 28, 1, true),
            new THREE.MeshLambertMaterial({ color: 0x14170f, side: THREE.BackSide })
        );
        liner.position.set(cup.x, cup.y - C.CUP_DEPTH / 2, cup.z);
        group.add(liner);

        var floor = new THREE.Mesh(
            new THREE.CircleGeometry(C.HOLE_R, 28),
            new THREE.MeshLambertMaterial({ color: 0x1d2416 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(cup.x, cup.y - C.CUP_DEPTH, cup.z);
        floor.receiveShadow = true;
        group.add(floor);

        var rim = new THREE.Mesh(
            new THREE.RingGeometry(C.HOLE_R - 0.005, C.HOLE_R + 0.045, 32),
            new THREE.MeshBasicMaterial({ color: 0xf2f5f0, side: THREE.DoubleSide })
        );
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(cup.x, cup.y + 0.006, cup.z);
        group.add(rim);
        b.cup = rim;

        /* The pin. Everything below hangs off one group standing at the
           centre of the cup, tilted away down the line of play, so the lean is
           set once and the flag, the ferrule and the wobble all inherit it. */
        var away = Math.atan2(cup.x - hole.tee.x, cup.z - hole.tee.z);
        var pin = new THREE.Group();
        pin.position.set(cup.x, cup.y - C.CUP_DEPTH + 0.01, cup.z);
        pin.rotation.y = away;             // a real flagstick stands vertical
        group.add(pin);
        b.pin = pin;

        var H = 2.25;
        var pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.021, 0.030, H, 10),
            new THREE.MeshPhongMaterial({ color: 0xf4f6f4, shininess: 40, specular: 0x556066 })
        );
        pole.position.y = H / 2;
        pole.castShadow = true;
        pin.add(pole);
        b.flagPole = pole;

        // The weighted foot that sits on the floor of the cup, and the black
        // band at the lip: both are what a real flagstick has, and between
        // them they stop the pole reading as a wire pushed into the grass.
        var foot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.075, 0.07, 12),
            new THREE.MeshLambertMaterial({ color: 0x23262a })
        );
        foot.position.y = 0.035;
        pin.add(foot);

        var band = new THREE.Mesh(
            new THREE.CylinderGeometry(0.033, 0.033, 0.16, 10),
            new THREE.MeshLambertMaterial({ color: 0x23262a })
        );
        band.position.y = C.CUP_DEPTH + 0.10;
        pin.add(band);

        /* The cloth turns about the pole rather than with the hole, because a
           flag points where the wind is going and nowhere else. It is built
           with its hoist at the origin so that rotating the group swings it
           round the stick instead of round its own middle. */
        var swivel = new THREE.Group();
        swivel.position.y = H - 0.10;
        pin.add(swivel);
        b.flagSwivel = swivel;

        var cloth = new THREE.Mesh(
            new THREE.PlaneGeometry(FLAG_W, 0.43, 14, 3),
            new THREE.MeshPhongMaterial({
                color: 0xe23b3b, side: THREE.DoubleSide, shininess: 6, specular: 0x2a1010
            })
        );
        cloth.geometry.translate(FLAG_W / 2, -0.215, 0);   // hoist at the origin
        cloth.castShadow = true;
        swivel.add(cloth);
        b.flagCloth = cloth;
        b.flagRest = cloth.geometry.attributes.position.array.slice();
        // The ripple runs along the fly, so whoever animates the cloth
        // needs to know how wide it is. One definition, handed over.
        b.flagWidth = FLAG_W;
    }

    function addTeeMark(b, group, hole) {
        var m = new THREE.Mesh(
            new THREE.RingGeometry(0.20, 0.26, 20),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        m.rotation.x = -Math.PI / 2;
        m.position.set(hole.tee.x, hole.tee.y + 0.015, hole.tee.z);
        group.add(m);
    }

    /* Three lights, and the weather sets all three.

       The sun is the one that changes most: overcast takes it down to a fifth
       and hands the difference to the sky, which is exactly what a cloud does,
       and the golden-hour kinds drop it towards the horizon and warm it, which
       is what gives those holes their long shadows. The shadow *softens* with
       the cloud rather than merely fading, by widening the sampling radius —
       a sharp shadow under a solid overcast is the single loudest way to tell
       a player that the sky is a picture.

       The third is a fill from the opposite side at a fraction of the sun's
       strength. Without it the shaded face of every rail on the course is the
       flat ambient colour and the hole reads as a diagram; with it there is a
       bounce off the ground and the boxes turn into objects. */
    function lights(b, group, hole, theme, weather) {
        var cx = (hole.bounds.minX + hole.bounds.maxX) / 2;
        var cz = (hole.bounds.minZ + hole.bounds.maxZ) / 2;

        /* The fill light is the sky, so it is the same colour as the sky: an
           overcast one goes grey, a golden one goes orange. Skipping this is
           what leaves a sunset looking like a warm filter over a scene still
           lit by a blue afternoon. */
        var skyLight = skyTint(theme.ambient, weather, false);
        if (weather.cloud > 0.6) skyLight.lerp(new THREE.Color(0xc6d2de), (weather.cloud - 0.6) * 1.2);
        var amb = new THREE.HemisphereLight(skyLight, 0x3c4436, theme.ambientI * weather.amb);
        group.add(amb);

        var sunColour = new THREE.Color(weather.warm || theme.sun);
        var pos = theme.sunPos;
        // A low sun is a long shadow: pull the height down and push the reach
        // out, keeping the bearing the hole was designed around.
        var lift = weather.low ? 0.30 : 1;
        var reach = weather.low ? 1.9 : 1;
        var sun = new THREE.DirectionalLight(sunColour, 0.95 * weather.sun);
        sun.position.set(cx + pos[0] * reach, Math.max(2.5, pos[1] * lift), cz + pos[2] * reach);
        sun.target.position.set(cx, 0, cz);
        sun.castShadow = true;
        var span = Math.max(hole.bounds.maxX - hole.bounds.minX, hole.bounds.maxZ - hole.bounds.minZ) * 0.75 + 4;
        sun.shadow.camera.left = -span;
        sun.shadow.camera.right = span;
        sun.shadow.camera.top = span;
        sun.shadow.camera.bottom = -span;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 120;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.bias = -0.0009;
        sun.shadow.normalBias = 0.02;
        sun.shadow.radius = 1.5 + weather.cloud * 4.5;
        group.add(sun);
        group.add(sun.target);
        b.sun = sun;
        b.sunDir.set(pos[0] * reach, Math.max(2.5, pos[1] * lift), pos[2] * reach).normalize();

        var fill = new THREE.DirectionalLight(skyLight, 0.16 + weather.cloud * 0.10);
        fill.position.set(cx - pos[0], Math.abs(pos[1]) * 0.45, cz - pos[2]);
        fill.target.position.set(cx, 0, cz);
        group.add(fill);
        group.add(fill.target);
    }

    /* A hole is built once, and the weather it is built under is baked into
       every material in it — the wetness of the grass, the softness of the
       shadows, the colour of the fill. That is why changing the weather
       rebuilds the hole rather than tweening: half of it is uniforms and would
       tween beautifully, and the other half is material state that would not,
       and a hole that is half sunny is worse than a cut. */

    /* The one entry point. `opts` is { theme, weather, tex, maxAniso }, where
       `tex` is the renderer's cache of textures that outlive a hole. */
    function build(hole, opts) {
        var theme = opts.theme;
        var weather = opts.weather;

        var b = {
            group: new THREE.Group(),
            theme: theme,
            weather: weather,
            tex: opts.tex,
            maxAniso: opts.maxAniso || 1,
            movers: [],
            waterMats: [],
            textures: [],
            sky: null,
            sun: null,
            sunDir: new THREE.Vector3(0, 1, 0),
            cup: null, pin: null,
            flagPole: null, flagSwivel: null, flagCloth: null, flagRest: null,
            flagWidth: 0
        };

        /* One grass texture per hole, because the pad materials hold clones of
           it tinted for this theme. It goes on the disposal list like the
           rest. */
        b.tex.grass = T.grass(theme);
        b.textures.push(b.tex.grass);

        /* The weather scales the theme's own fog, which is what makes mist a
           different hole rather than a different filter over the same one. */
        b.fogNear = 24 * weather.fog;
        b.fogFar = 95 * weather.fog;
        b.fogColour = skyTint(theme.fog, weather, false);

        var dome = G3.sky.dome(theme, weather);
        b.sky = dome.material;
        b.group.add(dome.mesh);

        lights(b, b.group, hole, theme, weather);
        addSurround(b, b.group, hole, theme);

        var i;
        for (i = 0; i < hole.pads.length; i++) addPad(b, b.group, hole.pads[i], theme, hole.cup);
        for (i = 0; i < hole.walls.length; i++) addWall(b, b.group, hole.walls[i], theme);
        for (i = 0; i < hole.water.length; i++) addWater(b, b.group, hole.water[i], theme);
        addCup(b, b.group, hole);
        addTeeMark(b, b.group, hole);

        /* The rain, the mist banks and whatever is drifting in the air are
           parented to the hole, so the next hole disposes them with it. */
        if (G3.weather) b.group.add(G3.weather.build(hole, theme, weather));

        /* Every water shader on the hole is told the same sky it is going to
           be reflecting, once, here — and the sun the lights just placed. */
        G3.water.lightAll(b.waterMats, theme, weather, b.sunDir, b.fogNear, b.fogFar);
        if (b.sky) b.sky.uniforms.sunDir.value.copy(b.sunDir);

        return b;
    }

    G3.holeMesh = { build: build };

})(window.G3);
