import nodeVertSrc from './shaders/node.vert?raw';
import nodeFragSrc from './shaders/node.frag?raw';
import bgVertSrc from './shaders/background.vert?raw';
import bgFragSrc from './shaders/background.frag?raw';
import { InstancedNodeRenderer } from './InstancedNodeRenderer';
import { InstancedEdgeRenderer } from './InstancedEdgeRenderer';
import { LiquidGlassNodeRenderer } from './LiquidGlassNodeRenderer';
import { GlassNodeRenderer } from './GlassNodeRenderer';


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

// PHASE 2: Level-of-Detail computation based on camera zoom
export function computeLOD(camera) {
    if (!camera) return 'full';
    
    // **FIXED**: Very conservative LOD - only filter at extreme zoom out
    // Full detail at zoom>=0.1, medium at >=0.05, low at <0.05
    if (camera.zoom > 0.1) return 'full';
    if (camera.zoom > 0.05) return 'medium';
    return 'low'; // only at extreme zoom out
}

export class NodeGraphRenderer {
    constructor(gl, canvas) {
        this.gl = gl;
        this.canvas = canvas;
        this.camera = null; // Will be set by the main component
        this.spatialIndex = null; // Will be set by the main component

        this.instancedRenderer = new InstancedNodeRenderer(gl);
        this.edgeRenderer = new InstancedEdgeRenderer(gl);
        this.liquidGlassRenderer = new LiquidGlassNodeRenderer(gl, canvas.width, canvas.height);
        this.glassRenderer = new GlassNodeRenderer(gl);

        // Rendering mode and toggles
        this.renderingMode = 'liquid_glass';
        this.showRectangleNodes = false;
        this.init();
    }
    init() {
        const gl = this.gl;

        // --- Background program (fullscreen quad with dotted pattern) ---
        this.bgProg = createProgram(gl, bgVertSrc, bgFragSrc);
        this.u_bgColor = gl.getUniformLocation(this.bgProg, 'u_bgColor');
        this.u_dotColor = gl.getUniformLocation(this.bgProg, 'u_dotColor');
        this.u_resolution = gl.getUniformLocation(this.bgProg, 'u_resolution');
        this.u_dotSpacing = gl.getUniformLocation(this.bgProg, 'u_dotSpacing');
        this.u_dotRadius = gl.getUniformLocation(this.bgProg, 'u_dotRadius');

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
        this.liquidGlassRenderer.setViewportSize(width, height);
    }

    setRenderingMode(mode) {
        const modes = ['rectangle', 'glass', 'liquid_glass'];
        if (modes.includes(mode)) this.renderingMode = mode;
    }

    setShowRectangleNodes(show) {
        this.showRectangleNodes = !!show;
    }

