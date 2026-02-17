import * as THREE from "three";

export const loadVideo = (path) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.addEventListener(
      "loadedmetadata",
      () => {
        video.setAttribute("playsinline", "");
        resolve(video);
      },
      { once: true },
    );
    video.src = path;
  });
};

