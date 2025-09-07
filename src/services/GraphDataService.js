import { GraphNode } from "../graph/GraphNode";
import { GraphEdge } from "../graph/GraphEdge";
import { Graph } from "../graph/Graph";

/**
 * Service for handling graph data operations including loading, parsing, and transformation.
 * Separates data handling logic from UI components and graph models.
 */
export class GraphDataService {
  /**
   * Converts project JSON into a populated Graph instance.
   * @param {Object} json - Data (root = { graph:{ nodes:[], relationships:[] } })
   * @returns {Graph}
   */
  static loadGraphFromJSON(json) {
    const graph = new Graph();
    
    // Process nodes
    for (const nodeData of json.graph.nodes) {
      // Convert array of label objects (key-value) to {text, color}
      const labels = (nodeData.labels || []).map(labelObj =>
        Object.entries(labelObj).map(([text, color]) => ({ text, color }))
      ).flat();
      
      graph.addNode(
        new GraphNode({
          ...nodeData,
          labels
        })
      );
    }
    
    // Process edges/relationships
    for (const edgeData of json.graph.relationships) {
      graph.addEdge(new GraphEdge(edgeData));
    }
    
    return graph;
  }

  /**
   * Processes various graph data formats and returns a standardized Graph instance.
   * Handles different input formats from components.
   * @param {*} graphData - Raw graph data in various formats
   * @returns {Graph}
   */
  static processGraphData(graphData) {
    if (graphData instanceof Graph) {
      return graphData;
    }

    const graph = new Graph();
    const source = graphData?.graph ? graphData.graph : graphData;

    // Process nodes
    const nodesInput = source?.nodes;
    if (Array.isArray(nodesInput)) {
      for (const node of nodesInput) graph.addNode(node);
    } else if (nodesInput && typeof nodesInput.values === 'function') {
      for (const node of nodesInput.values()) graph.addNode(node);
    } else if (nodesInput && typeof nodesInput === 'object') {
      for (const node of Object.values(nodesInput)) graph.addNode(node);
    }

    // Process edges
    const edgesInput = source?.edges ?? source?.relationships;
    if (Array.isArray(edgesInput)) {
      for (const edge of edgesInput) graph.addEdge(edge);
    } else if (edgesInput && typeof edgesInput.values === 'function') {
      for (const edge of edgesInput.values()) graph.addEdge(edge);
    } else if (edgesInput && typeof edgesInput === 'object') {
      for (const edge of Object.values(edgesInput)) graph.addEdge(edge);
    }

    return graph;
  }

  /**
   * Extracts background color from graph data.
   * @param {*} graphData - Raw graph data
   * @returns {string|undefined} - Hex color string or undefined
   */
  static extractBackgroundColor(graphData) {
    const source = graphData?.graph ? graphData.graph : graphData;
    return source?.style?.['background-color'] || source?.style?.backgroundColor;
  }
}
