import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGraphState } from '../hooks/useGraphState';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import GraphCanvas from './GraphCanvas';
import GraphControls from './GraphControls';
import GraphToolbar from './GraphToolbar';

const GraphVisualization = ({ initialData, onNodeSelect, onEdgeSelect }) => {
  const canvasRef = useRef(null);
  
  // Container handles all state management and business logic
    const {
        graph,
        selectedNodes,
        selectedEdges,
        expandedProperties,
        viewMode,
        filters,
        updateGraph,
        selectNode,
        selectEdge,
        toggleProperties
    } = useGraphState(initialData);

    const {
        camera,
        isInteracting,
        interactionMode,
        panTo,
        zoomTo,
        fitToView,
        resetView,
        setInteractionMode
    } = useCanvasInteraction(canvasRef);

    return (
        <div className="graph-visualization" style={{width: "100%", height: "100%", position: "relative"}}>
        <GraphToolbar 
            onFitToView={() => fitToView(graph ? [...graph.nodes.values()] : [])}
            onResetView={resetView}
            viewMode={viewMode}
            filters={filters}
        />
        <div className="graph-container" style={{width: "100%", height: "100%", position: "relative"}}>
            <GraphCanvas
            ref={canvasRef}
            graph={graph}
            camera={camera}
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
            expandedProperties={expandedProperties}
            onNodeSelect={selectNode}
            onEdgeSelect={selectEdge}
            isInteracting={isInteracting}
            interactionMode={interactionMode}
            />
            <GraphControls
            onZoomIn={() => zoomTo(camera.zoom * 1.2)}
            onZoomOut={() => zoomTo(camera.zoom / 1.2)}
            onPanMode={() => setInteractionMode('pan')}
            onSelectMode={() => setInteractionMode('select')}
            />
        </div>
        </div>
    );
};

export default GraphVisualization;
