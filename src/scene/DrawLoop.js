// src/scene/DrawLoop.js
export class DrawLoop {
  constructor(renderer) {
    this.renderer = renderer;
    this.isRunning = false;
    this.animationId = null;
    this.isDirty = false;
  }

  markDirty() {
    this.isDirty = true;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.animationId = requestAnimationFrame(this.tick.bind(this));
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  tick() {
    if (!this.isRunning) return;
    
    if (this.isDirty) {
      this.renderer.render();
      this.isDirty = false;
    }
    
    this.animationId = requestAnimationFrame(this.tick.bind(this));
  }
}
