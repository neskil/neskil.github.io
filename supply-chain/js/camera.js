// Camera: world <-> screen transform with pan and zoom, clamped to the
// world bounds. Event wiring lives in input.js.
//
// The map is drawn in an isometric ("2.5D") projection: the game logic
// still works in flat world (x, y) coordinates — roads, distances and
// pathfinding are unchanged — but this camera projects that ground plane
// onto the screen at an iso angle. Because every hit-test in input.js
// goes through toScreen/toWorld, swapping the projection here is all it
// takes to make selection, road-dragging and hover follow the iso view.
window.SC = window.SC || {};

SC.camera = (function() {
    // 2:1 dimetric projection. A world square becomes a diamond twice as
    // wide as it is tall. kx/ky map world axes onto the iso "ground plane":
    //   screen-ish = ((x - y)*kx, (x + y)*ky)
    const ISO = { kx: 0.5, ky: 0.25 };

    // cam.x/cam.y are the iso-plane point that sits at the top-left of the
    // viewport; cam.zoom scales iso-plane units to screen pixels.
    const cam = { x: 0, y: 0, zoom: 1, minZoom: 0.3, maxZoom: 3 };
    let viewW = 0, viewH = 0;

    // world (x, y) -> iso-plane (flat, before pan/zoom)
    function project(wx, wy) {
        return { x: (wx - wy) * ISO.kx, y: (wx + wy) * ISO.ky };
    }
    // iso-plane -> world (inverse of project)
    function unproject(px, py) {
        const a = px / ISO.kx;   // wx - wy
        const b = py / ISO.ky;   // wx + wy
        return { x: (a + b) / 2, y: (b - a) / 2 };
    }

    // Bounding box of the whole world once projected onto the iso plane.
    function isoBounds() {
        const W = SC.CONFIG.WORLD_W, H = SC.CONFIG.WORLD_H;
        const pts = [project(0, 0), project(W, 0), project(0, H), project(W, H)];
        const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
        return {
            minX: Math.min(...xs), maxX: Math.max(...xs),
            minY: Math.min(...ys), maxY: Math.max(...ys)
        };
    }

    function setViewport(w, h) {
        viewW = w;
        viewH = h;
        const b = isoBounds();
        const fit = Math.min(w / (b.maxX - b.minX), h / (b.maxY - b.minY));
        cam.minZoom = fit * 0.85; // never zoom out far beyond a full-world view
        clamp();
    }

    function fitWorld() {
        const b = isoBounds();
        cam.zoom = Math.min(viewW / (b.maxX - b.minX), viewH / (b.maxY - b.minY));
        cam.x = (b.minX + b.maxX) / 2 - viewW / (2 * cam.zoom);
        cam.y = (b.minY + b.maxY) / 2 - viewH / (2 * cam.zoom);
        clamp();
    }

    function focus(wx, wy, zoom) {
        if (zoom) cam.zoom = Math.max(cam.minZoom, Math.min(cam.maxZoom, zoom));
        const p = project(wx, wy);
        cam.x = p.x - viewW / (2 * cam.zoom);
        cam.y = p.y - viewH / (2 * cam.zoom);
        clamp();
    }

    function clamp() {
        cam.zoom = Math.max(cam.minZoom, Math.min(cam.maxZoom, cam.zoom));
        const b = isoBounds();
        const isoW = b.maxX - b.minX, isoH = b.maxY - b.minY;
        const wV = viewW / cam.zoom, hV = viewH / cam.zoom;
        const pad = 160; // overscroll so edge nodes / tall buildings aren't stuck at the border
        if (wV >= isoW + 2 * pad) {
            cam.x = (b.minX + b.maxX) / 2 - wV / 2;
        } else {
            cam.x = Math.max(b.minX - pad, Math.min(b.maxX + pad - wV, cam.x));
        }
        if (hV >= isoH + 2 * pad) {
            cam.y = (b.minY + b.maxY) / 2 - hV / 2;
        } else {
            cam.y = Math.max(b.minY - pad, Math.min(b.maxY + pad - hV, cam.y));
        }
    }

    function pan(dxScreen, dyScreen) {
        cam.x -= dxScreen / cam.zoom;
        cam.y -= dyScreen / cam.zoom;
        clamp();
    }

    // Zoom keeping the iso point under (sx, sy) fixed on screen
    function zoomAt(sx, sy, factor) {
        const bx = cam.x + sx / cam.zoom, by = cam.y + sy / cam.zoom;
        cam.zoom = Math.max(cam.minZoom, Math.min(cam.maxZoom, cam.zoom * factor));
        cam.x = bx - sx / cam.zoom;
        cam.y = by - sy / cam.zoom;
        clamp();
    }

    function toWorld(sx, sy) {
        return unproject(cam.x + sx / cam.zoom, cam.y + sy / cam.zoom);
    }

    function toScreen(wx, wy) {
        const p = project(wx, wy);
        return { x: (p.x - cam.x) * cam.zoom, y: (p.y - cam.y) * cam.zoom };
    }

    return {
        cam, ISO, project, unproject,
        setViewport, fitWorld, focus, pan, zoomAt, toWorld, toScreen
    };
})();
