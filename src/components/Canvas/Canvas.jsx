import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useWebGLRenderer } from '../../hooks/useWebGLRenderer';
import { initialCards, initialArrows } from '../../data/initial-state';
import Card from '../Card/Card';
import ArrowLabel from '../ArrowLabel/ArrowLabel';
import './style.css';

const Canvas = () => {
  const canvasRef = useRef(null);
  const [cards, setCards] = useState(initialCards);
  const [arrows, setArrows] = useState(initialArrows);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Use custom hook for WebGL renderer
  const { updateScene, isInitialized } = useWebGLRenderer(canvasRef, initialCards, initialArrows);

  // Update renderer when cards or arrows change
  useEffect(() => {
    if (isInitialized) {
      updateScene(cards, arrows);
    }
  }, [cards, arrows, updateScene, isInitialized]);

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 1920;
    const y = (event.clientY - rect.top) / rect.height * 1080;

    // Find the top-most card at this position
    const sortedCards = [...cards].sort((a, b) => b.id - a.id);
    const clickedCard = sortedCards.find(card => 
      x >= card.x && x <= card.x + card.width && 
      y >= card.y && y <= card.y + card.height
    );

    if (clickedCard) {
      setDraggedCard(clickedCard);
      setDragOffset({ x: x - clickedCard.x, y: y - clickedCard.y });
    }
  }, [cards]);

  const handleMouseMove = useCallback((event) => {
    if (draggedCard) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width * 1920;
      const y = (event.clientY - rect.top) / rect.height * 1080;

      setCards(prevCards => 
        prevCards.map(card => 
          card.id === draggedCard.id 
            ? { ...card, x: x - dragOffset.x, y: y - dragOffset.y }
            : card
        )
      );
    }
  }, [draggedCard, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggedCard(null);
  }, []);

  // Add event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseUp);

      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  return (
    <div className="canvas-container">
      <canvas 
        ref={canvasRef} 
        className="webgl-canvas"
        width={1920}
        height={1080}
      />
      
      {/* HTML overlays for cards */}
      {cards.map(card => (
        <Card 
          key={card.id}
          card={card}
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
          />
        );
      })}
    </div>
  );
};

export default Canvas;
