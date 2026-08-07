/**
 * game/missionPhysics.js — the simulation as a mission's support rule.
 *
 * A mission that declares `physics` has no support ratio to satisfy. Instead,
 * every placement is handed to the solver: the whole yard is rebuilt as rigid
 * bodies, settled, and compared against where the grid says everything should
 * be. Anything that moved has fallen.
 *
 * A fall is not a loss. The container is still in the yard, still counts
 * against the manifest, and still widens the envelope from wherever it came to
 * rest — which is penalty enough, because sprawl is exactly what the score
 * measures. The grid follows it: `settle()` reports the cells and tiers the
 * wreck now occupies, the mission reseats it there, and its resting pose is
 * remembered so the next simulation starts it where it actually lies rather
 * than snapping it back onto the lattice.
 *
 * The grid therefore stays authoritative about *what ground is taken*, while
 * the solver is authoritative about *where a body is*. A wreck's cells are an
 * axis-aligned approximation of a box lying at an angle, deliberately rounded
 * outward: better to over-reserve a slot than to let the next container be
 * dropped into one that is visibly occupied.
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

    /**
     * Headroom reserved above a wreck, in metres.
     *
     * A wreck claims every tier its own height touches, so the next free tier
     * always starts at or above its highest corner. "At" is not enough: a
     * container released exactly onto another's roof starts the solver in
     * contact, which reads as a shove. This pads the claim so the drop always
     * begins in clear air. It is a little under the 31 cm of slack a tier
     * already leaves above a standing container, so it costs no extra tier in
     * the ordinary case.
     */
    const WRECK_CLEARANCE = 0.25;

    const scratchUp = new THREE.Vector3();
    const scratchStart = new THREE.Vector3();

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

            // A wreck is wherever it stopped; everything else is wherever the
            // lattice says. Rebuilding a wreck from its cells would stand it
            // back up, which is precisely what it is not doing any more.
            const wreck = p.pose || null;
            const at = wreck ? wreck.position.clone()
                             : yardView.cellToWorld(p.x, p.z, p.tier, p.type, p.rot);

            // A bare carrier for the solver — no meshes, no materials. This
            // world is measured and thrown away, never rendered.
            const proxy = {
                position: new THREE.Vector3(),
                quaternion: new THREE.Quaternion(),
                // A quarter turn swaps the container's footprint. RigidBox reads
                // `length` as the X extent, matching the meshes and the grid.
                // A wreck carries its yaw in the quaternion instead, so it is
                // built unrotated and posed afterwards.
                userData: {
                    spec: wreck ? {
                        length: spec.length,
                        height: spec.height,
                        width: spec.width
                    } : {
                        length: p.rot % 2 === 0 ? spec.length : spec.width,
                        height: spec.height,
                        width: p.rot % 2 === 0 ? spec.width : spec.length
                    }
                }
            };
            proxy.position.copy(at);
            if (wreck) proxy.quaternion.copy(wreck.quaternion);

            const body = new Cargo3D.RigidBox(proxy, unitMass(p.unit, spec));
            world.add(body);

            // A tier is 2.90 m but a container is 2.59, so the lattice leaves
            // air between tiers and a simulated stack legitimately sinks onto
            // itself. That settle is expected, not a collapse, and it compounds
            // with height — judging it as drift condemns every tall stack. A
            // wreck starts where it already settled, so it has none left to do.
            entries.push({
                placement: p,
                body: body,
                wreck: !!wreck,
                start: at.clone(),
                startQuat: body.quaternion.clone(),
                expectedSettle: wreck ? 0 : p.tier * Math.max(0, C.GRID.TIER_H - spec.height)
            });
        }

        return { world: world, entries: entries };
    }

    /**
     * How far a body has turned away from the pose it started the simulation
     * in. A standing unit starts upright, so this is its tilt from vertical; a
     * wreck starts already lying over, so it is how much further it has gone.
     */
    function turnedDegrees(body, startQuat) {
        scratchUp.set(0, 1, 0).applyQuaternion(body.quaternion);
        scratchStart.set(0, 1, 0).applyQuaternion(startQuat);
        const dot = Math.max(-1, Math.min(1, scratchUp.dot(scratchStart)));
        return THREE.MathUtils.radToDeg(Math.acos(dot));
    }

    /**
     * Settle a copy of the yard and report what did not survive it.
     *
     * Each fallen entry carries the slot it came to rest in — the cells its
     * footprint now covers and the tiers its height now spans — so the caller
     * can move it there rather than take it out of play.
     *
     * @param {YardGrid} grid
     * @param {YardView} yardView
     * @returns {{held: boolean, fallen: Array<object>}}
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

        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            const at = e.body.position;

            // Sideways movement is always a fall; downward movement is only a
            // fall once it exceeds the slack the lattice built in.
            const dx = at.x - e.start.x;
            const dz = at.z - e.start.z;
            const slid = Math.sqrt(dx * dx + dz * dz);
            const dropped = e.start.y - at.y;
            const turned = turnedDegrees(e.body, e.startQuat);

            const held = slid <= SETTLE_TOLERANCE &&
                         turned <= TILT_LIMIT_DEG &&
                         dropped <= e.expectedSettle + SETTLE_TOLERANCE;
            if (held) continue;

            fallen.push({
                placement: e.placement,
                wasWreck: e.wreck,
                slid: slid,
                dropped: dropped,
                tilt: turned,
                slot: restingSlot(e.body, yardView, grid),
                pose: {
                    position: at.clone(),
                    quaternion: e.body.quaternion.clone()
                }
            });
        }

        return { held: fallen.length === 0, fallen: fallen };
    }

    function allAsleep(world) {
        for (let i = 0; i < world.bodies.length; i++) {
            if (!world.bodies[i].sleeping) return false;
        }
        return true;
    }

    /**
     * The slot a body has come to rest in: the cells its footprint covers and
     * the tiers its height spans, from the axis-aligned box around its corners.
     *
     * Both ends of the tier span matter and for different reasons. The bottom
     * stops the grid leaving an empty tier under a wreck that is visibly
     * sitting there. The top — padded by WRECK_CLEARANCE — is what guarantees
     * the next container dropped on this column is released in clear air above
     * the wreck's highest corner instead of inside it.
     *
     * @returns {{cells: Array<[number,number]>, tier: number, tierTop: number}}
     */
    function restingSlot(body, yardView, grid) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        // Every sample point, not just the first eight: a masked piece carries a
        // set of corners per part and the outermost is not always in the first.
        for (let i = 0; i < body.samplePoints.length; i++) {
            const p = body.samplePoints[i].clone().applyQuaternion(body.quaternion).add(body.position);
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
            if (p.z < minZ) minZ = p.z;
            if (p.z > maxZ) maxZ = p.z;
        }

        const lo = yardView.worldToCell(minX, minZ);
        const hi = yardView.worldToCell(maxX, maxZ);

        const cells = [];
        for (let x = lo.x; x <= hi.x; x++) {
            for (let z = lo.z; z <= hi.z; z++) {
                if (x < 0 || x >= grid.cols || z < 0 || z >= grid.rows) continue;
                cells.push([x, z]);
            }
        }

        const tier = Math.max(0, Math.floor(minY / C.GRID.TIER_H));
        const tierTop = Math.max(tier, Math.floor((maxY + WRECK_CLEARANCE) / C.GRID.TIER_H));
        return { cells: cells, tier: tier, tierTop: tierTop };
    }

    Cargo3D.MissionPhysics = {
        settle: settle,
        buildWorld: buildWorld,
        restingSlot: restingSlot,
        SETTLE_TOLERANCE: SETTLE_TOLERANCE,
        TILT_LIMIT_DEG: TILT_LIMIT_DEG,
        WRECK_CLEARANCE: WRECK_CLEARANCE
    };
})(window);
