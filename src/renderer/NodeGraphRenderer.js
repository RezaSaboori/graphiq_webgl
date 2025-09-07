import nodeVertSrc from './shaders/node.vert?raw';
import nodeFragSrc from './shaders/node.frag?raw';
import bgFragSrc from './shaders/background.frag?raw';
import { InstancedNodeRenderer } from './InstancedNodeRenderer';
import { InstancedEdgeRenderer } from './InstancedEdgeRenderer';


// Utility to compile shaders/programs
function createShader(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src.trimStart()); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(shader));
    return shader;
}
function createProgram(gl, vert, frag) {
    const prog = gl.createProgram();
    // Smallest unit quad for background (+nodes)
    const v = vert ? createShader(gl, gl.VERTEX_SHADER, vert) : null;
    const f = createShader(gl, gl.FRAGMENT_SHADER, frag);
    if (v) gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(prog));
    return prog;
}

// Helper: hex (#xxxxxx) to rgb [0,1]
export function hexToRgbNorm(hex) {
    hex = hex.replace('#','');
    if(hex.length===3) hex = hex.split('').map(x=>x+x).join('');
    const num = parseInt(hex, 16);
    return [(num>>16 & 255)/255, (num>>8 & 255)/255, (num&255)/255];
}

export class NodeGraphRenderer {
    constructor(gl, canvas) {
        this.gl = gl;
        this.canvas = canvas;
        this.camera = null; // Will be set by the main component

        this.instancedRenderer = new InstancedNodeRenderer(gl);
        this.edgeRenderer = new InstancedEdgeRenderer(gl);
        this.init();
    }
    init() {
        const gl = this.gl;

        // --- Background program (fullscreen quad, no vertex shader needed) ---
        const bgQuadVertSrc = `#version 300 es
        in vec2 a_position;
        void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;
        this.bgProg = createProgram(gl, bgQuadVertSrc, bgFragSrc);
        this.u_bgColor = gl.getUniformLocation(this.bgProg, 'u_bgColor');

        this.bgVbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bgVbo);
        // Fullscreen quad [-1,-1] - [1,1]
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
        1,  -1,
        -1,  1,
        1,   1
        ]), gl.STATIC_DRAW);

        // --- Node rendering program ---
        this.nodeProg = createProgram(gl, nodeVertSrc, nodeFragSrc);
        this.a_position = gl.getAttribLocation(this.nodeProg, 'a_position');
        this.a_screen = gl.getAttribLocation(this.nodeProg, 'a_screen');
        this.a_size = gl.getAttribLocation(this.nodeProg, 'a_size');
        this.u_color = gl.getUniformLocation(this.nodeProg, 'u_color');
        this.u_viewProjection = gl.getUniformLocation(this.nodeProg, 'u_viewProjectionMatrix');

        this.rectVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.rectVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -0.5,-0.5,
        0.5,-0.5,
        -0.5, 0.5,
        0.5, 0.5
        ]), gl.STATIC_DRAW);

        this.rectIBO = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.rectIBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,3]), gl.STATIC_DRAW);
    }

    setViewportSize(width, height) {
        this.gl.viewport(0, 0, width, height);
    }

    drawBackground(bgColor) {
        const gl = this.gl;
        gl.useProgram(this.bgProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bgVbo);

        const aPos = gl.getAttribLocation(this.bgProg, "a_position");
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        gl.uniform4fv(this.u_bgColor, bgColor);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.disableVertexAttribArray(aPos);
    }

    drawNode(worldX, worldY, width, height, color, viewProjectionMatrix) {
        const gl = this.gl;
        gl.useProgram(this.nodeProg);
        
        // Set viewProjection matrix
        if (this.u_viewProjection) {
            gl.uniformMatrix4fv(this.u_viewProjection, false, viewProjectionMatrix);
        }
        
        // Setup vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.rectVBO);
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);
        
        // Set instance data (position, size, color)
        gl.vertexAttrib2f(this.a_screen, worldX, worldY);
        gl.vertexAttrib2f(this.a_size, width, height);
        gl.uniform4fv(this.u_color, color);
        
        // Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.rectIBO);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        
        // Cleanup
        gl.disableVertexAttribArray(this.a_position);
    }

    render(bgColor = [0.12, 0.12, 0.13, 1]) {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.drawBackground(bgColor);

        // Use camera's viewProjection matrix for proper coordinate transformation
        const viewProjectionMatrix = this.camera ? this.camera.viewProjection : new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        // Edges first (if graph available)
        if (this.graph && this.edgeRenderer && this.instancedRenderer) {
            const nodes = [...this.graph.nodes.values()];
            const edges = [...this.graph.edges.values()];
            const nodeMap = this.graph.nodes;
            console.log('Renderer: Rendering nodes:', nodes.length, 'edges:', edges.length);
            this.edgeRenderer.updateEdges(edges, nodeMap);
            this.edgeRenderer.render(viewProjectionMatrix);
            this.instancedRenderer.updateNodes(nodes);
        }
        this.instancedRenderer.render(viewProjectionMatrix);
    }
}
