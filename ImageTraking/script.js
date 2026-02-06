//const THREE = window.MINDAR.IMAGE.THREE;
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MindARThree } from "mindar-image-three";

//creating a helper function for loading gltf models
const loadGLTF = (path) => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
      resolve(gltf);
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    const mindARThree = new MindARThree({
      container: document.getElementById("ar-container"),
      imageTargetSrc: "./targets.mind", // path to the image target that was sentizised on "https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
    });

    const { renderer, scene, camera } = mindARThree;

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0.5,
    });
    const plane = new THREE.Mesh(geometry, material);

    //get me the stimated position of the target to place the object
    const anchor = mindARThree.addAnchor(0);

    const gltf = await loadGLTF("./hedgehog.glb");
    gltf.scene.scale.set(0.3, 0.3, 0.3);
    gltf.scene.position.set(0, 0, 0.4);
    anchor.group.add(gltf.scene);

    anchor.group.add(plane); // THREE.Group

    await mindARThree.start();

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  };
  start();
});
