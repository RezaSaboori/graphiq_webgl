import React, { useRef, useEffect, useCallback } from 'react';
import { useWebGLRenderer } from '../hooks/useWebGLRenderer';
import { useCanvasResize } from '../hooks/useCanvasResize';

const GraphCanvas = ({
    graph,
    camera,
    selectedNodes,
    selectedEdges,
    expandedProperties,
    onNodeSelect,
    onEdgeSelect,
    isInteracting,
    interactionMode
    }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    
    // Custom hook for WebGL setup and rendering
    const { renderer, updateState, handleInteraction } = useWebGLRenderer({
        canvasRef,
        camera,
        graph
    });

    // Custom hook for responsive canvas sizing
    const { canvasSize } = useCanvasResize(containerRef);

    // Update renderer state when props change
    useEffect(() => {
        if (renderer) {
        updateState({
            selectedNodes,
            selectedEdges,
            expandedProperties,
            interactionMode
        });
        }
    }, [renderer, selectedNodes, selectedEdges, expandedProperties, interactionMode]);

    // Handle canvas interactions
    const handleCanvasInteraction = useCallback((event) => {
        if (!renderer) return;
        
        const result = handleInteraction(event);
        
        if (result?.type === 'node') {
        onNodeSelect?.(result.nodeId, result.data);
        } else if (result?.type === 'edge') {
        onEdgeSelect?.(result.edgeId, result.data);
        }
    }, [renderer, onNodeSelect, onEdgeSelect]);

    return (
        <div 
        ref={containerRef}
        className={`graph-canvas-container ${interactionMode}`}
        style={{ width: '100%', height: '100%', position: 'relative' }}
        >
        <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleCanvasInteraction}
            onMouseDown={handleCanvasInteraction}
            onMouseMove={handleCanvasInteraction}
            onWheel={handleCanvasInteraction}
            style={{
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: isInteracting ? 'grabbing' : interactionMode === 'pan' ? 'grab' : 'crosshair'
            }}
        />
        </div>
    );
};

export default GraphCanvas;
