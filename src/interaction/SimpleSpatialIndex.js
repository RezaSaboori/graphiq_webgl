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
}
