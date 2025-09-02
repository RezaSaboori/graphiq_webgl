import React, { useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import iranSansXV from '../../assets/IRANSansXV.woff';

const CardMesh = ({ 
  card, 
  isDragging, 
  onDragStart, 
  onDrag, 
  onDragEnd 
}) => {
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const { camera, raycaster, mouse, scene } = useThree();

  // Create card geometry and material
  const geometry = new THREE.PlaneGeometry(card.width, card.height);
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(card.color[0], card.color[1], card.color[2]),
    transparent: true,
    opacity: card.color[3] || 0.8,
    roughness: 0.1,
    metalness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  });

  // Handle mouse interactions
  const handlePointerDown = useCallback((event) => {
    event.stopPropagation();
    setDragStart({
      mouseX: event.clientX,
      mouseY: event.clientY,
      cardX: card.x,
      cardY: card.y
    });
    onDragStart(card.id);
  }, [card.id, card.x, card.y, onDragStart]);

  const handlePointerMove = useCallback((event) => {
    if (dragStart && isDragging) {
      // Convert screen delta to world delta
      const deltaX = (event.clientX - dragStart.mouseX) / camera.zoom;
      const deltaY = (event.clientY - dragStart.mouseY) / camera.zoom;
      
      const newPosition = {
        x: dragStart.cardX + deltaX,
        y: dragStart.cardY + deltaY
      };
      
      onDrag(card.id, newPosition);
    }
  }, [dragStart, isDragging, camera.zoom, card.id, onDrag]);

  const handlePointerUp = useCallback(() => {
    if (dragStart) {
      setDragStart(null);
      onDragEnd();
    }
  }, [dragStart, onDragEnd]);

  // Update material properties based on state
  useFrame(() => {
    if (meshRef.current) {
      // Add subtle hover effect
      if (isHovered) {
        meshRef.current.material.opacity = Math.min(1.0, (card.color[3] || 0.8) + 0.2);
      } else {
        meshRef.current.material.opacity = card.color[3] || 0.8;
      }
      
      // Add dragging effect
      if (isDragging) {
        meshRef.current.position.z = 0.1;
        meshRef.current.material.emissive = new THREE.Color(0.1, 0.1, 0.1);
      } else {
        meshRef.current.position.z = -0.1 * card.id;
        meshRef.current.material.emissive = new THREE.Color(0, 0, 0);
      }
    }
  });

  // Set up event listeners for dragging
  React.useEffect(() => {
    const handleGlobalMouseMove = (event) => {
      handlePointerMove(event);
    };

    const handleGlobalMouseUp = () => {
      handlePointerUp();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <group position={[card.x, card.y, 0]}>
      {/* Card background mesh */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onPointerDown={handlePointerDown}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      />
      
      {/* Card title text */}
      <Text
        position={[0, card.height * 0.3, 0.01]}
        fontSize={16}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={card.width * 0.9}
        font={iranSansXV}
        outlineWidth={0.5}
        outlineColor="#000000"
      >
        {card.text}
      </Text>
      
      {/* Card properties text */}
      {card.properties && (
        <Text
          position={[0, -card.height * 0.2, 0.01]}
          fontSize={12}
          color="#e0e0e0"
          anchorX="center"
          anchorY="middle"
          maxWidth={card.width * 0.9}
          font={iranSansXV}
        >
          {Object.entries(card.properties)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n')}
        </Text>
      )}
      
      {/* Card type indicator */}
      <Text
        position={[0, card.height * 0.4, 0.01]}
        fontSize={10}
        color="#888888"
        anchorX="center"
        anchorY="middle"
        maxWidth={card.width * 0.9}
        font={iranSansXV}
      >
        Unspecified
      </Text>
    </group>
  );
};

export default CardMesh;
