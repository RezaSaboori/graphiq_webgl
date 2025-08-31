import React from 'react';
import { getBoxToBoxCurve, interpolateCubicBezier, interpolateCubicBezierAngle } from '../../webgl/utils/proto-arrows';
import { worldToScreen, worldToScreenSize } from '../../webgl/utils/coordinate-utils';
import './style.css';

const ArrowLabel = ({ arrow, fromCard, toCard, camera, canvas }) => {
  const { label, labelWidth, labelHeight } = arrow;
  
  // Use the same curve calculation as the WebGL renderer
  const startBox = { x: fromCard.x, y: fromCard.y, w: fromCard.width, h: fromCard.height };
  const endBox = { x: toCard.x, y: toCard.y, w: toCard.width, h: toCard.height };
  const curve = getBoxToBoxCurve(startBox, endBox);
  
  // Calculate the exact midpoint position on the Bézier curve (t = 0.5)
  const midPoint = interpolateCubicBezier(curve, 0.5);
  
  // Calculate the rotation angle at the midpoint to match the WebGL background
  const midAngleRad = interpolateCubicBezierAngle(curve, 0.5) * (Math.PI / 180);
  
  // Convert world coordinates to screen coordinates using camera
  const screenPos = worldToScreen(midPoint.x, midPoint.y, camera, canvas);
  const screenSize = worldToScreenSize(labelWidth, labelHeight, camera);
  
  const labelStyle = {
    position: 'absolute',
    left: `${screenPos.left}px`,
    top: `${screenPos.top}px`,
    width: `${screenSize.width}px`,
    height: `${screenSize.height}px`,
    transform: `translate(-50%, -50%) rotate(${midAngleRad}rad)`,
    // Removed scale() since coordinate transformation already handles zoom
    transformOrigin: 'center center',
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
