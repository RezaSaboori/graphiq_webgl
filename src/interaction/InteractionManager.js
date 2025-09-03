// src/interaction/InteractionManager.js

import { InteractionStateMachine } from './InteractionStateMachine';
import { throttle } from '../utils/debounce';

export class InteractionManager {
  constructor(canvas, camera, renderer) {
    this.canvas = canvas;
    this.camera = camera;
    this.renderer = renderer;

    // State machine for interaction modes (select, pan, drag, etc.)
    this.stateMachine = new InteractionStateMachine();

    // Internal event queue and processing flag
    this.eventQueue = [];
    this.isProcessing = false;

    // Current pointer state tracking
    this.lastPointer = null;
    this.pressed = false;

    // Bind all handlers to ensure correct "this"
    this.handlePointerEvent = this.handlePointerEvent.bind(this);
    this.handleWheelEvent = this.handleWheelEvent.bind(this);
    this.handleKeyEvent = this.handleKeyEvent.bind(this);
    this.processEventQueue = this.processEventQueue.bind(this);

    this.setupEventDelegation();
  }

  setupEventDelegation() {
    // Delegate pointer/touch/mouse events at document level for performance
    document.addEventListener('pointerdown', this.handlePointerEvent, { passive: false });
    document.addEventListener('pointermove', throttle(this.handlePointerEvent, 16), { passive: false }); // Throttle to ~60fps
    document.addEventListener('pointerup', this.handlePointerEvent, { passive: false });
    document.addEventListener('wheel', this.handleWheelEvent, { passive: false });
    document.addEventListener('keydown', this.handleKeyEvent, { passive: false });
  }

  handlePointerEvent(event) {
    // Ignore events not inside canvas (unless dragging)
    const rect = this.canvas.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!inside && !(this.pressed && event.type === 'pointermove')) {
      return;
    }

    // Calculate canvas and world coordinates
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const worldCoords = this.camera.screenToWorld(canvasX, canvasY);

    // Track pressed state
    if (event.type === 'pointerdown') this.pressed = true;
    if (event.type === 'pointerup' || event.type === 'pointercancel') this.pressed = false;

    // Save last pointer for delta calculations
    this.lastPointer = { canvasX, canvasY, time: performance.now() };

    // Queue event for later processing
    this.eventQueue.push({
      type: event.type,
      worldX: worldCoords.x,
      worldY: worldCoords.y,
      screenX: canvasX,
      screenY: canvasY,
      button: event.button,
      pressure: event.pressure,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      pointerId: event.pointerId,
      timestamp: performance.now(),
      originalEvent: event
    });

    // Start queue processing if not running
    if (!this.isProcessing) {
      this.isProcessing = true;
      this.processEventQueue();
    }
  }

  handleWheelEvent(event) {
    // Only handle wheel if pointer is over canvas
    const rect = this.canvas.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      return;
    }
    // Convert to canvas and world coordinates
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const worldCoords = this.camera.screenToWorld(canvasX, canvasY);

    // Queue wheel (zoom) event
    this.eventQueue.push({
      type: 'wheel',
      worldX: worldCoords.x,
      worldY: worldCoords.y,
      screenX: canvasX,
      screenY: canvasY,
      deltaY: event.deltaY,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      timestamp: performance.now(),
      originalEvent: event
    });

    if (!this.isProcessing) {
      this.isProcessing = true;
      this.processEventQueue();
    }
  }

  handleKeyEvent(event) {
    // Delegate all key events for shortcuts, multi-select, etc.
    this.eventQueue.push({
      type: 'keydown',
      key: event.key,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      timestamp: performance.now(),
      originalEvent: event
    });
    if (!this.isProcessing) {
      this.isProcessing = true;
      this.processEventQueue();
    }
  }

  // Main event processing loop with frame budgeting
  processEventQueue() {
    const frameBudget = 16; // ~60fps
    const start = performance.now();

    while (this.eventQueue.length > 0 && performance.now() - start < frameBudget) {
      const evt = this.eventQueue.shift();
      this.stateMachine.handleEvent(evt, this.camera, this.renderer);
    }

    if (this.eventQueue.length > 0) {
      // Continue processing next frame
      requestAnimationFrame(this.processEventQueue);
    } else {
      this.isProcessing = false;
    }
  }

  // Clean up on destruction
  dispose() {
    document.removeEventListener('pointerdown', this.handlePointerEvent);
    document.removeEventListener('pointermove', this.handlePointerEvent);
    document.removeEventListener('pointerup', this.handlePointerEvent);
    document.removeEventListener('wheel', this.handleWheelEvent);
    document.removeEventListener('keydown', this.handleKeyEvent);
    this.eventQueue = [];
    this.isProcessing = false;
  }
}
