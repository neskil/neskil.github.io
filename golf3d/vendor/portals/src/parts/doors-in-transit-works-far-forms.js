// doors-in-transit: THE FAR STORE'S CHEAP FORMS (the works builder's part). Three shapes, each drawn many times over
// in one call: a door of the near ranks (a thin box with two flat hanger straps), a door of the ranks behind them
// (one face), and a plain box (a rail, a gantry post). And the ground with the sheets that close the view.
// A corner of a door's form is given in the door's own measures and stretched by the material: of the box, x and z
// run from -0.5 to 0.5 (times the door's width, the plan's door depth) and y from 0 at the sill to 1 at the head;
// of a strap, x and z are metres from the door's middle and y runs from 0 at the door's head to 1 at the rail.
import { FAR } from './doors-in-transit-plan.js';

export const STRAP = 0.3;        // a far hanger strap: a flat bar this wide (the hall's straps are rods; these are seen from 100 m and more)
export const FLOOR_Y = -0.04;    // the far ground lies a hand's breadth under the hall's floor line, so that it never lies in the sill's own face
export const NEAR_TRIANGLES = 14, FACE_TRIANGLES = 2, BOX_TRIANGLES = 12, GROUND_TRIANGLES = 10;

function quads(THREE, list) {
  const P = [], Nn = [], K = [], I = [];
  for (const [a, b, c, d, n, kind] of list) {
    const base = P.length / 3;
    P.push(...a, ...b, ...c, ...d);
    for (let i = 0; i < 4; i++) { Nn.push(...n); K.push(kind); }
    I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(K, 1));
  g.setIndex(I);
  return g;
}
const FRONT = [[-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 1, 0.5], [-0.5, 1, 0.5], [0, 0, 1], 0];

// a near door: the face toward the hall, the two sides, the head and the sill (its back, turned from the hall for
// good, is left out), and two straps in the door's middle plane, `hangX` either side of its middle
export function nearDoorForm(THREE, hangX) {
  const list = [FRONT,
    [[0.5, 0, 0.5], [0.5, 0, -0.5], [0.5, 1, -0.5], [0.5, 1, 0.5], [1, 0, 0], 0],
    [[-0.5, 0, -0.5], [-0.5, 0, 0.5], [-0.5, 1, 0.5], [-0.5, 1, -0.5], [-1, 0, 0], 0],
    [[-0.5, 1, 0.5], [0.5, 1, 0.5], [0.5, 1, -0.5], [-0.5, 1, -0.5], [0, 1, 0], 0],
    [[-0.5, 0, -0.5], [0.5, 0, -0.5], [0.5, 0, 0.5], [-0.5, 0, 0.5], [0, -1, 0], 0]];
  for (const x of [-hangX, hangX]) list.push([[x - STRAP / 2, 0, 0], [x + STRAP / 2, 0, 0], [x + STRAP / 2, 1, 0], [x - STRAP / 2, 1, 0], [0, 0, 1], 1]);
  return quads(THREE, list);
}
export function faceDoorForm(THREE) { return quads(THREE, [FRONT]); }

// the doors of one form: D = { n, place, size, paint } (flat lists: four, four and three numbers to a door)
export function doorMesh(THREE, form, material, D) {
  form.setAttribute('aPlace', new THREE.InstancedBufferAttribute(new Float32Array(D.place), 4));
  form.setAttribute('aSize', new THREE.InstancedBufferAttribute(new Float32Array(D.size), 4));
  form.setAttribute('aPaint', new THREE.InstancedBufferAttribute(new Float32Array(D.paint), 3));
  form.instanceCount = D.n;
  return still(THREE, new THREE.Mesh(form, material));
}
// plain boxes: B = { n, middle, size } (flat lists, three numbers to a box each)
export function boxMesh(THREE, material, B) {
  const unit = new THREE.BoxGeometry(1, 1, 1), g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', unit.attributes.position); g.setAttribute('normal', unit.attributes.normal); g.setIndex(unit.index);
  g.setAttribute('aBoxC', new THREE.InstancedBufferAttribute(new Float32Array(B.middle), 3));
  g.setAttribute('aBoxD', new THREE.InstancedBufferAttribute(new Float32Array(B.size), 3));
  g.instanceCount = B.n;
  return still(THREE, new THREE.Mesh(g, material));
}
// the ground from the wall's line to the far end, and the four sheets at the far end, the far sides and the top
export function groundMesh(THREE, material) {
  const X = FAR.xGone, z0 = FAR.wallZ, z1 = FAR.zGone, y0 = FLOOR_Y, y1 = FAR.yGone;
  const P = [-X, y0, z0, X, y0, z0, X, y0, z1, -X, y0, z1,      // the ground
    -X, y0, z1, X, y0, z1, X, y1, z1, -X, y1, z1,                // the far end
    X, y0, z0, X, y0, z1, X, y1, z1, X, y1, z0,                  // the +x side
    -X, y0, z1, -X, y0, z0, -X, y1, z0, -X, y1, z1,              // the -x side
    -X, y1, z1, X, y1, z1, X, y1, z0, -X, y1, z0];               // the top
  const I = []; for (let q = 0; q < 5; q++) I.push(q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  g.setAttribute('aSheet', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 1));      // the ground's four corners, then the four sheets'
  return still(THREE, new THREE.Mesh(g, material));
}
// (a form's corners are moved by its material, so the engine is told the whole store's bounds and never culls by them)
function still(THREE, mesh) {
  mesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, FAR.yGone / 2, (FAR.wallZ + FAR.zGone) / 2), Math.hypot(FAR.xGone, FAR.yGone / 2, (FAR.wallZ - FAR.zGone) / 2));
  mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
  return mesh;
}
