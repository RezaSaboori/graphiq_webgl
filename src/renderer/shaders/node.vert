#version 300 es
precision highp float;
in vec2 a_position;         // unit rectangle [-0.5, 0.5]
in vec2 a_world;            // world position (x, y)
in vec2 a_size;             // node size (width, height)
uniform mat3 u_screenFromWorld; // camera/world-to-screen transform
out vec2 v_localRect;
void main() {
    // Rect position in world space
    vec2 worldPos = a_world + a_position * a_size;
    // Transform world → screen
    vec3 screen = u_screenFromWorld * vec3(worldPos, 1.0);
    gl_Position = vec4(((screen.xy)), 0, 1);
    v_localRect = a_position;
}
