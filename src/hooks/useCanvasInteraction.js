import { useState, useEffect } from 'react';
import { Camera } from '../utils/camera';

// Legacy hook is reduced to camera lifecycle only; pointer handlers are removed.
export const useCanvasInteraction = (canvasRef, initialCamera = null) => {
    const [camera, setCamera] = useState(initialCamera);
    const [isInteracting, setIsInteracting] = useState(false);
    const [interactionMode, setInteractionMode] = useState('select');

    useEffect(() => {
        if (!canvasRef?.current) return;
        const canvas = canvasRef.current;
        const nextCamera = camera ?? new Camera({
            viewportWidth: canvas.width || canvas.clientWidth,
            viewportHeight: canvas.height || canvas.clientHeight,
            zoom: 1
        });
        setCamera(nextCamera);
    }, [canvasRef]);

    return {
        camera,
        setCamera,
        isInteracting,
        interactionMode,
        setInteractionMode,
        pointerHandlers: {}
    };
};
