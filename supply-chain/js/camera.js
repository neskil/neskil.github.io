// Camera: world <-> screen transform with pan and zoom, clamped to the
// world bounds. Event wiring lives in input.js.
window.SC = window.SC || {};

SC.camera = (function() {
    const cam = { x: 0, y: 0, zoom: 1, minZoom: 0.3, maxZoom: 3 };
    let viewW = 0, viewH = 0;

    function setViewport(w, h) {
        viewW = w;
        viewH = h;
        // Never zoom out far beyond a full-world view
        const fit = Math.min(w / SC.CONFIG.WORLD_W, h / SC.CONFIG.WORLD_H);
        cam.minZoom = fit * 0.85;
        clamp();
    }

    function fitWorld() {
        cam.zoom = Math.min(viewW / SC.CONFIG.WORLD_W, viewH / SC.CONFIG.WORLD_H);
        cam.x = (SC.CONFIG.WORLD_W - viewW / cam.zoom) / 2;
        cam.y = (SC.CONFIG.WORLD_H - viewH / cam.zoom) / 2;
        clamp();
    }

    function focus(wx, wy, zoom) {
        if (zoom) cam.zoom = Math.max(cam.minZoom, Math.min(cam.maxZoom, zoom));
        cam.x = wx - viewW / (2 * cam.zoom);
        cam.y = wy - viewH / (2 * cam.zoom);
        clamp();
    }

    function clamp() {
        cam.zoom = Math.max(cam.minZoom, Math.min(cam.maxZoom, cam.zoom));
        const wV = viewW / cam.zoom, hV = viewH / cam.zoom;
        const pad = 120; // allow a little overscroll so edge nodes aren't stuck at the border
        if (wV >= SC.CONFIG.WORLD_W + 2 * pad) {
            cam.x = (SC.CONFIG.WORLD_W - wV) / 2;
        } else {
            cam.x = Math.max(-pad, Math.min(SC.CONFIG.WORLD_W + pad - wV, cam.x));
        }
        if (hV >= SC.CONFIG.WORLD_H + 2 * pad) {
            cam.y = (SC.CONFIG.WORLD_H - hV) / 2;
        } else {
            cam.y = Math.max(-pad, Math.min(SC.CONFIG.WORLD_H + pad - hV, cam.y));
        }
    }

    function pan(dxScreen, dyScreen) {
        cam.x -= dxScreen / cam.zoom;
        cam.y -= dyScreen / cam.zoom;
        clamp();
    }

    // Zoom keeping the world point under (sx, sy) fixed on screen
    function zoomAt(sx, sy, factor) {
        const before = toWorld(sx, sy);
        cam.zoom = Math.max(cam.minZoom, Math.min(cam.maxZoom, cam.zoom * factor));
        cam.x = before.x - sx / cam.zoom;
        cam.y = before.y - sy / cam.zoom;
        clamp();
    }

    function toWorld(sx, sy) {
        return { x: cam.x + sx / cam.zoom, y: cam.y + sy / cam.zoom };
    }

    function toScreen(wx, wy) {
        return { x: (wx - cam.x) * cam.zoom, y: (wy - cam.y) * cam.zoom };
    }

    return { cam, setViewport, fitWorld, focus, pan, zoomAt, toWorld, toScreen };
})();
