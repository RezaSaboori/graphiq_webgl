import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useWebGLRenderer } from '../../hooks/useWebGLRenderer';
import { initialCards, initialArrows } from '../../data/initial-state';
import { worldToScreen, screenToWorld, worldToScreenSize, calculateOptimalCamera } from '../../webgl/utils/coordinate-utils';
import Card from '../Card/Card';
import ArrowLabel from '../ArrowLabel/ArrowLabel';
import './style.css';

const Canvas = () => {
  const canvasRef = useRef(null);
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        // Recalculate optimal camera position after resize
        const optimalCamera = calculateOptimalCamera(cards, arrows, canvasRef.current);
        setCamera(optimalCamera);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cards, arrows]);

  // Handle mouse events for dragging cards
  const handleMouseDown = useCallback((event) => {
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

  const handleMouseMove = useCallback((event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    if (draggedCard) {
      // Handle card dragging
      const worldPos = screenToWorld(screenX, screenY, camera, canvasRef.current);
      
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === draggedCard.id 
            ? { ...card, x: worldPos.x - dragOffset.x, y: worldPos.y - dragOffset.y }
            : card
        )
      );
    } else if (isPanning) {
      // Handle panning
      const deltaX = (panStart.x - screenX) / camera.zoom;
      const deltaY = (panStart.y - screenY) / camera.zoom;
      
      setCamera(prevCamera => ({
        ...prevCamera,
        x: prevCamera.x + deltaX,
        y: prevCamera.y + deltaY
      }));
      
      setPanStart({ x: screenX, y: screenY });
    }
  }, [draggedCard, dragOffset, isPanning, panStart, camera]);

  const handleMouseUp = useCallback(() => {
    setDraggedCard(null);
    setIsPanning(false);
  }, []);

  // Handle wheel events for zooming
  const handleWheel = useCallback((event) => {
    event.preventDefault();
    
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
    <div className="canvas-container">
      <canvas 
        ref={canvasRef} 
        className="webgl-canvas"
        width={1920}
        height={1080}
      />
      
      {/* Camera info display */}
      <div className="camera-info">
        <div>Camera: ({camera.x.toFixed(1)}, {camera.y.toFixed(1)})</div>
        <div>Zoom: {camera.zoom.toFixed(2)}x</div>
        <div>Canvas: {canvasRef.current?.clientWidth || 0} × {canvasRef.current?.clientHeight || 0}</div>
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
