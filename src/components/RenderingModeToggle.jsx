import React, { useState } from 'react';

const RENDERING_MODE = {
  RECTANGLE: 'rectangle',
  GLASS: 'glass',
  LIQUID_GLASS: 'liquid_glass'
};

export default function RenderingModeToggle({ onModeChange, onToggleRectangles, initialMode = RENDERING_MODE.LIQUID_GLASS }) {
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [showRectangles, setShowRectangles] = useState(false);

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    onModeChange?.(mode);
  };

  const handleToggleRectangles = () => {
    const next = !showRectangles;
    setShowRectangles(next);
    onToggleRectangles?.(next);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      left: 20,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '14px',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Rendering Mode</h3>

      <div style={{ marginBottom: '15px' }}>
        {Object.entries(RENDERING_MODE).map(([key, value]) => (
          <label key={value} style={{ display: 'block', marginBottom: '5px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="renderingMode"
              value={value}
              checked={currentMode === value}
              onChange={() => handleModeChange(value)}
              style={{ marginRight: '8px' }}
            />
            {key.replace('_', ' ')}
          </label>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #555', paddingTop: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showRectangles}
            onChange={handleToggleRectangles}
            style={{ marginRight: '8px' }}
          />
          Show Rectangle Nodes
        </label>
        <small style={{ color: '#999', marginTop: '5px', display: 'block' }}>
          Toggle to test WebGL without rectangles
        </small>
      </div>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
        Current: {String(currentMode).toUpperCase()}
        {showRectangles ? ' + RECTANGLES' : ''}
      </div>
    </div>
  );
}


