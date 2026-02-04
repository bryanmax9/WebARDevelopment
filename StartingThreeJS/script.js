import * as THREE from "../../libs/three.js-r132/build/three.module.js";

console.log(THREE);

document.addEventListener("DOMContentLoaded", () => {
  const scene = new THREE.Scene();

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);

  scene.add(cube);
  cube.position.set(0, 0, -2);
  cube.rotation.set(0, Math.PI / 4, 0);

  const camera = new THREE.PerspectiveCamera();
  camera.position.set(1, 1, 5);

  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(500, 500);
  renderer.render(scene, camera);

  const video = document.createElement("video");
  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;
    video.play();
  });

  video.style.position = "absolute";
  video.style.width = renderer.domElement.style.width;
  video.style.height = renderer.domElement.style.height;
  renderer.domElement.style.position = "absolute";

  document.body.appendChild(video);
  document.body.appendChild(renderer.domElement);
});
