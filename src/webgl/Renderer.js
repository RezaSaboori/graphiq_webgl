import { createShader, createProgram } from './utils/gl-helpers';
import { mat4 } from './utils/matrix';
import { getBoxToBoxCurve, interpolateCubicBezierAngle } from './utils/proto-arrows';

export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.programs = {};
    this.buffers = {};
    this.vaos = new Map();
    this.attribLocs = {};
    this.uniformLocs = {};
    
    // World constants
    this.WORLD_WIDTH = 1920;
    this.WORLD_HEIGHT = 1080;
    this.ARROW_SEGMENTS = 40;
    
    // Scene data
    this.cards = [];
    this.arrows = [];
  }

  init() {
    this.gl = this.canvas.getContext('webgl2');
    if (!this.gl) {
      throw new Error('WebGL2 not supported!');
    }

    this.setupShaders();
    this.setupBuffers();
    this.setupVAOs();
    
    // Set initial viewport
    this.resizeCanvas();
  }

  setupShaders() {
    // Card shaders
    const cardVertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, `#version 300 es
in vec2 a_position;
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;
void main() {
  gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 0.0, 1.0);
}`);

    const cardFragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
uniform vec4 u_color;
out vec4 outColor;
void main() {
  outColor = u_color;
}`);

    if (!cardVertexShader || !cardFragmentShader) {
      throw new Error('Failed to create card shaders');
    }

    this.programs.cards = createProgram(this.gl, cardVertexShader, cardFragmentShader);
    if (!this.programs.cards) {
      throw new Error('Failed to create card shader program');
    }

    // Arrow shaders
    const arrowVertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, `#version 300 es
in float a_t;
in vec2 a_p0;
in vec2 a_p1;
in vec2 a_p2;
in vec2 a_p3;
in vec4 a_color;
uniform mat4 u_projectionMatrix;
out vec4 v_color;

vec2 cubicBezier(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
  float t_inv = 1.0 - t;
  float t_inv_sq = t_inv * t_inv;
  float t_sq = t * t;
  return (t_inv_sq * t_inv * p0) +
         (3.0 * t_inv_sq * t * p1) +
         (3.0 * t_inv * t_sq * p2) +
         (t_sq * t * p3);
}

