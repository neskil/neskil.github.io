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
            cargo: null,          // item key while hauling
            job: null, phase: null // 'toPickup' | 'toDrop'
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
            if (t.job && t.job.order === order && t.phase === 'toPickup') {
                // Abort: finish the current segment, then idle
                t.job = null;
                t.phase = null;
                if (t.path) t.path = t.path.slice(0, t.pathIdx + 2);
            }
            // Loaded trucks ('toDrop') finish their run; salvage is
            // handled at the drop point.
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

        const job = truck.job;
        if (!job) return;
        if (truck.phase === 'toPickup') {
            const route = SC.roads.findPath(job.pickup, job.drop);
            if (!route) { // network changed underneath us: give the job back
                truck.job = null; truck.phase = null;
                SC.state.jobs.push(job);
                return;
            }
            truck.cargo = job.item;
            truck.phase = 'toDrop';
            setPath(truck, route.path);
        } else if (truck.phase === 'toDrop') {
            if (job.type === 'raw') {
                SC.factories.receiveRaw(job.drop, job.item, job.task);
            } else {
                SC.economy.deliverProduct(job.order, job.item);
            }
            truck.cargo = null;
            truck.job = null;
            truck.phase = null;
        }
    }

    // Assign pending jobs to idle trucks (nearest truck first).
    function dispatch() {
        const jobs = SC.state.jobs;
        if (!jobs.length) return;
        const idle = SC.state.trucks.filter(t => !t.job && !t.path);
        for (const truck of idle) {
            let best = null, bestDist = Infinity, bestRoute = null;
            for (const job of jobs) {
                if (!SC.roads.findPath(job.pickup, job.drop)) continue;
                const r = SC.roads.findPath(truck.node, job.pickup);
                if (r && r.dist < bestDist) { best = job; bestDist = r.dist; bestRoute = r; }
            }
            if (!best) continue;
            jobs.splice(jobs.indexOf(best), 1);
            truck.job = best;
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
        if (SC.state.money < price) return { ok: false, reason: 'money', cost: price };
        SC.state.money -= price;
        SC.state.trucksBought++;
        const hq = SC.state.nodes.find(n => n.isHQ) || SC.state.nodes[0];
        return { ok: true, truck: addTruck(hq) };
    }

    return { addTruck, addJob, cancelJobsForOrder, dispatch, tick, buyTruck };
})();
