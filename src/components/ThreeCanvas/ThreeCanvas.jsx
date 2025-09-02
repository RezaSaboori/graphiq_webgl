import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { initialCards, initialArrows } from '../../data/initial-state';
import { calculateOptimalCameraThree, clampCameraToWorldBoundsThree } from '../../utils/three-coordinate-utils';
import CardMesh from './CardMesh';
import InstancedArrowMesh from './InstancedArrowMesh';
import PerformanceMonitor from './PerformanceMonitor';
import PerformanceTracker from './PerformanceTracker';
import './style.css';

// Camera controller component
function CameraController({ camera, setCamera, isPanning, panStart, dragOffset }) {
  const { camera: threeCamera, size } = useThree();
  
  useFrame(() => {
    // Update Three.js orthographic camera
    if (threeCamera.isOrthographicCamera) {
      threeCamera.position.set(camera.x, camera.y, 100);
      threeCamera.zoom = camera.zoom;
      threeCamera.left = -size.width / 2;
      threeCamera.right = size.width / 2;
      threeCamera.top = size.height / 2;
      threeCamera.bottom = -size.height / 2;
      threeCamera.updateProjectionMatrix();
    }
  });

  return null;
}

// Main scene component
function Scene({ cards, arrows, camera, setCamera, draggedCard, setDraggedCard, dragOffset, setDragOffset, setCards }) {
  return (
    <>
      {/* Camera controller */}
      <CameraController 
        camera={camera} 
        setCamera={setCamera}
        isPanning={false}
        panStart={{ x: 0, y: 0 }}
        dragOffset={dragOffset}
      />
      
      {/* Ambient light for basic illumination */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.4} />
      
      {/* Render all cards */}
      {cards.map(card => (
        <CardMesh
          key={card.id}
          card={card}
          isDragging={draggedCard === card.id}
          onDragStart={(cardId) => setDraggedCard(cardId)}
          onDrag={(cardId, newPosition) => {
            // Update card position
            setCards(prevCards => 
              prevCards.map(c => 
                c.id === cardId ? { ...c, x: newPosition.x, y: newPosition.y } : c
              )
            );
          }}
          onDragEnd={() => setDraggedCard(null)}
        />
      ))}
      
      {/* Render all arrows using instanced rendering */}
      <InstancedArrowMesh arrows={arrows} cards={cards} />
    </>
  );
}

const ThreeCanvas = () => {
  const containerRef = useRef(null);
  const [cards, setCards] = useState(initialCards);
  const [arrows, setArrows] = useState(initialArrows);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Camera state for world coordinate system
  const [camera, setCamera] = useState({
    x: 0,
    y: 0,
    zoom: 1.0
  });
  
  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Performance state
  const [performance, setPerformance] = useState({ fps: 60, frameTime: 16.67 });

  // Handle canvas sizing
  const resizeCanvas = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Canvas will automatically resize with react-three-fiber
    }
  }, []);

  // Handle mouse events for panning and zooming
  const handleMouseDown = useCallback((event) => {
    if (event.button === 1 || (event.button === 0 && event.ctrlKey)) { // Middle mouse or Ctrl+Left
      setIsPanning(true);
      setPanStart({ x: event.clientX, y: event.clientY });
      event.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((event) => {
    if (isPanning) {
      const deltaX = event.clientX - panStart.x;
      const deltaY = event.clientY - panStart.y;
      
      setCamera(prev => ({
        ...prev,
        x: prev.x - deltaX / prev.zoom,
        y: prev.y + deltaY / prev.zoom // Invert Y for proper panning
      }));
      
      setPanStart({ x: event.clientX, y: event.clientY });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5.0, camera.zoom * zoomFactor));
    
    setCamera(prev => ({
      ...prev,
      zoom: newZoom
    }));
  }, [camera.zoom]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  // Handle window resize
  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Fit to view functionality
  const fitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const size = {
      width: container.clientWidth,
      height: container.clientHeight
    };
    
    const optimalCamera = calculateOptimalCameraThree(cards, arrows, size, 50);
    setCamera(optimalCamera);
  }, [cards, arrows, setCamera]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'f' || event.key === 'F') {
        fitToView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitToView]);

  // Performance update handler
  const handlePerformanceUpdate = useCallback((fps, frameTime) => {
    setPerformance({ fps, frameTime });
  }, []);

  return (
    <div className="three-canvas-container" ref={containerRef}>
      <Canvas
        camera={{ 
          position: [0, 0, 100], 
          near: 0.1,
          far: 1000
        }}
        style={{ width: '100%', height: '100%' }}
        orthographic
      >
        <Scene
          cards={cards}
          arrows={arrows}
          camera={camera}
          setCamera={setCamera}
          draggedCard={draggedCard}
          setDraggedCard={setDraggedCard}
          dragOffset={dragOffset}
          setDragOffset={setDragOffset}
          setCards={setCards}
        />
        
        {/* Performance tracker inside Canvas */}
        <PerformanceTracker onPerformanceUpdate={handlePerformanceUpdate} />
      </Canvas>
      
      {/* UI Overlay */}
      <div className="ui-overlay">
        <div className="controls-info">
          <div className="control-item">
            <span className="key">F</span>
            <span className="description">Fit to view</span>
          </div>
          <div className="control-item">
            <span className="key">Ctrl + Drag</span>
            <span className="description">Pan view</span>
          </div>
          <div className="control-item">
            <span className="key">Wheel</span>
            <span className="description">Zoom</span>
          </div>
          <div className="control-item">
            <span className="key">Drag</span>
            <span className="description">Move cards</span>
          </div>
        </div>
        
        {/* Performance Monitor */}
        <PerformanceMonitor fps={performance.fps} frameTime={performance.frameTime} />
      </div>
    </div>
  );
};

export default ThreeCanvas;
