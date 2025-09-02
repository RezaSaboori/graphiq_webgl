import { useRef, useEffect, useState, useCallback } from 'react';

export const usePerformance = (enabled = true) => {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(null);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameTimeRef = useRef(0);
  
  const measureFrame = useCallback(() => {
    if (!enabled) return;
    
    const now = performance.now();
    frameTimeRef.current = now - lastTimeRef.current;
    lastTimeRef.current = now;
    
    frameCountRef.current++;
    
    // Update FPS every second
    if (frameCountRef.current % 60 === 0) {
      const elapsed = now - (lastTimeRef.current - frameTimeRef.current * 60);
      const currentFps = Math.round((60 * 1000) / elapsed);
      setFps(currentFps);
      setFrameTime(Math.round(frameTimeRef.current));
    }
  }, [enabled]);
  
  // Monitor memory usage if available
  useEffect(() => {
    if (!enabled) return;
    
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = performance.memory;
        setMemoryUsage({
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
        });
      }
    };
    
    const interval = setInterval(updateMemoryUsage, 1000);
    return () => clearInterval(interval);
  }, [enabled]);
  
  return {
    fps,
    frameTime,
    memoryUsage,
    measureFrame
  };
};
