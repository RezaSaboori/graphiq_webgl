#version 300 es
precision highp float;

in vec2 a_start; // Edge start position (world)
in vec2 a_end;   // Edge end position (world)
in vec4 a_color; // Per-edge color

uniform mat4 u_viewProjectionMatrix;

out vec4 v_color;
void main() {
  // Each instance is an edge, each edge is two vertices: 0=start, 1=end
  vec2 pos = (gl_VertexID == 0) ? a_start : a_end;
  gl_Position = u_viewProjectionMatrix * vec4(pos, 0.0, 1.0);
  v_color = a_color;
}
