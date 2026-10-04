/**
 * cargo-packer/core/manifests.js
 * Benchmark cargo scenarios and manifest presets.
 * Strictly NO Three.js and NO DOM dependencies.
 */
(function(exports) {
  'use strict';

  const Types = (typeof module !== 'undefined' && module.exports) ? require('./types') : window.CargoPacker;

  /**
   * Scenario 1: E-Commerce Express
   * Mixed heterogeneous parcels with diverse aspect ratios.
   */
  function getEcommerceManifest() {
    const items = [];
    let id = 1;

    // A: Medium Shipping Boxes (0.45 x 0.35 x 0.30 m, 8kg) - 14 units
    for (let i = 0; i < 14; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Medium Carton', 0.45, 0.35, 0.30, 8, {
        color: '#38bdf8', // Light blue
        category: 'carton'
      }));
    }

    // B: Shoebox style parcels (0.35 x 0.22 x 0.15 m, 2.5kg) - 20 units
    for (let i = 0; i < 20; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Shoebox Parcel', 0.35, 0.22, 0.15, 2.5, {
        color: '#a855f7', // Purple
        category: 'parcel'
      }));
    }

    // C: Flat Mailers / Book packs (0.40 x 0.10 x 0.30 m, 3kg) - 12 units
    for (let i = 0; i < 12; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Flat Mailer', 0.40, 0.10, 0.30, 3, {
        color: '#10b981', // Emerald
        category: 'parcel'
      }));
    }

    // D: Large Appliance Cartons (0.60 x 0.50 x 0.45 m, 22kg) - 8 units
    for (let i = 0; i < 8; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Appliance Carton', 0.60, 0.50, 0.45, 22, {
        color: '#f59e0b', // Amber
        category: 'carton'
      }));
    }

    // E: Long Postal Tubes / Rug Rolls (0.20 x 0.20 x 1.10 m, 6kg) - 6 units
    for (let i = 0; i < 6; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Long Cylinder/Box', 0.20, 0.20, 1.10, 6, {
        color: '#ec4899', // Pink
        category: 'carton'
      }));
    }

    return items;
  }

  /**
   * Scenario 2: FMCG Distribution (Fast Moving Consumer Goods)
   * Modular retail distribution cartons that nest and interlock cleanly.
   */
  function getFmcgManifest() {
    const items = [];
    let id = 1;

    // Master Case A: 0.60 x 0.40 x 0.40 m, 18kg (EUR-pallet modular footprint) - 20 units
    for (let i = 0; i < 20; i++) {
      items.push(Types.createItem(`fmcg_${id++}`, 'Master Case A (60x40)', 0.60, 0.40, 0.40, 18, {
        color: '#0284c7', // Sky Blue
        category: 'carton'
      }));
    }

    // Master Case B: 0.40 x 0.30 x 0.30 m, 10kg - 24 units
    for (let i = 0; i < 24; i++) {
      items.push(Types.createItem(`fmcg_${id++}`, 'Master Case B (40x30)', 0.40, 0.30, 0.30, 10, {
        color: '#6366f1', // Indigo
        category: 'carton'
      }));
    }

    // Secondary Pack: 0.40 x 0.20 x 0.25 m, 5kg - 18 units
    for (let i = 0; i < 18; i++) {
      items.push(Types.createItem(`fmcg_${id++}`, 'Retail Pack C (40x20)', 0.40, 0.20, 0.25, 5, {
        color: '#14b8a6', // Teal
        category: 'carton'
      }));
    }

    return items;
  }

  /**
   * Scenario 3: Industrial Machinery & Hazardous Freight
   * Heavy wooden crates, steel chemical drums, and machinery testing Center of Gravity.
   */
  function getIndustrialManifest() {
    const items = [];
    let id = 1;

    // Heavy Generator Crates: 1.40 x 1.10 x 1.20 m, 950kg - 4 units
    for (let i = 0; i < 4; i++) {
      items.push(Types.createItem(`ind_${id++}`, 'Generator Crate', 1.40, 1.10, 1.20, 950, {
        color: '#d97706', // Ochre / Wood
        category: 'crate',
        allowedOrientations: 'this_side_up'
      }));
    }

    // Steel Chemical Drums: 0.60 x 0.90 x 0.60 m, 210kg - 12 units
    for (let i = 0; i < 12; i++) {
      items.push(Types.createItem(`ind_${id++}`, 'Steel Drum 200L', 0.60, 0.90, 0.60, 210, {
        color: '#64748b', // Steel Grey
        category: 'drum',
        allowedOrientations: 'this_side_up'
      }));
    }

    // Tooling & Spares Crates: 0.80 x 0.50 x 0.60 m, 120kg - 10 units
    for (let i = 0; i < 10; i++) {
      items.push(Types.createItem(`ind_${id++}`, 'Spares Box', 0.80, 0.50, 0.60, 120, {
        color: '#0f766e', // Dark cyan
        category: 'crate'
      }));
    }

    // Fragile Electronic Instrument Packs: 0.50 x 0.35 x 0.40 m, 15kg (Max top load 20kg) - 8 units
    for (let i = 0; i < 8; i++) {
      items.push(Types.createItem(`ind_${id++}`, 'Fragile Electronics', 0.50, 0.35, 0.40, 15, {
        color: '#ef4444', // Red
        category: 'carton',
        fragile: true,
        maxTopWeight: 20
      }));
    }

    return items;
  }

  /**
   * Scenario 4: Pallet Stacking Benchmark
   * Sized specifically for standard EUR-Pallet (1.2m x 0.8m x 1.8m).
   */
  function getPalletManifest() {
    const items = [];
    let id = 1;

    // Standard Carton 0.40 x 0.30 x 0.25 m - 16 units
    for (let i = 0; i < 16; i++) {
      items.push(Types.createItem(`pal_${id++}`, 'Export Carton', 0.40, 0.30, 0.25, 12, {
        color: '#38bdf8',
        category: 'carton'
      }));
    }

    // Half Carton 0.40 x 0.20 x 0.25 m - 12 units
    for (let i = 0; i < 12; i++) {
      items.push(Types.createItem(`pal_${id++}`, 'Half Carton', 0.40, 0.20, 0.25, 6, {
        color: '#f59e0b',
        category: 'carton'
      }));
    }

    return items;
  }

  const PRESETS = {
    ecommerce: {
      id: 'ecommerce',
      name: 'E-Commerce Mixed Parcels',
      description: 'Diverse mix of 60 parcels, testing 3D void-filling and spatial packing.',
      containerId: 'iso20',
      getItems: getEcommerceManifest
    },
    fmcg: {
      id: 'fmcg',
      name: 'FMCG Retail Cartons',
      description: 'Modular interlocking grocery cartons with high volume fill potential.',
      containerId: 'iso20',
      getItems: getFmcgManifest
    },
    industrial: {
      id: 'industrial',
      name: 'Industrial Machinery & Drums',
      description: 'Heavy machinery and chemical drums testing Center of Gravity & weight limits.',
      containerId: 'iso20',
      getItems: getIndustrialManifest
    },
    pallet: {
      id: 'pallet',
      name: 'EUR-Pallet Stacking',
      description: 'Standard wooden pallet loading pattern with European modular dimensions.',
      containerId: 'pallet',
      getItems: getPalletManifest
    }
  };

  exports.PRESETS = PRESETS;
  exports.getEcommerceManifest = getEcommerceManifest;
  exports.getFmcgManifest = getFmcgManifest;
  exports.getIndustrialManifest = getIndustrialManifest;
  exports.getPalletManifest = getPalletManifest;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
