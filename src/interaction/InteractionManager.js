// src/interaction/InteractionManager.js
import { createInteractionStateMachine } from './InteractionStateMachine.js';
import { EventBus } from './EventBus.js';
import { createActor } from 'xstate';

export class InteractionManager {
  constructor(canvas, spatialIndex) {
    this.canvas = canvas;
    this.spatialIndex = spatialIndex;
    this.eventBus = new EventBus();
    
    // Create FSM with event bus context
    this.fsm = createInteractionStateMachine({
      eventBus: this.eventBus,
      dragThreshold: 3
    });
    
    this.service = null;
    this.isDestroyed = false;
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (this.isDestroyed) return;
    
    // Start the FSM service (XState v5 API)
    this.service = createActor(this.fsm);
    this.service.start();
    
    // Canvas event handlers - ALL events go through FSM
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointerleave', this.handlePointerUp.bind(this));
    
    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handlePointerDown(event) {
    if (this.isDestroyed) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    // Perform picking
    const target = this.pickAt(screenX, screenY);
    
    console.log('Pointer down:', { screen: { x: screenX, y: screenY }, target });
    
    this.service.send({
      type: 'POINTER_DOWN',
      screen: { x: screenX, y: screenY },
      target
    });
  }

  handlePointerMove(event) {
    if (this.isDestroyed) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    // Perform picking for hover
    const target = this.pickAt(screenX, screenY);
    
    this.service.send({
      type: 'POINTER_MOVE',
      screen: { x: screenX, y: screenY },
      target
    });
  }

  handlePointerUp(event) {
    if (this.isDestroyed) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    this.service.send({
      type: 'POINTER_UP',
      screen: { x: screenX, y: screenY }
    });
  }

  pickAt(screenX, screenY) {
    if (!this.spatialIndex) return null;
    
    // Use spatial index for picking
    const candidates = this.spatialIndex.query(screenX, screenY, 5); // 5 pixel tolerance
    
    if (candidates.length === 0) return null;
    
    // Return the first (topmost) candidate
    const node = candidates[0];
    return {
      type: 'node',
      node
    };
  }

  // Event bus methods for external listeners
  on(event, callback) {
    this.eventBus.on(event, callback);
  }

  off(event, callback) {
    this.eventBus.off(event, callback);
  }

  emit(event, data) {
    this.eventBus.emit(event, data);
  }

  destroy() {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Remove event listeners
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
    
    // Stop FSM service
    if (this.service) {
      this.service.stop();
      this.service = null;
    }
    
    // Clear event bus
    this.eventBus.destroy();
  }
}
