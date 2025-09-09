// src/scene/Camera.js
import { mat4, vec4 } from 'gl-matrix';

export class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.position = { x: 0, y: 0 }; // In world space
    this.zoom = 1.0;
    this._recalc();
  }
  setViewportSize(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this._recalc();
  }
  setCenter(x, y) {
    this.position.x = x;
    this.position.y = y;
    this._recalc();
  }
  setZoom(zoom) {
    this.zoom = zoom;
    this._recalc();
  }
  _recalc() {
    // Orthographic projection: world units are equal to pixels at zoom=1
    const hw = this.viewportWidth / (2 * this.zoom);
    const hh = this.viewportHeight / (2 * this.zoom);
    this.projection = mat4.ortho(mat4.create(),
      -hw, hw,
      -hh, hh,
      -1000, 1000
    );
    // View matrix centers the camera on (position.x, position.y)
    this.view = mat4.create();
    mat4.translate(this.view, this.view, [-this.position.x, -this.position.y, 0]);
    // viewProjection = projection * view
    this.viewProjection = mat4.create();
    mat4.multiply(this.viewProjection, this.projection, this.view);
  }
  // Convert world → screen
  worldToScreen(wx, wy) {
    const world = vec4.fromValues(wx, wy, 0, 1);
    const out = vec4.create();
    vec4.transformMat4(out, world, this.viewProjection);
    const ndcX = out[0] / out[3];
    const ndcY = out[1] / out[3];
    return {
      x: (ndcX + 1) * 0.5 * this.viewportWidth,
      y: (1 - ndcY) * 0.5 * this.viewportHeight // flip Y for canvas
    };
  }
  // Convert screen → world
  screenToWorld(sx, sy) {
    const ndcX = (sx / this.viewportWidth) * 2 - 1;
    const ndcY = 1 - (sy / this.viewportHeight) * 2;
    const clip = vec4.fromValues(ndcX, ndcY, 0, 1);
    const invVP = mat4.invert(mat4.create(), this.viewProjection);
    const out = vec4.create();
    vec4.transformMat4(out, clip, invVP);
    return { x: out[0] / out[3], y: out[1] / out[3] };
  }

  // Fit the view to contain all nodes with some padding
  fitToView(nodes, padding = 100) {
    if (!nodes || nodes.length === 0) return;

    // Calculate bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const node of nodes) {
      const x = node.position.x;
      const y = node.position.y;
      const width = node.width || 300;
      const height = node.height || 100;
      
      minX = Math.min(minX, x - width/2);
      minY = Math.min(minY, y - height/2);
      maxX = Math.max(maxX, x + width/2);
      maxY = Math.max(maxY, y + height/2);
    }

    // Add padding
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Calculate center and dimensions
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;

    // Calculate zoom to fit the graph
    const zoomX = this.viewportWidth / graphWidth;
    const zoomY = this.viewportHeight / graphHeight;
    const zoom = Math.min(zoomX, zoomY, 1.0); // Don't zoom in more than 1:1

    // Apply the transformation
    this.setCenter(centerX, centerY);
    this.setZoom(zoom);
  }
}
