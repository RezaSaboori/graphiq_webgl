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
    constructor(gl, canvas, camera) {
        this.gl = gl;
        this.canvas = canvas;
        this.camera = camera;

        this.instancedRenderer = new InstancedNodeRenderer(gl, camera);
        this.edgeRenderer = new InstancedEdgeRenderer(gl, camera);
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
        this.a_world = gl.getAttribLocation(this.nodeProg, 'a_world');
        this.a_size = gl.getAttribLocation(this.nodeProg, 'a_size');
        this.u_screenFromWorld = gl.getUniformLocation(this.nodeProg, 'u_screenFromWorld');
        this.u_color = gl.getUniformLocation(this.nodeProg, 'u_color');

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
        if (this.camera?.setViewportSize)
        this.camera.setViewportSize(width, height);
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

    render(bgColor = [0.12, 0.12, 0.13, 1]) {
        if (!this.camera) return; // Prevent crashing if camera isn't ready

        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.drawBackground(bgColor);

        // === Instanced rendering for edges then nodes ===
        const { viewportWidth:w, viewportHeight:h, zoom, x, y } = this.camera;
        const sx = 2/(w/zoom), sy = 2/(h/zoom), tx = -sx*x-1, ty = -sy*y-1;
        const mat3 = new Float32Array([sx,0,0, 0,sy,0, tx,ty,1]);

        // Edges first (if graph available)
        if (this.graph && this.edgeRenderer && this.instancedRenderer) {
            const nodes = [...this.graph.nodes.values()];
            const edges = [...this.graph.edges.values()];
            const nodeMap = this.graph.nodes;
            this.edgeRenderer.updateEdges(edges, nodeMap);
            this.edgeRenderer.render(mat3);
            this.instancedRenderer.updateNodes(nodes);
        }
        this.instancedRenderer.render(mat3);
    }
}
