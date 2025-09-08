import React from 'react';
import NodeGraphContainer from './containers/NodeGraphContainer';

/**
 * Main visualization component that provides a clean interface for rendering node graphs.
 * This is now a simple wrapper that delegates to the container component.
 */
export default function NodeGraphVisualization({ graphData, nodeWidth = 300 }) {
  console.log("NodeGraphVisualization rendering with data:", graphData);
  if (!graphData) {
    return <div>No graph data provided</div>;
  }
  try {
    return <NodeGraphContainer graphData={graphData} nodeWidth={nodeWidth} />;
  } catch (error) {
    console.error("NodeGraphVisualization error:", error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>WebGL Initialization Error</h2>
        <p>{error.message}</p>
        <p>Check browser console for details.</p>
      </div>
    );
  }
}