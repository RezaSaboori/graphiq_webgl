#version 300 es
precision highp float;
in vec2 a_position;         // unit rectangle [-0.5, 0.5]
in vec2 a_screen;           // world position (x, y)
in vec2 a_size;             // node size (width, height)

uniform mat4 u_viewProjectionMatrix;

out vec2 v_localRect;
void main() {
    // Rect position in world space
    vec2 worldPos = a_screen + a_position * a_size;
    gl_Position = u_viewProjectionMatrix * vec4(worldPos, 0.0, 1.0);
    v_localRect = a_position;
}
