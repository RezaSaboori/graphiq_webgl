import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useWebGLRenderer } from '../../hooks/useWebGLRenderer';
import { initialCards, initialArrows } from '../../data/initial-state';
import { worldToScreen, screenToWorld, worldToScreenSize, calculateOptimalCamera, throttle, debounce } from '../../webgl/utils/coordinate-utils';
import Card from '../Card/Card';
import ArrowLabel from '../ArrowLabel/ArrowLabel';
import PerformanceMonitor from '../PerformanceMonitor/PerformanceMonitor';
import './style.css';

const Canvas = () => {
  const canvasRef = useRef(null);
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

  // Use custom hook for WebGL renderer
  const { updateScene, isInitialized } = useWebGLRenderer(canvasRef, initialCards, initialArrows);

  // Handle canvas sizing with device pixel ratio
  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    // Get display size
    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;
    
    // Get device pixel ratio
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set canvas size to device pixels for maximum fidelity
    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;
    
    // Set CSS size to display size
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    
    // Update WebGL viewport
    if (isInitialized) {
      updateScene(cards, arrows, camera);
    }
  }, [cards, arrows, camera, isInitialized, updateScene]);

  // Update renderer when cards, arrows, or camera changes
  useEffect(() => {
    if (isInitialized) {
      updateScene(cards, arrows, camera);
    }
  }, [cards, arrows, camera, updateScene, isInitialized]);

  // Initialize camera to fit content when component mounts
  useEffect(() => {
    if (canvasRef.current && cards.length > 0) {
      const optimalCamera = calculateOptimalCamera(cards, arrows, canvasRef.current);
      setCamera(optimalCamera);
    }
  }, []); // Only run once on mount

  // Handle window resize with ResizeObserver for better performance
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          resizeCanvas();
          // Recalculate optimal camera position after resize
          if (canvasRef.current && cards.length > 0) {
            const optimalCamera = calculateOptimalCamera(cards, arrows, canvasRef.current);
            setCamera(optimalCamera);
          }
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    // Also listen for device pixel ratio changes
    const handlePixelRatioChange = () => {
      resizeCanvas();
    };

    // Use matchMedia to detect pixel ratio changes
    const mediaQuery = window.matchMedia('(resolution: 1dppx)');
    mediaQuery.addEventListener('change', handlePixelRatioChange);

    return () => {
      resizeObserver.disconnect();
      mediaQuery.removeEventListener('change', handlePixelRatioChange);
    };
  }, [cards, arrows, resizeCanvas]);

  // Initial resize
  useEffect(() => {
    resizeCanvas();
  }, [resizeCanvas]);

  // Handle mouse events for dragging cards
  const handleMouseDown = useCallback((event) => {
    // Early return if canvas is not available
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    // Convert screen coordinates to world coordinates
    const worldPos = screenToWorld(screenX, screenY, camera, canvasRef.current);

    // Find the top-most card at this position
    const sortedCards = [...cards].sort((a, b) => b.id - a.id);
    const clickedCard = sortedCards.find(card => 
      worldPos.x >= card.x && worldPos.x <= card.x + card.width && 
      worldPos.y >= card.y && worldPos.y <= card.y + card.height
    );

    if (clickedCard) {
      setDraggedCard(clickedCard);
      setDragOffset({ x: worldPos.x - clickedCard.x, y: worldPos.y - clickedCard.y });
    } else {
      // Start panning if clicking on empty space
      setIsPanning(true);
      setPanStart({ x: screenX, y: screenY });
    }
  }, [cards, camera]);

  // Throttled panning handler for better performance during panning
  const throttledPanning = useCallback(
    throttle((deltaX, deltaY) => {
      setCamera(prevCamera => ({
        ...prevCamera,
        x: prevCamera.x + deltaX,
        y: prevCamera.y + deltaY
      }));
    }, 16), // ~60fps for panning
    []
  );

  // Mouse move handler for smooth interactions
  const handleMouseMove = useCallback((event) => {
    // Early return if canvas is not available
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    if (draggedCard) {
      // Handle card dragging - immediate updates for responsive dragging
      const worldPos = screenToWorld(screenX, screenY, camera, canvasRef.current);
      
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === draggedCard.id 
            ? { ...card, x: worldPos.x - dragOffset.x, y: worldPos.y - dragOffset.y }
            : card
        )
      );
    } else if (isPanning) {
      // Handle panning - use throttled updates for smooth camera movement
      const deltaX = (panStart.x - screenX) / camera.zoom;
      const deltaY = (panStart.y - screenY) / camera.zoom;
      
      // Use throttled panning for better performance
      throttledPanning(deltaX, deltaY);
      
      setPanStart({ x: screenX, y: screenY });
    }
  }, [draggedCard, dragOffset, isPanning, panStart, camera, throttledPanning]);

  const handleMouseUp = useCallback(() => {
    setDraggedCard(null);
    setIsPanning(false);
  }, []);

  // Handle wheel events for zooming
  const handleWheel = useCallback((event) => {
    event.preventDefault();
    
    // Early return if canvas is not available
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Convert mouse position to world coordinates before zoom
    const worldPos = screenToWorld(mouseX, mouseY, camera, canvasRef.current);
    
    // Calculate zoom factor
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10.0, camera.zoom * zoomFactor));
    
    // Calculate new camera position to zoom towards mouse
    const newCamera = {
      x: worldPos.x - (mouseX / newZoom),
      y: worldPos.y - (mouseY / newZoom),
      zoom: newZoom
    };
    
    setCamera(newCamera);
  }, [camera]);

  // Handle keyboard events for navigation
  const handleKeyDown = useCallback((event) => {
    const moveAmount = 100 / camera.zoom; // Move amount in world units
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setCamera(prev => ({ ...prev, y: prev.y - moveAmount }));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setCamera(prev => ({ ...prev, y: prev.y + moveAmount }));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setCamera(prev => ({ ...prev, x: prev.x - moveAmount }));
        break;
      case 'ArrowRight':
        event.preventDefault();
        setCamera(prev => ({ ...prev, x: prev.x + moveAmount }));
        break;
      case '0':
        event.preventDefault();
        // Reset camera to origin
        setCamera({ x: 0, y: 0, zoom: 1.0 });
        break;
      case 'f':
        event.preventDefault();
        // Fit all content to view
        if (canvasRef.current) {
          const optimalCamera = calculateOptimalCamera(cards, arrows, canvasRef.current);
          setCamera(optimalCamera);
        }
        break;
      case '+':
      case '=':
        event.preventDefault();
        setCamera(prev => ({ ...prev, zoom: Math.min(10.0, prev.zoom * 1.2) }));
        break;
      case '-':
        event.preventDefault();
        setCamera(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }));
        break;
    }
  }, [camera]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Add event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseUp);
      canvas.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseUp);
        canvas.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas 
        ref={canvasRef} 
        className="webgl-canvas"
      />
      
      {/* Performance Monitor */}
      <PerformanceMonitor enabled={true} />
      
      {/* Camera info display */}
      <div className="camera-info">
        <div>Camera: ({camera.x.toFixed(1)}, {camera.y.toFixed(1)})</div>
        <div>Zoom: {camera.zoom.toFixed(2)}x</div>
        <div>Canvas: {canvasRef.current?.clientWidth || 0} × {canvasRef.current?.clientHeight || 0}</div>
        <div>Device Pixel Ratio: {window.devicePixelRatio || 1}</div>
        <div>Controls: Mouse drag to pan, Wheel to zoom, Arrow keys to move, F to fit view</div>
      </div>
      
      {/* HTML overlays for cards */}
      {cards.map(card => (
        <Card 
          key={card.id}
          card={card}
          camera={camera}
          canvas={canvasRef.current}
          isDragging={draggedCard?.id === card.id}
        />
      ))}
      
      {/* HTML overlays for arrow labels */}
      {arrows.map(arrow => {
        const fromCard = cards.find(c => c.id === arrow.from);
        const toCard = cards.find(c => c.id === arrow.to);
        if (!fromCard || !toCard) return null;
        
        return (
          <ArrowLabel 
            key={arrow.id}
            arrow={arrow}
            fromCard={fromCard}
            toCard={toCard}
            camera={camera}
            canvas={canvasRef.current}
          />
        );
      })}
    </div>
  );
};

export default Canvas;
