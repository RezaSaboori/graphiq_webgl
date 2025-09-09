#version 300 es
precision highp float;

in vec4 v_color;
flat in int v_state;
in vec2 v_localPos;
in vec2 v_worldPos;

out vec4 fragColor;

const float glassAlpha = 0.15;
const float rimPower = 2.0;
const vec3 glassColor = vec3(0.8, 0.9, 1.0);

void main() {
  float rim = 1.0 - dot(normalize(v_localPos), normalize(v_localPos));
  rim = pow(rim, rimPower);
  vec3 finalColor = mix(v_color.rgb, glassColor, glassAlpha);
  finalColor += rim * 0.3;
  if (v_state == 1) {
    finalColor *= vec3(1.2, 1.1, 1.0);
  }
  float alpha = mix(0.7, 0.9, rim);
  fragColor = vec4(finalColor, alpha);
}


