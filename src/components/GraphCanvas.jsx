import React, { useRef, useEffect, useCallback, forwardRef } from 'react';
import { useWebGLRenderer } from '../hooks/useWebGLRenderer';
import { useCanvasResize } from '../hooks/useCanvasResize';

const GraphCanvas = forwardRef(({
    graph,
    camera,
    selectedNodes,
    selectedEdges,
    expandedProperties,
    onNodeSelect,
    onEdgeSelect,
    isInteracting,
    interactionMode
}, ref) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    
    // Custom hook for WebGL setup and rendering
    const { renderer, updateState, handleInteraction, updateViewport } = useWebGLRenderer({
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

    // Update viewport when canvas size changes
    useEffect(() => {
        if (renderer && canvasSize.width > 0 && canvasSize.height > 0) {
        updateViewport(canvasSize.width, canvasSize.height);
        }
    }, [renderer, canvasSize, updateViewport]);

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
        style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
        >
        <canvas
            ref={(node) => {
                canvasRef.current = node;
                if (ref) {
                    if (typeof ref === 'function') {
                        ref(node);
                    } else {
                        ref.current = node;
                    }
                }
            }}
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
});

GraphCanvas.displayName = 'GraphCanvas';

export default GraphCanvas;
