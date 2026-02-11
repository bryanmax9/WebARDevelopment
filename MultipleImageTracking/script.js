import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MindARThree } from "mindar-image-three";

const loadGLTF = (path) => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => resolve(gltf), undefined, reject);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    const mindARThree = new MindARThree({
      container: document.getElementById("ar-container"),
      imageTargetSrc: "./targets.mind",
      maxTrack: 2,
      warmupTolerance: 2,
      missTolerance: 2,
    });
    const { renderer, scene, camera } = mindARThree;

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    const mewtwo = await loadGLTF("./assets/armored_mewtwo/scene.gltf");
    mewtwo.scene.scale.set(0.1, 0.1, 0.1);
    mewtwo.scene.position.set(0, 0, 0.4);

    const mew = await loadGLTF("./assets/mew_model/scene.gltf");
    mew.scene.scale.set(1, 1, 1);
    mew.scene.position.set(0, 0, 0.4);

    const mewtwoAnchor = mindARThree.addAnchor(0);
    mewtwoAnchor.group.add(mewtwo.scene);

    const mewAnchor = mindARThree.addAnchor(1);
    mewAnchor.group.add(mew.scene);

    await mindARThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  };

  start();
});
