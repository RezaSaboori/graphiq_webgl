#version 300 es
precision highp float;
in vec2 a_position;         // unit rectangle [-0.5, 0.5]
in vec2 a_screen;           // screen position (x, y)
in vec2 a_size;             // node size (width, height)
out vec2 v_localRect;
void main() {
    // Rect position in screen space
    vec2 screenPos = a_screen + a_position * a_size;
    // Convert screen coordinates to NDC
    vec2 ndc = (screenPos / vec2(1920.0, 1080.0)) * 2.0 - 1.0;
    ndc.y = -ndc.y; // Flip Y for screen coordinates
    gl_Position = vec4(ndc, 0, 1);
    v_localRect = a_position;
}
