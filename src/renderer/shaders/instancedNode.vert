#version 300 es
precision highp float;

in vec2 a_position;           // Base quad [-0.5, 0.5]

in vec2 a_instancePosition;   // Per-instance: world-space center
in vec2 a_instanceScale;      // Per-instance: width/height
in vec4 a_instanceColor;      // Per-instance: base color
in int  a_instanceState;      // Per-instance: selected/hovered/...

uniform mat4 u_viewProjectionMatrix;

out vec4 v_color;
flat out int v_state;

void main() {
  vec2 worldPos = a_instancePosition + (a_position * a_instanceScale);
  gl_Position = u_viewProjectionMatrix * vec4(worldPos, 0.0, 1.0);
  v_color = a_instanceColor;
  v_state = a_instanceState;
}
