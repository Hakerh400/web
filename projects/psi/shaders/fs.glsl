#define brightnessMin .3

precision mediump float;

uniform vec3 lightDir;
uniform sampler2D texImg;

uniform bool calcLight;

varying vec3 nFrag;
varying vec2 texFrag;

void main(){
  float intensity = (dot(nFrag, -lightDir) + 1.) / 2.;
  float brightness = calcLight ? brightnessMin + intensity * (1. - brightnessMin) : 1.;

  gl_FragColor = vec4(texture2D(texImg, texFrag).xyz * brightness, 1.);
}