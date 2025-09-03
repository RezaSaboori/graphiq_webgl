import { useState, useEffect, useCallback } from 'react';
import { debounce } from '../utils/debounce';

export const useCanvasResize = (containerRef) => {
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Debounced resize handler for performance
    const handleResize = useCallback(
        debounce(() => {
        if (!containerRef.current) return;
        
        const { clientWidth, clientHeight } = containerRef.current;
        setCanvasSize({ width: clientWidth, height: clientHeight });
        }, 100),
        [containerRef]
    );

    useEffect(() => {
        handleResize();
        
        const resizeObserver = new ResizeObserver(handleResize);
        if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
        }

        return () => {
        resizeObserver.disconnect();
        handleResize.cancel?.();
        };
    }, [handleResize]);

    return { canvasSize };
};
