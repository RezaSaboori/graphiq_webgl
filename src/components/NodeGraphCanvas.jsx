import React, { forwardRef } from 'react';

/**
 * Presentational component for the WebGL canvas.
 * This is a "dumb" component that only handles rendering the canvas element.
 * All logic and interactions are handled by the container component.
 */
const NodeGraphCanvas = forwardRef((props, ref) => {
  return (
    <canvas
      ref={ref}
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block',
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 10,
        pointerEvents: 'auto',
        background: '#222',
        outline: 'none'
      }}
      {...props}
    />
  );
});

NodeGraphCanvas.displayName = 'NodeGraphCanvas';

export default NodeGraphCanvas;
