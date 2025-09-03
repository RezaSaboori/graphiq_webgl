// SimpleSpatialIndex: minimal CPU spatial index for hit-testing nodes
export class SimpleSpatialIndex {
  constructor() {
    this.nodes = [];
  }
  // nodes: iterable of { id, position:{x,y}, width, height }
  rebuild(nodesIterable) {
    this.nodes = Array.isArray(nodesIterable) ? nodesIterable : [...nodesIterable];
  }
  // point: {x, y} in world coords
  queryPoint(point) {
    if (!point) return null;
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const halfW = (node.width || 300) / 2;
      const halfH = (node.height || 100) / 2;
      if (
        point.x >= node.position.x - halfW &&
        point.x <= node.position.x + halfW &&
        point.y >= node.position.y - halfH &&
        point.y <= node.position.y + halfH
      ) {
        return { type: 'node', node };
      }
    }
    return null;
  }
}


