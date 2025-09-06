#version 300 es
precision highp float;

in vec2 a_start; // Edge start position (screen)
in vec2 a_end;   // Edge end position (screen)
in vec4 a_color; // Per-edge color

out vec4 v_color;
void main() {
  // Each instance is an edge, each edge is two vertices: 0=start, 1=end
  vec2 pos = (gl_VertexID == 0) ? a_start : a_end;
  // Convert screen coordinates to NDC
  vec2 ndc = (pos / vec2(1920.0, 1080.0)) * 2.0 - 1.0;
  ndc.y = -ndc.y; // Flip Y for screen coordinates
  gl_Position = vec4(ndc, 0, 1);
  v_color = a_color;
}
