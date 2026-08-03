// levelSchema.js — shared schema for the scalar/object-shaped fields of a
// `registerLevel({...})` level config (level1.js..level9.js, levelTest.js).
//
// Read by BOTH:
//   - level-editor.html — drives the Metadata / Palette / Out of Bounds /
//     Gravity Well sidebar form panels, the loader's per-field defaults, and
//     the export-block generator.
//   - tests.html — drives the scalar-field checks in the "Level Config
//     Validation" test category.
// so a new scalar field only needs to be added HERE instead of being kept in
// sync by hand across the editor's parser, its UI, its exporter, AND the test
// suite's hand-written assertions. See the "Level Editor / renderer parity
// system" TODO entry in README.md for the problem this solves.
//
// Scope: mission-parameter scalars, `palette`, `outOfBounds`, and
// `gravityWell`. Geometry arrays (`terrainPolygons`/`waterBodies`/`hazards`)
// are NOT covered — the editor's vertex-drag tooling for those is bespoke per
// shape kind (zone/laser/crusher/etc.), not purely data-driven, and stays
// hand-coded; see README for why that's deferred.
//
// Field descriptor shape:
//   key       — property name on the config object (or sub-object)
//   type      — 'string' | 'number' | 'integer' | 'boolean' | 'stringList' |
//               'color' | 'rgba' | 'rgbaPrefix'  ('color'/'rgba'/'rgbaPrefix'
//               are all string-typed at the JS level; they only differ in
//               which editor widget/validation makes sense)
//   default   — value substituted when the field is absent from a loaded config
//   widget    — editor UI hint: 'text' | 'number' | 'checkbox' | 'color' | 'select'
//   label     — short sidebar label
//   required  — tests.html asserts the field is present (and non-empty for
//               strings/lists, positive where `positive` is also set)
//   positive  — numeric fields only: must be > 0 when present
//   min       — integer fields only: minimum allowed value
//   options   — 'select' widgets / enum-checked strings: allowed values
//   enumValues— for 'stringList': every item must be one of these
//   nullable  — field may explicitly be absent/null with no computed
//               fallback (e.g. Y-position overrides that default to "read
//               off the terrain surface" rather than a fixed number)
//   validate  — optional custom `(value) => boolean` check (e.g. rockGlow's
//               partial-rgba-string convention)

const VALID_CARGO_TYPES   = ['normal', 'red', 'blue', 'green', 'tethered', 'heavy'];
const VALID_WEATHER_TYPES = ['', 'rain', 'ash', 'snow', 'heatwave', 'bubbles'];
const VALID_OOB_TYPES     = ['water', 'goo', 'sand', 'acid', 'void'];

