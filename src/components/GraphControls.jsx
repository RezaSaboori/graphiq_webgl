import React from 'react';

const GraphControls = ({
  onZoomIn,
  onZoomOut,
  onPanMode,
  onSelectMode,
}) => (
  <div className="graph-controls" style={{
    position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 8, zIndex: 10
  }}>
    <button onClick={onZoomIn} title="Zoom In">+</button>
    <button onClick={onZoomOut} title="Zoom Out">−</button>
    <button onClick={onPanMode} title="Pan Tool">🖐️</button>
    <button onClick={onSelectMode} title="Select Tool">🖱️</button>
  </div>
);

export default GraphControls;
