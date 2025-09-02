import React, { memo } from 'react';
import { worldToScreen, worldToScreenSize, isObjectVisible } from '../../webgl/utils/coordinate-utils';
import './style.css';

const Card = memo(({ card, camera, canvas, isDragging }) => {
  const { x, y, width, height, text, properties } = card;
  
  // Early return if canvas is not available
  if (!canvas) return null;
  
  // Visibility culling - only render if card is visible
  if (!isObjectVisible(card, camera, canvas)) {
    return null;
  }
  
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
    // Ensure height is properly applied
    minHeight: `${screenSize.height}px`,
    maxHeight: `${screenSize.height}px`,
    // Removed transform: scale() since coordinate transformation already handles zoom
  };

  return (
    <div className="card-overlay" style={cardStyle}>
      <div className="card-header">
        <div className="card-labels">
          <span className="label-item primary">{text}</span>
          <span className="label-item secondary">Unspecified</span>
        </div>
      </div>
      <div className="card-properties">
        {properties && (
          <div className="properties-list">
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
});

Card.displayName = 'Card';

export default Card;
