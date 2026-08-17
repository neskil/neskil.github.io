/* The ground, as a function.

   A hole's terrain is analytic — a tilted plane plus a handful of gaussian
   bumps and hollows — rather than a mesh with a collision copy. Two reasons
   that matters:

     - The physics and the visible mesh cannot drift apart. The renderer
       displaces its vertices with height(), and the ball asks height() where
       the floor is. There is no second representation to keep in sync.
     - Slopes need no special-casing. In the 2D game a breaking green was a
       rectangle with a hardcoded acceleration vector; here the ball is simply
       on a hill, and gravity along the surface does the rest.

   Everything is in metres and seconds. A driver carries about 200m, the cup is
   108mm across, and the courses are laid out at the sizes those numbers imply,
   so the tuning constants read like the real quantities they stand for. */
(function (GOLF) {
    'use strict';

    /* Surfaces, ordered by how specific they are: the first match wins, so a
       bunker cut into a green still plays as sand. */
    var SURFACE = {
        WATER: 'water',
        SAND: 'sand',
        GREEN: 'green',
        FAIRWAY: 'fairway',
        ROUGH: 'rough'
    };

    /* Rolling deceleration in m/s², bounce restitution, and how much horizontal
       speed a bounce scrubs off.

       Rolling resistance is Coulomb — a constant deceleration opposing travel —
       not the exponential decay the 2D game uses. That is not a detail. Under
       exponential decay a ball on a slope reaches a terminal velocity and slides
       down it forever, because the resisting force vanishes as the ball slows;
       a putt across a 3° green ran 43m sideways and never stopped. With a
       constant deceleration the ball stops dead the moment the slope cannot
       overcome it, which is what real turf does and what makes a green readable.

       Values come from how far a ball should run, since d = v² / 2a: a 3m/s
       putt on a green covers 10m, a ball landing on fairway at 10m/s runs 20m,
       the same ball in rough dies in 6m, and sand stops it inside two. */
    var SURFACE_PROPS = {
        green:   { decel: 0.45, restitution: 0.36, grab: 0.62 },
        fairway: { decel: 2.5,  restitution: 0.33, grab: 0.55 },
        rough:   { decel: 8.3,  restitution: 0.18, grab: 0.28 },
        sand:    { decel: 14.0, restitution: 0.08, grab: 0.10 },
        water:   { decel: 20.0, restitution: 0.02, grab: 0.05 }
    };

    function inCircle(x, z, c) {
        var dx = x - c.x, dz = z - c.z;
        return dx * dx + dz * dz <= c.r * c.r;
    }

    function anyCircle(list, x, z) {
        if (!list) return false;
        for (var i = 0; i < list.length; i++) {
            if (inCircle(x, z, list[i])) return true;
        }
        return false;
    }

    /* Height of the ground at (x, z).

       Gaussians rather than cones or steps because the ball needs a continuous
       surface normal: a crease in the terrain would make the bounce direction
       jump between two frames and the ball would hop for no visible reason. */
    function height(hole, x, z) {
        var t = hole.tilt || { ax: 0, az: 0 };
        var y = (hole.baseY || 0) + t.ax * x + t.az * z;

        var b = hole.bumps;
        if (b) {
            for (var i = 0; i < b.length; i++) {
                var dx = x - b[i].x, dz = z - b[i].z;
                var d2 = dx * dx + dz * dz;
                var r2 = b[i].r * b[i].r;
                y += b[i].h * Math.exp(-d2 / r2);
            }
        }
        return y;
    }

    /* Surface normal, by central difference on height().

       Analytic derivatives would be exact and are not worth it: the gaussian
       sum is cheap, and a 5cm step is far below the smallest feature on any
       hole while staying far above float noise. */
    function normal(hole, x, z, out) {
        var e = 0.05;
        var hx = height(hole, x + e, z) - height(hole, x - e, z);
        var hz = height(hole, x, z + e) - height(hole, x, z - e);
        // Gradient (dy/dx, dy/dz) -> normal (-dy/dx, 1, -dy/dz), normalised.
        var nx = -hx / (2 * e), nz = -hz / (2 * e);
        var len = Math.sqrt(nx * nx + 1 + nz * nz);
        out = out || {};
        out.x = nx / len;
        out.y = 1 / len;
        out.z = nz / len;
        return out;
    }

    // Steepness in degrees, for the HUD's lie readout.
    function slopeDegrees(hole, x, z) {
        var n = normal(hole, x, z);
        return Math.acos(Math.min(1, n.y)) * 180 / Math.PI;
    }

    function surfaceAt(hole, x, z) {
        if (anyCircle(hole.water, x, z)) return SURFACE.WATER;
        if (anyCircle(hole.sand, x, z)) return SURFACE.SAND;
        if (hole.green && inCircle(x, z, hole.green)) return SURFACE.GREEN;
        if (anyCircle(hole.fairway, x, z)) return SURFACE.FAIRWAY;
        return SURFACE.ROUGH;
    }

    function propsFor(surface) {
        return SURFACE_PROPS[surface] || SURFACE_PROPS.rough;
    }

    function outOfBounds(hole, x, z) {
        var b = hole.bounds;
        return x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ;
    }

    GOLF.terrain = {
        SURFACE: SURFACE,
        SURFACE_PROPS: SURFACE_PROPS,
        height: height,
        normal: normal,
        slopeDegrees: slopeDegrees,
        surfaceAt: surfaceAt,
        propsFor: propsFor,
        outOfBounds: outOfBounds,
        inCircle: inCircle
    };

})(window.GOLF);
