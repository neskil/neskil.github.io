/**
 * cargo-packer/core/algorithms.js
 * The one list of packing algorithms. The sidebar, the compare pickers, the
 * showdown and the tests all read it, so adding an algorithm is one entry
 * here plus its file.
 *
 * quality: 'good' | 'baseline' | 'bad' — shown as a tag in the UI.
 * slow:    true for the ones whose time grows fastest with the load; the
 *          background packer runs them last so the quick results show first.
 * Strictly NO Three.js and NO DOM dependencies.
 */
(function(exports) {
  'use strict';

  function lib() {
    if (typeof module !== 'undefined' && module.exports) {
      return Object.assign({},
        require('./extremePoints'), require('./wallBuilding'), require('./firstFit'), require('./moreHeuristics'));
    }
    return self.CargoPacker;
  }

  const ALGORITHMS = [
    {
      id: 'extremePoints',
      name: 'Extreme Points (EP)',
      shortName: 'Extreme Points',
      quality: 'good',
      blurb: '3D anchor points & surface projection',
      explainer: 'Generates candidate 3D corner coordinates after every placement, projects them against existing surfaces, and picks the tightest fit minimizing wasted space.',
      winNote: 'Its corner points let small boxes fill the recesses that layered methods leave open.',
      slow: true,
      run: (items, c, o) => lib().packExtremePoints(items, c, o)
    },
    {
      id: 'wallBuilding',
      name: 'Wall-Building (Back-to-Front)',
      shortName: 'Wall-Building',
      quality: 'good',
      blurb: 'Back-to-front vertical transverse slices',
      explainer: 'Builds vertical transverse slices (walls) across the container width before advancing along the length. Ideal for maritime cargo securing and physical stability.',
      winNote: 'Building wall after wall from the back keeps each slice tight and stable.',
      run: (items, c, o) => lib().packWallBuilding(items, c, o)
    },
    {
      id: 'deepestBottomLeft',
      name: 'Deepest-Bottom-Left',
      shortName: 'Deepest-Bottom-Left',
      quality: 'good',
      blurb: 'Deepest, then lowest, then left-most spot',
      explainer: 'A classic from the bin-packing literature (Karabulut & İnceoğlu, 2004). Sorts by volume, then puts each box at the deepest admissible corner, breaking ties by height and then by side. No scoring, no projection: one simple rule.',
      winNote: 'Always reaching for the deepest corner packs tightly against the bulkhead.',
      run: (items, c, o) => lib().packDeepestBottomLeft(items, c, o)
    },
    {
      id: 'balanced',
      name: 'Balanced Load (CoG-centred)',
      shortName: 'Balanced Load',
      quality: 'good',
      blurb: 'Spreads the weight: centre of gravity mid-container',
      explainer: 'Loads for weight balance rather than density. Heaviest first, each box goes where it keeps the centre of gravity closest to the middle of the container, so the axles share the load and nothing pulls the trailer sideways. What real load planners spread evenly is weight, not gaps.',
      winNote: 'Building out from the middle kept the load compact and the weight centred.',
      slow: true,
      run: (items, c, o) => lib().packBalanced(items, c, o)
    },
    {
      id: 'firstFit',
      name: 'First-Fit Decreasing (Shelf)',
      shortName: 'First-Fit',
      quality: 'baseline',
      blurb: 'Greedy horizontal layer baseline',
      explainer: 'Sorts cargo by height and constructs horizontal floor shelves. Fast and intuitive baseline, but demonstrates the classic headspace air-void problem.',
      winNote: 'Uniform heights stack into level shelves with little headspace lost.',
      run: (items, c, o) => lib().packFirstFit(items, c, o)
    },
    {
      id: 'nextFit',
      name: 'Next-Fit (Unsorted)',
      shortName: 'Next-Fit',
      quality: 'baseline',
      blurb: 'Arrival order, never looks back',
      explainer: 'Loads boxes in the order they arrive: next to the last one, else a new row, else a new layer, and never returns to a row it has left. Without sorting, one awkward box early on wastes the space behind it.',
      winNote: 'The manifest happened to arrive in an order that packs well.',
      run: (items, c, o) => lib().packNextFit(items, c, o)
    },
    {
      id: 'floorOnly',
      name: 'Floor Only (No Stacking)',
      shortName: 'Floor Only',
      quality: 'bad',
      blurb: 'One layer, no stacking, no turning',
      explainer: 'Puts every box straight on the floor as it is listed, never stacking and never turning one. Covers the floor and leaves the air above it empty: what a cautious first day on the job looks like.',
      winNote: 'With this little cargo, one layer on the floor was enough.',
      run: (items, c, o) => lib().packFloorOnly(items, c, o)
    },
    {
      id: 'randomDrop',
      name: 'Random Drop',
      shortName: 'Random Drop',
      quality: 'bad',
      blurb: 'Random order, random spot',
      explainer: 'Shuffles the cargo, then tries random spots and turns for each box, lowers it onto whatever is below and keeps the first spot where it rests safely. Still physical (nothing floats or overlaps), just without a plan.',
      winNote: 'Luck. Try another load.',
      run: (items, c, o) => lib().packRandomDrop(items, c, o)
    }
  ];

  const byId = {};
  ALGORITHMS.forEach(a => { byId[a.id] = a; });

  exports.ALGORITHMS = ALGORITHMS;
  exports.getAlgorithm = id => byId[id] || null;

})(typeof module !== 'undefined' && module.exports ? module.exports : (self.CargoPacker = self.CargoPacker || {}));
