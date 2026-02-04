const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener("DOMContentLoaded", () => {
  const start = async () => {
    const mindARThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.body,
      imageTargetSrc: "./targets.mind",
    });

    const { renderer, scene, camera } = mindARThree;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0.5,
    });
    const plane = new THREE.Mesh(geometry, material);

    //get me the stimated position of the target to place the object
    const anchor = mindARThree.addAnchor(0);
    anchor.group.add(plane); // THREE.Group

    await mindARThree.start();

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  };
  start();
});
