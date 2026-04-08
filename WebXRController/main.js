import * as THREE from 'https://unpkg.com/three@0.132.2/build/three.module.js';
//importing AR button componet
import { ARButton} from '../libs/three.js-r132/examples/jsm/webxr/ARButton.js'

document.addEventListener('DOMContentLoaded', () => {

    const initialize = async () => {

        // Build three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        
        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        renderer.setAnimationLoop(() => {
            renderer.render(scene,camera);
        })
        
        // Capture user action is through a controller(first touching point on the screen)
        const controller = renderer.xr.getController(0);
        scene.add(controller);


        const events = document.querySelector("#events");

        controller.addEventListener("connected", (e) => {
            console.log("controller connected:", e.data);
            events.value += "controller connected\n";
        });

        // Listen on the XR session directly for select events
        renderer.xr.addEventListener("sessionstart", () => {
            const session = renderer.xr.getSession();
            session.addEventListener("selectstart", () => {
                console.log("selectstart");
                events.value += "select start\n";
            });
            session.addEventListener("selectend", () => {
                console.log("selectend");
                events.value += "select end\n";
            });
            session.addEventListener("select", () => {
                console.log("select");
                events.value += "select\n";
            });
        });

        const arButton = ARButton.createButton(renderer, {optionalFeatures: ['dom-overlay'], domOverlay:{root: document.body}});
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(arButton);
    }
    initialize();
});
