// @author brunoimbrizi / http://brunoimbrizi.com

precision highp float;

uniform sampler2D uTexture;

varying vec2 vPUv;
varying vec2 vUv;

void main() {
	vec4 color = vec4(0.0);
	vec2 uv = vUv;
	vec2 puv = vPUv;

	// pixel color
	vec4 colA = texture2D(uTexture, puv);

	// greyscale for intensity
	float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;
	
	// purple-blue gradient for light background
	vec3 darkPurple = vec3(0.3, 0.15, 0.5);     // Darker purple
	vec3 purple = vec3(0.55, 0.35, 0.85);       // Rich purple
	vec3 blue = vec3(0.4, 0.5, 0.9);            // Vibrant blue
	vec3 lightPurple = vec3(0.7, 0.6, 0.95);    // Light purple
	
	// Create gradient based on grey value
	vec3 gradientColor;
	if (grey < 0.25) {
		gradientColor = mix(darkPurple, purple, grey * 4.0);
	} else if (grey < 0.5) {
		gradientColor = mix(purple, blue, (grey - 0.25) * 4.0);
	} else {
		gradientColor = mix(blue, lightPurple, (grey - 0.5) * 2.0);
	}
	
	vec4 colB = vec4(gradientColor, 1.0);

	// circle with soft edge
	float border = 0.4;
	float radius = 0.5;
	float dist = radius - distance(uv, vec2(0.5));
	float t = smoothstep(0.0, border, dist);
	
	// Subtle glow for light background
	float glow = 1.0 - distance(uv, vec2(0.5)) * 2.0;
	glow = max(0.0, glow);
	glow = pow(glow, 4.0) * 0.3;

	// final color
	color = colB;
	color.rgb = mix(color.rgb, color.rgb * 0.8, glow);
	color.a = t * 0.9;

	gl_FragColor = color;
}