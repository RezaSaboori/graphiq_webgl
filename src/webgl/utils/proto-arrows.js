function getBoxBounds(box) {
  return [
    {x: box.x, y: box.y + box.h/2},
    {x: box.x + box.w, y: box.y + box.h/2},
    {x: box.x + box.w/2, y: box.y},
    {x: box.x + box.w/2, y: box.y + box.h}
  ];
}

function euclideanDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getIdealBoxSides(startBox, endBox) {
  const startPts = getBoxBounds(startBox);
  const endPts = getBoxBounds(endBox);
  let minDistance = Infinity;
  let startPoint = {x: 0, y: 0};
  let endPoint = {x: 0, y: 0};
  
  for (const pA of startPts) {
    for (const pB of endPts) {
      const d = euclideanDistance(pA, pB);
      if (d < minDistance) {
        minDistance = d;
        startPoint = pA;
        endPoint = pB;
      }
    }
  }
  
  return { startPoint, endPoint };
}

function isPointOnLeftOrRightSide(p, b) {
  return p.x === b.x || p.x === b.x + b.w;
}

const CPO = 0.75;

function getCurve(start, end, options) {
  const dX = (end.x - start.x) * (options?.flip ? CPO : 0);
  const dY = (end.y - start.y) * (options?.flip ? 0 : -CPO);
  
  return {
    start,
    control1: { x: start.x + dX, y: start.y - dY },
    control2: { x: end.x - dX, y: end.y + dY },
    end
  };
}

export function getBoxToBoxCurve(startBox, endBox) {
  const { startPoint, endPoint } = getIdealBoxSides(startBox, endBox);
  const flip = isPointOnLeftOrRightSide(startPoint, startBox) && 
               isPointOnLeftOrRightSide(endPoint, endBox);
  
  return getCurve(startPoint, endPoint, { flip });
}

export function interpolateCubicBezierAngle({ start, control1, control2, end }, t) {
  const tX = 3 * Math.pow(1 - t, 2) * (control1.x - start.x) +
              6 * (1 - t) * t * (control2.x - control1.x) +
              3 * Math.pow(t, 2) * (end.x - control2.x);
              
  const tY = 3 * Math.pow(1 - t, 2) * (control1.y - start.y) +
              6 * (1 - t) * t * (control2.y - control1.y) +
              3 * Math.pow(t, 2) * (end.y - control2.y);
              
  return Math.atan2(tY, tX) * (180 / Math.PI);
}
