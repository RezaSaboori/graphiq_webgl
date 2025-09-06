// src/scene/SceneModel.js
export class SceneModel {
  constructor(graph, spatialIndex, renderer, onDirty) {
    this.graph = graph;
    this.spatialIndex = spatialIndex;
    this.renderer = renderer;
    this.onDirty = onDirty;
    
    // State management - NO React state
    this.selectedNodes = new Set();
    this.draggedNode = null;
    this.hoveredNode = null;
    this.nodeWidth = 300;
    this.background = null;
    
    // Mark initial dirty for first render
    this.markDirty();
  }

  // Node operations
  moveNode(nodeId, screenPos) {
    const node = this.graph.getNode(nodeId);
    if (node) {
      node.position = { x: screenPos.x, y: screenPos.y };
      this.spatialIndex.add(node); // Update spatial index
      this.markDirty();
    }
  }

  setDraggedNode(nodeId) {
    this.draggedNode = nodeId;
    this.markDirty();
  }

  clearDraggedNode() {
    this.draggedNode = null;
    this.markDirty();
  }

  selectNode(nodeId) {
    this.selectedNodes.add(nodeId);
    this.markDirty();
  }

  deselectNode(nodeId) {
    this.selectedNodes.delete(nodeId);
    this.markDirty();
  }

  clearSelection() {
    this.selectedNodes.clear();
    this.markDirty();
  }

  setHoveredNode(nodeId) {
    this.hoveredNode = nodeId;
    this.markDirty();
  }

  clearHoveredNode() {
    this.hoveredNode = null;
    this.markDirty();
  }


  // Graph operations
  updateGraph(newGraph) {
    this.graph = newGraph;
    this.spatialIndex.rebuild([...newGraph.nodes.values()]);
    this.clearSelection();
    this.clearDraggedNode();
    this.clearHoveredNode();
    
    // Update renderer with new graph
    if (this.renderer) {
      this.renderer.graph = newGraph;
    }
    
    this.markDirty();
  }

  setNodeWidth(width) {
    this.nodeWidth = width;
    this.markDirty();
  }

  setBackground(color) {
    this.background = color;
    this.markDirty();
  }

  // Rendering state
  markDirty() {
    if (this.onDirty) {
      this.onDirty();
    }
  }

  // Getters for renderer
  getGraph() {
    return this.graph;
  }


  getSelectedNodes() {
    return this.selectedNodes;
  }

  getDraggedNode() {
    return this.draggedNode;
  }

  getHoveredNode() {
    return this.hoveredNode;
  }

  getNodeWidth() {
    return this.nodeWidth;
  }

  getBackground() {
    return this.background;
  }
}
