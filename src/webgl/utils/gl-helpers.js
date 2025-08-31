export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }
  
  const errorLog = gl.getShaderInfoLog(shader);
  console.error(`Shader compilation error (${type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT'}):`, errorLog);
  console.error('Shader source:', source);
  gl.deleteShader(shader);
  return null;
}

export function createProgram(gl, vertexShader, fragmentShader) {
  if (!vertexShader || !fragmentShader) {
    console.error('Cannot create program: one or both shaders are null');
    return null;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  }
  
  const errorLog = gl.getProgramInfoLog(program);
  console.error('Program linking error:', errorLog);
  gl.deleteProgram(program);
  return null;
}
