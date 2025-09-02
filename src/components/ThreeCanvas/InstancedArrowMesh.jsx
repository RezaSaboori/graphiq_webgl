import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { getBoxToBoxCurve, interpolateCubicBezier, interpolateCubicBezierAngle } from '../../utils/proto-arrows';
import iranSansXV from '../../assets/IRANSansXV.woff';

const InstancedArrowMesh = ({ arrows, cards }) => {
  const curveRef = useRef();
  const arrowheadRef = useRef();
  const labelRef = useRef();

  // Create instanced geometries
  const { curveGeometry, arrowheadGeometry, curveMaterial, arrowheadMaterial } = useMemo(() => {
    // Create curve template geometry
    const points = [];
    const segments = 40;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push(new THREE.Vector3(t, 0, 0)); // Template curve from 0 to 1
    }
    
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create arrowhead template geometry
    const arrowheadPoints = [
      new THREE.Vector3(-1, 0.5, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-1, -0.5, 0)
    ];
    const arrowheadGeometry = new THREE.BufferGeometry().setFromPoints(arrowheadPoints);
    
    // Create materials
    const curveMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      linewidth: 2
    });
    
    const arrowheadMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      linewidth: 2
    });
    
    return { curveGeometry, arrowheadGeometry, curveMaterial, arrowheadMaterial };
  }, []);

  // Calculate instance data for all arrows
  const instanceData = useMemo(() => {
    const curveInstances = [];
    const arrowheadInstances = [];
    const labelInstances = [];
    
    arrows.forEach((arrow, index) => {
      const fromCard = cards.find(c => c.id === arrow.from);
      const toCard = cards.find(c => c.id === arrow.to);
      
      if (!fromCard || !toCard) return;
      
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
      
      const curve = getBoxToBoxCurve(startBox, endBox);
      
      // Store curve control points for shader
      curveInstances.push({
        p0: [curve.start.x, curve.start.y],
        p1: [curve.control1.x, curve.control1.y],
        p2: [curve.control2.x, curve.control2.y],
        p3: [curve.end.x, curve.end.y],
        color: arrow.color
      });
      
      // Calculate arrowhead position and rotation
      const endAngleRad = interpolateCubicBezierAngle(curve, 1) * (Math.PI / 180);
      const endPoint = interpolateCubicBezier(curve, 1);
      
      arrowheadInstances.push({
        position: [endPoint.x, endPoint.y, 0],
        rotation: [0, 0, endAngleRad],
        color: arrow.color
      });
      
      // Calculate label position and rotation
      const midPoint = interpolateCubicBezier(curve, 0.5);
      const midAngleRad = interpolateCubicBezierAngle(curve, 0.5) * (Math.PI / 180);
      
      labelInstances.push({
        position: [midPoint.x, midPoint.y, 0.01],
        rotation: [0, 0, midAngleRad],
        size: [arrow.labelWidth, arrow.labelHeight],
        color: arrow.labelColor,
        text: arrow.label
      });
    });
    
    return { curveInstances, arrowheadInstances, labelInstances };
  }, [arrows, cards]);

  // Render individual arrows (fallback for now, can be optimized later with custom shaders)
  return (
    <group>
      {instanceData.curveInstances.map((instance, index) => {
        const arrow = arrows[index];
        if (!arrow) return null;
        
        const fromCard = cards.find(c => c.id === arrow.from);
        const toCard = cards.find(c => c.id === arrow.to);
        
        if (!fromCard || !toCard) return null;
        
        return (
          <ArrowMesh
            key={arrow.id}
            arrow={arrow}
            fromCard={fromCard}
            toCard={toCard}
          />
        );
      })}
    </group>
  );
};

// Keep the original ArrowMesh for now
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

export default InstancedArrowMesh;
