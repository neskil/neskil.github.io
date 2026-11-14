// Rides, companions and style lenses; modules load on demand. Written by the project's release tooling; kept here as plain source.
export const RIDES = [
  { id: "firefly-lantern", name: "Firefly Lantern", media: ["air","interior","tiny","snow","underwater"], near: 0.7, load: () => import('./rides/firefly-lantern.js') },
  { id: "magic-carpet", name: "Magic Carpet", media: ["air","open","interior","tiny"], near: 0.8, load: () => import('./rides/magic-carpet.js') },
];
export const COMPANIONS = [
  { id: "the-drift", name: "The Drift", load: () => import('./companions/the-drift.js') },
  { id: "wandering-lantern", name: "The Wandering Lantern", load: () => import('./companions/wandering-lantern.js') },
];
export const STYLES = [
  { id: "pastel-dream", name: "Pastel Dream", avoid: [], load: () => import('./styles/pastel-dream.js') },
];
