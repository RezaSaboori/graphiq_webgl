/**
 * DrawLoop: Centralized rendering system
 * Manages the requestAnimationFrame-based draw loop with dirty flag system
 * Ensures smooth, efficient rendering with proper cleanup
 */
export class DrawLoop {
  constructor(renderer) {
    this.renderer = renderer;
    this.dirty = false;
    this.animationFrameId = null;
    this.isRunning = false;
  }

  markDirty() {
    this.dirty = true;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.drawLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  drawLoop() {
    if (!this.isRunning) return;

    if (this.dirty) {
      this.renderer.render();
      this.dirty = false;
    }

    this.animationFrameId = requestAnimationFrame(() => this.drawLoop());
  }

  // Force an immediate render (useful for initial setup)
  renderNow() {
    this.renderer.render();
    this.dirty = false;
  }

  // Check if currently dirty
  isDirty() {
    return this.dirty;
  }
}
