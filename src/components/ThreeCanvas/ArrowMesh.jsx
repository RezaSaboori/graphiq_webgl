import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { getBoxToBoxCurve, interpolateCubicBezier, interpolateCubicBezierAngle } from '../../utils/proto-arrows';
import iranSansXV from '../../assets/IRANSansXV.woff';

const ArrowMesh = ({ arrow, fromCard, toCard }) => {
  const curveRef = useRef();
  const arrowheadRef = useRef();
  const labelRef = useRef();

  // Calculate the Bézier curve for the arrow
  const curve = useMemo(() => {
    if (!fromCard || !toCard) return null;
    
    const startBox = { 
      x: fromCard.x, 
      y: fromCard.y, 
      w: fromCard.width, 
      h: fromCard.height 
    };
    const endBox = { 
      x: toCard.x, 
      y: toCard.y, 
      w: toCard.width, 
      h: toCard.height 
    };
    
    return getBoxToBoxCurve(startBox, endBox);
  }, [fromCard, toCard]);

  // Create the curve geometry
  const curveGeometry = useMemo(() => {
    if (!curve) return null;
    
    const points = [];
    const segments = 40;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = interpolateCubicBezier(curve, t);
      points.push(new THREE.Vector3(point.x, point.y, 0));
    }
    
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [curve]);

  // Create arrowhead geometry
  const arrowheadGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(-20, 10, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-20, -10, 0)
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  // Create materials
  const curveMaterial = useMemo(() => 
    new THREE.LineBasicMaterial({
      color: new THREE.Color(arrow.color[0], arrow.color[1], arrow.color[2]),
      transparent: true,
      opacity: arrow.color[3] || 1.0,
      linewidth: 2
    }), [arrow.color]
  );

  const arrowheadMaterial = useMemo(() => 
    new THREE.LineBasicMaterial({
      color: new THREE.Color(arrow.color[0], arrow.color[1], arrow.color[2]),
      transparent: true,
      opacity: arrow.color[3] || 1.0,
      linewidth: 2
    }), [arrow.color]
  );

  // Calculate arrowhead position and rotation
  const arrowheadTransform = useMemo(() => {
    if (!curve) return { position: [0, 0, 0], rotation: [0, 0, 0] };
    
    const endAngleRad = interpolateCubicBezierAngle(curve, 1) * (Math.PI / 180);
    const endPoint = interpolateCubicBezier(curve, 1);
    
    return {
      position: [endPoint.x, endPoint.y, 0],
      rotation: [0, 0, endAngleRad]
    };
  }, [curve]);

  // Calculate label position and rotation
  const labelTransform = useMemo(() => {
    if (!curve) return { position: [0, 0, 0], rotation: [0, 0, 0] };
    
    const midPoint = interpolateCubicBezier(curve, 0.5);
    const midAngleRad = interpolateCubicBezierAngle(curve, 0.5) * (Math.PI / 180);
    
    return {
      position: [midPoint.x, midPoint.y, 0.01],
      rotation: [0, 0, midAngleRad]
    };
  }, [curve]);

  // Update materials based on state
  useFrame(() => {
    if (curveRef.current) {
      curveRef.current.material.needsUpdate = true;
    }
    if (arrowheadRef.current) {
      arrowheadRef.current.material.needsUpdate = true;
    }
  });

  if (!curve || !curveGeometry) {
    return null;
  }

  return (
    <group>
      {/* Arrow curve */}
      <line
        ref={curveRef}
        geometry={curveGeometry}
        material={curveMaterial}
      />
      
      {/* Arrowhead */}
      <line
        ref={arrowheadRef}
        geometry={arrowheadGeometry}
        material={arrowheadMaterial}
        position={arrowheadTransform.position}
        rotation={arrowheadTransform.rotation}
      />
      
      {/* Arrow label background */}
      <mesh position={labelTransform.position} rotation={labelTransform.rotation}>
        <planeGeometry args={[arrow.labelWidth, arrow.labelHeight]} />
        <meshBasicMaterial
          color={new THREE.Color(
            arrow.labelColor[0], 
            arrow.labelColor[1], 
            arrow.labelColor[2]
          )}
          transparent
          opacity={arrow.labelColor[3] || 0.7}
        />
      </mesh>
      
      {/* Arrow label text */}
      <Text
        position={labelTransform.position}
        rotation={labelTransform.rotation}
        fontSize={12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={arrow.labelWidth * 0.9}
        font={iranSansXV}
        outlineWidth={0.3}
        outlineColor="#000000"
      >
        {arrow.label}
      </Text>
    </group>
  );
};

export default ArrowMesh;
