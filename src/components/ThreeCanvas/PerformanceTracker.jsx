import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const PerformanceTracker = ({ onPerformanceUpdate }) => {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameTimeRef = useRef(0);

  useFrame((state, delta) => {
    frameCountRef.current++;
    frameTimeRef.current = delta * 1000; // Convert to milliseconds
    
    const currentTime = performance.now();
    const elapsed = currentTime - lastTimeRef.current;
    
    // Update FPS every second
    if (elapsed >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
      const currentFrameTime = frameTimeRef.current;
      
      // Call the callback to update the parent component
      onPerformanceUpdate(currentFps, currentFrameTime);
      
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }
  });

  return null; // This component doesn't render anything
};

export default PerformanceTracker;
