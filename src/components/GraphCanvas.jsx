import React, { useRef, useEffect, useCallback, forwardRef } from 'react';
import { useWebGLRenderer } from '../hooks/useWebGLRenderer';
import { useCanvasResize } from '../hooks/useCanvasResize';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';

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
    const {
        camera: hookCamera,
        setCamera,
        isInteracting: hookIsInteracting,
        interactionMode: hookInteractionMode,
        pointerHandlers
    } = useCanvasInteraction(canvasRef);

    const { renderer, updateState, updateViewport } = useWebGLRenderer({
        canvasRef,
        camera: hookCamera ?? camera,
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

    // Unified pointer/mouse/wheel handler → forwards to renderer with screen/world coords
    const handleCanvasInteraction = useCallback((event) => {
        if (!renderer || !hookCamera) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;
        const world = hookCamera.screenToWorld(screenX, screenY);

        if (renderer.handleInteraction) {
            renderer.handleInteraction(event.type, {
                screen: { x: screenX, y: screenY },
                world: { x: world.x, y: world.y },
                button: event.button,
                event
            });
        }
    }, [renderer, hookCamera]);

    // Combine pointer state handlers with unified forwarding to renderer
    const combinedHandlers = {
        onPointerDown: (e) => { pointerHandlers.onPointerDown?.(e); handleCanvasInteraction(e); },
        onPointerMove: (e) => { pointerHandlers.onPointerMove?.(e); handleCanvasInteraction(e); },
        onPointerUp: (e) => { pointerHandlers.onPointerUp?.(e); handleCanvasInteraction(e); },
        onPointerLeave: (e) => { pointerHandlers.onPointerLeave?.(e); handleCanvasInteraction(e); },
        onWheel: (e) => { pointerHandlers.onWheel?.(e); handleCanvasInteraction(e); }
    };

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
            {...combinedHandlers}
            tabIndex={0}
            style={{
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: (hookIsInteracting ?? isInteracting) ? 'grabbing' : (hookInteractionMode ?? interactionMode) === 'pan' ? 'grab' : 'crosshair'
            }}
        />
        </div>
    );
});

GraphCanvas.displayName = 'GraphCanvas';

export default GraphCanvas;
