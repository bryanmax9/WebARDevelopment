import * as THREE from 'https://unpkg.com/three@0.132.2/build/three.module.js';
//importing AR button componet
import { ARButton} from '../libs/three.js-r132/examples/jsm/webxr/ARButton.js'

document.addEventListener('DOMContentLoaded', () => {

    const initialize = async () => {

        // Build three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        const renderer = new THREE.WebGLRenderer({ alpha: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        // create AR object 
        const geometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, -0.3);
        scene.add(mesh);

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        renderer.xr.enabled = true;
        renderer.setAnimationLoop(() => renderer.render(scene, camera));

        const arButton = ARButton.createButton(renderer, {optionalFeatures: ['dom-overlay'], domOverlay:{root: document.body}});
        document.body.appendChild(arButton);
    }
    initialize();
});
