import vertexShaderSrc from './shaders/vertex.glsl?raw';
import fragmentGlassMainSrc from './shaders/fragment-main.glsl?raw';
import fragmentBgVBlur from './shaders/fragment-bg-vblur.glsl?raw';
import fragmentBgHBlur from './shaders/fragment-bg-hblur.glsl?raw';

// Glass effect uniforms - shared across all nodes
export const GLASS_UNIFORMS = {
  refThickness: 20,
  refFactor: 1.4,
  refDispersion: 7,
  refFresnelRange: 30,
  refFresnelHardness: 20,
  refFresnelFactor: 20,
  glareRange: 30,
  glareHardness: 20,
  glareFactor: 90,
  glareConvergence: 50,
  glareOppositeFactor: 80,
  glareAngle: -45,
  blurRadius: 1,
  tint: [1.0, 1.0, 1.0, 0.2], // RGBA normalized
  shadowExpand: 25,
  shadowFactor: 15,
  shadowPosition: [0, -10],
  shapeWidth: 200,
  shapeHeight: 200,
  shapeRadius: 80,
  shapeRoundness: 5,
  mergeRate: 0.05,
  showShape1: 1,
  step: 9,
};

export class LiquidGlassNodeRenderer {
  constructor(gl, width, height) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.initFramebuffers();
    this.compileShaders();
    this.setupQuad();
    this.setupBlurWeights();
  }

  initFramebuffers() {
    const gl = this.gl;
    // 1. BG snapshot (sharp background)
    this.bgFbo = this._createFboWithTex();
    // 2. Blur passes
    this.hBlurFbo = this._createFboWithTex();
    this.vBlurFbo = this._createFboWithTex();
  }

  _createFboWithTex() {
    const gl = this.gl;
    const fbo = gl.createFramebuffer();
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex };
  }

  compileShaders() {
    // Debug shader source presence
    if (window.DEBUG_LIQUID_GLASS) {
      try {
        console.log('🔍 Checking shader imports...');
        console.log('vertexShaderSrc length:', vertexShaderSrc ? vertexShaderSrc.length : 'MISSING');
        console.log('fragmentGlassMainSrc length:', fragmentGlassMainSrc ? fragmentGlassMainSrc.length : 'MISSING');
        console.log('fragmentBgHBlur length:', fragmentBgHBlur ? fragmentBgHBlur.length : 'MISSING');
        console.log('fragmentBgVBlur length:', fragmentBgVBlur ? fragmentBgVBlur.length : 'MISSING');
      } catch (_) {}
    }

    if (!vertexShaderSrc || !fragmentGlassMainSrc) {
      console.error('❌ Critical shader files are missing!');
      throw new Error('Required shader files not found');
    }

    this.vertProgram = this._createProgram(vertexShaderSrc, fragmentGlassMainSrc);
    this.hBlurProgram = this._createProgram(vertexShaderSrc, fragmentBgHBlur);
    this.vBlurProgram = this._createProgram(vertexShaderSrc, fragmentBgVBlur);
  }

  _createProgram(vertSrc, fragSrc) {
    const gl = this.gl;
    function compile(type, src) {
      if (window.DEBUG_LIQUID_GLASS) {
        try {
          console.log(`Compiling ${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader...`);
          console.log('Shader source length:', src ? src.length : 'MISSING');
        } catch (_) {}
      }
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        console.error(`Shader compilation error (${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'}):`, error);
        if (window.DEBUG_LIQUID_GLASS) {
          try { console.error('Shader source:', src); } catch (_) {}
        }
        throw new Error(error);
      }
      if (window.DEBUG_LIQUID_GLASS) {
        try { console.log(`✅ ${type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment'} shader compiled successfully`); } catch (_) {}
      }
      return shader;
    }
    const v = compile(gl.VERTEX_SHADER, vertSrc);
    const f = compile(gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(prog);
      console.error('Program linking error:', error);
      throw new Error(error);
    }
    if (window.DEBUG_LIQUID_GLASS) {
      try { console.log('✅ Shader program linked successfully'); } catch (_) {}
    }
    return prog;
  }

  setupQuad() {
    const gl = this.gl;
    // Fullscreen quad for post-processing (vec4 coordinates)
    this.quadVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 1,
       1, -1, 0, 1,
      -1,  1, 0, 1,
       1,  1, 0, 1
    ]), gl.STATIC_DRAW);
  }

  setupBlurWeights() {
    // Gaussian blur weights
    const radius = GLASS_UNIFORMS.blurRadius;
    this.blurWeights = new Float32Array(radius + 1);
    let sum = 0;
    for (let i = 0; i <= radius; i++) {
      const weight = Math.exp(-(i * i) / (2 * radius * radius));
      this.blurWeights[i] = weight;
      sum += weight;
    }
    // Normalize weights
    for (let i = 0; i <= radius; i++) {
      this.blurWeights[i] /= sum;
    }
  }

  drawQuad() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    const aPos = gl.getAttribLocation(program, "a_position");
    if (window.DEBUG_LIQUID_GLASS) {
      try {
        console.log('🔍 DrawQuad Debug:');
        console.log('- Current program:', program);
        console.log('- a_position location:', aPos);
        console.log('- VBO bound:', this.quadVBO);
      } catch (_) {}
    }
    if (aPos >= 0) {
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 4, gl.FLOAT, false, 0, 0);
    } else {
      console.error('❌ a_position attribute not found!');
      return;
    }
    // Ensure blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    if (window.DEBUG_LIQUID_GLASS) {
      try { console.log('- About to draw...'); } catch (_) {}
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (window.DEBUG_LIQUID_GLASS) {
      try { console.log('- Draw call completed'); } catch (_) {}
    }
    const drawError = gl.getError();
    if (drawError !== gl.NO_ERROR) {
      console.error('❌ WebGL error during draw:', drawError);
    }
    if (aPos >= 0) {
      gl.disableVertexAttribArray(aPos);
    }
  }

  setViewportSize(width, height) {
    this.width = width;
    this.height = height;
    // Recreate framebuffers with new size
    this.initFramebuffers();
  }

  /**
   * Main function to render a "glass node"
   * @param {number} x node x position in world coordinates
   * @param {number} y node y position in world coordinates
   * @param {number} width node width
   * @param {number} height node height
   * @param {number} z z-index for sorting
   * @param {Function} sceneRenderCallback function to render the scene excluding this node
   * @param {Object} camera camera object with viewProjection matrix
   */
  drawNode(x, y, width, height, z, sceneRenderCallback, camera) {
    const gl = this.gl;

    // Convert world coordinates to screen coordinates using camera
    const screenPos = this.worldToScreen(x, y, camera);
    const screenSize = this.worldToScreenSize(width, height, camera);

    // Optional debug logging
    if (window.DEBUG_LIQUID_GLASS) {
      console.log('Drawing liquid glass node:', {
        world: { x, y, width, height, z },
        screen: { pos: screenPos, size: screenSize },
      });
    }

    // Early-out if completely out of viewport (skip when DEBUG_LIQUID_GLASS is enabled)
    if (!window.DEBUG_LIQUID_GLASS) {
      if (
        screenPos.x + screenSize.x * 0.5 < 0 ||
        screenPos.x - screenSize.x * 0.5 > this.width ||
        screenPos.y + screenSize.y * 0.5 < 0 ||
        screenPos.y - screenSize.y * 0.5 > this.height
      ) {
        return;
      }
    } else {
      console.log('LiquidGlassNodeRenderer culling bypass (debug):', {
        world: { x, y, width, height, z },
        screen: { pos: screenPos, size: screenSize },
        viewport: { width: this.width, height: this.height }
      });
    }

    // 1. SNAPSHOT BG (EXCLUDE NODE)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bgFbo.fbo);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Render scene excluding this node
    if (sceneRenderCallback) {
      sceneRenderCallback();
    }

    // 2. HORIZONTAL BLUR PASS
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.hBlurFbo.fbo);
    gl.useProgram(this.hBlurProgram);
    
    // Set uniforms for horizontal blur
    const hBlurUniforms = this.getBlurUniforms(this.hBlurProgram, this.bgFbo.tex);
    this.setBlurUniforms(hBlurUniforms);
    
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.drawQuad();

    // 3. VERTICAL BLUR PASS
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.vBlurFbo.fbo);
    gl.useProgram(this.vBlurProgram);
    
    // Set uniforms for vertical blur
    const vBlurUniforms = this.getBlurUniforms(this.vBlurProgram, this.hBlurFbo.tex);
    this.setBlurUniforms(vBlurUniforms);
    
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.drawQuad();

    // 4. GLASS MAIN PASS
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Render to main framebuffer
    gl.useProgram(this.vertProgram);
    // Ensure blending for transparency and disable depth test for overlays
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    if (window.DEBUG_LIQUID_GLASS) {
      try {
        console.log('🔍 WebGL Debug - Glass Pass:');
        console.log('- Program valid:', gl.getProgramParameter(this.vertProgram, gl.LINK_STATUS));
        console.log('- Current program bound:', gl.getParameter(gl.CURRENT_PROGRAM) === this.vertProgram);
      } catch (_) {}
    }
    
    // Check for WebGL errors
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error('WebGL error before glass pass:', error);
    }
    
    // Set up scissor test to only render within node bounds
    // WebGL scissor origin is bottom-left; convert from top-left screen Y
    const halfW = screenSize.x * 0.5;
    const halfH = screenSize.y * 0.5;
    const scissorX = Math.max(0, Math.floor(screenPos.x - halfW));
    const scissorYTopLeft = Math.max(0, Math.floor(screenPos.y - halfH));
    const scissorY = Math.max(0, Math.floor(this.height - (scissorYTopLeft + screenSize.y)));
    const scissorWidth = Math.max(0, Math.min(this.width - scissorX, Math.ceil(screenSize.x)));
    const scissorHeight = Math.max(0, Math.min(this.height - scissorY, Math.ceil(screenSize.y)));
    
    if (window.DEBUG_LIQUID_GLASS) {
      console.log('Scissor bounds:', { scissorX, scissorY, scissorWidth, scissorHeight });
    }
    
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(scissorX, scissorY, scissorWidth, scissorHeight);
    
    // Set glass uniforms
    this.setGlassUniforms(screenPos, screenSize, camera, z);
    if (window.DEBUG_LIQUID_GLASS) {
      try {
        console.log('- About to draw quad for node at:', screenPos);
        console.log('- Scissor enabled:', gl.isEnabled(gl.SCISSOR_TEST));
        console.log('- Scissor box:', gl.getParameter(gl.SCISSOR_BOX));
      } catch (_) {}
    }
    
    this.drawQuad();
    
    // Check for WebGL errors after drawing
    const errorAfter = gl.getError();
    if (errorAfter !== gl.NO_ERROR) {
      console.error('WebGL error after glass pass:', errorAfter);
    }
    
    gl.disable(gl.SCISSOR_TEST);
  }

  getBlurUniforms(program, sourceTexture) {
    const gl = this.gl;
    return {
      u_prevPassTexture: gl.getUniformLocation(program, 'u_prevPassTexture'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_blurRadius: gl.getUniformLocation(program, 'u_blurRadius'),
      u_blurWeights: gl.getUniformLocation(program, 'u_blurWeights'),
      sourceTexture: sourceTexture
    };
  }

  setBlurUniforms(uniforms) {
    const gl = this.gl;
    gl.uniform1i(uniforms.u_prevPassTexture, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, uniforms.sourceTexture);
    gl.uniform2f(uniforms.u_resolution, this.width, this.height);
    gl.uniform1i(uniforms.u_blurRadius, GLASS_UNIFORMS.blurRadius);
    gl.uniform1fv(uniforms.u_blurWeights, this.blurWeights);
  }

  setGlassUniforms(screenPos, screenSize, camera, zIndex) {
    const gl = this.gl;
    
    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.bgFbo.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.vBlurFbo.tex);

    // Set all glass uniforms
    const uniforms = {
      u_blurredBg: gl.getUniformLocation(this.vertProgram, 'u_blurredBg'),
      u_bg: gl.getUniformLocation(this.vertProgram, 'u_bg'),
      u_resolution: gl.getUniformLocation(this.vertProgram, 'u_resolution'),
      u_dpr: gl.getUniformLocation(this.vertProgram, 'u_dpr'),
      u_mouse: gl.getUniformLocation(this.vertProgram, 'u_mouse'),
      u_mouseSpring: gl.getUniformLocation(this.vertProgram, 'u_mouseSpring'),
      u_mergeRate: gl.getUniformLocation(this.vertProgram, 'u_mergeRate'),
      u_shapeWidth: gl.getUniformLocation(this.vertProgram, 'u_shapeWidth'),
      u_shapeHeight: gl.getUniformLocation(this.vertProgram, 'u_shapeHeight'),
      u_shapeRadius: gl.getUniformLocation(this.vertProgram, 'u_shapeRadius'),
      u_shapeRoundness: gl.getUniformLocation(this.vertProgram, 'u_shapeRoundness'),
      u_tint: gl.getUniformLocation(this.vertProgram, 'u_tint'),
      u_refThickness: gl.getUniformLocation(this.vertProgram, 'u_refThickness'),
      u_refFactor: gl.getUniformLocation(this.vertProgram, 'u_refFactor'),
      u_refDispersion: gl.getUniformLocation(this.vertProgram, 'u_refDispersion'),
      u_refFresnelRange: gl.getUniformLocation(this.vertProgram, 'u_refFresnelRange'),
      u_refFresnelFactor: gl.getUniformLocation(this.vertProgram, 'u_refFresnelFactor'),
      u_refFresnelHardness: gl.getUniformLocation(this.vertProgram, 'u_refFresnelHardness'),
      u_glareRange: gl.getUniformLocation(this.vertProgram, 'u_glareRange'),
      u_glareConvergence: gl.getUniformLocation(this.vertProgram, 'u_glareConvergence'),
      u_glareOppositeFactor: gl.getUniformLocation(this.vertProgram, 'u_glareOppositeFactor'),
      u_glareFactor: gl.getUniformLocation(this.vertProgram, 'u_glareFactor'),
      u_glareHardness: gl.getUniformLocation(this.vertProgram, 'u_glareHardness'),
      u_glareAngle: gl.getUniformLocation(this.vertProgram, 'u_glareAngle'),
      u_showShape1: gl.getUniformLocation(this.vertProgram, 'u_showShape1'),
      STEP: gl.getUniformLocation(this.vertProgram, 'STEP'),
      // Per-node arrays (use [0] for base address)
      u_nodeCount: gl.getUniformLocation(this.vertProgram, 'u_nodeCount'),
      u_nodePositions0: gl.getUniformLocation(this.vertProgram, 'u_nodePositions[0]'),
      u_nodeWidths0: gl.getUniformLocation(this.vertProgram, 'u_nodeWidths[0]'),
      u_nodeHeights0: gl.getUniformLocation(this.vertProgram, 'u_nodeHeights[0]'),
      u_nodeRadius0: gl.getUniformLocation(this.vertProgram, 'u_nodeRadius[0]'),
      u_nodeRoundness0: gl.getUniformLocation(this.vertProgram, 'u_nodeRoundness[0]'),
      u_nodeZIndex0: gl.getUniformLocation(this.vertProgram, 'u_nodeZIndex[0]')
    };

    // Set texture uniforms
    gl.uniform1i(uniforms.u_blurredBg, 1);
    gl.uniform1i(uniforms.u_bg, 0);

    // Set resolution and DPR
    gl.uniform2f(uniforms.u_resolution, this.width, this.height);
    gl.uniform1f(uniforms.u_dpr, window.devicePixelRatio || 1);

    // Set mouse/center position (convert to bottom-left origin)
    const centerX = screenPos.x;
    const centerY = this.height - screenPos.y;
    gl.uniform2f(uniforms.u_mouse, centerX, centerY);
    gl.uniform2f(uniforms.u_mouseSpring, centerX, centerY);

    // Set shape parameters
    gl.uniform1f(uniforms.u_mergeRate, GLASS_UNIFORMS.mergeRate);
    gl.uniform1f(uniforms.u_shapeWidth, screenSize.x);
    gl.uniform1f(uniforms.u_shapeHeight, screenSize.y);
    gl.uniform1f(uniforms.u_shapeRadius, GLASS_UNIFORMS.shapeRadius);
    gl.uniform1f(uniforms.u_shapeRoundness, GLASS_UNIFORMS.shapeRoundness);
    gl.uniform4fv(uniforms.u_tint, GLASS_UNIFORMS.tint);

    // Set refraction parameters
    gl.uniform1f(uniforms.u_refThickness, GLASS_UNIFORMS.refThickness);
    gl.uniform1f(uniforms.u_refFactor, GLASS_UNIFORMS.refFactor);
    gl.uniform1f(uniforms.u_refDispersion, GLASS_UNIFORMS.refDispersion);
    gl.uniform1f(uniforms.u_refFresnelRange, GLASS_UNIFORMS.refFresnelRange);
    gl.uniform1f(uniforms.u_refFresnelFactor, GLASS_UNIFORMS.refFresnelFactor);
    gl.uniform1f(uniforms.u_refFresnelHardness, GLASS_UNIFORMS.refFresnelHardness);

    // Set glare parameters
    gl.uniform1f(uniforms.u_glareRange, GLASS_UNIFORMS.glareRange);
    gl.uniform1f(uniforms.u_glareConvergence, GLASS_UNIFORMS.glareConvergence);
    gl.uniform1f(uniforms.u_glareOppositeFactor, GLASS_UNIFORMS.glareOppositeFactor);
    gl.uniform1f(uniforms.u_glareFactor, GLASS_UNIFORMS.glareFactor);
    gl.uniform1f(uniforms.u_glareHardness, GLASS_UNIFORMS.glareHardness);
    gl.uniform1f(uniforms.u_glareAngle, GLASS_UNIFORMS.glareAngle);

    // Set other parameters
    gl.uniform1i(uniforms.u_showShape1, GLASS_UNIFORMS.showShape1);
    gl.uniform1i(uniforms.STEP, GLASS_UNIFORMS.step);

    // Per-node data (pass a single node for now)
    if (
      uniforms.u_nodeCount &&
      uniforms.u_nodePositions0 &&
      uniforms.u_nodeWidths0 &&
      uniforms.u_nodeHeights0 &&
      uniforms.u_nodeRadius0 &&
      uniforms.u_nodeRoundness0 &&
      uniforms.u_nodeZIndex0
    ) {
      const centerX = screenPos.x;
      const centerY = this.height - screenPos.y;
      const positions = new Float32Array([centerX, centerY]);
      const widths = new Float32Array([screenSize.x]);
      const heights = new Float32Array([screenSize.y]);
      const radii = new Float32Array([GLASS_UNIFORMS.shapeRadius]);
      const roundness = new Float32Array([GLASS_UNIFORMS.shapeRoundness]);
      const zIndices = new Int32Array([typeof zIndex === 'number' ? zIndex : 0]);

      gl.uniform1i(uniforms.u_nodeCount, 1);
      gl.uniform2fv(uniforms.u_nodePositions0, positions);
      gl.uniform1fv(uniforms.u_nodeWidths0, widths);
      gl.uniform1fv(uniforms.u_nodeHeights0, heights);
      gl.uniform1fv(uniforms.u_nodeRadius0, radii);
      gl.uniform1fv(uniforms.u_nodeRoundness0, roundness);
      gl.uniform1iv(uniforms.u_nodeZIndex0, zIndices);
    }
  }

  worldToScreen(worldX, worldY, camera) {
    if (!camera || typeof camera.worldToScreen !== 'function') {
      return { x: worldX, y: worldY };
    }
    return camera.worldToScreen(worldX, worldY);
  }

  worldToScreenSize(worldWidth, worldHeight, camera) {
    if (!camera || typeof camera.worldToScreen !== 'function') {
      return { x: worldWidth, y: worldHeight };
    }
    const p1 = camera.worldToScreen(0, 0);
    const p2 = camera.worldToScreen(worldWidth, worldHeight);
    return { x: Math.abs(p2.x - p1.x), y: Math.abs(p2.y - p1.y) };
  }

  dispose() {
    const gl = this.gl;
    if (this.bgFbo) {
      gl.deleteFramebuffer(this.bgFbo.fbo);
      gl.deleteTexture(this.bgFbo.tex);
    }
    if (this.hBlurFbo) {
      gl.deleteFramebuffer(this.hBlurFbo.fbo);
      gl.deleteTexture(this.hBlurFbo.tex);
    }
    if (this.vBlurFbo) {
      gl.deleteFramebuffer(this.vBlurFbo.fbo);
      gl.deleteTexture(this.vBlurFbo.tex);
    }
    if (this.quadVBO) {
      gl.deleteBuffer(this.quadVBO);
    }
  }
}
