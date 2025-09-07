import React from 'react';
import NodeGraphContainer from './containers/NodeGraphContainer';

/**
 * Main visualization component that provides a clean interface for rendering node graphs.
 * This is now a simple wrapper that delegates to the container component.
 */
export default function NodeGraphVisualization({ graphData, nodeWidth = 300 }) {
  return <NodeGraphContainer graphData={graphData} nodeWidth={nodeWidth} />;
}