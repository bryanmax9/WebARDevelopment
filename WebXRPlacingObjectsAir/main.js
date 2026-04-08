import * as THREE from 'https://unpkg.com/three@0.132.2/build/three.module.js';
//importing AR button componet
import { ARButton } from './libs/three.js-r132/examples/jsm/webxr/ARButton.js'

document.addEventListener('DOMContentLoaded', () => {

    const initialize = async () => {

        // Build three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });

        const arButton = ARButton.createButton(renderer, { optionalFeatures: ['dom-overlay'], domOverlay: { root: document.body } });
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(arButton);


        // Capture user action is through a controller(first touching point on the screen)
        const controller = renderer.xr.getController(0);
        scene.add(controller);



        controller.addEventListener("select", () => {
            const geometry = new THREE.BoxGeometry(0.06,0.06,0.06);
            const material = new THREE.MeshBasicMaterial({color: 0xffffff * Math.random()});
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.applyMatrix4(controller.matrixWorld);
            mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
            scene.add(mesh);
        });


    }
    initialize();
});
