#version 300 es
precision highp float;

in vec4 v_color;
flat in int v_state;
out vec4 fragColor;

void main() {
  if (v_state == 1) { // Simple example: highlight selected
    fragColor = v_color * vec4(1.2, 1, 1, 1); // Lighten
  } else {
    fragColor = v_color;
  }
}
