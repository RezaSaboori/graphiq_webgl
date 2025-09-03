import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGraphState } from '../hooks/useGraphState';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import GraphCanvas from './GraphCanvas';
import GraphControls from './GraphControls';
import GraphToolbar from './GraphToolbar';

const GraphVisualization = ({ initialData, onNodeSelect, onEdgeSelect }) => {
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
        resetView
    } = useCanvasInteraction();

    return (
        <div className="graph-visualization">
        <GraphToolbar 
            onFitToView={fitToView}
            onResetView={resetView}
            viewMode={viewMode}
            filters={filters}
        />
        <div className="graph-container">
            <GraphCanvas
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
