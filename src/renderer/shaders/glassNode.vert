#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_instancePosition;
in vec2 a_instanceScale;
in vec4 a_instanceColor;
in int  a_instanceState;

uniform mat4 u_viewProjectionMatrix;

out vec4 v_color;
flat out int v_state;
out vec2 v_localPos;
out vec2 v_worldPos;

void main() {
  vec2 worldPos = a_instancePosition + (a_position * a_instanceScale);
  gl_Position = u_viewProjectionMatrix * vec4(worldPos, 0.0, 1.0);
  v_color = a_instanceColor;
  v_state = a_instanceState;
  v_localPos = a_position;
  v_worldPos = worldPos;
}


