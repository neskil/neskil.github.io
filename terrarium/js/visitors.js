// Pocket Weather Terrarium — who else lives in the jar. A sheep grazes the
// meadow, butterflies come out on warm dry days, a duck and her duckling
// paddle round the pond until it freezes, an earthworm works its way round
// the soil against the glass, and every few minutes (or after five
// quick taps on the glass) something comes down out of the jar's sky for the
// sheep. It brings her back.
//
// Built against the same three.js global and jar coordinates as scene.js,
// which hands over the pieces of the world this needs.

const THREE = window.THREE;

const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const lin = (c) => new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255).convertSRGBToLinear();

// How long each part of a visit lasts, in seconds.
const VISIT = [['arrive', 2.6], ['beam', 0.8], ['lift', 3], ['close', 0.6], ['leave', 1.8]];
const AWAY = 22;          // how long the sheep is gone for
const SHEEP_REACH = 0.7;  // she keeps to the flat middle of the meadow
const SHEEP_SIZE = 1.7;
const UFO_SIZE = 1.5;
const HOVER = 0.62;       // how high the saucer stops over her

export function createVisitors({ world, shell, groundH, onMeadow, envMap, rand, pond }) {
    /* ── The sheep ── */
    const sheep = new THREE.Group();
    const body = new THREE.Group();
    sheep.add(body);
    const wool = new THREE.MeshStandardMaterial({ color: lin([236, 232, 222]), roughness: 1 });
    const face = new THREE.MeshStandardMaterial({ color: lin([46, 40, 38]), roughness: 0.75 });
    const puff = new THREE.IcosahedronGeometry(1, 1);
    for (const [x, y, z, r] of [[0, 0.056, 0, 0.03], [0.012, 0.06, 0.022, 0.024], [-0.012, 0.06, 0.022, 0.024], [0.012, 0.058, -0.024, 0.025], [-0.012, 0.058, -0.024, 0.025], [0, 0.072, 0.004, 0.024], [0, 0.07, -0.02, 0.022], [0, 0.06, 0.036, 0.018]]) {
        const p = new THREE.Mesh(puff, wool);
        p.position.set(x, y, z);
        p.scale.setScalar(r);
        p.castShadow = true;
        body.add(p);
    }
    const head = new THREE.Group();
    head.position.set(0, 0.066, 0.046);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), face);
    skull.scale.set(0.012, 0.014, 0.019);
    skull.position.z = 0.012;
    skull.castShadow = true;
    const fringe = new THREE.Mesh(puff, wool);
    fringe.scale.setScalar(0.011);
    fringe.position.set(0, 0.011, 0.006);
    head.add(skull, fringe);
    for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), face);
        ear.scale.set(0.009, 0.003, 0.005);
        ear.position.set(s * 0.013, 0.006, 0.004);
        ear.rotation.z = s * 0.4;
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 6, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        eye.position.set(s * 0.0085, 0.004, 0.022);
        head.add(ear, eye);
    }
    body.add(head);
    const legs = [];
    const legGeo = new THREE.CylinderGeometry(0.0035, 0.003, 0.036, 6);
    legGeo.translate(0, -0.018, 0);
    for (const [x, z] of [[0.013, 0.026], [-0.013, 0.026], [0.013, -0.026], [-0.013, -0.026]]) {
        const leg = new THREE.Mesh(legGeo, face);
        leg.position.set(x, 0.038, z);
        leg.castShadow = true;
        body.add(leg);
        legs.push(leg);
    }
    sheep.scale.setScalar(SHEEP_SIZE);
    world.add(sheep);

    const flock = { x: 0.2, z: 0.36, heading: -2.4, mode: 'graze', timer: 4, tx: 0, tz: 0, gone: 0, drop: 0 };

    // A path is fine if it never crosses the pond, the cabin or the tree.
    function pickTarget() {
        for (let tries = 0; tries < 30; tries++) {
            const a = rand() * 6.283, r = Math.sqrt(rand()) * SHEEP_REACH;
            const x = Math.cos(a) * r, z = Math.sin(a) * r;
            let clear = true;
            for (let k = 1; k <= 8 && clear; k++) {
                const f = k / 8;
                clear = onMeadow(flock.x + (x - flock.x) * f, flock.z + (z - flock.z) * f);
            }
            if (clear) { flock.tx = x; flock.tz = z; return true; }
        }
        return false;
    }

    function placeSheep() {
        sheep.position.set(flock.x, groundH(flock.x, flock.z), flock.z);
        sheep.rotation.set(0, flock.heading, 0);
    }
    placeSheep();

    function updateSheep(dt, t, snow) {
        if (flock.mode === 'taken') return;
        if (flock.mode === 'gone') {
            flock.gone -= dt;
            if (flock.gone > 0) return;
            // Set back down somewhere on the meadow, a little dazed.
            for (let k = 0; k < 40; k++) {
                const a = rand() * 6.283, r = Math.sqrt(rand()) * SHEEP_REACH;
                flock.x = Math.cos(a) * r; flock.z = Math.sin(a) * r;
                if (onMeadow(flock.x, flock.z)) break;
            }
            flock.mode = 'graze';
            flock.timer = 5;
            flock.drop = 1;
            sheep.visible = true;
            sheep.scale.setScalar(SHEEP_SIZE);
            body.rotation.set(0, 0, 0);
        }
        if (flock.mode === 'stunned') {
            head.rotation.x = -0.5;
            legs.forEach(l => { l.rotation.x = 0; });
            return;
        }
        let walking = false;
        if (flock.mode === 'graze') {
            flock.timer -= dt;
            head.rotation.x = 0.75 + Math.sin(t * 7) * 0.08;
            if (flock.timer <= 0 && pickTarget()) flock.mode = 'walk';
            else if (flock.timer <= 0) flock.timer = 2;
        } else {
            const dx = flock.tx - flock.x, dz = flock.tz - flock.z, d = Math.hypot(dx, dz);
            if (d < 0.015) {
                flock.mode = 'graze';
                flock.timer = 3 + rand() * 7;
            } else {
                const want = Math.atan2(dx, dz);
                let turn = want - flock.heading;
                turn = Math.atan2(Math.sin(turn), Math.cos(turn));
                flock.heading += Math.sign(turn) * Math.min(Math.abs(turn), dt * 2.5);
                if (Math.abs(turn) < 0.6) {
                    const v = (snow > 0.5 ? 0.022 : 0.035) * dt;
                    flock.x += Math.sin(flock.heading) * v;
                    flock.z += Math.cos(flock.heading) * v;
                    walking = true;
                }
                head.rotation.x = 0.1;
            }
        }
        legs.forEach((l, k) => { l.rotation.x = walking ? Math.sin(t * 13 + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.45 : 0; });
        body.position.y = walking ? Math.abs(Math.sin(t * 13)) * 0.003 : 0;
        placeSheep();
        if (flock.drop > 0) {
            flock.drop = Math.max(0, flock.drop - dt * 1.6);
            sheep.position.y += ease(flock.drop) * 0.35;
        }
    }

    /* ── A duck and her duckling on the pond ──
       She picks a spot on open water, turns towards it and paddles over,
       steering clear of the lily pads; the duckling keeps a little way
       behind her. A V of wake spreads behind each while they move. Gone
       while the pond is frozen; still, heads down, at night. */
    const wakeTex = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        for (const s of [-1, 1]) {
            const gr = g.createLinearGradient(32, 0, 32 + s * 26, 64);
            gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
            g.strokeStyle = gr; g.lineWidth = 3; g.lineCap = 'round';
            g.beginPath(); g.moveTo(32, 2); g.lineTo(32 + s * 26, 62); g.stroke();
        }
        const tex = new THREE.CanvasTexture(c);
        return tex;
    })();
    function duck(plumage, crown, bill, size) {
        const g = new THREE.Group();
        const feathers = new THREE.MeshStandardMaterial({ color: lin(plumage), roughness: 0.85 });
        const dark = new THREE.MeshStandardMaterial({ color: lin(crown), roughness: 0.8 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), feathers);
        body.scale.set(0.015, 0.011, 0.024);
        body.position.y = 0.004;
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.016, 6), feathers);
        tail.rotation.x = -2.1;
        tail.position.set(0, 0.01, -0.024);
        const head = new THREE.Group();
        head.position.set(0, 0.018, 0.016);
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 12, 8), dark);
        const beak = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.003, 0.011), new THREE.MeshStandardMaterial({ color: lin(bill), roughness: 0.5 }));
        beak.position.set(0, -0.002, 0.011);
        head.add(skull, beak);
        for (const sx of [-1, 1]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0016, 6, 4), new THREE.MeshBasicMaterial({ color: 0x111111 }));
            eye.position.set(sx * 0.0078, 0.002, 0.004);
            head.add(eye);
        }
        const wake = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.09), new THREE.MeshBasicMaterial({ map: wakeTex, transparent: true, depthWrite: false, opacity: 0 }));
        wake.rotation.x = -Math.PI / 2;
        wake.position.set(0, -0.0035, -0.035);
        g.add(body, tail, head, wake);
        for (const m of [body, tail, skull]) m.castShadow = true;
        g.scale.setScalar(size);
        return { g, head, wake, size, x: pond.x, z: pond.z, heading: rand() * 6.28, speed: 0 };
    }
    const ducks = new THREE.Group();
    world.add(ducks);
    const hen = duck([132, 100, 70], [96, 72, 50], [214, 140, 52], 1);
    const chick = duck([236, 206, 92], [214, 180, 70], [150, 110, 60], 0.55);
    ducks.add(hen.g, chick.g);
    hen.x = pond.x - pond.r * 0.3; hen.z = pond.z;
    chick.x = hen.x - 0.04; chick.z = hen.z;
    const paddle = { tx: hen.x, tz: hen.z, wait: 2, shown: -1 };
    const openWater = (x, z) => Math.hypot(x - pond.x, z - pond.z) < pond.r * 0.68
        && pond.avoid.every(([px, pz, pr]) => Math.hypot(x - px, z - pz) > pr + 0.022);
    function pickWater() {
        for (let tries = 0; tries < 30; tries++) {
            const a = rand() * 6.283, r = Math.sqrt(rand()) * pond.r * 0.68;
            const x = pond.x + Math.cos(a) * r, z = pond.z + Math.sin(a) * r;
            let clear = true;
            for (let k = 1; k <= 8 && clear; k++) clear = openWater(hen.x + (x - hen.x) * k / 8, hen.z + (z - hen.z) * k / 8);
            if (clear) { paddle.tx = x; paddle.tz = z; return; }
        }
    }
    function swim(d, tx, tz, top, dt) {
        const dx = tx - d.x, dz = tz - d.z, dist = Math.hypot(dx, dz);
        let want = 0;
        if (dist > 0.006) {
            let turn = Math.atan2(dx, dz) - d.heading;
            turn = Math.atan2(Math.sin(turn), Math.cos(turn));
            d.heading += Math.sign(turn) * Math.min(Math.abs(turn), dt * 2);
            if (Math.abs(turn) < 0.8) want = Math.min(top, dist * 1.5);
        }
        d.speed += (want - d.speed) * Math.min(1, dt * 2);
        d.x += Math.sin(d.heading) * d.speed * dt;
        d.z += Math.cos(d.heading) * d.speed * dt;
    }
    function updateDucks(dt, t, day, frozen, still) {
        const want = frozen ? 0 : 1;
        if (paddle.shown < 0) paddle.shown = want;
        paddle.shown += (want - paddle.shown) * Math.min(1, dt * 0.6);
        ducks.visible = paddle.shown > 0.02;
        if (!ducks.visible) return;
        const asleep = day < 0.2;
        if (!asleep && !still) {
            paddle.wait -= dt;
            if (paddle.wait <= 0 && Math.hypot(paddle.tx - hen.x, paddle.tz - hen.z) < 0.01) { pickWater(); paddle.wait = 3 + rand() * 6; }
            swim(hen, paddle.tx, paddle.tz, 0.03, dt);
            // The duckling aims a little behind her and hurries when it falls back.
            swim(chick, hen.x - Math.sin(hen.heading) * 0.038, hen.z - Math.cos(hen.heading) * 0.038, 0.045, dt);
        } else { hen.speed = chick.speed = 0; }
        for (const [k, d] of [hen, chick].entries()) {
            d.g.position.set(d.x, pond.y + 0.0035 * d.size + Math.sin(t * 1.6 + k * 2) * 0.0008, d.z);
            d.g.rotation.set(Math.sin(t * 1.3 + k) * 0.04, d.heading, Math.sin(t * 1.1 + k) * 0.05);
            d.g.scale.setScalar(d.size * paddle.shown);
            // Head tucked in at night, a dip for weed now and then by day.
            const dip = !asleep && Math.sin(t * 0.37 + k * 3) > 0.96 ? 0.7 : 0;
            d.head.rotation.x = asleep ? 0.9 : dip;
            d.head.position.z = asleep ? 0.008 : 0.016;
            d.wake.material.opacity = Math.min(0.45, d.speed * 18);
        }
    }

    /* ── The worm, against the glass in the topsoil ── */
    const WORM = 14;
    const wormMat = new THREE.MeshStandardMaterial({ color: lin([196, 116, 112]), roughness: 0.32 });
    const bandMat = new THREE.MeshStandardMaterial({ color: lin([214, 150, 140]), roughness: 0.3 });
    const segGeo = new THREE.SphereGeometry(1, 10, 8);
    const worm = Array.from({ length: WORM }, (_, i) => {
        const m = new THREE.Mesh(segGeo, i === 4 || i === 5 ? bandMat : wormMat);
        const taper = Math.sin(Math.PI * (i + 1) / (WORM + 1));
        m.scale.setScalar(0.006 + 0.008 * Math.pow(taper, 0.6));
        shell.add(m);
        return m;
    });
    const crawl = { a: -0.35, dir: 1, pause: 0 };
    function updateWorm(dt, t) {
        if (crawl.pause > 0) crawl.pause -= dt;
        else {
            crawl.a += crawl.dir * 0.02 * dt;
            if (rand() < dt * 0.012) { crawl.pause = 2 + rand() * 4; if (rand() < 0.4) crawl.dir *= -1; }
        }
        // It moves by squeezing: the head reaches, the tail catches up.
        const squeeze = crawl.pause > 0 ? 0 : Math.sin(t * 2.2);
        worm.forEach((m, i) => {
            const ai = crawl.a - crawl.dir * i * (0.017 + 0.003 * squeeze * (i / WORM));
            const y = 0.63 + 0.055 * Math.sin(ai * 4 + 1.3) + 0.008 * Math.sin(t * 1.6 - i * 0.7);
            const r = 0.976 + 0.003 * Math.sin(t * 3 - i);
            m.position.set(Math.sin(ai) * r, y, Math.cos(ai) * r);
        });
    }

    /* ── The visitor ── */
    const ufo = new THREE.Group();
    const hull = new THREE.MeshStandardMaterial({ color: 0xc4ccd8, metalness: 0.9, roughness: 0.22, envMap, envMapIntensity: 1.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x4a525e, metalness: 0.8, roughness: 0.35, envMap });
    const saucer = new THREE.Mesh(new THREE.SphereGeometry(0.13, 40, 16), hull);
    saucer.scale.y = 0.26;
    saucer.castShadow = true;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.126, 0.01, 8, 48), dark);
    rim.rotation.x = Math.PI / 2;
    const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.03, 24), dark);
    belly.position.y = -0.03;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 12, 0, 6.283, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xa8fff0, emissive: 0x2fae90, emissiveIntensity: 0.7, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.6, envMap }));
    dome.position.y = 0.022;
    const spinner = new THREE.Group();
    spinner.add(saucer, rim, belly, dome);
    const bulbs = Array.from({ length: 10 }, (_, k) => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
        const a = k / 10 * 6.283;
        b.position.set(Math.cos(a) * 0.128, -0.004, Math.sin(a) * 0.128);
        spinner.add(b);
        return b;
    });
    ufo.add(spinner);
    const glow = new THREE.PointLight(0x9dffc8, 0, 1.3, 2);
    glow.position.y = -0.06;
    ufo.add(glow);

    // The tractor beam: a cone, brighter at the top, with rings sliding down it.
    const beamUniforms = { uA: { value: 0 }, uTime: { value: 0 } };
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.15, 1, 32, 1, true);
    beamGeo.translate(0, -0.5, 0);
    const beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({
        uniforms: beamUniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform float uA; uniform float uTime; varying vec2 vUv;
            void main() {
                float rings = 0.65 + 0.35 * sin(vUv.y * 46.0 + uTime * 9.0);
                float edge = 0.6 + 0.4 * sin(vUv.x * 6.2832 * 3.0 + uTime * 2.0);
                float a = uA * (0.2 + 0.7 * vUv.y) * rings * edge;
                gl_FragColor = vec4(vec3(0.55, 1.0, 0.8) * a, a);
            }`,
    }));
    beam.position.y = -0.03;
    beam.visible = false;
    ufo.add(beam);
    ufo.visible = false;
    world.add(ufo);

    const visit = { phase: null, t: 0, next: 150 + rand() * 120, from: new THREE.Vector3(), over: new THREE.Vector3() };

    function summon() {
        if (visit.phase || flock.mode === 'gone' || flock.mode === 'taken') return false;
        visit.phase = 0;
        visit.t = 0;
        const a = rand() * 6.283;
        visit.from.set(Math.cos(a) * 0.45, 2.72, Math.sin(a) * 0.45);
        flock.mode = 'stunned';
        return true;
    }

    function updateUfo(dt, t, still) {
        if (visit.phase === null) {
            if (!still) {
                visit.next -= dt;
                if (visit.next <= 0) { summon(); visit.next = 200 + rand() * 220; }
            }
            return;
        }
        visit.t += dt;
        while (visit.phase < VISIT.length && visit.t >= VISIT[visit.phase][1]) {
            visit.t -= VISIT[visit.phase][1];
            visit.phase++;
            if (visit.phase < VISIT.length && VISIT[visit.phase][0] === 'lift') flock.mode = 'taken';
        }
        if (visit.phase >= VISIT.length) {
            visit.phase = null;
            ufo.visible = false;
            beam.visible = false;
            glow.intensity = 0;
            flock.mode = 'gone';
            flock.gone = AWAY;
            return;
        }
        const [name, len] = VISIT[visit.phase];
        const f = visit.t / len;
        const groundY = groundH(flock.x, flock.z);
        visit.over.set(flock.x, groundY + HOVER, flock.z);
        ufo.visible = true;
        spinner.rotation.y += dt * 2.5;
        bulbs.forEach((b, k) => b.material.color.setHSL((k / bulbs.length + t * 0.6) % 1, 1, 0.62));
        const bob = Math.sin(t * 2.4) * 0.012;
        let beamA = 0;
        if (name === 'arrive') {
            const e = ease(f);
            ufo.position.lerpVectors(visit.from, visit.over, e);
            ufo.position.y += Math.sin(f * Math.PI) * 0.15 + bob * e;
            ufo.scale.setScalar(UFO_SIZE * (0.2 + 0.8 * e));
            ufo.rotation.z = Math.sin(f * Math.PI) * 0.25;
        } else if (name === 'leave') {
            const e = f * f;
            ufo.position.set(visit.over.x * (1 - e * 0.6), visit.over.y + e * 2.2, visit.over.z * (1 - e * 0.6));
            ufo.scale.setScalar(UFO_SIZE * Math.max(0.02, 1 - e * 0.95));
            ufo.rotation.z = -e * 0.4;
        } else {
            ufo.position.copy(visit.over);
            ufo.position.y += bob;
            ufo.rotation.z = 0;
            ufo.scale.setScalar(UFO_SIZE);
            beamA = name === 'beam' ? ease(f) : name === 'lift' ? 1 : 1 - ease(f);
        }
        beam.visible = beamA > 0.01;
        beamUniforms.uA.value = beamA;
        beamUniforms.uTime.value = t;
        beam.scale.y = Math.max(0.01, (ufo.position.y - groundY) / ufo.scale.y - 0.03);
        glow.intensity = 0.25 + beamA * 1.1;

        if (name === 'lift') {
            // Up she goes, turning slowly, legs going, and in at the hatch.
            const e = ease(f);
            sheep.position.set(flock.x, groundY + e * (HOVER - 0.09), flock.z);
            body.rotation.set(Math.sin(t * 3) * 0.2, 0, Math.sin(t * 2.3) * 0.25);
            sheep.rotation.y += dt * 1.6;
            legs.forEach((l, k) => { l.rotation.x = Math.sin(t * 20 + k * 1.7) * 0.6; });
            sheep.scale.setScalar(SHEEP_SIZE * (f > 0.82 ? Math.max(0, 1 - (f - 0.82) / 0.18) : 1));
            sheep.visible = sheep.scale.x > 0.01;
        }
    }

    /* ── Butterflies, on warm dry days ──
       Each is two painted wings hinged on a body, flapping fast, wandering
       between flowers on a loose figure-of-eight and resting now and then. */
    function wingTex(base, edge, spot) {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        g.fillStyle = base;
        g.beginPath(); g.moveTo(2, 34); g.bezierCurveTo(10, 2, 46, -4, 62, 14); g.bezierCurveTo(60, 30, 44, 36, 34, 36);
        g.bezierCurveTo(50, 44, 52, 60, 36, 62); g.bezierCurveTo(22, 62, 8, 50, 2, 34); g.fill();
        g.globalCompositeOperation = 'source-atop';
        g.strokeStyle = edge; g.lineWidth = 7; g.stroke();
        g.fillStyle = spot; g.beginPath(); g.arc(40, 16, 5, 0, 6.283); g.fill();
        const tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        return tex;
    }
    const wingGeo = new THREE.PlaneGeometry(0.065, 0.065);
    wingGeo.translate(0.0325, 0, 0);
    wingGeo.rotateX(-Math.PI / 2);
    const bodyGeo = new THREE.CylinderGeometry(0.0035, 0.0022, 0.045, 5);
    bodyGeo.rotateX(Math.PI / 2);
    const flies = [['#f0922e', '#2a1a12', '#fff4d8'], ['#f7f2e4', '#3a3a3a', '#2a2a2a'], ['#5aa0ff', '#1a2a50', '#e0f0ff'], ['#ffd84a', '#3a2a10', '#ff9a3a']].map(([base, edge, spot], i) => {
        const mat = new THREE.MeshStandardMaterial({ map: wingTex(base, edge, spot), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6 });
        const g = new THREE.Group();
        const left = new THREE.Mesh(wingGeo, mat), right = new THREE.Mesh(wingGeo, mat);
        right.scale.x = -1;
        const b = new THREE.Mesh(bodyGeo, face);
        g.add(left, right, b);
        g.scale.setScalar(0);
        world.add(g);
        return { g, left, right, home: [(rand() - 0.5) * 0.9, (rand() - 0.5) * 0.9], p: rand() * 6.28, rest: 0, size: -1, speed: 0.5 + rand() * 0.4, i };
    });
    const bfPrev = new THREE.Vector3();
    function updateButterflies(dt, t, day, w) {
        const out = day > 0.55 && !(w.rain > 0) && !(w.snow > 0) && (w.temp ?? 15) >= 11 && (w.wind ?? 0) < 8 && !w.storm;
        for (const f of flies) {
            // Already out if the page opens on a fine day; otherwise they drift in.
            if (f.size < 0) f.size = out ? 1 : 0;
            f.size += ((out ? 1 : 0) - f.size) * Math.min(1, dt * 0.8);
            f.g.visible = f.size > 0.02;
            if (!f.g.visible) continue;
            f.g.scale.setScalar(f.size);
            f.p += dt * f.speed * (f.rest > 0 ? 0 : 1);
            if (f.rest > 0) f.rest -= dt;
            else if (rand() < dt * 0.04) f.rest = 1.5 + rand() * 3;
            const x = f.home[0] + Math.sin(f.p * 1.3) * 0.28, z = f.home[1] + Math.sin(f.p * 0.9 + f.i) * 0.24 * Math.cos(f.p * 0.6);
            const r = Math.hypot(x, z), k = r > 0.8 ? 0.8 / r : 1;
            const gx = x * k, gz = z * k, floor = groundH(gx, gz);
            const y = f.rest > 0 ? floor + 0.05 : floor + 0.14 + 0.1 * Math.sin(f.p * 2.1) + 0.02 * Math.sin(t * 9 + f.i);
            bfPrev.copy(f.g.position);
            f.g.position.set(gx, f.g.position.y ? f.g.position.y + (y - f.g.position.y) * Math.min(1, dt * 4) : y, gz);
            const dx = f.g.position.x - bfPrev.x, dz = f.g.position.z - bfPrev.z;
            if (Math.abs(dx) + Math.abs(dz) > 1e-5) f.g.rotation.y = Math.atan2(dx, dz);
            // Wings: fast beats in flight, slow open-and-close at rest.
            const flap = f.rest > 0 ? 0.5 + 0.5 * Math.sin(t * 2 + f.i) : Math.sin(t * 26 + f.i * 2);
            f.left.rotation.z = 0.15 + flap * 1.1;
            f.right.rotation.z = -(0.15 + flap * 1.1);
        }
    }

    return {
        summon, ducks, _dbg: () => ({ flies: flies.map(f => [f.size, f.g.visible, f.g.position.toArray().map(v => +v.toFixed(3))]), phase: visit.phase, t: visit.t, mode: flock.mode, vis: ufo.visible, pos: ufo.position.toArray(), sc: ufo.scale.x }),
        update(dt, t, { snow, still, day, w, frozen }) {
            updateSheep(dt, t, snow);
            updateDucks(dt, t, day, frozen, still);
            updateButterflies(dt, t, day, w);
            updateWorm(dt, t);
            updateUfo(dt, t, still);
        },
    };
}
