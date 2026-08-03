(function (window) {
    'use strict';

    // The campaign: a single line of missions, each one introducing exactly one
    // idea and then never explaining it again. Unlocking is linear — clear a
    // mission with at least one star and the next one opens.
    //
    // A mission is data. Everything below is either a literal queue (when the
    // puzzle is hand-authored) or a seeded generator (when the point is that
    // you cannot memorise it). Par is *derived* from the queue in scoring.js,
    // so editing a queue can never leave a stale target behind.
    const CY = window.CY = window.CY || {};

    const CHAPTERS = [
        { id: 'ch1', name: 'Yard Basics',     carrier: 'maersk',    blurb: 'Learn the lattice.' },
        { id: 'ch2', name: 'Intermodal',      carrier: 'hapag',     blurb: 'Real boxes, real rules.' },
        { id: 'ch3', name: 'Terminal Master', carrier: 'evergreen', blurb: 'Everything, at once.' }
    ];

    const MISSIONS = [
        // ── Chapter 1 ────────────────────────────────────────────────────
        {
            id: 'm1', chapter: 'ch1', name: 'First Tier',
            brief: 'Six crate bundles, one small pad. Drop them so the box you draw around them is as small as you can make it.',
            teaches: 'Click a cell to drop, R to rotate. The score is the cuboid around everything.',
            yard: { w: 6, d: 4, h: 3 },
            rules: { maxTier: 3, minSupport: 0.5, preview: 3 },
            queue: ['k2', 'kO', 'k2', 'kL', 'k1', 'k1']
        },
        {
            id: 'm2', chapter: 'ch1', name: 'Twenty Footers',
            brief: 'Your first intermodal boxes. A 20ft is two cells long — turn it to fit the pad, not the other way round.',
            teaches: 'Containers are long. Rotation is 90° about the vertical only.',
            yard: { w: 6, d: 4, h: 3 },
            rules: { maxTier: 3, minSupport: 0.5, preview: 3 },
            queue: ['c20', 'c20', 'k2', 'c20', 'kO', 'c20']
        },
        {
            id: 'm3', chapter: 'ch1', name: 'Going Up',
            brief: 'The pad is four by four and the queue is ten deep. There is only one direction left.',
            teaches: 'Height counts from the ground, so an unnecessary tier is expensive.',
            yard: { w: 4, d: 4, h: 4 },
            rules: { maxTier: 4, minSupport: 0.5, preview: 3 },
            gen: { pool: ['k1', 'k2', 'kO', 'kL', 'kJ', 'kT'], count: 10 }
        },
        {
            id: 'm4', chapter: 'ch1', name: 'Support Act',
            brief: 'Three quarters of a bundle\'s underside has to be carried now. No more corners hanging over the void.',
            teaches: 'Support ratio — overhangs are refused, not penalised.',
            yard: { w: 6, d: 4, h: 4 },
            rules: { maxTier: 4, minSupport: 0.75, preview: 3 },
            gen: { pool: ['k2', 'kO', 'kL', 'kJ', 'kT', 'kStep', 'kTower'], count: 10 },
            // A 75% support floor plus stepped bundles is the one mix in the
            // campaign that genuinely cannot be packed near the theoretical
            // minimum, so this mission carries its own medal multipliers.
            par: { gold: 1.55, silver: 1.90, bronze: 2.45 }
        },

        // ── Chapter 2 ────────────────────────────────────────────────────
        {
            id: 'm5', chapter: 'ch2', name: 'The Forty Foot Problem',
            brief: 'Five forty-foot high cubes. Four cells each, and a pad that is eight wide. The arithmetic is the puzzle.',
            teaches: 'Long boxes want to lie parallel; the leftovers decide your score.',
            yard: { w: 8, d: 4, h: 4 },
            rules: { maxTier: 4, minSupport: 0.6, preview: 3 },
            queue: ['c40', 'c40', 'c20', 'c40', 'c20', 'c40', 'c40']
        },
        {
            id: 'm6', chapter: 'ch2', name: 'Mixed Consignment',
            brief: 'Boxes and bundles in the same queue, in an order you did not choose.',
            teaches: 'Leave gaps a 40ft can still use, or you will be filling them with air.',
            yard: { w: 10, d: 5, h: 4 },
            rules: { maxTier: 4, minSupport: 0.6, preview: 3 },
            gen: { pool: ['c20', 'c40', 'kO', 'kL', 'k2', 'kT'], count: 12 }
        },
        {
            id: 'm7', chapter: 'ch2', name: 'Cold Chain',
            brief: 'Reefers need a plug. Bury one on all four sides and the yard pays for a genset — in volume.',
            teaches: 'Soft rules: a reefer with no side access costs you at the audit, it is not refused.',
            yard: { w: 8, d: 4, h: 4 },
            rules: { maxTier: 4, minSupport: 0.6, preview: 3 },
            queue: ['r20', 'c40', 'r20', 'c20', 'c40', 'r20', 'k2', 'c40']
        },
        {
            id: 'm8', chapter: 'ch2', name: 'Top Heavy',
            brief: 'Tank frames carry nothing. Whatever you put down on top of one, the yard will refuse.',
            teaches: 'Hard rule: no-top pieces are dead ends — place them where a dead end is free.',
            yard: { w: 8, d: 5, h: 4 },
            rules: { maxTier: 4, minSupport: 0.6, preview: 3 },
            gen: { pool: ['c20', 'c40', 't20', 'kO', 'kL', 'k2'], count: 12, force: { t20: 3 } }
        },

        // ── Chapter 3 ────────────────────────────────────────────────────
        {
            id: 'm9', chapter: 'ch3', name: 'Priority Departure',
            brief: 'The flagged boxes leave on the morning feeder. Anything sitting on one of them at the audit costs you.',
            teaches: 'Priority tags — plan the *unstacking*, not just the stacking.',
            yard: { w: 9, d: 5, h: 4 },
            rules: { maxTier: 4, minSupport: 0.6, preview: 3 },
            queue: [
                { id: 'c40', tag: 'priority' }, 'c20', 'kO',
                { id: 'c20', tag: 'priority' }, 'c40', 'kL',
                'c40', { id: 'c20', tag: 'priority' }, 'k2', 'c40'
            ]
        },
        {
            id: 'm10', chapter: 'ch3', name: 'Blind Queue',
            brief: 'One box of warning. Everything you have learned, without the lookahead.',
            teaches: 'Preview length is a difficulty dial — keep the stack forgiving.',
            yard: { w: 9, d: 5, h: 4 },
            rules: { maxTier: 4, minSupport: 0.6, preview: 1 },
            gen: { pool: ['c20', 'c40', 'kO', 'kL', 'kJ', 'kT', 'k2'], count: 14 }
        },
        {
            id: 'm11', chapter: 'ch3', name: 'Tight Berth',
            brief: 'Five by five by five. Nothing is going sideways; every mistake is a hole you will be paying for.',
            teaches: 'A cube-shaped pad makes bounding volume brutally sensitive to holes.',
            yard: { w: 5, d: 5, h: 5 },
            rules: { maxTier: 5, minSupport: 0.6, preview: 2 },
            gen: { pool: ['k1', 'k2', 'kO', 'kL', 'kJ', 'kT', 'kStep', 'kTripod', 'kTower'], count: 16 }
        },
        {
            id: 'm12', chapter: 'ch3', name: 'Yard Master',
            brief: 'Twenty units. Reefers, tanks, priority sailings, a full-size pad and no excuses.',
            teaches: 'Nothing new. That is the point.',
            yard: { w: 12, d: 6, h: 5 },
            rules: { maxTier: 5, minSupport: 0.6, preview: 3 },
            gen: {
                pool: ['c20', 'c40', 'c45', 'r20', 't20', 'kO', 'kL', 'kJ', 'kT', 'kStep'],
                count: 20, force: { r20: 2, t20: 2 }, priority: 3
            }
        }
    ];

    const byId = Object.create(null);
    MISSIONS.forEach(function (m) { byId[m.id] = m; });

    function list() { return MISSIONS.slice(); }
    function chapters() { return CHAPTERS.slice(); }
    function get(id) { return byId[id] || null; }

    function indexOf(id) {
        for (let i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === id) return i;
        return -1;
    }

    function next(id) {
        const i = indexOf(id);
        return (i > -1 && i + 1 < MISSIONS.length) ? MISSIONS[i + 1] : null;
    }

    function rulesFor(m) {
        return Object.assign({}, CY.RULES, (m && m.rules) || {});
    }

    // Normalise both queue notations ('c40' and { id, tag }) into one shape.
    function entry(q) {
        if (typeof q === 'string') return { id: q, tag: null };
        return { id: q.id, tag: q.tag || null };
    }

    // Generated queues are seeded off the mission id, so the mission is the
    // same puzzle for everyone and a score means something.
    function buildQueue(m) {
        if (!m) return [];
        if (m.queue) return m.queue.map(entry);

        const gen = m.gen;
        if (!gen) return [];
        const rng = CY.rng.create(CY.rng.hash(m.id));
        const out = [];

        // Forced pieces first so a mission that is *about* tanks always gets
        // its tanks, however the shuffle lands.
        Object.keys(gen.force || {}).forEach(function (id) {
            for (let i = 0; i < gen.force[id]; i++) out.push({ id: id, tag: null });
        });
        while (out.length < gen.count) {
            out.push({ id: rng.pick(gen.pool), tag: null });
        }

        const shuffled = rng.shuffle(out).slice(0, gen.count);

        // Priority tags land on containers only — tagging a single crate as
        // "departs first" reads as noise.
        let want = gen.priority || 0;
        for (let i = 0; i < shuffled.length && want > 0; i++) {
            const def = CY.piece(shuffled[i].id);
            if (def && def.kind === 'container' && !shuffled[i].tag) {
                shuffled[i] = { id: shuffled[i].id, tag: 'priority' };
                want--;
            }
        }
        return shuffled;
    }

    function parFor(m) {
        return CY.score.parFor(buildQueue(m).map(function (e) { return e.id; }), m && m.par);
    }

    // Linear ladder: m1 is always open, everything else needs a star on the
    // one before it.
    function isUnlocked(id, progress) {
        const i = indexOf(id);
        if (i <= 0) return i === 0;
        const prev = MISSIONS[i - 1];
        const rec = progress && progress.missions && progress.missions[prev.id];
        return !!(rec && rec.stars > 0);
    }

    CY.missions = {
        list: list,
        chapters: chapters,
        get: get,
        next: next,
        indexOf: indexOf,
        rulesFor: rulesFor,
        buildQueue: buildQueue,
        parFor: parFor,
        isUnlocked: isUnlocked
    };

})(window);
