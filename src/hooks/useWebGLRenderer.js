import { useRef, useEffect, useCallback } from 'react';
import { NodeGraphRenderer, hexToRgbNorm } from '../renderer/NodeGraphRenderer';

export const useWebGLRenderer = ({ canvasRef, graph }) => {
    const rendererRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Render loop with proper cleanup
    const render = useCallback((bgColor = [0.12, 0.12, 0.13, 1]) => {
        if (!rendererRef.current) return;

        rendererRef.current.render(bgColor);
        animationFrameRef.current = requestAnimationFrame(() => render(bgColor));
    }, []);

    // Initialize WebGL renderer
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const gl = canvas.getContext('webgl2');
        
        if (!gl) {
            return;
        }

        // Create renderer
        const renderer = new NodeGraphRenderer(gl, canvas);
        renderer.graph = graph;
        rendererRef.current = renderer;
            graphEdges: graph?.edges?.size || 0
        });

        // Start the render loop
        render();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            renderer?.dispose?.();
        };
    }, [canvasRef, graph, render]);

    // Update renderer state
    const updateState = useCallback((state) => {
        if (!rendererRef.current) return;
        
        // Update renderer with new state
        rendererRef.current.updateState?.(state);
        
        // Trigger re-render
        render();
    }, [render]);

    // Update viewport when canvas size changes
    const updateViewport = useCallback((width, height) => {
        if (!rendererRef.current) return;
        rendererRef.current.setViewportSize(width, height);
    }, []);

    // Handle canvas interactions
    const handleInteraction = useCallback((event) => {
        if (!rendererRef.current) return null;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        return rendererRef.current.handleInteraction?.(x, y, event);
    }, []);

    return {
        renderer: rendererRef.current,
        updateState,
        handleInteraction,
        render,
        updateViewport
    };
};
