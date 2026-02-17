import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { loadVideo } from "./libs/loader.js";
import { createChromaMaterial } from "./libs/chroma-video.js";

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    const mindarThree = new MindARThree({
      container: document.getElementById("ar-container"),
      imageTargetSrc: "./targets.mind", // path to the image target that was sentizised on "https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
    });

    const { renderer, scene, camera } = mindarThree;

    const video = await loadVideo("./mew_GreenScreen.mp4");
    const texture = new THREE.VideoTexture(video);
    const geometry = new THREE.PlaneGeometry(1, 1080 / 1920);
    const material = createChromaMaterial(texture, "#00ff00");
    const plane = new THREE.Mesh(geometry, material);

    plane.rotation.x = Math.PI / 2;
    plane.position.y = 0.7;
    plane.scale.multiplyScalar(4);

    //get me the stimated position of the target to place the object
    const anchor = mindarThree.addAnchor(0);
    anchor.group.add(plane);

    video.addEventListener("play", () => {
      video.currentTime = 6;
    });

    // Play/pause video based on anchor visibility (MindAR Three.js has no onTargetFound/onTargetLost)
    let wasVisible = false;
    await mindarThree.start();
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
