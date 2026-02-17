import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { loadVideo } from "./libs/loader.js";
import { createChromaMaterial } from "./libs/chroma-video.js";

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    const mindarThree = new MindARThree({
      container: document.getElementById("ar-container"),
      imageTargetSrc: "./targets.mind", // path to the image target that was sentizised on "https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
      uiScanning: false,
      uiLoading: "no",
    });

    const { renderer, scene, camera } = mindarThree;
    const scanOverlay = document.getElementById("scan-overlay");

    const video = await loadVideo("./mew_GreenScreen.mp4");
    const texture = new THREE.VideoTexture(video);
    const geometry = new THREE.PlaneGeometry(1, 1080 / 1920);
    // tweak threshold/smoothness/cropBottom if you still see a green line
    const material = createChromaMaterial(
      texture,
      "#00ff00",
      0.42, // threshold
      0.25, // smoothness
      0.12, // cropBottom: cut bottom 12% of the video (removes the line)
      1.0, // cropTop
    );
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

    // Play/pause video and toggle scanning UI based on anchor visibility
    let wasVisible = false;
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      const visible = anchor.group.visible;

      if (visible && !wasVisible) {
        video.play();
        if (scanOverlay) scanOverlay.classList.add("hidden");
      }

      if (!visible && wasVisible) {
        video.pause();
        if (scanOverlay) scanOverlay.classList.remove("hidden");
      }

      wasVisible = visible;
      renderer.render(scene, camera);
    });
  };
  start();
});
