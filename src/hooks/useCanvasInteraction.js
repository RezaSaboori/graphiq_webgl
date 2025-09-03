import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera } from '../utils/camera';

// Utility function to calculate bounding box of nodes
const calculateNodeBounds = (nodes) => {
    if (!nodes || nodes.length === 0) {
        return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
        if (node.position) {
            const x = node.position.x;
            const y = node.position.y;
            const width = node.width || 300;
            const height = node.height || 100;
            
            minX = Math.min(minX, x - width / 2);
            minY = Math.min(minY, y - height / 2);
            maxX = Math.max(maxX, x + width / 2);
            maxY = Math.max(maxY, y + height / 2);
        }
    });
    
    return { minX, minY, maxX, maxY };
};

// Utility function for smooth camera animation
const animateCameraTo = (camera, target) => {
    // Simple implementation - could be enhanced with proper animation
    camera.x = target.x;
    camera.y = target.y;
};

export const useCanvasInteraction = (canvasRef) => {
    const [camera, setCamera] = useState(null);
    const [isInteracting, setIsInteracting] = useState(false);
    const [interactionMode, setInteractionMode] = useState('select'); // 'select', 'pan', 'zoom'
    const lastInteractionRef = useRef({ x: 0, y: 0 });

    // Initialize camera when canvas is ready
    useEffect(() => {
        if (!canvasRef?.current) return;
        
        const canvas = canvasRef.current;
        const newCamera = new Camera({
            viewportWidth: canvas.width || canvas.clientWidth,
            viewportHeight: canvas.height || canvas.clientHeight,
            zoom: 1
        });
        
        setCamera(newCamera);
    }, [canvasRef]);

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
        newCamera.fitWorldRect({
            left: bounds.minX,
            top: bounds.minY,
            right: bounds.maxX,
            bottom: bounds.maxY
        }, padding);
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
