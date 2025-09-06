import { useRef, useEffect, useCallback } from 'react';
import { NodeGraphRenderer, hexToRgbNorm } from '../renderer/NodeGraphRenderer';

export const useWebGLRenderer = ({ canvasRef, camera, graph }) => {
    const rendererRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Render loop with proper cleanup
    const render = useCallback((bgColor = [0.12, 0.12, 0.13, 1]) => {
        if (!rendererRef.current) return;

        rendererRef.current.render(bgColor);
        animationFrameRef.current = requestAnimationFrame(() => render(bgColor));
    }, []);

    // Initialize WebGL renderer - ensure camera exists first
    useEffect(() => {
        if (!canvasRef.current) return;
        
        // Don't proceed until camera is ready!
        if (!camera) {
            return; // Camera must be ready first!
        }

        const canvas = canvasRef.current;
        const gl = canvas.getContext('webgl2');
        
        if (!gl) {
            console.error('WebGL2 not supported');
            return;
        }

        // Now create renderer with existing camera
        const renderer = new NodeGraphRenderer(gl, canvas, camera);
        renderer.graph = graph;
        rendererRef.current = renderer;

        console.log('WebGL Renderer initialized:', {
            canvasSize: { width: canvas.width, height: canvas.height },
            graphNodes: graph?.nodes?.size || 0,
            graphEdges: graph?.edges?.size || 0,
            camera: { x: camera.x, y: camera.y, zoom: camera.zoom }
        });

        // Start the render loop
        render();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            renderer?.dispose?.();
        };
    }, [canvasRef, camera, graph, render]);

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
