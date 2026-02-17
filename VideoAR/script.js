import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { loadVideo } from "../libs/loader.js";

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    const mindARThree = new MindARThree({
      container: document.getElementById("ar-container"),
      imageTargetSrc: "./targets.mind", // path to the image target that was sentizised on "https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
    });

    const { renderer, scene, camera } = mindARThree;

    const video = await loadVideo("./mew.mp4");
    const texture = new THREE.VideoTexture(video);
    const geometry = new THREE.PlaneGeometry(1, 204 / 480);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const plane = new THREE.Mesh(geometry, material);

    //get me the stimated position of the target to place the object
    const anchor = mindARThree.addAnchor(0);
    anchor.group.add(plane);

    video.addEventListener("play", () => {
      video.currentTime = 6;
    });

    // Play/pause video based on anchor visibility (MindAR Three.js has no onTargetFound/onTargetLost)
    let wasVisible = false;
    await mindARThree.start();
    renderer.setAnimationLoop(() => {
      const visible = anchor.group.visible;
      if (visible && !wasVisible) video.play();
      if (!visible && wasVisible) video.pause();
      wasVisible = visible;

      renderer.render(scene, camera);
    });
  };
  start();
});
