/**
 * cargo-packer/core/solveWorker.js
 * Packs off the main thread, so a load of any size never freezes the page.
 *
 * In:  { id, items, container, options, order }   order = algorithm ids
 * Out: { id, type: 'result', algoId, result, ms }  one per algorithm, in order
 *      { id, type: 'done' }
 *
 * The page cancels a solve that is no longer wanted by terminating the worker
 * and starting a fresh one, so nothing here needs to check for that.
 */
/* global importScripts */
importScripts(
  'types.js', 'collision.js', 'metrics.js',
  'extremePoints.js', 'wallBuilding.js', 'firstFit.js', 'moreHeuristics.js',
  'algorithms.js', 'manifests.js'
);

self.onmessage = e => {
  const { id, items, container, options, order } = e.data;
  const CP = self.CargoPacker;
  order.forEach(algoId => {
    const algo = CP.getAlgorithm(algoId);
    if (!algo) return;
    const t0 = performance.now();
    const result = algo.run(items, container, options);
    self.postMessage({ id: id, type: 'result', algoId: algoId, result: result, ms: Math.round(performance.now() - t0) });
  });
  self.postMessage({ id: id, type: 'done' });
};
