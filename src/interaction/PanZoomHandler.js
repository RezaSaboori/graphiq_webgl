// src/interaction/PanZoomHandler.js
export class PanZoomHandler {
    constructor(camera) {
      this.camera = camera;
      this.isInteracting = false;
      this.momentum = { x: 0, y: 0 };
      this.animationFrameId = null;
    }
  
    handlePanStart(event) {
      this.isInteracting = true;
      this.lastPointerPos = { x: event.screenX, y: event.screenY };
      this.momentum = { x: 0, y: 0 };
      
      // Cancel any ongoing momentum animation
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  
    handlePanMove(event) {
      if (!this.isInteracting) return;
      
      const deltaX = event.screenX - this.lastPointerPos.x;
      const deltaY = event.screenY - this.lastPointerPos.y;
      
      // Convert screen delta to world delta
      const worldDeltaX = deltaX / this.camera.zoom;
      const worldDeltaY = deltaY / this.camera.zoom;
      
      // Update camera position
      this.camera.panBy(-worldDeltaX, -worldDeltaY);
      
      // Track momentum for smooth deceleration
      this.momentum.x = -worldDeltaX * 0.1;
      this.momentum.y = -worldDeltaY * 0.1;
      
      this.lastPointerPos = { x: event.screenX, y: event.screenY };
    }
  
    handlePanEnd(event) {
      this.isInteracting = false;
      
      // Apply momentum if significant
      if (Math.abs(this.momentum.x) > 0.1 || Math.abs(this.momentum.y) > 0.1) {
        this.applyMomentum();
      }
    }
  
    handleZoom(event) {
      const zoomFactor = Math.pow(0.95, event.deltaY);
      const newZoom = Math.max(0.1, Math.min(5.0, this.camera.zoom * zoomFactor));
      
      // Zoom towards cursor position
      this.camera.zoomTo(newZoom, event.screenX, event.screenY);
    }
  
    applyMomentum() {
      const friction = 0.92;
      
      this.camera.panBy(this.momentum.x, this.momentum.y);
      this.momentum.x *= friction;
      this.momentum.y *= friction;
      
      // Continue momentum if still significant
      if (Math.abs(this.momentum.x) > 0.01 || Math.abs(this.momentum.y) > 0.01) {
        this.animationFrameId = requestAnimationFrame(() => this.applyMomentum());
      }
    }
}
