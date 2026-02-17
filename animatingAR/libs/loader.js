import * as THREE from "three";

export const loadAudio = (path) => {
  return new Promise((resolve, reject) => {
    const loader = new THREE.AudioLoader();
    loader.load(path, resolve, undefined, reject);
  });
};

