// src/interaction/SimpleSpatialIndex.js
export class SimpleSpatialIndex {
  constructor() {
    this.nodes = [];
  }

  rebuild(nodes) {
    this.nodes = [...nodes];
  }

  add(node) {
    if (!this.nodes.includes(node)) {
      this.nodes.push(node);
    }
  }

  remove(node) {
    const index = this.nodes.indexOf(node);
    if (index !== -1) {
      this.nodes.splice(index, 1);
    }
  }

  query(x, y, tolerance = 5) {
    const candidates = [];
    
    for (const node of this.nodes) {
      if (!node.position) continue;
      
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeWidth = node.width || 300;
      const nodeHeight = node.height || 100;
      
      // Check if point is within node bounds (with tolerance)
      const left = nodeX - nodeWidth / 2 - tolerance;
      const right = nodeX + nodeWidth / 2 + tolerance;
      const top = nodeY - nodeHeight / 2 - tolerance;
      const bottom = nodeY + nodeHeight / 2 + tolerance;
      
      if (x >= left && x <= right && y >= top && y <= bottom) {
        candidates.push(node);
      }
    }
    
    // Sort by z-index or creation order (simple implementation)
    return candidates;
  }

  clear() {
    this.nodes = [];
  }

  // PHASE 2: get visible nodes given a camera
  // camera: instance of Camera.js (with .screenToWorld())
  // margin: extra world-units to not cut nodes at edge
  getVisibleNodes(camera, margin = 100) {
    if (!camera) return this.nodes;
    
    // get screen bounds in world space
    const topLeft = camera.screenToWorld(0, 0);
    const bottomRight = camera.screenToWorld(camera.viewportWidth, camera.viewportHeight);

    const minX = Math.min(topLeft.x, bottomRight.x) - margin;
    const maxX = Math.max(topLeft.x, bottomRight.x) + margin;
    const minY = Math.min(topLeft.y, bottomRight.y) - margin;
    const maxY = Math.max(topLeft.y, bottomRight.y) + margin;

    // filter only in-view nodes
    const visibleNodes = this.nodes.filter(node => {
      if (!node.position) return false;
      const x = node.position.x;
      const y = node.position.y;
      const w = node.width || 300;
      const h = node.height || 100;
      return (
        x + w/2 >= minX &&
        x - w/2 <= maxX &&
        y + h/2 >= minY &&
        y - h/2 <= maxY
      );
    });
    return visibleNodes;
  }
}