void main() {
  vec2 position = cubicBezier(a_p0, a_p1, a_p2, a_p3, a_t);
  gl_Position = u_projectionMatrix * vec4(position, 0.0, 1.0);
  v_color = a_color;
}`);

    const arrowFragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main() {
  outColor = v_color;
}`);

    if (!arrowVertexShader || !arrowFragmentShader) {
      throw new Error('Failed to create arrow shaders');
    }

    this.programs.arrows = createProgram(this.gl, arrowVertexShader, arrowFragmentShader);
    if (!this.programs.arrows) {
      throw new Error('Failed to create arrow shader program');
    }

    // Arrowhead shaders
    const arrowheadVertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, `#version 300 es
in vec2 a_position;
in vec2 a_translation;
in float a_rotation;
in vec4 a_color;
uniform mat4 u_projectionMatrix;
out vec4 v_color;

void main() {
  float c = cos(a_rotation);
  float s = sin(a_rotation);
  mat2 scale = mat2(20.0, 0.0, 0.0, 20.0);
  mat2 rotation = mat2(c, s, -s, c);
  
  vec2 final_pos = rotation * scale * a_position + a_translation;
  
  gl_Position = u_projectionMatrix * vec4(final_pos, 0.0, 1.0);
  v_color = a_color;
}`);

    const arrowheadFragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main() {
  outColor = v_color;
}`);

    if (!arrowheadVertexShader || !arrowheadFragmentShader) {
      throw new Error('Failed to create arrowhead shaders');
    }

    this.programs.arrowheads = createProgram(this.gl, arrowheadVertexShader, arrowheadFragmentShader);
    if (!this.programs.arrowheads) {
      throw new Error('Failed to create arrowhead shader program');
    }

    // Get attribute and uniform locations
    this.setupLocations();
  }

  setupLocations() {
    // Card locations
    this.attribLocs.cards = {
      position: this.gl.getAttribLocation(this.programs.cards, 'a_position')
    };
    this.uniformLocs.cards = {
      projection: this.gl.getUniformLocation(this.programs.cards, 'u_projectionMatrix'),
      modelView: this.gl.getUniformLocation(this.programs.cards, 'u_modelViewMatrix'),
      color: this.gl.getUniformLocation(this.programs.cards, 'u_color')
    };

    // Arrow locations
    this.attribLocs.arrows = {
      t: this.gl.getAttribLocation(this.programs.arrows, 'a_t'),
      p0: this.gl.getAttribLocation(this.programs.arrows, 'a_p0'),
      p1: this.gl.getAttribLocation(this.programs.arrows, 'a_p1'),
      p2: this.gl.getAttribLocation(this.programs.arrows, 'a_p2'),
      p3: this.gl.getAttribLocation(this.programs.arrows, 'a_p3'),
      color: this.gl.getAttribLocation(this.programs.arrows, 'a_color')
    };
    this.uniformLocs.arrows = {
      projection: this.gl.getUniformLocation(this.programs.arrows, 'u_projectionMatrix')
    };

    // Arrowhead locations
    this.attribLocs.arrowheads = {
      position: this.gl.getAttribLocation(this.programs.arrowheads, 'a_position'),
      translation: this.gl.getAttribLocation(this.programs.arrowheads, 'a_translation'),
      rotation: this.gl.getAttribLocation(this.programs.arrowheads, 'a_rotation'),
      color: this.gl.getAttribLocation(this.programs.arrowheads, 'a_color')
    };
    this.uniformLocs.arrowheads = {
      projection: this.gl.getUniformLocation(this.programs.arrowheads, 'u_projectionMatrix')
    };
  }

  setupBuffers() {
    // Quad buffer for cards
    this.buffers.quad = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.quad);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, 
      new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), 
      this.gl.STATIC_DRAW
    );

    // Arrow curve template buffer
    const tValues = [];
    for (let i = 0; i <= this.ARROW_SEGMENTS; i++) {
      tValues.push(i / this.ARROW_SEGMENTS);
    }
    this.buffers.arrowCurveTemplate = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.arrowCurveTemplate);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(tValues), this.gl.STATIC_DRAW);

    // Arrowhead template buffer
    this.buffers.arrowHeadTemplate = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.arrowHeadTemplate);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, 
      new Float32Array([-1, 0.5, 0, 0, -1, -0.5]), 
      this.gl.STATIC_DRAW
    );

    // Instance buffers
    this.buffers.arrowInstances = this.gl.createBuffer();
    this.buffers.arrowHeadInstances = this.gl.createBuffer();
  }

  setupVAOs() {
    // Card VAO
    const cardVao = this.gl.createVertexArray();
    this.gl.bindVertexArray(cardVao);
    this.gl.enableVertexAttribArray(this.attribLocs.cards.position);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.quad);
    this.gl.vertexAttribPointer(this.attribLocs.cards.position, 2, this.gl.FLOAT, false, 0, 0);
    this.vaos.set('cards', cardVao);

    // Arrow VAO
    const arrowVao = this.gl.createVertexArray();
    this.gl.bindVertexArray(arrowVao);
    this.gl.enableVertexAttribArray(this.attribLocs.arrows.t);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.arrowCurveTemplate);
    this.gl.vertexAttribPointer(this.attribLocs.arrows.t, 1, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.arrowInstances);
    const arrowStride = (4 * 2 + 4) * 4;
    
    this.gl.enableVertexAttribArray(this.attribLocs.arrows.p0);
    this.gl.vertexAttribPointer(this.attribLocs.arrows.p0, 2, this.gl.FLOAT, false, arrowStride, 0);
    this.gl.vertexAttribDivisor(this.attribLocs.arrows.p0, 1);
    
    this.gl.enableVertexAttribArray(this.attribLocs.arrows.p1);
    this.gl.vertexAttribPointer(this.attribLocs.arrows.p1, 2, this.gl.FLOAT, false, arrowStride, 8);
    this.gl.vertexAttribDivisor(this.attribLocs.arrows.p1, 1);
    
    this.gl.enableVertexAttribArray(this.attribLocs.arrows.p2);
    this.gl.vertexAttribPointer(this.attribLocs.arrows.p2, 2, this.gl.FLOAT, false, arrowStride, 16);
    this.gl.vertexAttribDivisor(this.attribLocs.arrows.p2, 1);
    
    this.gl.enableVertexAttribArray(this.attribLocs.arrows.p3);
    this.gl.vertexAttribPointer(this.attribLocs.arrows.p3, 2, this.gl.FLOAT, false, arrowStride, 24);
    this.gl.vertexAttribDivisor(this.attribLocs.arrows.p3, 1);
    
    this.gl.enableVertexAttribArray(this.attribLocs.arrows.color);
    this.gl.vertexAttribPointer(this.attribLocs.arrows.color, 4, this.gl.FLOAT, false, arrowStride, 32);
    this.gl.vertexAttribDivisor(this.attribLocs.arrows.color, 1);
    
    this.vaos.set('arrows', arrowVao);

    // Arrowhead VAO
    const arrowheadVao = this.gl.createVertexArray();
    this.gl.bindVertexArray(arrowheadVao);
    this.gl.enableVertexAttribArray(this.attribLocs.arrowheads.position);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.arrowHeadTemplate);
    this.gl.vertexAttribPointer(this.attribLocs.arrowheads.position, 2, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.arrowHeadInstances);
    const arrowheadStride = (2 + 1 + 4) * 4;
    
    this.gl.enableVertexAttribArray(this.attribLocs.arrowheads.translation);
    this.gl.vertexAttribPointer(this.attribLocs.arrowheads.translation, 2, this.gl.FLOAT, false, arrowheadStride, 0);
    this.gl.vertexAttribDivisor(this.attribLocs.arrowheads.translation, 1);
    
    this.gl.enableVertexAttribArray(this.attribLocs.arrowheads.rotation);
    this.gl.vertexAttribPointer(this.attribLocs.arrowheads.rotation, 1, this.gl.FLOAT, false, arrowheadStride, 8);
    this.gl.vertexAttribDivisor(this.attribLocs.arrowheads.rotation, 1);
    
    this.gl.enableVertexAttribArray(this.attribLocs.arrowheads.color);
    this.gl.vertexAttribPointer(this.attribLocs.arrowheads.color, 4, this.gl.FLOAT, false, arrowheadStride, 12);
    this.gl.vertexAttribDivisor(this.attribLocs.arrowheads.color, 1);
    
    this.vaos.set('arrowheads', arrowheadVao);

    this.gl.bindVertexArray(null);
  }

  updateScene(cards, arrows) {
    this.cards = cards;
    this.arrows = arrows;
  }

  render() {
    this.resizeCanvas();
    
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clearColor(0.1, 0.12, 0.15, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);
    
    const projectionMatrix = mat4.ortho(0, this.WORLD_WIDTH, this.WORLD_HEIGHT, 0, -1, 1);

    this.drawCards(projectionMatrix);
    this.drawInstancedArrows(projectionMatrix);
  }

  drawCards(projectionMatrix) {
    this.gl.useProgram(this.programs.cards);
    this.gl.bindVertexArray(this.vaos.get('cards'));
    this.gl.uniformMatrix4fv(this.uniformLocs.cards.projection, false, projectionMatrix);

    // Sort cards by ID for proper z-ordering
    const sortedCards = [...this.cards].sort((a, b) => a.id - b.id);

    sortedCards.forEach(card => {
      let z = -0.1 * card.id;
      
      let modelViewMatrix = mat4.create();
      modelViewMatrix = mat4.translate(modelViewMatrix, [card.x, card.y, z]);
      modelViewMatrix = mat4.scale(modelViewMatrix, [card.width, card.height, 1]);
      
      this.gl.uniformMatrix4fv(this.uniformLocs.cards.modelView, false, modelViewMatrix);
      this.gl.uniform4fv(this.uniformLocs.cards.color, card.color);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    });
    
    this.gl.bindVertexArray(null);
  }

  drawInstancedArrows(projectionMatrix) {
    if (this.arrows.length === 0) return;

    const arrowInstanceData = [];
    const arrowheadInstanceData = [];
    
    this.arrows.forEach(arrow => {
      const fromCard = this.cards.find(c => c.id === arrow.from);
      const toCard = this.cards.find(c => c.id === arrow.to);
      if (!fromCard || !toCard) return;

      const startBox = { x: fromCard.x, y: fromCard.y, w: fromCard.width, h: fromCard.height };
      const endBox = { x: toCard.x, y: toCard.y, w: toCard.width, h: toCard.height };
      const curve = getBoxToBoxCurve(startBox, endBox);

      arrowInstanceData.push(
        curve.start.x, curve.start.y,
        curve.control1.x, curve.control1.y,
        curve.control2.x, curve.control2.y,
        curve.end.x, curve.end.y,
        ...arrow.color
      );

      const endAngleRad = interpolateCubicBezierAngle(curve, 1) * (Math.PI / 180);
      arrowheadInstanceData.push(
        curve.end.x, curve.end.y,
        endAngleRad,
        ...arrow.color
      );
    });

    // Draw arrow curves
    this.gl.useProgram(this.programs.arrows);
    this.gl.uniformMatrix4fv(this.uniformLocs.arrows.projection, false, projectionMatrix);
    this.gl.bindVertexArray(this.vaos.get('arrows'));
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.arrowInstances);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrowInstanceData), this.gl.DYNAMIC_DRAW);
    this.gl.drawArraysInstanced(this.gl.LINE_STRIP, 0, this.ARROW_SEGMENTS + 1, this.arrows.length);

    // Draw arrowheads
    this.gl.useProgram(this.programs.arrowheads);
    this.gl.uniformMatrix4fv(this.uniformLocs.arrowheads.projection, false, projectionMatrix);
    this.gl.bindVertexArray(this.vaos.get('arrowheads'));
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.arrowHeadInstances);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrowheadInstanceData), this.gl.DYNAMIC_DRAW);
    this.gl.drawArraysInstanced(this.gl.LINE_STRIP, 0, 3, this.arrows.length);

    this.gl.bindVertexArray(null);
  }

  resizeCanvas() {
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
    }
  }
}
