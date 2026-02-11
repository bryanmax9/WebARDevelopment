//The assets of animated gltf was gotten from: https://www.fab.com/category/3d-model/characters-creatures?utm_campaign=pr*Fab_sp*Fab.com_an*Moonrock_ct*Bing_cn*Fab.com_ta*Generic_pl*LinkClicks_co*USBuyer_Control&utm_content=555197693&utm_medium=PaidSearch&utm_source=BingSearch&utm_term=game+assets&is_free=1&technical_features=animated&asset_formats=gltf&asset_formats=converted-files

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
      imageTargetSrc: "./target.mind", // path to the image target that was sentizised on "https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
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

    const gltf = await loadGLTF("./toon_ducks_gltf/scene.gltf");
    gltf.scene.scale.set(0.3, 0.3, 0.3);
    gltf.scene.position.set(0, 0, 0.4);
    anchor.group.add(gltf.scene);

    anchor.group.add(plane); // THREE.Group

    // gltf.animations (some models may not have any)
    const mixer = new THREE.AnimationMixer(gltf.scene);
    if (gltf.animations && gltf.animations.length > 0) {
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
    }

    const clock = new THREE.Clock();

    await mindARThree.start();
    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();
      mixer.update(delta);
      renderer.render(scene, camera);
    });
  };
  start();
});
