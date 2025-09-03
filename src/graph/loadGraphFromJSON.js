import { GraphNode } from "./GraphNode";
import { GraphEdge } from "./GraphEdge";
import { Graph } from "./Graph";

/**
 * Converts project JSON into a populated Graph instance.
 * @param {Object} json - Data (root = { graph:{ nodes:[], relationships:[] } })
 * @returns {Graph}
 */
export function loadGraphFromJSON(json) {
    const graph = new Graph();
    // Nodes
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
    // Edges/relationships
    for (const edgeData of json.graph.relationships) {
        graph.addEdge(new GraphEdge(edgeData));
    }
    return graph;
}
