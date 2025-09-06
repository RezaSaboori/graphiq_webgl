// src/interaction/PickingSystem.js
export class PickingSystem {
    constructor(gl, camera) {
      this.gl = gl;
      this.camera = camera;
      
      // GPU picking setup
      this.pickingFramebuffer = this.createPickingFramebuffer();
      this.pickingShader = this.createPickingShader();
      
      // Spatial index for CPU fallback
      this.spatialIndex = new QuadTree();
    }
  
    async pickObjectAt(screenX, screenY) {
      // Use GPU picking for large graphs (>1000 nodes)
      if (this.shouldUseGPUPicking()) {
        return await this.gpuPick(screenX, screenY);
      } else {
        return this.cpuPick(screenX, screenY);
      }
    }
  
    async gpuPick(screenX, screenY) {
      // Render scene with object IDs as colors
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.pickingFramebuffer);
      this.renderPickingPass();
      
      // Read pixel color (async to avoid blocking)
      const pixel = new Uint8Array(4);
      this.gl.readPixels(screenX, screenY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
      
      // Decode object ID from color
      const objectId = this.decodeObjectId(pixel);
      return this.getObjectById(objectId);
    }
  
    cpuPick(screenX, screenY) {
      const worldPos = this.camera.screenToWorld(screenX, screenY);
      return this.spatialIndex.query(worldPos.x, worldPos.y);
    }
}
