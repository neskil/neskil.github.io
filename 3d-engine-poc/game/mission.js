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
        const mission = Cargo3D.MissionSchema.normalise(opts.mission);
        this.mission = mission;
        this.finished = false;
        this.startedAt = Date.now();

        this.units = ManifestLib.build(mission, opts.seed);
        this.grid = new Cargo3D.YardGrid(mission.bay.cols, mission.bay.rows, mission.bay.tiers);
        this.yardView = new Cargo3D.YardView(this.app.sceneView, mission.bay);
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

        const self = this;
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
            onComplete: function () { self.finish(); },
            onExit: function () { self.app.ui.openPauseMenu(); }
        });

        this.app.ui.showMissionHUD(mission, this.units);
        this.placement.attach();
        this.app.ui.updateMissionHUD(this.snapshot(this.placement));
    };

    MissionMode.prototype.exit = function () {
        if (this.placement) this.placement.detach();
        if (this.yardView) this.yardView.dispose();
        this.app.ui.hideMissionHUD();
        this.placement = null;
        this.yardView = null;
        this.grid = null;
        this.mission = null;
    };

    MissionMode.prototype.update = function (delta) {
        if (this.yardView) this.yardView.update(delta);
    };

    /** Everything the HUD needs, in one object. */
    MissionMode.prototype.snapshot = function (ctrl) {
        const controller = ctrl || this.placement;
        const measure = Scoring.measure(this.grid);
        const par = Scoring.parFor(this.units);

        return {
            mission: this.mission,
            current: controller ? controller.current() : null,
            upcoming: controller ? controller.upcoming(3) : [],
            placed: this.grid.count(),
            total: this.units.length,
            remaining: controller ? controller.remaining() : 0,
            canRotate: controller ? controller.canRotate() : false,
            rot: controller ? controller.rot : 0,
            hover: controller ? controller.hover : null,
            envelope: measure.envelope,
            par: par,
            ratio: par ? measure.envelope / par : 0,
            projectedMedal: Scoring.medalFor(measure.envelope, par, this.mission.medals),
            thresholds: {
                gold: Scoring.targetFor(par, this.mission.medals, 'gold'),
                silver: Scoring.targetFor(par, this.mission.medals, 'silver'),
                bronze: Scoring.targetFor(par, this.mission.medals, 'bronze')
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
