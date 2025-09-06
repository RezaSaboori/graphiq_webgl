/**
 * Camera system for 2D world → screen transforms.
 * Origin (0,0) is world top-left. Supports negative and positive coordinates.
 * All positions in WORLD coordinates (floats).
 */
export class Camera {
    constructor({
        x = 0,
        y = 0,
        zoom = 1,
        viewportWidth = 800,
        viewportHeight = 600
    } = {}) {
        this.x = x;
        this.y = y;
        this.zoom = zoom;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
    }

    // Convert a point in world space → screen (pixel coordinates relative to canvas)
    worldToScreen(worldX, worldY) {
        return {
            x: Math.round((worldX - this.x) * this.zoom),
            y: Math.round((worldY - this.y) * this.zoom)
        };
    }

    // Convert a point in SCREEN (pixel coordinates) → world coordinates (float)
    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.zoom + this.x,
            y: screenY / this.zoom + this.y
        };
    }

    /** Pan the camera by delta in world units */
    panBy(dx, dy) {
        this.x += dx;
        this.y += dy;
        }

    /** Pan to absolute world position */
    panTo(newX, newY) {
        this.x = newX;
        this.y = newY;
        }

    /**
     * Zoom to a level, optionally centered on canvas/knot point (screen space).
     * By default centers on (viewport center).
     */
    zoomTo(newZoom, centerScreenX = this.viewportWidth / 2, centerScreenY = this.viewportHeight / 2) {
        const before = this.screenToWorld(centerScreenX, centerScreenY);
        this.zoom = Math.max(0.01, newZoom); // Prevent negative/zero zoom
        const after = this.screenToWorld(centerScreenX, centerScreenY);
        // Keep the world point under the cursor fixed when zooming
        this.x += before.x - after.x;
        this.y += before.y - after.y;
        }

    /** When canvas resizes, update viewport size */
    setViewportSize(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    /** Get world rect of visible area {left, top, right, bottom} */
    getVisibleWorldRect() {
        return {
            left: this.x,
            top: this.y,
            right: this.x + this.viewportWidth / this.zoom,
            bottom: this.y + this.viewportHeight / this.zoom
        };
    }

    /** Fit camera to world bounds (with margin, optional) */
    fitWorldRect({left, top, right, bottom}, marginPx=32) {
        const worldWidth = right - left;
        const worldHeight = bottom - top;
        const zoomX = (this.viewportWidth - marginPx*2) / worldWidth;
        const zoomY = (this.viewportHeight - marginPx*2) / worldHeight;
        this.zoom = Math.max(0.01, Math.min(zoomX, zoomY));
        
        // Center the graph in the viewport
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;
        this.x = centerX - this.viewportWidth / (2 * this.zoom);
        this.y = centerY - this.viewportHeight / (2 * this.zoom);
        }
}