const LEVEL_SCHEMA = {
  // Top-level scalar/list fields on the registerLevel({...}) config object.
  fields: [
    { key:'name',            type:'string',    default:'',  widget:'text',     label:'Level ID', required:true, desc:'The unique identifier and file name for the level.', recommended:'levelX' },
    { key:'missionTitle',    type:'string',    default:'',  widget:'text',     label:'Display Title', desc:'The human-readable title displayed in menus.', recommended:'Keep it short and punchy' },
    { key:'description',     type:'string',    default:'',  widget:'text',     label:'Briefing Text', desc:'The mission briefing shown to the player before starting.', recommended:'1-2 short sentences' },
    { key:'hint',            type:'string',    default:'',  widget:'text',     label:'Fail Tip / Hint', desc:'Optional tip displayed if the player fails multiple times.', recommended:'Keep it helpful but not obvious' },
    { key:'gravity',         type:'number',    default:0.11,widget:'number',   label:'Gravity Pull', step:0.01, required:true, positive:true, desc:'Downward acceleration applied to the lander each frame.', recommended:'0.10 - 0.15', sliderMin:0.02, sliderMax:0.3, sliderStep:0.01 },
    { key:'airResistance',   type:'number',    default:0.01,widget:'number',   label:'Air Resistance', step:0.001, desc:'Air drag force per frame (0.01 = 1% drag). Lower values reduce air resistance.', recommended:'0.005 - 0.015', sliderMin:0, sliderMax:0.03, sliderStep:0.001 },
    { key:'wind',            type:'number',    default:0,   widget:'number',   label:'Wind Speed', step:0.01, desc:'Horizontal force applied to the lander and particles.', recommended:'-0.05 to 0.05', sliderMin:-0.1, sliderMax:0.1, sliderStep:0.01 },
    { key:'windVarianceEnabled', type:'boolean', default:true, widget:'checkbox', label:'Wind Variance', desc:'Lets the wind wander up/down over time via layered sine texture (physics/atmosphere.js). Turn off for a perfectly steady wind.', recommended:'On, unless the level wants dead-still wind' },
    { key:'windVarianceAmount',  type:'number',  default:0.25, widget:'number', label:'Variance Amount', step:0.05, desc:'Peak swing as a fraction of the base Wind Speed (0.25 = wanders roughly ±25%).', recommended:'0.10 - 0.30', sliderMin:0, sliderMax:0.6, sliderStep:0.05 },
    { key:'windVarianceSpeed',   type:'number',  default:1.0,  widget:'number', label:'Variance Speed', step:0.1, desc:'How rapidly the wind wanders between highs and lows. 1 = normal, 2 = twice as fast, 0.5 = half as fast.', recommended:'0.5 - 2.0', sliderMin:0.2, sliderMax:3, sliderStep:0.1 },
    { key:'weather',         type:'string',    default:'',  widget:'select',   label:'Weather Effect', options:VALID_WEATHER_TYPES, desc:'Visual weather particle effects.', recommended:'Match with wind for best effect' },
    { key:'deposit',         type:'number',    default:1000,widget:'number',   label:'Deposit ($)', desc:'Mission deposit taken from bank and carried into level.', recommended:'200 - 800', sliderMin:100, sliderMax:1500, sliderStep:50 },
    { key:'fee',             type:'number',    default:50,  widget:'number',   label:'Docking Fee ($)', desc:'Non-refundable docking fee deducted from the bank at mission start.', recommended:'50 - 500', sliderMin:0, sliderMax:1000, sliderStep:50 },
    { key:'timeLimit',       type:'number',    default:300, widget:'number',   label:'Time Limit (s)', required:true, positive:true, desc:'Maximum time in seconds before the mission fails.', recommended:'120 - 300', sliderMin:30, sliderMax:600, sliderStep:10 },
    { key:'maxFuel',          type:'number',    default:null, nullable:true, widget:'number', label:'Max Fuel Capacity', desc:'Override base lander fuel capacity for this level.', recommended:'120 - 300', sliderMin:50, sliderMax:500, sliderStep:10 },
    { key:'padScale',        type:'number',    default:1,   widget:'number',   label:'Pad Width Mult', step:0.1, positive:true, desc:'Multiplier for the physical width of landing pads.', recommended:'1.0 (0.8 for hard, 1.5 for easy)', sliderMin:0.5, sliderMax:2, sliderStep:0.1 },
    { key:'targetCargo',     type:'integer',   default:3,   widget:'number',   label:'Target Deliveries', required:true, min:1, desc:'Number of cargo pieces that must be successfully delivered.', recommended:'1 - 5', sliderMin:1, sliderMax:12, sliderStep:1 },
    { key:'allowedTypes',    type:'stringList',default:['normal','red','blue','green'], widget:'text', label:'Allowed Cargo Types', required:true, enumValues:VALID_CARGO_TYPES, desc:'Comma-separated list of cargo types available in this level.', recommended:'normal,red,blue' },
    { key:'heavyCargo',      type:'boolean',   default:false, widget:'checkbox', label:'Heavy Cargo Mode', desc:'If true, all cargo weighs significantly more.', recommended:'Use for late-game challenge levels' },
    { key:'backgroundType',  type:'string',    default:'parallax', widget:'select', label:'Background Style', options:['parallax', 'cave', 'city'], desc:'The visual style of the far background.', recommended:'parallax for outdoors, cave for underground, city for urban areas' },
    { key:'terrainDecor',    type:'string',    default:'auto', widget:'select', label:'Terrain Decoration', options:['auto', 'rock', 'grass', 'facade', 'none'], desc:"Surface detailing drawn on the terrain polygons themselves. 'rock' is the jagged edge noise most levels use, 'grass' the tufted L1 look, 'facade' turns the silhouette into lit skyscrapers (see the Facade section), 'none' leaves the bare outline. 'auto' keeps the historical behaviour: grass on L1, rock everywhere else.", recommended:"auto, or facade with backgroundType:'city'" },
    { key:'shadowAngle',     type:'number',    default:null, nullable:true, widget:'number', label:'Sun/Shadow Angle', desc:'The angle of the sun for terrain shadows.', recommended:'-1.0 to 1.0 (0 is straight down)' },
    { key:'shadowLength',    type:'number',    default:null, nullable:true, widget:'number', label:'Shadow Length', desc:'The length of terrain shadows cast by the sun.', recommended:'20 - 150' },
    { key:'heatHaze',        type:'boolean',   default:false, widget:'checkbox', label:'Heat Haze Effect', desc:'Applies a wavy distortion shader to the bottom of the screen.', recommended:'Use with ash weather or lava levels' },
    { key:'night',           type:'boolean',   default:false, widget:'checkbox', label:'Night Ops (Dark)', desc:'Darkens the level and enables ship headlights + sonar ping.', recommended:'False' },
    { key:'nightDarkness',   type:'number',    default:0.90, nullable:true, widget:'number', label:'Night Darkness Alpha', step:0.05, desc:'Base opacity (0.00 - 1.00) of the night overlay. Lower values (e.g. 0.35) keep early levels bright while retaining radar sonar pings.', recommended:'0.35 - 0.45 for early levels, 0.90 for total darkness', sliderMin:0, sliderMax:1, sliderStep:0.05 },
    // Altitude fog band (render/fog.js + physics/atmosphere.js fogDensityAt).
    // A soft ceiling made of weather: visibility collapses as the lander climbs
    // into it. Inactive unless BOTH Y bounds are set. Distinct from palette.fog.
    { key:'fogBandBottomY',  type:'number',    default:null, nullable:true, widget:'number', label:'Fog Band Bottom Y', step:10, desc:'World Y where the altitude fog starts fading in. Larger Y = lower down. Leave empty to disable the band.', recommended:'Just above the highest terrain the player must clear', sliderMin:-2000, sliderMax:2000, sliderStep:10 },
    { key:'fogBandTopY',     type:'number',    default:null, nullable:true, widget:'number', label:'Fog Band Top Y', step:10, desc:'World Y at (and above) which the fog is at full density. Must be smaller than Fog Band Bottom Y.', recommended:'250 - 350 above the bottom edge', sliderMin:-2000, sliderMax:2000, sliderStep:10 },
    { key:'fogBandColor',    type:'string',    default:'198,150,86', widget:'text', label:'Fog Band Color', desc:'Bare "r,g,b" string (no rgba() wrapper) — the renderer appends its own alpha.', recommended:'198,150,86 (blown sand)' },
    { key:'fogBandOpacity',  type:'number',    default:0.94, widget:'number', label:'Fog Band Opacity', step:0.02, desc:'Alpha at full density. Keep below 1 so silhouettes and running lights still bleed through.', recommended:'0.85 - 0.95', sliderMin:0.1, sliderMax:1, sliderStep:0.02 },
    { key:'fogBandDamage',   type:'number',    default:0, widget:'number', label:'Fog Band Damage/s', step:0.5, desc:'Hull points per second at full fog density (grit abrasion). 0 = fog is purely a visibility hazard.', recommended:'0 for visual-only, 3 - 6 to make altitude genuinely costly', sliderMin:0, sliderMax:20, sliderStep:0.5 },
    { key:'terrainType',     type:'string',    default:'', widget:'select', label:'Special Level Mode', options:['', 'worm-lair', 'flat'], desc:"Special terrain behavior flag. 'worm-lair' enables the giant Sandworm AI (also requires a sandworm-type hazard polygon marking its zone).", recommended:"worm-lair for Sandworm levels, otherwise leave blank" },
    { key:'ambientTrafficRate', type:'number', default:1, widget:'number', label:'Space Traffic Rate', step:0.5, desc:'Multiplier for background ambient traffic (space trucks) density and spawn frequency. 0 disables ambient traffic entirely.', recommended:'0 = none, 1 = normal, 4 = chaotic', sliderMin:0, sliderMax:5, sliderStep:0.5 },
    { key:'ambientTrafficSpeed',type:'number', default:1, widget:'number', label:'Space Traffic Speed',step:0.1, desc:'Speed multiplier for ambient traffic.', recommended:'1.0 = normal, 2.0 = fast', sliderMin:0.1, sliderMax:5, sliderStep:0.1 },
    { key:'ambientTrafficMinY', type:'number', default:null, nullable:true, widget:'number', label:'Traffic Min Y', step:100, desc:'Highest Y coordinate (top) for ambient traffic to spawn.', recommended:'Leave empty for auto', sliderMin:-20000, sliderMax:5000, sliderStep:100 },
    { key:'ambientTrafficMaxY', type:'number', default:null, nullable:true, widget:'number', label:'Traffic Max Y', step:100, desc:'Lowest Y coordinate (bottom) for ambient traffic to spawn.', recommended:'Leave empty for auto', sliderMin:-20000, sliderMax:5000, sliderStep:100 },
    { key:'startX',          type:'number',    default:80,  widget:'number',   label:'X', desc:'X coordinate for the starting HQ.', recommended:'Place near a flat edge' },
    { key:'startY',          type:'number',    default:null, nullable:true, widget:'number', label:'Y', desc:'Override Y coordinate for the HQ. If null, snaps to terrain.', recommended:'Leave empty' },
    { key:'startDepotWidth', type:'number',    default:null, nullable:true, widget:'number', label:'Width', desc:'Override physical width of the HQ pad.', recommended:'Leave empty' },
    { key:'collectionX',     type:'number',    default:null, nullable:true, widget:'number', label:'X', desc:'X coordinate for the Cargo Depot.', recommended:'Place near a flat edge' },
    { key:'collectionY',     type:'number',    default:null, nullable:true, widget:'number', label:'Y', desc:'Override Y coordinate for the Cargo Depot. If null, snaps to terrain.', recommended:'Leave empty' },
    { key:'collectionWidth', type:'number',    default:null, nullable:true, widget:'number', label:'Width', desc:'Override physical width of the Cargo pad.', recommended:'Leave empty' },
  ],

  // palette: {...} — required object on every level; the same 7 keys are
  // used everywhere (confirmed by grepping all 9 levels + levelTest), each
  // required and non-empty.
  palette: {
    fields: [
      { key:'skyTop',      type:'color',      default:'#020617', widget:'color', label:'skyTop', required:true },
      { key:'skyMid',      type:'color',      default:'#040b16', widget:'color', label:'skyMid', required:true },
      { key:'skyBot',      type:'color',      default:'#051114', widget:'color', label:'skyBot', required:true },
      { key:'terrainFill', type:'color',      default:'#06101c', widget:'color', label:'terrainFill', required:true },
      { key:'rockEdge',    type:'color',      default:'#38bdf8', widget:'color', label:'rockEdge', required:true },
      // Intentionally a PARTIAL rgba string (no closing paren/alpha) — render
      // call sites append the alpha themselves, e.g. `${pal.rockGlow}0.1)`.
      { key:'rockGlow',    type:'rgbaPrefix', default:'rgba(56,189,248,', widget:'text', label:'rockGlow', required:true,
        validate: v => v.startsWith('rgba(') && v.endsWith(',') },
      { key:'fog',         type:'rgba',       default:'rgba(56,189,248,0.1)', widget:'text', label:'fog', required:true },
    ]
  },

  // outOfBounds: {...} — optional object on most levels. L9 uses the bare
  // boolean `true` instead ("thick lateral fog on the sides", no zone
  // mechanics) — callers must special-case that shorthand before reading
  // these sub-fields; see levelSchemaIsOOBObject() below.
  outOfBounds: {
    fields: [
      { key:'type',         type:'string', default:'water', widget:'select', label:'Type', options:VALID_OOB_TYPES, desc:'Visual material type. Determines particle effects and rendering style (e.g., bubbles for water/goo, dust for sand, empty space for void). Physics are controlled separately by Drag and Buoyancy below.', recommended:'water, goo, void' },
      { key:'color',        type:'color',  default:'',    widget:'color',  label:'Color', desc:'Base color of the fluid or void.', recommended:'Match the palette theme' },
      { key:'mistColor',    type:'color',  default:'',    widget:'color',  label:'Mist Color', desc:'Color of the gradient mist sitting above the surface.', recommended:'Slightly lighter than base color' },
      { key:'surfaceY',     type:'number', default:600,   widget:'number', label:'Surface Y', desc:'The Y coordinate where the out-of-bounds area begins (grows downwards).', recommended:'Usually below the lowest terrain', sliderMin:0, sliderMax:2500, sliderStep:10 },
      { key:'drag',         type:'number', default:0.02,  widget:'number', label:'Drag', step:0.01, desc:'Friction/resistance applied to the ship when submerged. High drag (0.08+) slows the ship heavily, making it sluggish. Low drag (0.01) allows smooth gliding.', recommended:'0.02 - 0.05', sliderMin:0, sliderMax:0.2, sliderStep:0.01 },
      { key:'buoyancy',     type:'number', default:0.05,  widget:'number', label:'Buoyancy', step:0.01, desc:'Upward force pushing the ship when submerged. High buoyancy (0.06+) floats the ship up rapidly. Low buoyancy (0.00-0.02) lets the ship sink easily.', recommended:'0.04 - 0.08', sliderMin:0, sliderMax:0.2, sliderStep:0.01 },
    ]
  },

  // worldBounds: {...} — optional object to constrain the player to the playable
  // area, one threshold + action per edge. `bottomY` absorbed the old
  // `outOfBounds.monsterDepth` field (bottomAction:'monster' reproduces the
  // classic sink-too-deep worm strike) — outOfBounds is now purely the fluid
  // zone (visuals + drag/buoyancy).
  worldBounds: {
    fields: [
      { key:'ceilingY',      type:'number', default:null,       nullable:true,  widget:'number', label:'Ceiling Y', desc:'Absolute Y coordinate of the upper boundary. E.g. -1000.', recommended:'-1500 to -500', sliderMin:-3000, sliderMax:0, sliderStep:10 },
      { key:'ceilingAction', type:'string', default:'pushback', widget:'select', label:'Ceiling Action', options:['pushback', 'destroy', 'lose_cargo', 'monster', 'police'], desc:'What happens when the lander goes too high.' },
      { key:'leftMargin',    type:'number', default:null,       nullable:true,  widget:'number', label:'Left Margin', desc:'Distance past x=0 before the left boundary triggers.', recommended:'200 - 800', sliderMin:0, sliderMax:2000, sliderStep:10 },
      { key:'rightMargin',   type:'number', default:null,       nullable:true,  widget:'number', label:'Right Margin', desc:'Distance past the level width before the right boundary triggers.', recommended:'200 - 800', sliderMin:0, sliderMax:2000, sliderStep:10 },
      { key:'lateralAction', type:'string', default:'pushback', widget:'select', label:'Lateral Action', options:['pushback', 'destroy', 'lose_cargo', 'monster', 'police'], desc:'What happens when the lander goes too far left or right (applies to both sides).' },
      { key:'bottomY',       type:'number', default:null,       nullable:true,  widget:'number', label:'Bottom Y', desc:'Absolute Y coordinate of the lower boundary. Replaces the old outOfBounds.monsterDepth.', recommended:'outOfBounds surfaceY + 300', sliderMin:0, sliderMax:3000, sliderStep:10 },
      { key:'bottomAction',  type:'string', default:'monster',  widget:'select', label:'Bottom Action', options:['pushback', 'destroy', 'lose_cargo', 'monster', 'police'], desc:'What happens when the lander sinks too deep.' },
    ]
  },

  // radarPingZone: {...} — optional, purely visual (drawRadarPingZone() in
  // render/ui.js draws an animated sonar ring at cx,cy). `color` is a bare
  // "r,g,b" string, not a hex/rgba() color — the renderer builds its own
  // rgba(color, alpha) — so it stays a text field like rockGlow/fog.
  radarPingZone: {
    fields: [
      { key:'cx',     type:'number', default:500,  widget:'number', label:'X', desc:'Center X coordinate of the ping zone.', recommended:'Match a danger-zone hazard, e.g. a sandworm polygon' },
      { key:'cy',     type:'number', default:500,  widget:'number', label:'Y', desc:'Center Y coordinate of the ping zone.', recommended:'Match a danger-zone hazard, e.g. a sandworm polygon' },
      { key:'r',      type:'number', default:300,  widget:'number', label:'Radius', desc:'Maximum radius the sonar ring expands to before fading.', recommended:'200 - 400', sliderMin:20, sliderMax:800, sliderStep:10 },
      { key:'color',  type:'string', default:'210,100,15', widget:'text', label:'Color', desc:'Bare "r,g,b" string (no rgba() wrapper) — the renderer appends its own alpha.', recommended:'200,100,20 (amber warning tone)' },
      { key:'period', type:'number', default:3800, widget:'number', label:'Period (ms)', desc:'Milliseconds per ping cycle — lower is faster/more urgent.', recommended:'3000 - 4000', sliderMin:500, sliderMax:8000, sliderStep:100 },
    ]
  },

  // facade: {...} — optional object tuning `terrainDecor: 'facade'`, which
  // decorates the terrain polygons themselves into lit skyscrapers rather than
  // leaving them flat silhouettes (drawTerrainFacades() in render/terrain.js).
  // Purely cosmetic — no collision or gameplay effect. Ignored unless
  // terrainDecor is 'facade', and every field has a working default, so
  // `terrainDecor: 'facade'` on its own is a complete configuration.
  //
  // The renderer derives what counts as a "building" from the geometry: for
  // each column it takes that polygon's own top surface and stops at the
  // polygon's lowest floor edge, so towers get windows while the street and any
  // basin floors at ground level are left bare. Nothing to author per-polygon.
  facade: {
    fields: [
      { key:'cellW',      type:'number',  default:34,        widget:'number', label:'Column Pitch', positive:true, desc:'Horizontal spacing of the window lattice, in world px.', recommended:'26 - 44', sliderMin:12, sliderMax:80, sliderStep:2 },
      { key:'cellH',      type:'number',  default:44,        widget:'number', label:'Row Pitch', positive:true, desc:'Vertical spacing of the window lattice, in world px. Larger values read as taller floors.', recommended:'32 - 56', sliderMin:12, sliderMax:100, sliderStep:2 },
      { key:'windowW',    type:'number',  default:14,        widget:'number', label:'Window Width', positive:true, desc:'Width of an individual window pane. Must be smaller than the column pitch.', recommended:'~40% of Column Pitch', sliderMin:2, sliderMax:40, sliderStep:1 },
      { key:'windowH',    type:'number',  default:20,        widget:'number', label:'Window Height', positive:true, desc:'Height of an individual window pane. Must be smaller than the row pitch.', recommended:'~45% of Row Pitch', sliderMin:2, sliderMax:60, sliderStep:1 },
      { key:'litChance',  type:'number',  default:0.45,      widget:'number', label:'Lit Fraction', step:0.05, desc:'Share of windows that are lit. 0 leaves a dark grid of empty panes, 1 lights every one.', recommended:'0.3 - 0.6', sliderMin:0, sliderMax:1, sliderStep:0.05 },
      { key:'warmRatio',  type:'number',  default:0.5,       widget:'number', label:'Warm/Cool Mix', step:0.05, desc:'Share of the lit windows using the warm colour rather than the cool one.', recommended:'0.4 - 0.7', sliderMin:0, sliderMax:1, sliderStep:0.05 },
      { key:'warmColor',  type:'color',   default:'#fdba74', widget:'color',  label:'Warm Light', desc:'Colour of warm-lit windows.', recommended:'Amber/sodium tones' },
      { key:'coolColor',  type:'color',   default:'#7dd3fc', widget:'color',  label:'Cool Light', desc:'Colour of cool-lit windows.', recommended:'Match the palette rockEdge' },
      { key:'flicker',    type:'number',  default:0.06,      widget:'number', label:'Flicker Fraction', step:0.02, desc:'Share of lit windows that slowly pulse. Keep low — it is per-window animation.', recommended:'0 - 0.1', sliderMin:0, sliderMax:0.4, sliderStep:0.02 },
      { key:'depth',      type:'number',  default:280,       widget:'number', label:'Shade Depth', positive:true, desc:'How far below a roof the interior shading gradient fades out, in world px. Gives the silhouette some solidity.', recommended:'180 - 400', sliderMin:40, sliderMax:900, sliderStep:20 },
      { key:'groundReach', type:'number', default:500,       widget:'number', label:'Ground Search', positive:true, desc:'How far sideways to look for the street a tower stands on, in world px. Windows stop at the lowest floor found within this distance, so each tower ends at its own ground line instead of one flat cutoff across the map. Raise it if towers sit far from any lower ground.', recommended:'400 - 700', sliderMin:100, sliderMax:2000, sliderStep:50 },
      { key:'parapet',    type:'boolean', default:true,      widget:'checkbox', label:'Roof Parapets', desc:'Draws a cornice band just under each roof edge.' },
      { key:'mullions',   type:'boolean', default:true,      widget:'checkbox', label:'Mullions', desc:'Draws faint vertical pilaster lines between window columns.' },
    ]
  },

  // windGust: {...} — optional object layering a calm/warning/gust cycle on
  // top of the base `wind` value (physics/atmosphere.js). Read by ui.js's
  // wind-indicator element for the pre-gust flash + soft audio cue. Purely
  // additive — a level with `wind` but no `windGust` just gets the old
  // constant-with-gentle-variance behavior.
  windGust: {
    fields: [
      { key:'calm',     type:'number', default:6, widget:'number', label:'Calm (s)', step:0.5, positive:true, desc:'Seconds of light lull between gusts.', recommended:'4 - 10', sliderMin:1, sliderMax:20, sliderStep:0.5 },
      { key:'warn',     type:'number', default:2, widget:'number', label:'Warning (s)', step:0.5, positive:true, desc:'Seconds the meter flashes amber before the gust hits — telegraphs the surge.', recommended:'1.5 - 3', sliderMin:0.5, sliderMax:6, sliderStep:0.5 },
      { key:'gust',     type:'number', default:6, widget:'number', label:'Gust (s)', step:0.5, positive:true, desc:'Seconds the wind stays at full gust strength before easing back to calm.', recommended:'4 - 8', sliderMin:1, sliderMax:20, sliderStep:0.5 },
      { key:'gustMult', type:'number', default:3, widget:'number', label:'Gust Multiplier', step:0.1, positive:true, desc:'Peak wind during a gust, as a multiple of the base Wind Speed.', recommended:'2.5 - 4.5', sliderMin:1, sliderMax:8, sliderStep:0.1 },
    ]
  },

  // quests: [...] — a list built from questPrimary()/questNoCrash()/etc.
  // helper calls (levels.js), not a flat scalar/object shape, so it isn't
  // form-generated from this schema like the sections above (the editor's
  // existing fixed Quests panel — primary/no-crash/no-cargo/quick/worm —
  // already covers the full set of kinds in use). Listed here so tests.html
  // has one shared place to check known quest `id`/`type` pairs instead of a
  // second hand-maintained list.
  questKinds: {
    primary:       { type:'primary' },
    no_crash:      { type:'bonus' },
    no_cargo_lost: { type:'bonus' },
    quick:         { type:'bonus' },
    survive_worm:  { type:'bonus' },
  },

  VALID_CARGO_TYPES,
  VALID_WEATHER_TYPES,
  VALID_OOB_TYPES,
};

// Coerces a raw value (often a string from an <input>) to a field's declared
// type. Shared by the editor's onchange handlers so parsing rules live in one
// place instead of being re-implemented per input.
function levelSchemaCoerce(field, raw) {
  if (raw === '' || raw == null) return field.nullable ? null : field.default;
  switch (field.type) {
    case 'number':  { const n = +raw; return isFinite(n) ? n : field.default; }
    case 'integer': { const n = parseInt(raw, 10); return isFinite(n) ? n : field.default; }
    case 'boolean': return !!raw;
    case 'stringList': return typeof raw === 'string' ? raw.split(',').map(s => s.trim()).filter(Boolean) : raw;
    default: return raw;
  }
}

// Reads a field's value off a config object (or sub-object), applying the
// schema default when absent.
function levelSchemaGet(obj, field) {
  const v = obj ? obj[field.key] : undefined;
  return (v === undefined) ? field.default : v;
}

// True when a level's `outOfBounds` value is the full zone-config object form
// rather than L9's bare-boolean shorthand (or absent entirely).
function levelSchemaIsOOBObject(oob) {
  return !!oob && typeof oob === 'object';
}
