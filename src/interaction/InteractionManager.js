// src/interaction/InteractionManager.js
import { createInteractionStateMachine } from './InteractionStateMachine.js';
import { EventBus } from './EventBus.js';
import { createActor } from 'xstate';

export class InteractionManager {
  constructor(canvas, spatialIndex, camera = null) {
    this.canvas = canvas;
    this.spatialIndex = spatialIndex;
    this.camera = camera;
    this.eventBus = new EventBus();
    
    // Create FSM with event bus context
    this.fsm = createInteractionStateMachine({
      eventBus: this.eventBus,
      dragThreshold: 3
    });
    
    this.service = null;
    this.isDestroyed = false;
    
    // Add for pan state
    this.canvasPanActive = false;
    this.lastPanScreen = null;
    
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
    
    // Add for zoom
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
  }

  handlePointerDown(event) {
    if (this.isDestroyed) return;
    
    // === PAN: Right-click or Space+Left-click
    if (event.button === 2 || (event.button === 0 && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey))) {
      this.canvasPanActive = true;
      this.lastPanScreen = { x: event.clientX, y: event.clientY };
      this.canvas.style.cursor = 'grab';
      return;
    }
    
    // Existing drag logic
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
    
    // === PANNING ===
    if (this.canvasPanActive && this.camera && this.lastPanScreen) {
      const dx = event.clientX - this.lastPanScreen.x;
      const dy = event.clientY - this.lastPanScreen.y;
      // Screen dx/dy → world dx/dy
      const before = this.camera.screenToWorld(this.lastPanScreen.x, this.lastPanScreen.y);
      const after = this.camera.screenToWorld(event.clientX, event.clientY);
      const wx = before.x - after.x;
      const wy = before.y - after.y;
      this.camera.setCenter(this.camera.position.x + wx, this.camera.position.y + wy);
      if (this.eventBus) this.eventBus.emit('cameraChanged');
      this.lastPanScreen = { x: event.clientX, y: event.clientY };
      return;
    }
    
    // Existing hover/drag logic
    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    // Perform picking for hover
    const target = this.pickAt(screenX, screenY);
    
    // Convert screen coordinates to world coordinates for drag/pan operations
    let worldPos = null;
    if (this.camera) {
      worldPos = this.camera.screenToWorld(screenX, screenY);
    }
    
    this.service.send({
      type: 'POINTER_MOVE',
      screen: { x: screenX, y: screenY },
      world: worldPos,
      target
    });
  }

  handlePointerUp(event) {
    if (this.canvasPanActive) {
      this.canvasPanActive = false;
      this.lastPanScreen = null;
      this.canvas.style.cursor = '';
      return;
    }
    
    // ...existing node drag up
    if (this.isDestroyed) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    this.service.send({
      type: 'POINTER_UP',
      screen: { x: screenX, y: screenY }
    });
  }

  handleWheel(event) {
    if (this.camera) {
      event.preventDefault();
      // Zoom relative to mouse pointer
      const rect = this.canvas.getBoundingClientRect();
      const sx = event.clientX - rect.left;
      const sy = event.clientY - rect.top;
      const worldBefore = this.camera.screenToWorld(sx, sy);
      // Clamp zoom
      let nextZoom = this.camera.zoom * (event.deltaY < 0 ? 1.1 : 0.9);
      nextZoom = Math.max(0.02, Math.min(10, nextZoom));
      this.camera.setZoom(nextZoom);
      // Keep the point under mouse stable
      const worldAfter = this.camera.screenToWorld(sx, sy);
      this.camera.setCenter(
        this.camera.position.x + (worldBefore.x - worldAfter.x),
        this.camera.position.y + (worldBefore.y - worldAfter.y)
      );
      if (this.eventBus) this.eventBus.emit('cameraChanged');
    }
  }

  pickAt(screenX, screenY) {
    if (!this.spatialIndex) return null;
    
    // Convert screen coordinates to world coordinates using camera
    let worldX, worldY;
    if (this.camera) {
      const world = this.camera.screenToWorld(screenX, screenY);
      worldX = world.x;
      worldY = world.y;
    } else {
      // Fallback to screen coordinates if no camera
      worldX = screenX;
      worldY = screenY;
    }
    
    // Use spatial index for picking in world coordinates
    const candidates = this.spatialIndex.query(worldX, worldY, 5); // 5 pixel tolerance
    
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
    this.canvas.removeEventListener('wheel', this.handleWheel);
    
    // Stop FSM service
    if (this.service) {
      this.service.stop();
      this.service = null;
    }
    
    // Clear event bus
    this.eventBus.destroy();
  }
}
