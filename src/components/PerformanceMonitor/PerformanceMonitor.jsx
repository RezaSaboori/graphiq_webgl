import React from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import './style.css';

const PerformanceMonitor = ({ enabled = true }) => {
  const { fps, frameTime, memoryUsage } = usePerformance(enabled);

  if (!enabled) return null;

  return (
    <div className="performance-monitor">
      <div className="performance-header">Performance</div>
      <div className="performance-metrics">
        <div className="metric">
          <span className="metric-label">FPS:</span>
          <span className={`metric-value ${fps < 30 ? 'warning' : fps < 50 ? 'caution' : 'good'}`}>
            {fps}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Frame:</span>
          <span className={`metric-value ${frameTime > 33 ? 'warning' : frameTime > 20 ? 'caution' : 'good'}`}>
            {frameTime}ms
          </span>
        </div>
        {memoryUsage && (
          <div className="metric">
            <span className="metric-label">Memory:</span>
            <span className="metric-value">
              {memoryUsage.used}MB / {memoryUsage.total}MB
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;
