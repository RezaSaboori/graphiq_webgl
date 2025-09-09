// src/renderer/InstancedEdgeRenderer.js

import instancedEdgeVert from './shaders/instancedEdge.vert?raw';
import instancedEdgeFrag from './shaders/instancedEdge.frag?raw';
import { hexToRgbNorm } from './NodeGraphRenderer';

export class InstancedEdgeRenderer {
  constructor(gl, maxEdges = 50000) {
    this.gl = gl;
    this.maxEdges = maxEdges;
    this.edgeCount = 0;

    this.starts = new Float32Array(this.maxEdges * 2);
    this.ends   = new Float32Array(this.maxEdges * 2);
    this.colors = new Float32Array(this.maxEdges * 4);

    this.initBuffers();
    this.initShaders();
    this.dirty = true;
  }

  initBuffers() {
    const gl = this.gl;
    this.startBuffer = gl.createBuffer();
    this.endBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();
  }

  initShaders() {
    const gl = this.gl;

    // Compile shaders
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, instancedEdgeVert);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, instancedEdgeFrag);
    gl.compileShader(fragShader);

    // Link program
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertShader);
    gl.attachShader(this.program, fragShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this.program));
    }
  }

  updateEdges(edgeList, nodeMap) {
    this.edgeCount = edgeList.length;
    for (let i = 0; i < this.edgeCount; ++i) {
      const e = edgeList[i];
      const nFrom = nodeMap.get(e.fromId);
      const nTo = nodeMap.get(e.toId);
      const startIdx = i * 2, colorIdx = i * 4;

      // Use screen coordinates directly
      this.starts[startIdx] = nFrom.position.x;
      this.starts[startIdx + 1] = nFrom.position.y;
      this.ends[startIdx] = nTo.position.x;
      this.ends[startIdx + 1] = nTo.position.y;

      // Set color by edge type/color
      const hex = Object.values(e.type)[0] || "#888";
      const [r, g, b] = hexToRgbNorm(hex);
      this.colors[colorIdx] = r;
      this.colors[colorIdx + 1] = g;
      this.colors[colorIdx + 2] = b;
      this.colors[colorIdx + 3] = 1;
    }
    this.dirty = true;
  }

  uploadInstanceBuffers() {
    const gl = this.gl;
    // a_start
    gl.bindBuffer(gl.ARRAY_BUFFER, this.startBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.starts, gl.DYNAMIC_DRAW);
    // a_end
    gl.bindBuffer(gl.ARRAY_BUFFER, this.endBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.ends, gl.DYNAMIC_DRAW);
    // a_color
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.DYNAMIC_DRAW);

    this.dirty = false;
  }

  render(viewProjectionMatrix) {
    const gl = this.gl;
    if (this.edgeCount === 0) return;
    if (this.dirty) this.uploadInstanceBuffers();

    gl.useProgram(this.program);

    // Set the viewProjection matrix uniform
    const uViewProjectionLoc = gl.getUniformLocation(this.program, 'u_viewProjectionMatrix');
    if (uViewProjectionLoc) {
      gl.uniformMatrix4fv(uViewProjectionLoc, false, viewProjectionMatrix);
    }

    // Per-instance attrib setup
    const bind = (buffer, attrib, comps) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const loc = gl.getAttribLocation(this.program, attrib);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, comps, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(loc, 1); // Per-instance
      return loc;
    };
    const locs = [];
    locs.push(bind(this.startBuffer, "a_start", 2));
    locs.push(bind(this.endBuffer,   "a_end",   2));
    locs.push(bind(this.colorBuffer, "a_color", 4));

    // Each edge is a 2-vertex line; no base geometry needed
    gl.drawArraysInstanced(gl.LINES, 0, 2, this.edgeCount);

    // Clean up attribs
    for (const loc of locs) gl.disableVertexAttribArray(loc);
  }
}
