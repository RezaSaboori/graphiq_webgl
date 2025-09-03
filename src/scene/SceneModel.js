/**
 * SceneModel: Centralized scene state management
 * Manages all interactive state outside of React - graph data, camera, selections, etc.
 * All mutations mark the scene as dirty for the draw loop to handle rendering.
 */
export class SceneModel {
  constructor(graph, camera, spatialIndex, renderer, markDirtyFn) {
    this.graph = graph;
    this.camera = camera;
    this.spatialIndex = spatialIndex;
    this.renderer = renderer;
    this.markDirty = markDirtyFn;
    
    // Interactive state (centralized, not in React)
    this.selectedNodes = new Set();
    this.selectedEdges = new Set();
    this.expandedNodes = new Set();
    this.draggedNode = null;
    this.hoveredNode = null;
    this.nodeWidth = 300;
    this.background = null;
    this.viewMode = 'default';
    this.filters = {};
  }

  // Camera operations
  panBy(dx, dy) {
    this.camera.panBy(dx, dy);
    this.markDirty();
  }

  zoomTo(zoom, centerX, centerY) {
    this.camera.zoomTo(zoom, centerX, centerY);
    this.markDirty();
  }

  setViewportSize(width, height) {
    this.camera.setViewportSize(width, height);
    this.markDirty();
  }

  // Node operations
  moveNode(nodeId, pos) {
    const node = this.graph.nodes.get(nodeId);
    if (node) {
      node.position.x = pos.x;
      node.position.y = pos.y;
      this.spatialIndex.rebuild([...this.graph.nodes.values()]);
      this.renderer.updateGraph(this.graph, { 
        selectedNodes: this.selectedNodes, 
        nodeWidth: this.nodeWidth 
      });
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

  setHoveredNode(nodeId) {
    this.hoveredNode = nodeId;
    this.markDirty();
  }

  clearHoveredNode() {
    this.hoveredNode = null;
    this.markDirty();
  }

  selectNode(nodeId, selected = true, multiSelect = false) {
    if (!multiSelect) {
      this.selectedNodes.clear();
    }
    if (selected) {
      this.selectedNodes.add(nodeId);
    } else {
      this.selectedNodes.delete(nodeId);
    }
    this.renderer.updateGraph(this.graph, { 
      selectedNodes: this.selectedNodes, 
      nodeWidth: this.nodeWidth 
    });
    this.markDirty();
  }

  selectEdge(edgeId, selected = true, multiSelect = false) {
    if (!multiSelect) {
      this.selectedEdges.clear();
    }
    if (selected) {
      this.selectedEdges.add(edgeId);
    } else {
      this.selectedEdges.delete(edgeId);
    }
    this.renderer.updateGraph(this.graph, { 
      selectedNodes: this.selectedNodes, 
      nodeWidth: this.nodeWidth 
    });
    this.markDirty();
  }

  expandNode(nodeId, expanded = true) {
    if (expanded) {
      this.expandedNodes.add(nodeId);
    } else {
      this.expandedNodes.delete(nodeId);
    }
    this.renderer.updateGraph(this.graph, { 
      selectedNodes: this.selectedNodes, 
      nodeWidth: this.nodeWidth 
    });
    this.markDirty();
  }

  toggleNodeExpansion(nodeId) {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
    this.renderer.updateGraph(this.graph, { 
      selectedNodes: this.selectedNodes, 
      nodeWidth: this.nodeWidth 
    });
    this.markDirty();
  }

  // Graph operations
  updateGraph(newGraph) {
    this.graph = newGraph;
    this.spatialIndex.rebuild([...this.graph.nodes.values()]);
    // Reset interaction state when graph changes
    this.selectedNodes.clear();
    this.selectedEdges.clear();
    this.expandedNodes.clear();
    this.draggedNode = null;
    this.hoveredNode = null;
    this.renderer.updateGraph(this.graph, { 
      selectedNodes: this.selectedNodes, 
      nodeWidth: this.nodeWidth 
    });
    this.markDirty();
  }

  setBackground(background) {
    this.background = background;
    this.markDirty();
  }

  setNodeWidth(width) {
    this.nodeWidth = width;
    this.renderer.updateGraph(this.graph, { 
      selectedNodes: this.selectedNodes, 
      nodeWidth: this.nodeWidth 
    });
    this.markDirty();
  }

  // View and filter operations
  setViewMode(mode) {
    this.viewMode = mode;
    this.markDirty();
  }

  setFilters(filters) {
    this.filters = { ...filters };
    this.markDirty();
  }

  // Utility methods
  getSelectedNodes() {
    return Array.from(this.selectedNodes);
  }

  getSelectedEdges() {
    return Array.from(this.selectedEdges);
  }

  getExpandedNodes() {
    return Array.from(this.expandedNodes);
  }

  getDraggedNode() {
    return this.draggedNode;
  }

  getHoveredNode() {
    return this.hoveredNode;
  }

  clearSelection() {
    this.selectedNodes.clear();
    this.selectedEdges.clear();
    this.renderer.updateGraph(this.graph, { 
      selectedNodes: this.selectedNodes, 
      nodeWidth: this.nodeWidth 
    });
    this.markDirty();
  }

  clearExpansion() {
    this.expandedNodes.clear();
    this.renderer.updateGraph(this.graph, { 
      selectedNodes: this.selectedNodes, 
      nodeWidth: this.nodeWidth 
    });
    this.markDirty();
  }

  clearAllInteractionState() {
    this.selectedNodes.clear();
    this.selectedEdges.clear();
    this.expandedNodes.clear();
    this.draggedNode = null;
    this.hoveredNode = null;
    this.renderer.updateGraph(this.graph, { 
      selectedNodes: this.selectedNodes, 
      nodeWidth: this.nodeWidth 
    });
    this.markDirty();
  }
}
