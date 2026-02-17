//The assets of animated gltf was gotten from: https://www.fab.com/category/3d-model/characters-creatures?utm_campaign=pr*Fab_sp*Fab.com_an*Moonrock_ct*Bing_cn*Fab.com_ta*Generic_pl*LinkClicks_co*USBuyer_Control&utm_content=555197693&utm_medium=PaidSearch&utm_source=BingSearch&utm_term=game+assets&is_free=1&technical_features=animated&asset_formats=gltf&asset_formats=converted-files

//const THREE = window.MINDAR.IMAGE.THREE;
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MindARThree } from "mindar-image-three";
import { loadAudio } from "./libs/loader.js";

// Helper function for loading gltf models
const loadGLTF = (path) => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
      resolve(gltf);
    });
  });
};

// Helper function to detect target found/lost via visibility (MindAR Three.js doesn't have onTargetFound)
const watchTarget = (anchor, onFound, onLost) => {
  let wasVisible = false;
  return () => {
    const visible = anchor.group.visible;
    if (visible && !wasVisible) onFound();
    if (!visible && wasVisible) onLost();
    wasVisible = visible;
  };
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

    //this is for higlighting the object in the scene
    // const geometry = new THREE.PlaneGeometry(1, 1);
    // const material = new THREE.MeshBasicMaterial({
    //   color: 0x0000ff,
    //   transparent: true,
    //   opacity: 0.5,
    // });
    // const plane = new THREE.Mesh(geometry, material);

    const duck = await loadGLTF("./toon_ducks_gltf/scene.gltf");
    duck.scene.scale.set(0.3, 0.3, 0.3);
    duck.scene.position.set(0, 0, 0.4);
    duck.scene.userData.clickable = true;

    //get me the stimated position of the target to place the object
    const anchor = mindARThree.addAnchor(0);
    anchor.group.add(duck.scene);

    //anchor.group.add(plane);

    // gltf.animations (some models may not have any)
    const mixer = new THREE.AnimationMixer(duck.scene);
    if (duck.animations && duck.animations.length > 0) {
      const action = mixer.clipAction(duck.animations[0]);
      action.play();
    }

    const clock = new THREE.Clock();

    const audioClip = await loadAudio("./bgmusic.mp3");
    const listener = new THREE.AudioListener();
    const audio = new THREE.PositionalAudio(listener);

    camera.add(listener);
    anchor.group.add(audio);

    audio.setRefDistance(100);
    audio.setBuffer(audioClip);
    audio.setLoop(true);

    //Cuak sound effect
    const soundeffect = await loadAudio("./cuak.mp3");
    const soundeffectAudio = new THREE.Audio(listener);
    soundeffectAudio.setBuffer(soundeffect);

    // Handle when target is found
    const onTargetFound = () => {
      console.log("target found");
      console.log("playing audio");
      audio.play();
    };

    // Handle when target is lost
    const onTargetLost = () => {
      console.log("target lost");
      console.log("stopping audio");
      audio.stop();
    };

    const checkTarget = watchTarget(anchor, onTargetFound, onTargetLost);

    document.addEventListener("click", (e) => {
      //console.log(e.clientX, e.clientY);

      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      const mouse = new THREE.Vector2(mouseX, mouseY);

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        let o = intersects[0].object;

        while (o.parent && !o.userData.clickable) {
          o = o.parent;
        }

        if (o.userData.clickable) {
          if (o === duck.scene) {
            console.log("clicked on duck");
            soundeffectAudio.play();
          }
        }
      }
    });

    await mindARThree.start();
    renderer.setAnimationLoop(() => {
      checkTarget();
      mixer.update(clock.getDelta());
      renderer.render(scene, camera);
    });
  };
  start();
});
