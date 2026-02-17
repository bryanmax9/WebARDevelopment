import * as THREE from "three";

// keyColor: chroma key color (e.g. "#00ff00")
// threshold: how close to the key color is fully transparent
// smoothness: how soft the edge is
// cropBottom / cropTop: trim problematic rows of the video (0–1 UV space)
export const createChromaMaterial = (
  texture,
  keyColor,
  threshold = 0.45,
  smoothness = 0.2,
  cropBottom = 0.0,
  cropTop = 1.0,
) => {
  const keyColorObject = new THREE.Color(keyColor);

  return new THREE.ShaderMaterial({
    uniforms: {
      tex: { value: texture },
      color: { value: keyColorObject },
      threshold: { value: threshold },
      smoothness: { value: smoothness },
      cropBottom: { value: cropBottom },
      cropTop: { value: cropTop },
    },
    vertexShader:
      "varying mediump vec2 vUv;\n" +
      "void main(void)\n" +
      "{\n" +
      "vUv = uv;\n" +
      "mediump vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n" +
      "gl_Position = projectionMatrix * mvPosition;\n" +
      "}",
    fragmentShader:
      "uniform mediump sampler2D tex;\n" +
      "uniform mediump vec3 color;\n" +
      "uniform mediump float threshold;\n" +
      "uniform mediump float smoothness;\n" +
      "uniform mediump float cropBottom;\n" +
      "uniform mediump float cropTop;\n" +
      "varying mediump vec2 vUv;\n" +
      "void main(void)\n" +
      "{\n" +
      "  // simple vertical crop to remove any residual edge/line in the video\n" +
      "  if (vUv.y < cropBottom || vUv.y > cropTop) discard;\n" +
      "  mediump vec3 tColor = texture2D( tex, vUv ).rgb;\n" +
      "  mediump float diff = length(tColor - color);\n" +
      "  // 0 when very close to key color, 1 when far away\n" +
      "  mediump float a = smoothstep(threshold, threshold + smoothness, diff);\n" +
      "  gl_FragColor = vec4(tColor, a);\n" +
      "}",
    transparent: true,
  });
};

