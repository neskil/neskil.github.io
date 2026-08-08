/**
 * game/mission.js — campaign mode.
 *
 * Builds a bay from a mission definition, feeds its manifest through the
 * placement controller, and measures the result when the queue empties.
 * The mode owns nothing permanent: enter() builds, exit() disposes.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};
    const Scoring = Cargo3D.Scoring;
    const ManifestLib = Cargo3D.Manifest;
    const Storage = Cargo3D.Storage;

    function MissionMode(app) {
        this.app = app;
        this.mission = null;
        this.grid = null;
        this.units = [];
        this.yardView = null;
        this.placement = null;
        this.startedAt = 0;
        this.finished = false;
    }

    MissionMode.prototype.enter = function (opts) {
        // Declared up front: the obstacle loop and the onLand hook below both
        // close over it, and the loop runs during enter() rather than later.
        const self = this;
        const mission = Cargo3D.MissionSchema.normalise(opts.mission);
        this.mission = mission;
        this.finished = false;
        this.startedAt = Date.now();

        this.units = ManifestLib.build(mission, opts.seed);
        this.grid = new Cargo3D.YardGrid(mission.bay.cols, mission.bay.rows, mission.bay.tiers);
        const terminal = Cargo3D.Constants.terminal(mission.terminal);
        this.app.sceneView.setTerminal(terminal);
        this.yardView = new Cargo3D.YardView(this.app.sceneView, mission.bay, terminal);
        this.yardView.onLand = function (x, y, z) {
            if (self.app.effects) {
                self.app.effects.dustPuff(x, y, z);
                self.app.effects.shake(0.22);
            }
        };

        if (mission.obstacles && mission.obstacles.length) {
            mission.obstacles.forEach(function (obs, idx) {
                const obsUnit = {
                    uid: 'obs-' + idx,
                    type: obs.type || '20ft',
                    carrier: obs.carrier || 'steel',
                    traits: obs.traits || [],
                    departure: 0,
                    massT: 15
                };
                const p = self.grid.place(obsUnit, obs.x, obs.z, obs.tier || 0, obs.rot || 0);
                if (p) {
                    p.isObstacle = true;
                    const mesh = self.yardView.addUnit(p);
                    mesh.userData.dropping = false;
                }
            });
            this.yardView.updateEnvelope(this.grid.bounds());
        }

        this.app.weather.set(mission.weather);
        this.app.terminal.setVisible(false);
        this.app.sceneView.setMastsVisible(false);
        this.app.vehicle.setEnabled(false);
        this.app.crane.setEnabled(false);
        this.app.crane.setVisible(false);
        this.app.cameraRig.frameBay(mission.bay);
        this.app.cameraRig.setMode('iso');

        this.placement = new Cargo3D.PlacementController({
            sceneView: this.app.sceneView,
            yardView: this.yardView,
            grid: this.grid,
            effects: this.app.effects,
            cameraRig: this.app.cameraRig,
            rules: mission.rules,
            units: this.units,
            onChange: function (ctrl) { self.app.ui.updateMissionHUD(self.snapshot(ctrl)); },
            onReject: function (reason) { self.app.ui.flashReason(reason); },
            onPlace: function () { self.checkStack(); },
            onComplete: function () { self.finish(); },
            onExit: function () { self.app.ui.openPauseMenu(); }
        });

        this.usesPhysics = mission.rules.some(function (spec) {
            return String(spec).split(':')[0] === 'physics';
        });
        this.collapse = null;

        this.app.ui.showMissionHUD(mission, this.units);
        this.placement.attach();
        this.app.ui.updateMissionHUD(this.snapshot(this.placement));
    };

    MissionMode.prototype.exit = function () {
        if (this.placement) this.placement.detach();
        if (this.yardView) this.yardView.dispose();
        // Hand the apron back in its default paint — every other mode assumes
        // it, and the menu behind this one is not standing in a terminal.
        this.app.sceneView.setTerminal(null);
        this.app.ui.hideMissionHUD();
        this.placement = null;
        this.yardView = null;
        this.grid = null;
        this.mission = null;
    };

    MissionMode.prototype.update = function (delta) {
        if (this.yardView) this.yardView.update(delta);
        if (this.collapse) this.updateCollapse(delta);
    };

    /* ── physics missions ──────────────────────────────────────────────── */

    /**
     * Ask the solver whether the yard still stands. Only physics missions pay
     * for this; everything else is decided up front by core/rules.js as before.
     *
     * The verdict is reached on a throwaway copy in a few milliseconds, so the
     * common answer — it held — costs the player no visible pause at all. Only
     * a collapse is worth animating.
     */
    MissionMode.prototype.checkStack = function () {
        if (!this.usesPhysics || this.collapse || this.finished) return;

        const verdict = Cargo3D.MissionPhysics.settle(this.grid, this.yardView);
        if (verdict.held) return;

        this.startCollapse(verdict);
    };

    /**
     * Let the player watch it come down. A second live world drives the meshes
     * while it falls; when it has run its course the fallen units are reseated
     * onto the ground they actually landed on, and the survivors snap back to
     * the lattice the grid never stopped believing they were on.
     */
    MissionMode.prototype.startCollapse = function (verdict) {
        const built = Cargo3D.MissionPhysics.buildWorld(this.grid, this.yardView);
        const meshes = {};

        for (let i = 0; i < built.entries.length; i++) {
            const e = built.entries[i];
            const mesh = this.yardView.unitMeshes[e.placement.id];
            if (!mesh) continue;
            mesh.userData.dropping = false;   // physics owns it now, not the drop-in
            meshes[e.placement.id] = mesh;
        }

        this.collapse = { built: built, meshes: meshes, verdict: verdict, elapsed: 0 };

        if (this.placement) this.placement.detach();
        if (Cargo3D.Audio) Cargo3D.Audio.reject();
        this.app.ui.flashReason('The stack came down.');
    };

    MissionMode.prototype.updateCollapse = function (delta) {
        const c = this.collapse;
        c.elapsed += delta;

        c.built.world.update(delta);

        for (let i = 0; i < c.built.entries.length; i++) {
            const e = c.built.entries[i];
            const mesh = c.meshes[e.placement.id];
            if (!mesh) continue;
            mesh.position.copy(e.body.position);
            mesh.quaternion.copy(e.body.quaternion);
        }

        // Long enough to read as a collapse, and never long enough for a
        // stubborn pile to hold the mission open.
        const settled = c.built.world.bodies.every(function (b) { return b.sleeping; });
        if (c.elapsed < 1.1) return;
        if (!settled && c.elapsed < 2.6) return;

        this.finishCollapse();
    };

    /**
     * Resolve the collapse.
     *
     * Nothing is craned away and no ground goes out of play: a container that
     * came down is still cargo, still counts against the manifest, and now
     * claims the slots it is actually lying across. That is the whole penalty,
     * and it is a real one — the envelope is the box around everything placed,
     * so a unit that slid two slots sideways has just made the score worse in
     * the only currency the mission has.
     */
    MissionMode.prototype.finishCollapse = function () {
        const c = this.collapse;
        const fallen = c.verdict.fallen;

        // Free every wreck's old ground before any of them claim new ground.
        // Two containers that came down together have both already left where
        // they were standing; reseating them one at a time would measure the
        // first against the second's pre-collapse footprint and leave it
        // holding nothing.
        for (let i = 0; i < fallen.length; i++) {
            this.grid.releaseCells(fallen[i].placement);
        }

        for (let i = 0; i < fallen.length; i++) {
            const f = fallen[i];
            const p = f.placement;

            // The grid follows the wreck; the wreck remembers its pose so the
            // next simulation starts it lying down rather than standing it up.
            this.grid.reseat(p.id, f.slot.cells, f.slot.tier, f.slot.tierTop);
            p.pose = f.pose;

            const mesh = this.yardView.unitMeshes[p.id];
            if (!mesh) continue;
            mesh.position.copy(f.pose.position);
            mesh.quaternion.copy(f.pose.quaternion);
            mesh.userData.dropping = false;
        }

        // Everything still standing was only ever off the lattice inside the
        // simulation; put the meshes back where the grid says they are. A wreck
        // from an earlier collapse is not "still standing" — it is where it is.
        const survivors = this.grid.list();
        for (let i = 0; i < survivors.length; i++) {
            const p = survivors[i];
            if (p.pose) continue;
            const mesh = this.yardView.unitMeshes[p.id];
            if (!mesh) continue;
            this.yardView.cellToWorld(p.x, p.z, p.tier, p.type, p.rot, mesh.position);
            mesh.rotation.set(0, p.rot % 2 === 0 ? 0 : Math.PI / 2, 0);
        }

        this.yardView.updateEnvelope(this.grid.bounds());

        if (this.app.effects) {
            for (let i = 0; i < fallen.length; i++) {
                const at = fallen[i].pose.position;
                this.app.effects.ring(at.x, 0.05, at.z, 0xf87171);
            }
            this.app.effects.shake(0.5);
        }

        this.collapse = null;
        if (this.placement) this.placement.attach();

        const n = fallen.length;
        this.app.ui.flashReason(
            n + (n === 1 ? ' unit came down' : ' units came down') +
            ' — still counted, where they lie'
        );
        this.app.ui.updateMissionHUD(this.snapshot(this.placement));
    };

    /** Everything the HUD needs, in one object. */
    MissionMode.prototype.snapshot = function (ctrl) {
        const controller = ctrl || this.placement;
        const measure = Scoring.measure(this.grid);
        const scoreMode = this.mission.scoreMode === 'sprawl' ? 'sprawl' : 'pack';
        const target = Scoring.scoreTarget(this.mission, this.units);

        return {
            mission: this.mission,
            scoreMode: scoreMode,
            current: controller ? controller.current() : null,
            upcoming: controller ? controller.upcoming(3) : [],
            placed: this.grid.count(),
            total: this.units.length,
            remaining: controller ? controller.remaining() : 0,
            canRotate: controller ? controller.canRotate() : false,
            rot: controller ? controller.rot : 0,
            hover: controller ? controller.hover : null,
            envelope: measure.envelope,
            par: target,
            ratio: target ? measure.envelope / target : 0,
            projectedMedal: Scoring.medalFor(measure.envelope, target, this.mission.medals, scoreMode),
            thresholds: {
                gold: Scoring.targetFor(target, this.mission.medals, 'gold'),
                silver: Scoring.targetFor(target, this.mission.medals, 'silver'),
                bronze: Scoring.targetFor(target, this.mission.medals, 'bronze')
            },
            measure: measure,
            stuck: controller ? controller.isStuck() : false
        };
    };

    MissionMode.prototype.finish = function () {
        if (this.finished) return;
        this.finished = true;

        const stats = {
            moves: this.grid.count(),
            undos: this.placement ? this.placement.undos : 0,
            elapsedMs: Date.now() - this.startedAt
        };

        const result = Scoring.buildResult(this.grid, this.mission, this.units, stats);
        const saved = Storage.recordResult(result);

        if (this.placement) this.placement.detach();

        const bounds = this.grid.bounds();
        if (bounds && this.app.effects) {
            const centre = this.yardView.cellToWorld(
                Math.floor((bounds.minX + bounds.maxX) / 2),
                Math.floor((bounds.minZ + bounds.maxZ) / 2),
                bounds.maxTier + 1, '10ft', 0
            );
            const colour = result.medal === 'gold' ? 0xfbbf24
                : result.medal === 'silver' ? 0xe2e8f0
                : result.medal === 'bronze' ? 0xd97706 : 0x38bdf8;
            this.app.effects.burst(centre.x, centre.y, centre.z, colour);
        }

        if (Cargo3D.Audio && result.medal) Cargo3D.Audio.fanfare(result.medal);

        this.app.cameraRig.setMode('orbit');
        this.app.ui.showResults(result, saved, Cargo3D.Campaign.nextAfter(this.mission.id));
    };

    /** Replay the same mission from scratch. */
    MissionMode.prototype.restart = function () {
        const mission = this.mission;
        this.exit();
        this.enter({ mission: mission });
    };

    Cargo3D.MissionMode = MissionMode;
})(window);
