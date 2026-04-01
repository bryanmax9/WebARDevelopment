import { loadGLTF } from "./loader.js";

document.addEventListener('DOMContentLoaded', () => {
    const start = async () => {
        const THREE = window.MINDAR.FACE.THREE;
        const mindarThree = new window.MINDAR.FACE.MindARThree({
            container: document.body,
        });

        const { renderer, scene, camera } = mindarThree;

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        // Occluder — invisible 3D head shape for proper depth/occlusion
        const occluder = await loadGLTF('./sparkar-occluder/headOccluder.glb');
        const occluderMaterial = new THREE.MeshBasicMaterial({ colorWrite: false });
        occluder.scene.traverse((obj) => {
            if (obj.isMesh) obj.material = occluderMaterial;
        });
        occluder.scene.scale.multiplyScalar(0.065);
        occluder.scene.position.set(0, -0.3, 0.15);
        occluder.scene.renderOrder = 0;
        const occluderAnchor = mindarThree.addAnchor(168);
        occluderAnchor.group.add(occluder.scene);

        // Load both masks in parallel
        const [freddyGltf, batmanGltf] = await Promise.all([
            loadGLTF('./freddy_bear/scene.gltf'),
            loadGLTF('./batman_mask/scene.gltf'),
        ]);

        // Freddy setup
        freddyGltf.scene.renderOrder = 1;
        freddyGltf.scene.scale.set(8, 8, 8);
        freddyGltf.scene.position.set(0, -1, 0); // freddy mask position
        freddyGltf.scene.visible = true;

        // Batman setup
        batmanGltf.scene.renderOrder = 1;
        batmanGltf.scene.scale.set(7, 7, 7);
        batmanGltf.scene.position.set(0, -0.35, 0); // batman mask position
        batmanGltf.scene.visible = false;

        const anchor = mindarThree.addAnchor(168);
        anchor.group.add(freddyGltf.scene);
        anchor.group.add(batmanGltf.scene);

        // Button toggle logic
        const btnFreddy = document.getElementById('btn-freddy');
        const btnBatman = document.getElementById('btn-batman');

        btnFreddy.addEventListener('click', () => {
            freddyGltf.scene.visible = true;
            batmanGltf.scene.visible = false;
            btnFreddy.classList.add('active');
            btnBatman.classList.remove('active');
        });

        btnBatman.addEventListener('click', () => {
            batmanGltf.scene.visible = true;
            freddyGltf.scene.visible = false;
            btnBatman.classList.add('active');
            btnFreddy.classList.remove('active');
        });

        await mindarThree.start();
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });
    }
    start();
});
