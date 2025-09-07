import React, { useRef, useEffect } from 'react';
import { useLiquidGlassSettings } from './LiquidGlassBackgroundRenderer';

/**
 * Example component showing how to use liquid glass nodes
 * This demonstrates the integration with the existing GraphIQ system
 */
export const LiquidGlassNodeExample = ({ nodes = [], onNodeDragStart, onNodeDragEnd }) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const glassSettings = useLiquidGlassSettings();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2');
    
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    // Initialize your NodeGraphRenderer here
    // This is just an example - you'll need to integrate with your existing setup
    // const renderer = new NodeGraphRenderer(gl, canvas);
    // rendererRef.current = renderer;

    // Handle window resize
    const handleResize = () => {
      if (rendererRef.current) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        rendererRef.current.setViewportSize(canvas.width, canvas.height);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        rendererRef.current.dispose?.();
      }
    };
  }, []);

  // Handle node drag start - bring to front
  const handleNodeMouseDown = (nodeId, event) => {
    if (rendererRef.current) {
      rendererRef.current.bringNodeToFront(nodeId);
    }
    onNodeDragStart?.(nodeId, event);
  };

  // Handle node drag end
  const handleNodeMouseUp = (nodeId, event) => {
    onNodeDragEnd?.(nodeId, event);
  };

  return (
    <div className="liquid-glass-example">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        onMouseDown={(e) => {
          // Find which node was clicked and handle drag start
          const rect = canvasRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // You'll need to implement hit testing here
          // For now, this is just a placeholder
          console.log('Canvas clicked at:', x, y);
        }}
        onMouseUp={(e) => {
          // Handle drag end
          console.log('Canvas mouse up');
        }}
      />
      
      {/* Example of how to use the glass settings */}
      <div className="glass-settings-info" style={{ position: 'absolute', top: 10, left: 10, color: 'white' }}>
        <h3>Liquid Glass Settings</h3>
        <p>Ref Thickness: {glassSettings.refThickness}</p>
        <p>Glare Range: {glassSettings.glareRange}</p>
        <p>Tint: {JSON.stringify(glassSettings.tint)}</p>
      </div>
    </div>
  );
};

export default LiquidGlassNodeExample;
