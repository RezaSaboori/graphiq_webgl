import React, { useRef, useState, useEffect } from 'react';

const PerformanceMonitor = ({ fps, frameTime }) => {
  const getFpsColor = (fps) => {
    if (fps >= 55) return '#4ade80'; // Green
    if (fps >= 30) return '#fbbf24'; // Yellow
    return '#ef4444'; // Red
  };

  const getFrameTimeColor = (frameTime) => {
    if (frameTime <= 18) return '#4ade80'; // Green
    if (frameTime <= 33) return '#fbbf24'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="performance-monitor">
      <div className="performance-item">
        <span className="performance-label">FPS:</span>
        <span 
          className="performance-value" 
          style={{ color: getFpsColor(fps) }}
        >
          {fps}
        </span>
      </div>
      <div className="performance-item">
        <span className="performance-label">Frame Time:</span>
        <span 
          className="performance-value" 
          style={{ color: getFrameTimeColor(frameTime) }}
        >
          {frameTime.toFixed(1)}ms
        </span>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
