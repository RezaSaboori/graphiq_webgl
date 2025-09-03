import { useState, useCallback, useRef } from 'react';

export const useCanvasInteraction = (initialCamera) => {
    const [camera, setCamera] = useState(initialCamera);
    const [isInteracting, setIsInteracting] = useState(false);
    const [interactionMode, setInteractionMode] = useState('select'); // 'select', 'pan', 'zoom'
    const lastInteractionRef = useRef({ x: 0, y: 0 });

    const panTo = useCallback((x, y, smooth = false) => {
        setCamera(prev => {
        const newCamera = { ...prev };
        if (smooth) {
            // Implement smooth panning with animation
            animateCameraTo(newCamera, { x, y });
        } else {
            newCamera.x = x;
            newCamera.y = y;
        }
        return newCamera;
        });
    }, []);

    const zoomTo = useCallback((zoom, centerX, centerY, smooth = false) => {
        setCamera(prev => {
        const newCamera = { ...prev };
        if (centerX !== undefined && centerY !== undefined) {
            newCamera.zoomTo(zoom, centerX, centerY);
        } else {
            newCamera.zoom = Math.max(0.1, Math.min(5.0, zoom));
        }
        return newCamera;
        });
    }, []);

    const fitToView = useCallback((nodes) => {
        if (!nodes || nodes.length === 0) return;
        
        // Calculate bounding box of all nodes
        const bounds = calculateNodeBounds(nodes);
        const padding = 50;
        
        setCamera(prev => {
        const newCamera = { ...prev };
        newCamera.fitToBounds(bounds, padding);
        return newCamera;
        });
    }, []);

    const resetView = useCallback(() => {
        setCamera(prev => ({
        ...prev,
        x: 0,
        y: 0,
        zoom: 1
        }));
    }, []);

    return {
        camera,
        isInteracting,
        interactionMode,
        panTo,
        zoomTo,
        fitToView,
        resetView,
        setInteractionMode,
        setIsInteracting
    };
};
