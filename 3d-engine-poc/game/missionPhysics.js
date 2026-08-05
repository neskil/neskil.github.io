/**
 * game/missionPhysics.js — the simulation as a mission's support rule.
 *
 * A mission that declares `physics` has no support ratio to satisfy. Instead,
 * every placement is handed to the solver: the whole yard is rebuilt as rigid
 * bodies, settled, and compared against where the grid says everything should
 * be. Anything that moved has fallen.
 *
 * The grid stays authoritative. Physics is only ever asked a question — did it
 * hold? — and the answer is yes (nothing changes) or no (the fallen units are
 * removed and the ground they came down on is out of play). That is what keeps
 * envelope scoring and a computed par meaningful: a surviving stack is always
 * exactly on the lattice, never a few centimetres off it.
 *
 * Two properties of the solver make this usable, and neither was true before it
 * was rewritten: it is frame-rate independent, so a verdict is identical on
 * every machine and medals are not a lottery; and it is fast enough to settle
 * a full bay in a few milliseconds, so the answer arrives before the player
 * notices they asked.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const C = Cargo3D.Constants;

    /** How far a unit may drift and still count as having held. */
    const SETTLE_TOLERANCE = 0.35;

    /** Simulated seconds allowed for the yard to come to rest. */
    const SETTLE_SECONDS = 6;

    /** Tilt beyond this counts as fallen even if the centre barely moved. */
    const TILT_LIMIT_DEG = 12;

    const UP = new THREE.Vector3(0, 1, 0);
    const scratchUp = new THREE.Vector3();

    /**
     * Laden mass in tonnes. Heavier cargo genuinely destabilises what is under
     * it, which is the whole reason `heavyBelow` exists as a written rule.
     */
    function unitMass(unit, spec) {
        if (unit && unit.massT) return unit.massT;
        const laden = (spec.tare || 0) + (spec.payload || 0) * 0.45;
        return laden > 0.5 ? laden : 12;
    }

    /**
     * Build a throwaway physics world from a grid, using the same grid→world
     * transform the renderer uses, so a simulated yard sits exactly where the
     * player sees it.
     *
     * @param {YardGrid} grid
     * @param {YardView} yardView supplies cellToWorld
     * @returns {{world: PhysicsWorld, entries: Array}}
     */
    function buildWorld(grid, yardView) {
        const world = new Cargo3D.PhysicsWorld();
        const entries = [];
        const placements = grid.list();

        for (let i = 0; i < placements.length; i++) {
            const p = placements[i];
            const spec = C.CARGO_TYPES[p.type] || C.CARGO_TYPES['20ft'];
            const at = yardView.cellToWorld(p.x, p.z, p.tier, p.type, p.rot);

            // A bare carrier for the solver — no meshes, no materials. This
            // world is measured and thrown away, never rendered.
            const proxy = {
                position: new THREE.Vector3(),
                quaternion: new THREE.Quaternion(),
                // A quarter turn swaps the container's footprint. RigidBox reads
                // `length` as the X extent, matching the meshes and the grid.
                userData: {
                    spec: {
                        length: p.rot % 2 === 0 ? spec.length : spec.width,
                        height: spec.height,
                        width: p.rot % 2 === 0 ? spec.width : spec.length
                    }
                }
            };
            proxy.position.copy(at);

            const body = new Cargo3D.RigidBox(proxy, unitMass(p.unit, spec));
            world.add(body);

            // A tier is 2.90 m but a container is 2.59, so the lattice leaves
            // air between tiers and a simulated stack legitimately sinks onto
            // itself. That settle is expected, not a collapse, and it compounds
            // with height — judging it as drift condemns every tall stack.
            entries.push({
                placement: p,
                body: body,
                start: at.clone(),
                expectedSettle: p.tier * Math.max(0, C.GRID.TIER_H - spec.height)
            });
        }

        return { world: world, entries: entries };
    }

    function tiltDegrees(body) {
        scratchUp.set(0, 1, 0).applyQuaternion(body.quaternion);
        const dot = Math.min(1, Math.abs(scratchUp.dot(UP)));
        return THREE.MathUtils.radToDeg(Math.acos(dot));
    }

    /**
     * Settle a copy of the yard and report what did not survive it.
     *
     * @param {YardGrid} grid
     * @param {YardView} yardView
     * @returns {{held: boolean, fallen: Array<object>, cells: Array<[number,number]>}}
     */
    function settle(grid, yardView) {
        const built = buildWorld(grid, yardView);
        const world = built.world;
        const entries = built.entries;

        const steps = Math.round(SETTLE_SECONDS / world.fixedDt);
        for (let i = 0; i < steps; i++) {
            world.step(world.fixedDt);
            // Everything asleep means the yard has come to rest; there is
            // nothing further to learn by simulating an empty room.
            if (i % 30 === 29 && allAsleep(world)) break;
        }

        const fallen = [];
        const cells = [];

        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            const at = e.body.position;

            // Sideways movement is always a fall; downward movement is only a
            // fall once it exceeds the slack the lattice built in.
            const dx = at.x - e.start.x;
            const dz = at.z - e.start.z;
            const slid = Math.sqrt(dx * dx + dz * dz);
            const dropped = e.start.y - at.y;
            const tilt = tiltDegrees(e.body);

            const held = slid <= SETTLE_TOLERANCE &&
                         tilt <= TILT_LIMIT_DEG &&
                         dropped <= e.expectedSettle + SETTLE_TOLERANCE;
            if (held) continue;

            fallen.push({
                placement: e.placement,
                slid: slid,
                dropped: dropped,
                tilt: tilt,
                restedAt: at.clone()
            });

            // The ground it started on, plus the ground it came to rest over:
            // wreckage takes both out of play.
            addCells(cells, e.placement.cells);
            addCells(cells, groundCellsUnder(e.body, yardView, grid));
        }

        return { held: fallen.length === 0, fallen: fallen, cells: cells };
    }

    function allAsleep(world) {
        for (let i = 0; i < world.bodies.length; i++) {
            if (!world.bodies[i].sleeping) return false;
        }
        return true;
    }

    function addCells(into, cells) {
        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];
            let seen = false;
            for (let j = 0; j < into.length; j++) {
                if (into[j][0] === c[0] && into[j][1] === c[1]) { seen = true; break; }
            }
            if (!seen) into.push([c[0], c[1]]);
        }
    }

    /** Squares a fallen body's footprint covers where it finally stopped. */
    function groundCellsUnder(body, yardView, grid) {
        const out = [];
        const corners = [];

        for (let i = 0; i < 8; i++) {
            const p = body.samplePoints[i].clone().applyQuaternion(body.quaternion).add(body.position);
            corners.push(p);
        }

        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (let i = 0; i < corners.length; i++) {
            minX = Math.min(minX, corners[i].x); maxX = Math.max(maxX, corners[i].x);
            minZ = Math.min(minZ, corners[i].z); maxZ = Math.max(maxZ, corners[i].z);
        }

        const lo = yardView.worldToCell(minX, minZ);
        const hi = yardView.worldToCell(maxX, maxZ);

        for (let x = lo.x; x <= hi.x; x++) {
            for (let z = lo.z; z <= hi.z; z++) {
                if (x < 0 || x >= grid.cols || z < 0 || z >= grid.rows) continue;
                out.push([x, z]);
            }
        }
        return out;
    }

    Cargo3D.MissionPhysics = {
        settle: settle,
        buildWorld: buildWorld,
        SETTLE_TOLERANCE: SETTLE_TOLERANCE,
        TILT_LIMIT_DEG: TILT_LIMIT_DEG
    };
})(window);
