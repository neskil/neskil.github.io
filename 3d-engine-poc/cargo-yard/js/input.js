(function (window) {
    'use strict';

    // Every pointer and key in one place. The old POC had two separate keydown
    // listeners racing each other, neither of which called preventDefault, so
    // the arrow keys scrolled the page while they drove the crane.
    const CY = window.CY = window.CY || {};

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    let vehicle = null;
    let crane = null;
    let lastTapCell = null;

    const keys = Object.create(null);

    function attach(opts) {
        vehicle = opts.vehicle;
        crane = opts.crane;
        const canvas = CY._render.renderer.domElement;

        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            CY.game.rotate(1);
        });

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', releaseAll);

        CY.render.onFrame(applyDriving);
    }

    // ── Pointer ─────────────────────────────────────────────────────────

    function cellUnder(event) {
        const canvas = CY._render.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, CY._render.camera);

        // Hitting a stack first is what makes stacking feel direct: the ghost
        // goes where you point, not where the ground happens to be behind it.
        const meshes = [];
        CY.pieces3d.all().forEach(function (g) {
            g.traverse(function (child) {
                if (child.isMesh && !child.userData.isInterior) {
                    child.userData.owner = g;
                    meshes.push(child);
                }
            });
        });

        const hits = raycaster.intersectObjects(meshes, false);
        if (hits.length) {
            const hit = hits[0];
            // Step a hair out along the face we hit so a side hit reads as the
            // neighbouring column, not the one we are pointing at.
            const p = hit.point.clone().addScaledVector(hit.face.normal.clone().transformDirection(hit.object.matrixWorld), 0.35);
            return {
                cell: CY.worldToCell(p.x, p.z, CY.state.yard),
                hover: hit.object.userData.owner
            };
        }

        const target = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(groundPlane, target)) {
            return { cell: CY.worldToCell(target.x, target.z, CY.state.yard), hover: null };
        }
        return null;
    }

    function onPointerMove(event) {
        const r = cellUnder(event);
        if (!r) return;
        CY.game.setCursor(r.cell.x, r.cell.z);
        CY.emit('ui:hover', r.hover ? gridEntryFor(r.hover) : null);
    }

    function gridEntryFor(meshGroup) {
        const id = meshGroup.userData.gridId;
        return (id && CY.state.grid.byId[id]) || null;
    }

    function onPointerDown(event) {
        if (event.button === 2) return;   // handled by contextmenu
        const r = cellUnder(event);
        if (!r) return;
        CY.game.setCursor(r.cell.x, r.cell.z);

        // Touch has no hover, so the first tap aims and the second commits.
        if (event.pointerType === 'touch') {
            const key = r.cell.x + ':' + r.cell.z;
            if (lastTapCell !== key) { lastTapCell = key; return; }
            lastTapCell = null;
        }
        commitPlace();
    }

    function commitPlace() {
        const placed = CY.game.place();
        if (placed) CY.audio.clunk();
        else CY.audio.bad();
    }

    // ── Keyboard ────────────────────────────────────────────────────────

    const MOVE = {
        ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
        w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
    };

    function typingInAField(target) {
        if (!target) return false;
        const tag = target.tagName;
        return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || target.isContentEditable;
    }

    function onKeyDown(event) {
        if (typingInAField(event.target)) return;
        const k = event.key;
        const lower = k.length === 1 ? k.toLowerCase() : k;
        keys[lower] = true;

        const machine = drivenMachine();
        const driving = !!machine;

        if (lower === ' ' || k === 'Spacebar') {
            event.preventDefault();
            if (driving) machine.toggleLift();
            else commitPlace();
            return;
        }
        if (k === 'Enter') { event.preventDefault(); commitPlace(); return; }
        if (lower === 'r') { event.preventDefault(); CY.game.rotate(event.shiftKey ? -1 : 1); return; }
        if (lower === 'z' && !driving) { event.preventDefault(); CY.game.undo(); return; }
        if (k === 'Escape') { CY.emit('ui:escape'); return; }

        if (!driving && MOVE[lower]) {
            event.preventDefault();
            CY.game.nudge(MOVE[lower][0], MOVE[lower][1]);
        } else if (driving && (MOVE[lower] || lower === 'q' || lower === 'e')) {
            event.preventDefault();
        }
    }

    function onKeyUp(event) {
        const k = event.key;
        keys[k.length === 1 ? k.toLowerCase() : k] = false;
    }

    function releaseAll() {
        Object.keys(keys).forEach(function (k) { keys[k] = false; });
        if (vehicle) vehicle.controls = { throttle: 0, steer: 0, boom: 0 };
        if (crane) crane.controls = { rail: 0, trolley: 0, hoist: 0 };
    }

    // Which machine, if any, the camera mode has put you in charge of.
    function drivenMachine() {
        const mode = CY._render.cameraMode;
        if (mode === 'vehicle') return vehicle;
        if (mode === 'gantry') return crane;
        return null;
    }

    // Held keys drive whichever machine you are in; taps move the cursor.
    // Reading the held set once per frame is what makes the motion
    // frame-rate honest.
    function applyDriving() {
        const mode = CY._render.cameraMode;
        const up = keys.w || keys.ArrowUp;
        const down = keys.s || keys.ArrowDown;
        const left = keys.a || keys.ArrowLeft;
        const right = keys.d || keys.ArrowRight;
        const lift = (keys.q ? 1 : 0) - (keys.e ? 1 : 0);

        if (vehicle) {
            const on = mode === 'vehicle';
            vehicle.controls.throttle = on ? (up ? 1 : 0) - (down ? 1 : 0) : 0;
            vehicle.controls.steer = on ? (left ? 1 : 0) - (right ? 1 : 0) : 0;
            vehicle.controls.boom = on ? lift : 0;
        }
        if (crane) {
            const on = mode === 'gantry';
            crane.controls.rail = on ? (down ? 1 : 0) - (up ? 1 : 0) : 0;
            crane.controls.trolley = on ? (right ? 1 : 0) - (left ? 1 : 0) : 0;
            crane.controls.hoist = on ? lift : 0;
        }
    }

    CY.input = { attach: attach, keys: keys };

})(window);
