#version 300 es
precision highp float;

in vec2 a_position;           // Base quad [-0.5, 0.5]

in vec2 a_instancePosition;   // Per-instance: world-space center
in vec2 a_instanceScale;      // Per-instance: width/height
in vec4 a_instanceColor;      // Per-instance: base color
in int  a_instanceState;      // Per-instance: selected/hovered/...

uniform mat3 u_worldToScreen; // Camera transform

out vec4 v_color;
flat out int v_state;

void main() {
  vec2 worldPos = a_instancePosition + (a_position * a_instanceScale);
  vec3 screen = u_worldToScreen * vec3(worldPos, 1.);
  gl_Position = vec4(screen.xy, 0, 1);
  v_color = a_instanceColor;
  v_state = a_instanceState;
}
