import React from 'react';

const GraphToolbar = ({
  onFitToView,
  onResetView,
  viewMode,
  filters,
}) => (
  <div className="graph-toolbar" style={{
    position: 'absolute', top: 8, left: 8, right: 8, display: 'flex',
    gap: 8, alignItems: 'center', zIndex: 10
  }}>
    <button onClick={onFitToView} title="Zoom to Fit">🔍 Fit</button>
    <button onClick={onResetView} title="Reset Camera">⭮ Reset</button>
    {/* Render more controls for viewMode and filters if you wish */}
  </div>
);

export default GraphToolbar;
