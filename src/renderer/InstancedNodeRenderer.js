// src/renderer/InstancedNodeRenderer.js

import instancedNodeVert from './shaders/instancedNode.vert?raw';
import instancedNodeFrag from './shaders/instancedNode.frag?raw';
import { hexToRgbNorm } from './NodeGraphRenderer';

export class InstancedNodeRenderer {
    constructor(gl, maxNodes = 10000) {
        this.gl = gl;
        this.maxNodes = maxNodes;
        this.currentCount = 0;

        this.initBuffers();
        this.initShaders();
    }

    initBuffers() {
        const gl = this.gl;
        // Base quad [-0.5, 0.5]^2
        this.baseQuad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.baseQuad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -0.5, -0.5,
        0.5, -0.5,
        -0.5,  0.5,
        0.5,  0.5
        ]), gl.STATIC_DRAW);

        // Prepare instance buffers
        this.positionBuffer = gl.createBuffer();
        this.scaleBuffer    = gl.createBuffer();
        this.colorBuffer    = gl.createBuffer();
        this.stateBuffer    = gl.createBuffer(); // For selected/hover etc.

        // Each instance gets 2 floats for pos, 2 for scale, 4 for color, 1 for state
        this.positions = new Float32Array(this.maxNodes * 2);
        this.scales    = new Float32Array(this.maxNodes * 2);
        this.colors    = new Float32Array(this.maxNodes * 4);
        this.states    = new Int32Array(this.maxNodes);

        this.dirty = true; // Track if instance data changed
    }

    initShaders() {
        const gl = this.gl;
        
        // Compile shaders
        const vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, instancedNodeVert);
        gl.compileShader(vertShader);

        const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, instancedNodeFrag);
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

    updateNodes(nodes) {
        this.currentCount = nodes.length;
        for (let i = 0; i < this.currentCount; ++i) {
        const node = nodes[i];
        const posIdx = i * 2;
        const scaleIdx = i * 2;
        const colorIdx = i * 4;

        // Use screen coordinates directly
        this.positions[posIdx] = node.position.x;
        this.positions[posIdx + 1] = node.position.y;

        this.scales[scaleIdx] = node.width || 300;
        this.scales[scaleIdx + 1] = node.height || 100;

        const [r, g, b] = hexToRgbNorm(node.color || "#444");
        this.colors[colorIdx] = r;
        this.colors[colorIdx + 1] = g;
        this.colors[colorIdx + 2] = b;
        this.colors[colorIdx + 3] = 1;
        this.states[i] = node.selected ? 1 : 0;
        }
        this.dirty = true;
    }

    uploadInstanceBuffers() {
        const gl = this.gl;
        // Per-instance attributes: pos (2), scale (2), color (4), state (1)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.scaleBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.scales, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.stateBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.states, gl.DYNAMIC_DRAW);

        this.dirty = false;
    }

    render(viewProjectionMatrix) {
        const gl = this.gl;
        if (this.dirty) this.uploadInstanceBuffers();

        gl.useProgram(this.program);

        // Set the viewProjection matrix uniform
        const uViewProjectionLoc = gl.getUniformLocation(this.program, 'u_viewProjectionMatrix');
        if (uViewProjectionLoc) {
            gl.uniformMatrix4fv(uViewProjectionLoc, false, viewProjectionMatrix);
        }

        // Setup base quad - one vertex attrib
        gl.bindBuffer(gl.ARRAY_BUFFER, this.baseQuad);
        const aPosLoc = gl.getAttribLocation(this.program, "a_position");
        gl.enableVertexAttribArray(aPosLoc);
        gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(aPosLoc, 0); // Not instanced

        // Setup instanced attributes
        const bindInstAttr = (buffer, name, size, type, divisor, isInt) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        const loc = gl.getAttribLocation(this.program, name);
        gl.enableVertexAttribArray(loc);
        if (isInt) {
            gl.vertexAttribIPointer(loc, size, type, 0, 0);
        } else {
            gl.vertexAttribPointer(loc, size, type, false, 0, 0);
        }
        gl.vertexAttribDivisor(loc, divisor); // 1=per instance
        };
        bindInstAttr(this.positionBuffer, "a_instancePosition", 2, gl.FLOAT, 1);
        bindInstAttr(this.scaleBuffer, "a_instanceScale", 2, gl.FLOAT, 1);
        bindInstAttr(this.colorBuffer, "a_instanceColor", 4, gl.FLOAT, 1);
        bindInstAttr(this.stateBuffer, "a_instanceState", 1, gl.INT, 1, true);

        // Draw as instanced
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.currentCount);

        // Cleanup
        gl.disableVertexAttribArray(aPosLoc);
        // Also disable instanced attribs above...
    }
}
