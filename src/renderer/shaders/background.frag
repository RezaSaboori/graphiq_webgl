#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_dotSpacing; // e.g. 20.0
uniform float u_dotRadius;  // e.g. 2.5
uniform vec4 u_dotColor;    // e.g. vec4(0.8,0.8,0.8,1.0)
uniform vec4 u_bgColor;     // e.g. vec4(0.2,0.2,0.2,1.0)

void main() {
    vec2 fragCoord = v_uv * u_resolution;
    // Find nearest dot center
    vec2 nearest = floor(fragCoord / u_dotSpacing) * u_dotSpacing + u_dotSpacing * 0.5;
    float dist = length(fragCoord - nearest);
    if(dist < u_dotRadius){
        fragColor = u_dotColor;
    } else {
        fragColor = u_bgColor;
    }
}
