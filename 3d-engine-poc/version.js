/**
 * version.js — which build the page you are looking at actually is.
 *
 * Written by tools/stamp-build.sh; do not edit the values by hand.
 *
 * The stamp names the commit that was HEAD when the script ran, which is the
 * last commit carrying real changes — not the commit that records the stamp.
 * A file cannot contain its own hash (writing the hash changes the hash), so
 * one commit of lag is the closest an unbuilt static site gets. That is the
 * useful end of the trade anyway: it names the change you are looking for.
 */
(function (global) {
    'use strict';

    const Cargo3D = global.Cargo3D = global.Cargo3D || {};

    Cargo3D.BUILD = {
        commit: '2bd32f6',
        date: '2026-08-06',
        repo: 'neskil/neskil.github.io'
    };
})(typeof window !== 'undefined' ? window : globalThis);
