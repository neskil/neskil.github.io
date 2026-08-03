(function (window) {
    'use strict';

    // The one channel the logic layer is allowed to use to reach the UI and
    // the renderer. Logic emits; render/ui listen. Never the other way round —
    // that inversion is what keeps tests.html runnable with no canvas.
    const CY = window.CY = window.CY || {};

    const handlers = Object.create(null);

    CY.on = function (name, fn) {
        (handlers[name] || (handlers[name] = [])).push(fn);
        return fn;
    };

    CY.off = function (name, fn) {
        const list = handlers[name];
        if (!list) return;
        const i = list.indexOf(fn);
        if (i > -1) list.splice(i, 1);
    };

    CY.emit = function (name, payload) {
        const list = handlers[name];
        if (!list) return;
        // Copy: a handler may unsubscribe itself mid-emit.
        list.slice().forEach(function (fn) {
            try {
                fn(payload);
            } catch (err) {
                // A broken listener must not take the game loop with it.
                if (window.console) console.error('CY.on(' + name + ') threw', err);
            }
        });
    };

    // Tests and "new game" need a clean bus.
    CY.resetEvents = function () {
        Object.keys(handlers).forEach(function (k) { delete handlers[k]; });
    };

})(window);
