import React from 'react';
import { getBoxToBoxCurve, interpolateCubicBezier, interpolateCubicBezierAngle } from '../../webgl/utils/proto-arrows';
import './style.css';

const ArrowLabel = ({ arrow, fromCard, toCard }) => {
  const { label, labelWidth, labelHeight } = arrow;
  
  // Use the same curve calculation as the WebGL renderer
  const startBox = { x: fromCard.x, y: fromCard.y, w: fromCard.width, h: fromCard.height };
  const endBox = { x: toCard.x, y: toCard.y, w: toCard.width, h: toCard.height };
  const curve = getBoxToBoxCurve(startBox, endBox);
  
  // Calculate the exact midpoint position on the Bézier curve (t = 0.5)
  const midPoint = interpolateCubicBezier(curve, 0.5);
  
  // Calculate the rotation angle at the midpoint to match the WebGL background
  const midAngleRad = interpolateCubicBezierAngle(curve, 0.5) * (Math.PI / 180);
  
  // Convert world coordinates to CSS coordinates
  const scaleX = window.innerWidth / 1920;
  const scaleY = window.innerHeight / 1080;
  
  const labelStyle = {
    position: 'absolute',
    left: `${midPoint.x * scaleX}px`,
    top: `${midPoint.y * scaleY}px`,
    width: `${labelWidth * scaleX}px`,
    height: `${labelHeight * scaleY}px`,
    transform: `translate(-50%, -50%) rotate(${midAngleRad}rad)`,
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div className="arrow-label" style={labelStyle}>
      <span className="label-text">{label}</span>
    </div>
  );
};

export default ArrowLabel;
