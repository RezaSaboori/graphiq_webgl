import React from 'react';
import './style.css';

const Card = ({ card, isDragging }) => {
  const { x, y, width, height, text, properties } = card;
  
  // Convert world coordinates to CSS coordinates
  const scaleX = window.innerWidth / 1920;
  const scaleY = window.innerHeight / 1080;
  
  const cardStyle = {
    position: 'absolute',
    left: `${x * scaleX}px`,
    top: `${y * scaleY}px`,
    width: `${width * scaleX}px`,
    height: `${height * scaleY}px`,
    zIndex: isDragging ? 1000000 : 10,
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
