// Trucks and the job dispatcher. Jobs are single-item hauls; idle trucks
// pick the nearest reachable pending job. Each truck has a home yard
// (HQ or a purchased 'yard' node) it returns to when there's no work,
// which is what makes dispatch naturally favor jobs near that yard —
// no separate "prefer home region" rule needed, since idle trucks simply
// cluster there between jobs. Pure logic.
window.SC = window.SC || {};

SC.vehicles = (function() {
    let truckSeq = 0, jobSeq = 0;

    function addTruck(node, homeYard) {
        const t = {
            id: truckSeq++,
            node,                 // node the truck is at / last passed
            x: node.x, y: node.y,
            homeYard: homeYard || node,
            path: null, pathIdx: 0, progress: 0,
            cargo: [],             // item keys being hauled this trip (bundled, same pickup+drop)
            jobs: [], phase: null  // 'toPickup' | 'toDrop' | 'returning'
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
            // loaded trucks finish their run; salvage handles the drop.
            // 'loading' trucks haven't consumed stock yet, so cancel freely.
            if (t.phase !== 'toPickup' && t.phase !== 'loading') continue;
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

        if (truck.phase === 'returning') { truck.phase = null; return; }
        if (!truck.jobs.length) return;
        if (truck.phase === 'toPickup') {
            loadAtPickup(truck);
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

    // Truck arrived at its pickup (or is waiting there). Suppliers hold
    // finite regenerating stock: if there isn't enough for the whole
    // bundle yet, the truck waits in the 'loading' phase and retries
    // each tick until the stock catches up. Factory pickups (crafted
    // intermediates/products) are made-to-order and never stock-gated.
    function loadAtPickup(truck) {
        const first = truck.jobs[0];
        const route = SC.roads.findPath(first.pickup, first.drop);
        if (!route) { // network changed underneath us: give the jobs back
            SC.state.jobs.push(...truck.jobs);
            truck.jobs = [];
            truck.phase = null;
            return;
        }
        if (first.pickup.kind === 'supplier') {
            if ((first.pickup.stock || 0) < truck.jobs.length) {
                truck.phase = 'loading';
                return;
            }
            first.pickup.stock -= truck.jobs.length;
        }
        truck.cargo = truck.jobs.map(j => j.item);
        truck.phase = 'toDrop';
        setPath(truck, route.path);
    }

    // Assign pending jobs to idle trucks. Repeatedly matches the globally
    // closest (idle truck, job) pair — not just "each truck grabs its own
    // nearest job" in array order — so a truck parked at a yard near the
    // job wins it over one that would have to cross the map, even if the
    // farther truck happens to be earlier in the trucks list. Combined
    // with idle trucks heading home to their yard (below), this is what
    // makes dispatch favor a truck's home region. A truck with spare
    // capacity bundles additional jobs that share the exact same pickup
    // and drop as the one it just claimed, so one trip can carry several
    // units of the same haul (e.g. multiple raw units for one factory, or
    // several units of one product to one city).
    function dispatch() {
        const jobs = SC.state.jobs;
        const capacity = SC.truckCapacity();
        let idle = SC.state.trucks.filter(t => !t.jobs.length && !t.path);

        while (idle.length && jobs.length) {
            let bestTruck = null, bestJob = null, bestDist = Infinity, bestRoute = null;
            for (const truck of idle) {
                for (const job of jobs) {
                    if (!SC.roads.findPath(job.pickup, job.drop)) continue;
                    const r = SC.roads.findPath(truck.node, job.pickup);
                    if (r && r.dist < bestDist) { bestDist = r.dist; bestTruck = truck; bestJob = job; bestRoute = r; }
                }
            }
            if (!bestTruck) break; // no remaining job is reachable by any idle truck

            const bundle = [bestJob];
            if (capacity > 1) {
                for (const job of jobs) {
                    if (bundle.length >= capacity) break;
                    if (job !== bestJob && job.pickup === bestJob.pickup && job.drop === bestJob.drop) bundle.push(job);
                }
            }
            for (const job of bundle) jobs.splice(jobs.indexOf(job), 1);
            bestTruck.jobs = bundle;
            bestTruck.phase = 'toPickup';
            setPath(bestTruck, bestRoute.path);
            SC.emit('truckDispatched', bestTruck);
            idle = idle.filter(t => t !== bestTruck);
        }

        // Trucks left with no work head back to their home yard, if not
        // there already.
        for (const truck of idle) {
            if (truck.node === truck.homeYard) continue;
            const home = SC.roads.findPath(truck.node, truck.homeYard);
            if (home && home.path.length > 1) {
                truck.phase = 'returning';
                setPath(truck, home.path);
            }
        }
    }

    // How many trucks are currently travelling this edge's segment right
    // now, in either direction — read by SC.roads.speedMult for
    // congestion (when SC.state.congestionEnabled).
    function truckCountOnEdge(edge) {
        let n = 0;
        for (const t of SC.state.trucks) {
            if (!t.path || t.pathIdx >= t.path.length - 1) continue;
            const a = t.path[t.pathIdx], b = t.path[t.pathIdx + 1];
            if ((a === edge.a && b === edge.b) || (a === edge.b && b === edge.a)) n++;
        }
        return n;
    }

    function tick(dt) {
        const speed = SC.truckSpeed();
        for (const t of SC.state.trucks) {
            if (t.phase === 'loading') { loadAtPickup(t); continue; } // waiting on supplier stock
            if (!t.path) continue;
            let remaining = speed * dt;
            while (remaining > 0 && t.path && t.pathIdx < t.path.length - 1) {
                const a = t.path[t.pathIdx], b = t.path[t.pathIdx + 1];
                const edge = SC.roads.findEdge(a, b);
                // progress === 0 means this segment was just entered (not
                // resumed mid-segment on a later tick) — counts each road
                // use exactly once regardless of fast-forward step size.
                if (t.progress === 0) SC.stats.recordRoadUse(edge);
                // Highways carry trucks faster on that segment
                const mult = SC.roads.speedMult(edge);
                const segLen = (Math.hypot(b.x - a.x, b.y - a.y) || 1) / mult;
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
        const hq = SC.state.nodes.find(n => n.isHQ) || SC.state.nodes[0];
        const yard = SC.isYard(SC.state.activeYard) ? SC.state.activeYard : hq;
        const price = SC.truckPrice(yard); // per-yard ladder
        if (!SC.canAfford(price)) return { ok: false, reason: 'money', cost: price };
        SC.state.money -= price;
        SC.state.trucksBought++;
        const truck = addTruck(yard, yard);
        SC.emit('truckBought', { truck, price });
        return { ok: true, truck };
    }

    // Re-home an idle truck to `yard` (free — moving isn't creating).
    // Takes one from the yard with the biggest fleet so bases even out;
    // the dispatcher's go-home logic then drives it to its new yard.
    function reassignTruck(yard) {
        if (!SC.isYard(yard)) return { ok: false, reason: 'invalid' };
        const idle = SC.state.trucks.filter(t =>
            !t.jobs.length && t.homeYard !== yard && (!t.path || t.phase === 'returning'));
        if (!idle.length) return { ok: false, reason: 'none' };
        idle.sort((a, b) => SC.trucksAtYard(b.homeYard) - SC.trucksAtYard(a.homeYard));
        const truck = idle[0];
        truck.homeYard = yard;
        SC.emit('truckReassigned', { truck, yard });
        return { ok: true, truck };
    }

    return { addTruck, addJob, cancelJobsForOrder, dispatch, tick, buyTruck, reassignTruck,
             truckCountOnEdge };
})();
