#version 300 es
precision highp float;

in vec2 a_position;           // Base quad [-0.5, 0.5]

in vec2 a_instancePosition;   // Per-instance: screen-space center
in vec2 a_instanceScale;      // Per-instance: width/height
in vec4 a_instanceColor;      // Per-instance: base color
in int  a_instanceState;      // Per-instance: selected/hovered/...

out vec4 v_color;
flat out int v_state;

void main() {
  vec2 screenPos = a_instancePosition + (a_position * a_instanceScale);
  // Convert screen coordinates to NDC
  vec2 ndc = (screenPos / vec2(1920.0, 1080.0)) * 2.0 - 1.0;
  ndc.y = -ndc.y; // Flip Y for screen coordinates
  gl_Position = vec4(ndc, 0, 1);
  v_color = a_instanceColor;
  v_state = a_instanceState;
}
