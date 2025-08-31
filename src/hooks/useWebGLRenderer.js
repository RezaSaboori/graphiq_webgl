import { useRef, useEffect, useCallback } from 'react';
import { WebGLRenderer } from '../webgl/Renderer';

export const useWebGLRenderer = (canvasRef) => {
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize renderer
  const initRenderer = useCallback(() => {
    if (canvasRef.current && !rendererRef.current) {
      try {
        rendererRef.current = new WebGLRenderer(canvasRef.current);
        rendererRef.current.init();
        return true;
      } catch (error) {
        console.error('Failed to initialize WebGL renderer:', error);
        return false;
      }
    }
    return false;
  }, [canvasRef]);

  // Update scene data
  const updateScene = useCallback((cards, arrows) => {
    if (rendererRef.current) {
      rendererRef.current.updateScene(cards, arrows);
    }
  }, []);

  // Start animation loop
  const startAnimation = useCallback(() => {
    const animate = () => {
      if (rendererRef.current) {
        rendererRef.current.render();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // Stop animation loop
  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (initRenderer()) {
      startAnimation();
    }

    return () => {
      stopAnimation();
      if (rendererRef.current) {
        rendererRef.current = null;
      }
    };
  }, [initRenderer, startAnimation, stopAnimation]);

  return {
    renderer: rendererRef.current,
    updateScene,
    isInitialized: !!rendererRef.current
  };
};
