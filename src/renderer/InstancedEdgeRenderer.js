// src/renderer/InstancedEdgeRenderer.js
export class InstancedEdgeRenderer {
    constructor(gl, camera, maxEdges = 50000) {
        this.gl = gl;
        this.camera = camera;
        this.maxEdges = maxEdges;
        this.edgeCount = 0;
    
        this.starts = new Float32Array(this.maxEdges * 2);
        this.ends   = new Float32Array(this.maxEdges * 2);
        this.colors = new Float32Array(this.maxEdges * 4);
    
        // Create and initialize buffer objects, compile and link shaders.
    // Similar to InstancedNodeRenderer.js
    }

    updateEdges(edgeList, nodeMap) {
        this.edgeCount = edgeList.length;
        for (let i = 0; i < edgeList.length; ++i) {
            // Get positions from nodeMap
            const e = edgeList[i];
            const nFrom = nodeMap.get(e.fromId);
            const nTo = nodeMap.get(e.toId);
            const startIdx = i*2, colorIdx = i*4;
    
            this.starts[startIdx] = nFrom.position.x;
            this.starts[startIdx+1] = nFrom.position.y;
            this.ends[startIdx]   = nTo.position.x;
            this.ends[startIdx+1] = nTo.position.y;
    
            // Set color by edge type/color
            const hex = Object.values(e.type)[0] || "#888";
            const [r,g,b] = hexToRgbNorm(hex);
            this.colors[colorIdx] = r;
            this.colors[colorIdx+1] = g;
            this.colors[colorIdx+2] = b;
            this.colors[colorIdx+3] = 1;
        }
        // Mark buffers dirty for upload
    }

    render(worldToScreenMat3) {
      // Similar pattern as node renderer: bind/program, attrib pointer, drawArraysInstanced
      // Each edge gets two vertices (start/end), gl.drawArraysInstanced
    }
}