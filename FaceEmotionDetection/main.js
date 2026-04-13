import * as faceapi from '../libs/faceapi/face-api.esm.js';
import {loadTexture} from "../libs/loader.js";
const THREE = window.MINDAR.FACE.THREE;

document.addEventListener('DOMContentLoaded', () =>{
    const start = async() => {

        //Load the Face API model
        const optionsTinyFace = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.3});
        const modelPath = "../libs/faceapi/model";
        await faceapi.nets.tinyFaceDetector.load(modelPath);
        await faceapi.nets.faceLandmark68Net.load(modelPath);
        await faceapi.nets.faceExpressionNet.load(modelPath);

        // initialize MindAR
        const mindarThree = new window.MINDAR.FACE.MindARThree({
            container: document.body
        });
        const {renderer, scene, camera} = mindarThree;

        //Loading Textures of each emotion
        const textures = {};
        textures['happy'] = await loadTexture("./openmoji/1F600.png");
        textures['angry'] = await loadTexture("./openmoji/1F621.png");
        textures['sad'] = await loadTexture("./openmoji/1F625.png");
        textures['neutral'] = await loadTexture("./openmoji/1F610.png");

        const geometry = new THREE.PlaneGeometry(1,1);
        const material = new THREE.MeshBasicMaterial({map: textures['neutral']}); //this needs textures
        const plane = new THREE.Mesh(geometry,material);

        const anchor = mindarThree.addAnchor(151); //anchor to the forhead of the user's face
        anchor.group.add(plane);

        //start AR
        await mindarThree.start();
        renderer.setAnimationLoop(() => {
            renderer.render(scene,camera);
        });

        const video = mindarThree.video;

        const expressions = ['happy','angry','sad','neutral'];

        let lastExpression = 'neutral';

        // detect function
        const detect = async () => {
            //execute the face API detection
            const results = await faceapi.detectSingleFace(video, optionsTinyFace).withFaceLandmarks().withFaceExpressions(); // this will give us the expression 
            
            if (results && results.expressions){
                //Check which expression from list has confidence level more than 0.5

                //if none of them is more than 0.5 confidence, than default to 'neutral'
                let newExpression = 'neutral';

                for (let i = 0; i< expressions.length; i++){
                    if (results.expressions[expressions[i]] > 0.5){
                        // if one of the expression its confidence level is more than 0.5, than assign to it
                        newExpression = expressions[i];
                    }
                }
                
                // Update the material with the corresponding texture depending on the material of the expression
                if (newExpression !== lastExpression){
                    material.map = textures[newExpression];
                    material.needsUpdate = true;
                }
                // now remembering the last expression
                lastExpression = newExpression;
            }
            

            window.requestAnimationFrame(detect);
        }

        //call dectect function continously
        window.requestAnimationFrame(detect);
    }

    start().catch(err => console.error("AR start failed:", err));
})