// Trucks and the job dispatcher. Jobs are single-item hauls; idle trucks
// pick the nearest reachable pending job. Pure logic.
window.SC = window.SC || {};

SC.vehicles = (function() {
    let truckSeq = 0, jobSeq = 0;

    function addTruck(node) {
        const t = {
            id: truckSeq++,
            node,                 // node the truck is at / last passed
            x: node.x, y: node.y,
            path: null, pathIdx: 0, progress: 0,
            cargo: [],             // item keys being hauled this trip (bundled, same pickup+drop)
            jobs: [], phase: null  // 'toPickup' | 'toDrop'
        };
        SC.state.trucks.push(t);
        return t;
    }

    function addJob(job) {
        job.id = jobSeq++;
        SC.state.jobs.push(job);
        return job;
    }

    function cancelJobsForOrder(order) {
        const jobs = SC.state.jobs;
        for (let i = jobs.length - 1; i >= 0; i--) {
            if (jobs[i].order === order) jobs.splice(i, 1);
        }
        for (const t of SC.state.trucks) {
            if (t.phase !== 'toPickup') continue; // loaded trucks finish their run; salvage handles the drop
            const before = t.jobs.length;
            t.jobs = t.jobs.filter(j => j.order !== order);
            if (t.jobs.length === before) continue;
            if (t.jobs.length === 0) {
                // Nothing left in this bundle: abort the trip, finish the
                // current road segment, then idle.
                t.phase = null;
                if (t.path) t.path = t.path.slice(0, t.pathIdx + 2);
            }
            // Bundle partially trimmed: remaining jobs share the same
            // pickup/drop, so the in-flight route is still valid.
        }
    }

    function setPath(truck, path) {
        truck.path = path;
        truck.pathIdx = 0;
        truck.progress = 0;
        if (path.length < 2) finishPath(truck);
    }

    function finishPath(truck) {
        truck.node = truck.path[truck.path.length - 1];
        truck.x = truck.node.x;
        truck.y = truck.node.y;
        truck.path = null;

        if (!truck.jobs.length) return;
        if (truck.phase === 'toPickup') {
            const first = truck.jobs[0];
            const route = SC.roads.findPath(first.pickup, first.drop);
            if (!route) { // network changed underneath us: give the jobs back
                SC.state.jobs.push(...truck.jobs);
                truck.jobs = [];
                truck.phase = null;
                return;
            }
            truck.cargo = truck.jobs.map(j => j.item);
            truck.phase = 'toDrop';
            setPath(truck, route.path);
        } else if (truck.phase === 'toDrop') {
            for (const job of truck.jobs) {
                if (job.type === 'raw') {
                    SC.factories.receiveRaw(job.drop, job.item, job.task);
                } else {
                    SC.economy.deliverProduct(job.order, job.item);
                }
            }
            truck.cargo = [];
            truck.jobs = [];
            truck.phase = null;
        }
    }

    // Assign pending jobs to idle trucks (nearest truck first). A truck
    // with spare capacity bundles additional jobs that share the exact
    // same pickup and drop as the one it just claimed, so one trip can
    // carry several units of the same haul (e.g. multiple raw units for
    // one factory, or several units of one product to one city).
    function dispatch() {
        const jobs = SC.state.jobs;
        if (!jobs.length) return;
        const idle = SC.state.trucks.filter(t => !t.jobs.length && !t.path);
        const capacity = SC.truckCapacity();
        for (const truck of idle) {
            let best = null, bestDist = Infinity, bestRoute = null;
            for (const job of jobs) {
                if (!SC.roads.findPath(job.pickup, job.drop)) continue;
                const r = SC.roads.findPath(truck.node, job.pickup);
                if (r && r.dist < bestDist) { best = job; bestDist = r.dist; bestRoute = r; }
            }
            if (!best) continue;
            const bundle = [best];
            if (capacity > 1) {
                for (const job of jobs) {
                    if (bundle.length >= capacity) break;
                    if (job !== best && job.pickup === best.pickup && job.drop === best.drop) bundle.push(job);
                }
            }
            for (const job of bundle) jobs.splice(jobs.indexOf(job), 1);
            truck.jobs = bundle;
            truck.phase = 'toPickup';
            setPath(truck, bestRoute.path);
        }
    }

    function tick(dt) {
        const speed = SC.truckSpeed();
        for (const t of SC.state.trucks) {
            if (!t.path) continue;
            let remaining = speed * dt;
            while (remaining > 0 && t.path && t.pathIdx < t.path.length - 1) {
                const a = t.path[t.pathIdx], b = t.path[t.pathIdx + 1];
                const segLen = Math.hypot(b.x - a.x, b.y - a.y) || 1;
                const distLeft = segLen * (1 - t.progress);
                if (remaining < distLeft) {
                    t.progress += remaining / segLen;
                    remaining = 0;
                } else {
                    remaining -= distLeft;
                    t.pathIdx++;
                    t.progress = 0;
                    t.node = t.path[t.pathIdx];
                    if (t.pathIdx >= t.path.length - 1) { finishPath(t); break; }
                }
            }
            if (t.path && t.pathIdx < t.path.length - 1) {
                const a = t.path[t.pathIdx], b = t.path[t.pathIdx + 1];
                t.x = a.x + (b.x - a.x) * t.progress;
                t.y = a.y + (b.y - a.y) * t.progress;
                t.angle = Math.atan2(b.y - a.y, b.x - a.x);
            }
        }
        dispatch();
    }

    function buyTruck() {
        const price = SC.truckPrice();
        if (!SC.canAfford(price)) return { ok: false, reason: 'money', cost: price };
        SC.state.money -= price;
        SC.state.trucksBought++;
        const hq = SC.state.nodes.find(n => n.isHQ) || SC.state.nodes[0];
        const truck = addTruck(hq);
        SC.emit('truckBought', { truck, price });
        return { ok: true, truck };
    }

    return { addTruck, addJob, cancelJobsForOrder, dispatch, tick, buyTruck };
})();
