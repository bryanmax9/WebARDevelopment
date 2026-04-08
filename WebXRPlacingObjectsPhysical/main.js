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

        //Create an indicator object that would be shown and updates continuously at the hit position
        const reticleGeometry = new THREE.RingGeometry(0.15,0.2,32).rotateX(-Math.PI/2);
        const reticleMaterial = new THREE.MeshBasicMaterial(); // we are using the deault color
        const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        scene.add(reticle);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });

        const arButtonEl = ARButton.createButton(renderer, {requiredFeatures: ['hit-test'] ,optionalFeatures: ['dom-overlay'], domOverlay: { root: document.body } });
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(arButtonEl);


        // Capture user action is through a controller(first touching point on the screen)
        const controller = renderer.xr.getController(0);
        scene.add(controller);



        controller.addEventListener("select", () => {
            const geometry = new THREE.BoxGeometry(0.06,0.06,0.06);
            const material = new THREE.MeshBasicMaterial({color: 0xffffff * Math.random()});
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.setFromMatrixPosition(reticle.matrix);
            mesh.scale.y = Math.random() * 2 +1;
            scene.add(mesh);
        });

        const tapHint = document.getElementById('tap-hint');
        const splashOverlay = document.getElementById('splash-overlay');
        const startArBtn = document.getElementById('start-ar-btn');
        const arButton = document.getElementById('ARButton');

        // Custom start button delegates to the real ARButton
        startArBtn.addEventListener('click', () => {
            if (arButton) arButton.click();
        });

        renderer.xr.addEventListener("sessionstart", async () =>{
            splashOverlay.classList.add('hidden');
            arButton.classList.add('ar-active');
            tapHint.classList.add('visible');
            const session = renderer.xr.getSession();

            const viewerReferenceSpace = await session.requestReferenceSpace("viewer"); //create reference space
            const hitTestSource = await session.requestHitTestSource({space: viewerReferenceSpace});

            renderer.setAnimationLoop((timestamp, frame) => {
                if (!frame) return;

                const hitTestResults = frame.getHitTestResults(hitTestSource);
                if (hitTestResults.length > 0){
                    const hit = hitTestResults[0];
                    const referenceSpace = renderer.xr.getReferenceSpace(); //the local reference space 
                    //so we get now the position of the hit
                    const hitPose = hit.getPose(referenceSpace); // position relative to the original local space instead of viewer space

                    //setting the reticle position according to the hit position
                    reticle.visible = true;
                    reticle.matrix.fromArray(hitPose.transform.matrix);
                } else{
                    reticle.visible = false;
                }

                renderer.render(scene,camera)
            });
        });

        renderer.xr.addEventListener("sessionend", async () =>{
            splashOverlay.classList.remove('hidden');
            arButton.classList.remove('ar-active');
            tapHint.classList.remove('visible');
        });


    }
    initialize();
});