    drawBackground(bgColor, dotColor = [0.8, 0.8, 0.8, 1.0], dotSpacing = 20.0, dotRadius = 2.5) {
        const gl = this.gl;
        gl.useProgram(this.bgProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bgVbo);

        const aPos = gl.getAttribLocation(this.bgProg, "a_position");
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        // Set uniforms for dotted background
        gl.uniform4fv(this.u_bgColor, bgColor);
        gl.uniform4fv(this.u_dotColor, dotColor);
        gl.uniform2f(this.u_resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.u_dotSpacing, dotSpacing);
        gl.uniform1f(this.u_dotRadius, dotRadius);
        
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

    /**
     * Update z-order for a node (useful when dragging)
     * @param {string} nodeId - ID of the node to update
     * @param {number} newZ - New z-index value
     */
    updateNodeZOrder(nodeId, newZ) {
        if (this.graph && this.graph.nodes.has(nodeId)) {
            const node = this.graph.nodes.get(nodeId);
            node.z = newZ;
        }
    }

    /**
     * Bring node to front (highest z-order)
     * @param {string} nodeId - ID of the node to bring to front
     */
    bringNodeToFront(nodeId) {
        if (this.graph) {
            // Find the highest z-order among all nodes
            const allNodes = [...this.graph.nodes.values()];
            const maxZ = Math.max(...allNodes.map(n => n.z || 0), 0);
            this.updateNodeZOrder(nodeId, maxZ + 1);
        }
    }

    render(bgColor = [0.12, 0.12, 0.13, 1], dotColor = [0.8, 0.8, 0.8, 1.0], dotSpacing = 20.0, dotRadius = 2.5) {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.drawBackground(bgColor, dotColor, dotSpacing, dotRadius);

        // Use camera's viewProjection matrix for proper coordinate transformation
        const viewProjectionMatrix = this.camera ? this.camera.viewProjection : new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        // Edges first (if graph available)
        if (this.graph && this.edgeRenderer && this.instancedRenderer) {
            // **NEW**: Use visible nodes only for frustum culling
            const allNodes = [...this.graph.nodes.values()];
            let visibleNodes = this.spatialIndex && this.camera ?
                this.spatialIndex.getVisibleNodes(this.camera)
                : allNodes;
            
            // **FIXED**: Fallback - if no nodes are visible, show all nodes (debugging)
            if (visibleNodes.length === 0 && allNodes.length > 0) {
                visibleNodes = allNodes;
            }
            
            // **FIXED**: Apply LOD filtering based on camera zoom
            const lod = computeLOD(this.camera);
            let lodFilteredNodes = visibleNodes;
            
            // **SAFETY**: If zoom is reasonable (>0.1), always show all visible nodes
            if (this.camera && this.camera.zoom > 0.1) {
                lodFilteredNodes = visibleNodes; // Show all visible nodes
            } else {
                // Only apply LOD filtering at extreme zoom out
                if (lod === 'low') {
                    // At low LOD, only show a subset of nodes (every 4th node for example)
                    lodFilteredNodes = visibleNodes.filter((_, index) => index % 4 === 0);
                } else if (lod === 'medium') {
                    // At medium LOD, show every 2nd node
                    lodFilteredNodes = visibleNodes.filter((_, index) => index % 2 === 0);
                }
                // At 'full' LOD, show all visible nodes
            }
            
            // **FIXED**: Edges should connect ALL visible nodes (frustum culled), not LOD-filtered nodes
            // This ensures relationships between visible nodes are always shown
            const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
            const allEdges = [...this.graph.edges.values()];
            const visibleEdges = allEdges.filter(e =>
                visibleNodeIds.has(e.fromId) && visibleNodeIds.has(e.toId)
            );

            // Update only visible for renderer
            // Create a map of only visible nodes for edge rendering
            const visibleNodeMap = new Map();
            visibleNodes.forEach(node => {
                visibleNodeMap.set(node.id, node);
            });
            
            this.edgeRenderer.updateEdges(visibleEdges, visibleNodeMap);
            this.edgeRenderer.render(viewProjectionMatrix);

            const sortedNodes = lodFilteredNodes.sort((a, b) => (a.z || 0) - (b.z || 0));

            // 🔧 FIXED RENDERING MODE LOGIC
            if (this.renderingMode === 'rectangle') {
                // Always render rectangle nodes when in rectangle mode
                this.instancedRenderer.updateNodes(sortedNodes);
                this.instancedRenderer.render(viewProjectionMatrix);
                
                // Optionally render additional rectangles if toggle is on
                if (this.showRectangleNodes) {
                    // Additional rectangle rendering if needed
                }
                return;
            }

            if (this.renderingMode === 'glass') {
                // Optional rectangle rendering
                if (this.showRectangleNodes) {
                    this.instancedRenderer.updateNodes(sortedNodes);
                    this.instancedRenderer.render(viewProjectionMatrix);
                }
                // Always render glass nodes
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                this.glassRenderer.updateNodes(sortedNodes);
                this.glassRenderer.render(viewProjectionMatrix);
                gl.disable(gl.BLEND);
                return;
            }

            // 🔧 FIXED LIQUID_GLASS mode - Always render liquid glass nodes
            if (this.renderingMode === 'liquid_glass') {
                // Always render liquid glass nodes
                for (const node of sortedNodes) {
                    const sceneRenderCallback = () => {
                        this.drawBackground(bgColor, dotColor, dotSpacing, dotRadius);
                        this.edgeRenderer.render(viewProjectionMatrix);
                        
                        // Only render other rectangle nodes if toggle is on
                        if (this.showRectangleNodes) {
                            const otherNodes = sortedNodes.filter(n => n.id !== node.id);
                            this.instancedRenderer.updateNodes(otherNodes);
                            this.instancedRenderer.render(viewProjectionMatrix);
                        }
                    };

                    this.liquidGlassRenderer.drawNode(
                        node.position.x,
                        node.position.y,
                        node.width || 300,
                        node.height || 100,
                        node.z || 0,
                        sceneRenderCallback,
                        this.camera
                    );
                }
                return;
            }
        }
    }
}
