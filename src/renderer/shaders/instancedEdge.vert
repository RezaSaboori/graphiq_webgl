#version 300 es
precision highp float;

in vec2 a_start;       // Edge start position (world)
in vec2 a_end;         // Edge end position (world)
in vec4 a_color;       // Per-edge color
uniform mat3 u_worldToScreen;
out vec4 v_color;

void main() {
  // Each edge instance: two vertices (start-end). Use gl_VertexID.
  vec2 pos = (gl_VertexID == 0) ? a_start : a_end;
  vec3 screenPos = u_worldToScreen * vec3(pos, 1.0);
  gl_Position = vec4(screenPos.xy, 0, 1);
  v_color = a_color;
}
