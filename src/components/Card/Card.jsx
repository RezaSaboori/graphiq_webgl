import React from 'react';
import { worldToScreen, worldToScreenSize } from '../../webgl/utils/coordinate-utils';
import './style.css';

const Card = ({ card, camera, canvas, isDragging }) => {
  const { x, y, width, height, text, properties } = card;
  
  // Convert world coordinates to screen coordinates using camera
  const screenPos = worldToScreen(x, y, camera, canvas);
  const screenSize = worldToScreenSize(width, height, camera);
  
  const cardStyle = {
    position: 'absolute',
    left: `${screenPos.left}px`,
    top: `${screenPos.top}px`,
    width: `${screenSize.width}px`,
    height: `${screenSize.height}px`,
    zIndex: isDragging ? 1000000 : 10,
    // Removed transform: scale() since coordinate transformation already handles zoom
  };

  return (
    <div className="card-overlay" style={cardStyle}>
      <div className="card-header">
        <h3 className="card-title">{text}</h3>
      </div>
      <div className="card-content">
        {properties && (
          <div className="card-properties">
            {Object.entries(properties).map(([key, value]) => (
              <div key={key} className="property-item">
                <span className="property-key">{key}:</span>
                <span className="property-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
