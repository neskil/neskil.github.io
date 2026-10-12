/**
 * cargo-packer/ui/tourContent.js
 * The guided tours: one short illustrated article per algorithm. Each chapter
 * says what to show and the runner (ui/tour.js) stages it.
 *
 * Chapter fields
 *   title, body   Text. Body is trusted HTML (it is ours); {placeholders} are
 *                 filled from the live load: {total} {placed} {unplaced}
 *                 {fill} {extent} {box} {epCount} {support} {depth} {rank}
 *                 {algoCount} {winner}.
 *   step          Which point of the packing to show: -1 (empty), a step
 *                 index, 'NN%' of the way through, 'end', or a named moment:
 *                 'firstStacked' (first box not on the floor),
 *                 'firstNewWall' (first box past the first wall),
 *                 'partlySupported' (the stacked box with the least support).
 *   camera        'overview' | 'corner' | 'focus' (on the step's box) |
 *                 'above' (steeply down on it) | 'top' | 'side' | 'doors'
 *   show          Any of 'eps' (candidate spots), 'select' (outline the box),
 *                 'support' (what the box rests on), 'cog'.
 *   note          Optional one-line takeaway, shown as a callout.
 *
 * Tours use step positions, not fixed numbers, so they read correctly on an
 * edited cargo load too.
 */
