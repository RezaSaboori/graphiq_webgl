// src/scene/DrawLoop.js
export class DrawLoop {
  constructor(renderer, sceneModel = null) {
    this.renderer = renderer;
    this.sceneModel = sceneModel;
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
      // Get background configuration from scene model or use defaults
      const backgroundConfig = this.sceneModel?.getBackgroundConfig?.();
      if (backgroundConfig) {
        this.renderer.render(
          backgroundConfig.backgroundColor,
          backgroundConfig.dotColor,
          backgroundConfig.dotSpacing,
          backgroundConfig.dotRadius
        );
      } else {
        this.renderer.render();
      }
      this.isDirty = false;
    }
    
    this.animationId = requestAnimationFrame(this.tick.bind(this));
  }
}
