// Wiring. Every module is inert until its init() runs, which is what lets
// tests.html load the same files and exercise their logic without a page
// around them.
//
// Order matters in one place: tilt reads HOME.background.pointer and calls
// activateCardTheme, so the background goes first.
window.HOME = window.HOME || {};

HOME.background.init();
HOME.stats.init();
HOME.tilt.init();
HOME.flip.init();
HOME.vault.init();