(function(exports) {
  'use strict';

  const TOURS = {
    extremePoints: {
      scenario: 'ecommerce',
      chapters: [
        {
          title: 'The puzzle',
          step: -1, camera: 'overview', show: [],
          body: '<p>A 20&nbsp;ft container holds 33&nbsp;m³. This manifest has <b>{total} parcels</b> in seven shapes. Trying every arrangement is hopeless (3D bin packing is NP-hard), so practical loaders follow a <i>rule</i> for where the next box may go.</p><p><b>Extreme Points</b> (Crainic, Perboli &amp; Tadei, 2008) is one of the best-known rules. Here is how it works, one box at a time.</p>'
        },
        {
          title: 'Biggest first, into the corner',
          step: 0, camera: 'corner', show: ['select', 'eps'],
          body: '<p>The boxes are sorted by volume, largest first. The first one (<b>{box}</b>) goes to the only spot there is yet: the corner where the floor, the back bulkhead and the side wall meet.</p>',
          note: 'Big boxes first: they are the hardest to fit later.'
        },
        {
          title: 'Every box makes new corners',
          step: 2, camera: 'focus', show: ['select', 'eps'],
          body: '<p>Each placed box offers up to three new <b>extreme points</b>: past its side, on its top, and in front of it. The blue dots are the <b>{epCount} spots</b> the next box could try; the amber one is where this box went.</p>'
        },
        {
          title: 'Projection: no corners in mid-air',
          step: '15%', camera: 'focus', show: ['select', 'eps'],
          body: '<p>A raw corner can hang in the air, or sit in a gap too small to use. Extreme Points <i>projects</i> each new point along the axes until it meets a wall or another box, so the points land where a box can actually rest. That is what lets small parcels slip into recesses other methods leave empty.</p>'
        },
        {
          title: 'Scoring a spot',
          step: '35%', camera: 'top', show: ['select', 'eps'],
          body: '<p>For every point and each of the six ways to turn the box, the algorithm checks that it fits, overlaps nothing and is at least 60&nbsp;% supported. Survivors are scored:</p><p class="tour-formula">1000·z + 500·y + 100·x − 40·contact</p><p>The lowest score wins: deep, low and to the left, touching as many surfaces as possible.</p>'
        },
        {
          title: 'Standing on something',
          step: 'partlySupported', camera: 'above', show: ['support', 'select'],
          body: '<p>The green patches are what this <b>{box}</b> rests on: <b>{support}&nbsp;%</b> of its base. Below 60&nbsp;% the spot is rejected. That rule is what keeps a load from toppling when the truck brakes.</p>',
          note: 'Every algorithm here obeys the same 60 % support rule.'
        },
        {
          title: 'The finished load',
          step: 'end', camera: 'overview', show: ['cog'],
          body: '<p><b>{placed} of {total}</b> boxes, <b>{fill}&nbsp;%</b> of the container, using <b>{extent}</b>. It ranks <b>#{rank} of {algoCount}</b> on this load. The green marker is the centre of gravity.</p><p>Try the same cargo with another algorithm, or press <b>Compare</b> to watch two side by side.</p>'
        }
      ]
    },

    wallBuilding: {
      scenario: 'fmcg',
      chapters: [
        {
          title: 'How dockworkers do it',
          step: -1, camera: 'overview', show: [],
          body: '<p>Stevedores loading a container by hand do not hunt for gaps. They build a <b>wall</b> across the width at the back, then another in front of it, and so on to the doors. A tidy wall is stable and easy to strap.</p><p><b>Wall-Building</b> turns that habit into an algorithm, here on <b>{total} retail cartons</b>.</p>'
        },
        {
          title: 'How thick is a wall?',
          step: 0, camera: 'corner', show: ['select'],
          body: '<p>Take the largest box still waiting and look at its <i>shortest</i> side: here <b>{depth}&nbsp;m</b>. That is the depth of the first wall. Thin walls waste less length when the next boxes are smaller.</p>'
        },
        {
          title: 'Filling a row',
          step: 3, camera: 'focus', show: ['select'],
          body: '<p>Boxes go side by side across the width, each one the first in the queue that fits the wall\'s depth. When the next one would stick out past the side wall, the row is full.</p>'
        },
        {
          title: 'Stacking the next row',
          step: 'firstStacked', camera: 'above', show: ['support', 'select'],
          body: '<p>The next row starts on top of the one below. Each box is lowered until it rests on what is underneath (the green patches: <b>{support}&nbsp;%</b> of its base) and must be at least 60&nbsp;% supported.</p>'
        },
        {
          title: 'The next wall',
          step: 'firstNewWall', camera: 'focus', show: ['select'],
          body: '<p>When the wall reaches the roof, or nothing more fits in it, the algorithm steps forward and starts a new wall in front of the last.</p>'
        },
        {
          title: 'Wall after wall',
          step: 'end', camera: 'overview', show: ['cog'],
          body: '<p><b>{placed} of {total}</b> boxes in <b>{extent}</b>, ranking <b>#{rank} of {algoCount}</b>. Uniform cartons suit it best; a mix of odd sizes leaves gaps at the end of each row that Extreme Points would have filled.</p>'
        }
      ]
    },

    deepestBottomLeft: {
      scenario: 'ecommerce',
      chapters: [
        {
          title: 'One simple rule',
          step: -1, camera: 'overview', show: [],
          body: '<p><b>Deepest-Bottom-Left</b> (Karabulut &amp; İnceoğlu, 2004) has no scoring formula at all. Each box goes to the spot that is <i>deepest</i> in the container; ties go to the <i>lowest</i>, then the <i>left-most</i>.</p>'
        },
        {
          title: 'Corners as candidates',
          step: '25%', camera: 'focus', show: ['select', 'eps'],
          body: '<p>The candidate spots are the corners of the boxes already placed (the blue dots, <b>{epCount}</b> of them here). Every corner and every turn of the box is tried; the deepest one that fits and is supported wins (amber).</p>'
        },
        {
          title: 'Hugging the bulkhead',
          step: '70%', camera: 'side', show: ['select'],
          body: '<p>Because depth always comes first, the load grows as a solid block against the back and only creeps towards the doors when it must. That leaves the front of the container free.</p>'
        },
        {
          title: 'Simple, and often the best',
          step: 'end', camera: 'overview', show: ['cog'],
          body: '<p><b>{placed} of {total}</b> boxes using <b>{extent}</b>, ranking <b>#{rank} of {algoCount}</b>. On many loads this one-line rule beats Extreme Points\' weighted score: a reminder that a cleverer formula is not automatically a better packer.</p>'
        }
      ]
    },

    balanced: {
      scenario: 'industrial',
      chapters: [
        {
          title: 'Even weight, not even gaps',
          step: -1, camera: 'overview', show: [],
          body: '<p>Spacing cargo out evenly sounds tidy, but loose cargo shifts in transit, so real loads are packed tight and gaps are filled with dunnage. What a load planner spreads evenly is the <b>weight</b>: the centre of gravity should sit mid-container, so the truck\'s axles share the load and nothing pulls the trailer sideways.</p><p><b>Balanced Load</b> packs for that, here on <b>{total}</b> heavy crates and drums.</p>'
        },
        {
          title: 'Heaviest first, in the middle',
          step: 0, camera: 'top', show: ['select', 'cog'],
          body: '<p>The heaviest item (<b>{box}</b>) goes first, and it goes to the middle of the floor rather than the back corner. The green marker is the centre of gravity; on the radar in the right panel it sits dead centre.</p>'
        },
        {
          title: 'Each box keeps the balance',
          step: '30%', camera: 'top', show: ['select', 'eps', 'cog'],
          body: '<p>Candidate spots are beside, in front of, behind and on top of the boxes already placed (the dots show some it tried). Each is scored by where the centre of gravity would move, plus a pull towards the middle and a preference for low spots:</p><p class="tour-formula">3·|ΔCoG length| + 3·|ΔCoG width| + 1·|box − middle| + 0.8·height</p><p>So a heavy box on one side is answered by the next one on the other.</p>'
        },
        {
          title: 'Grown from the middle',
          step: 'end', camera: 'overview', show: ['cog'],
          body: '<p><b>{placed} of {total}</b> items, with the centre of gravity at the middle of the container. The other loaders all pack against the back wall and leave it far towards the bulkhead: switch to Extreme Points and watch the radar turn red. It ranks <b>#{rank} of {algoCount}</b> on floor use, which is the price of leaving room at both ends.</p>'
        }
      ]
    },

    firstFit: {
      scenario: 'industrial',
      chapters: [
        {
          title: 'Shelves',
          step: -1, camera: 'overview', show: [],
          body: '<p><b>First-Fit Decreasing</b> is the textbook baseline. Sort the boxes by height, tallest first, and pack them in horizontal <b>shelves</b>: fill the floor row by row, then start a new shelf on top.</p>'
        },
        {
          title: 'The first shelf',
          step: '20%', camera: 'focus', show: ['select'],
          body: '<p>Each box goes to the first place on the current shelf where it fits: next in the row, or the start of a new row. Sorting by height keeps each shelf fairly level.</p>'
        },
        {
          title: 'A new shelf, and the headspace problem',
          step: 'firstStacked', camera: 'above', show: ['support', 'select'],
          body: '<p>A new shelf starts at the height of the tallest box below. Over the shorter boxes that leaves an air gap, so each box is lowered onto what is actually beneath it (the green patches: <b>{support}&nbsp;%</b>) and must be at least 60&nbsp;% supported.</p>',
          note: 'Placing boxes at the shelf line instead is how earlier versions ended up with boxes floating in mid-air.'
        },
        {
          title: 'Air above the short boxes',
          step: 'end', camera: 'side', show: ['cog'],
          body: '<p><b>{placed} of {total}</b> boxes using <b>{extent}</b>, ranking <b>#{rank} of {algoCount}</b>. From the side you can see the headspace that shelves trap above shorter boxes, the classic weakness of layer packing.</p>'
        }
      ]
    },

    nextFit: {
      scenario: 'random',
      chapters: [
        {
          title: 'No sorting, no second chances',
          step: -1, camera: 'overview', show: [],
          body: '<p><b>Next-Fit</b> takes the boxes in the order they arrive, here <b>{total}</b> random ones, and puts each one next to the last. If it does not fit, it starts a new row; if that fails, a new layer. A row or layer once left is <b>never revisited</b>.</p>'
        },
        {
          title: 'One awkward box sets the row',
          step: '25%', camera: 'focus', show: ['select'],
          body: '<p>Without sorting, a deep box early in a row makes the whole row that deep, and a short box makes the next layer start low. The gaps behind them stay empty for good.</p>'
        },
        {
          title: 'Left on the dock',
          step: 'end', camera: 'overview', show: [],
          body: '<p>Only <b>{placed} of {total}</b> boxes made it in (<b>{unplaced}</b> left on the dock), ranking <b>#{rank} of {algoCount}</b>. Every algorithm above it starts by sorting the cargo. That one step is most of the difference.</p>'
        }
      ]
    },

    floorOnly: {
      scenario: 'industrial',
      chapters: [
        {
          title: 'The cautious approach',
          step: -1, camera: 'overview', show: [],
          body: '<p><b>Floor Only</b> never stacks and never turns a box. Every one goes straight on the floor, the way it was listed, as deep and as far left as it fits.</p>'
        },
        {
          title: 'A floor full, a container empty',
          step: 'end', camera: 'top', show: [],
          body: '<p>The floor is covered and the air above it is empty: <b>{fill}&nbsp;%</b> of the volume, with <b>{unplaced} of {total}</b> boxes left behind. It ranks <b>#{rank} of {algoCount}</b>. Stacking is where the volume is.</p>'
        },
        {
          title: 'Seen from the side',
          step: 'end', camera: 'side', show: [],
          body: '<p>One layer high. Compare it with any of the good algorithms on this load and the difference is everything above this line.</p>'
        }
      ]
    },

    randomDrop: {
      scenario: 'random',
      chapters: [
        {
          title: 'No plan at all',
          step: -1, camera: 'overview', show: [],
          body: '<p><b>Random Drop</b> shuffles the cargo, then for each box tries random spots and random turns, lowers the box onto whatever is below, and keeps the first spot where it rests safely. It is still physical: nothing floats or overlaps.</p>'
        },
        {
          title: 'Where it tried',
          step: '30%', camera: 'focus', show: ['select', 'eps'],
          body: '<p>The blue dots are the spots it tried for this <b>{box}</b> before one worked (amber). Each failed try was a collision, or a spot with too little underneath.</p>'
        },
        {
          title: 'Gaps everywhere',
          step: 'end', camera: 'overview', show: [],
          body: '<p><b>{placed} of {total}</b> boxes, <b>{fill}&nbsp;%</b> of the volume, ranking <b>#{rank} of {algoCount}</b>. The run is seeded, so it is the same every time. It is a useful floor: any real algorithm should beat it comfortably.</p>'
        }
      ]
    }
  };

  exports.TOURS = TOURS;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
