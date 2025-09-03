export class Graph {
    constructor() {
      this.nodes = new Map();  // id -> GraphNode
      this.edges = new Map();  // id -> GraphEdge
    }

    addNode(node) {
        this.nodes.set(node.id, node);
    }
    addEdge(edge) {
        this.edges.set(edge.id, edge);
    }
    getNode(id) {
        return this.nodes.get(id);
    }
    getEdge(id) {
        return this.edges.get(id);
    }
    getEdgesForNode(nodeId) {
        return [...this.edges.values()].filter(
            e => e.fromId === nodeId || e.toId === nodeId
        );
    }
}
