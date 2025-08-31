import React from 'react';
import './style.css';

const ArrowLabel = ({ arrow, fromCard, toCard }) => {
  const { label } = arrow;
  
  // Calculate position for the label (midpoint of the arrow)
  const midX = (fromCard.x + toCard.x) / 2;
  const midY = (fromCard.y + toCard.y) / 2;
  
  // Convert world coordinates to CSS coordinates
  const scaleX = window.innerWidth / 1920;
  const scaleY = window.innerHeight / 1080;
  
  const labelStyle = {
    position: 'absolute',
    left: `${midX * scaleX}px`,
    top: `${midY * scaleY}px`,
    transform: 'translate(-50%, -50%)',
    zIndex: 5,
  };

  return (
    <div className="arrow-label" style={labelStyle}>
      <span className="label-text">{label}</span>
    </div>
  );
};

export default ArrowLabel;
