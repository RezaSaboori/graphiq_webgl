import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera } from '../utils/camera';

export const useCanvasInteraction = (canvasRef, initialCamera = null) => {
    const [camera, setCamera] = useState(initialCamera);
    const [isInteracting, setIsInteracting] = useState(false);
    const [interactionMode, setInteractionMode] = useState('select');
    const [activePointer, setActivePointer] = useState(null);

    useEffect(() => {
        if (!canvasRef?.current) return;
        const canvas = canvasRef.current;
        const newCamera = camera ?? new Camera({
            viewportWidth: canvas.width || canvas.clientWidth,
            viewportHeight: canvas.height || canvas.clientHeight,
            zoom: 1
        });
        setCamera(newCamera);
        // Do NOT add canvas event listeners here (handled in component).
    }, [canvasRef]);

    // Pan/Drag state
    const lastPointer = useRef(null);
    const mode = useRef('idle');

    const onPointerDown = (e) => {
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            // Middle click OR ctrl+left: pan mode
            setInteractionMode('pan');
            setIsInteracting(true);
            mode.current = 'panning';
            lastPointer.current = { x: e.clientX, y: e.clientY };
        } else if (e.button === 0) {
            setInteractionMode('select');
            setIsInteracting(true);
            mode.current = 'selecting';
            lastPointer.current = { x: e.clientX, y: e.clientY };
        }
        setActivePointer({ x: e.clientX, y: e.clientY, button: e.button });
    };

    const onPointerMove = (e) => {
        if (!isInteracting) return;
        if (mode.current === 'panning') {
            const dx = (e.clientX - lastPointer.current.x) / camera.zoom;
            const dy = (e.clientY - lastPointer.current.y) / camera.zoom;
            camera.panBy(-dx, -dy);
            lastPointer.current = { x: e.clientX, y: e.clientY };
            setCamera(new Camera({ ...camera }));
        }
        // Add drag logic here for selecting nodes, if needed.
    };

    const onPointerUp = (e) => {
        setIsInteracting(false);
        setInteractionMode('select');
        mode.current = 'idle';
        setActivePointer(null);
    };

    const onWheel = (e) => {
        if (!camera) return;
        e.preventDefault();
        const factor = Math.pow(0.95, e.deltaY); // smooth zoom
        let newZoom = camera.zoom * factor;
        newZoom = Math.max(0.05, Math.min(5.0, newZoom));
        const rect = canvasRef.current.getBoundingClientRect();
        const centerX = e.clientX - rect.left;
        const centerY = e.clientY - rect.top;
        camera.zoomTo(newZoom, centerX, centerY);
        setCamera(new Camera({ ...camera }));
    };

    return {
        camera,
        setCamera,
        isInteracting,
        interactionMode,
        setInteractionMode,
        pointerHandlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerLeave: onPointerUp,
            onWheel,
        }
    };
};
