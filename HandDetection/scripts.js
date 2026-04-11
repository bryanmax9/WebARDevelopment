// Import the GLTF loader helper from the shared libs folder
import {loadGLTF} from "../libs/loader.js";

// MindAR bundles its own copy of Three.js internally.
// We grab it from the global window object so we use the same instance
// and avoid the "multiple Three.js instances" warning.
const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener('DOMContentLoaded', () => {
    const start = async() => {

        // ─── MINDAR SETUP ────────────────────────────────────────────────────────
        // MindARThree is the main controller that ties together the AR camera,
        // the image target tracker, and the Three.js scene.
        // "imageTargetSrc" is the compiled .mind file that describes what image
        // the camera should lock onto (the robot card in this case).
        const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: document.body,
            imageTargetSrc: './assets/targets.mind',
        });

        // renderer  – draws the Three.js scene each frame
        // scene     – the 3D world that holds all objects and lights
        // camera    – the AR camera whose pose is updated by MindAR every frame
        const {renderer, scene, camera} = mindarThree;

        // ─── LIGHTING ────────────────────────────────────────────────────────────
        // HemisphereLight simulates natural sky/ground lighting without casting shadows.
        // First color (0xffffff) = sky color (white light from above)
        // Second color (0xbbbbff) = ground color (slightly blue reflected from below)
        // Intensity = 1 (full brightness)
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        // ─── LOAD & PLACE THE 3D ROBOT MODEL ─────────────────────────────────────
        // loadGLTF returns a promise that resolves with the full GLTF object.
        // The GLTF object has two key parts we care about:
        //   .scene      – the root Object3D that contains all the robot's meshes
        //   .animations – an array of AnimationClip objects (one per named animation)
        const robot = await loadGLTF("./assets/RobotExpressive.glb");

        // Scale down the robot (it's huge by default) and shift it slightly downward
        // so it appears centered on the image target card.
        robot.scene.scale.set(0.2, 0.2, 0.2);
        robot.scene.position.set(0, -0.2, 0);

        // addAnchor(0) creates a tracked anchor tied to target index 0 (the first
        // image target in the .mind file). The anchor's group automatically moves
        // and rotates in 3D space to match the detected card in the real world.
        const anchor = mindarThree.addAnchor(0);
        anchor.group.add(robot.scene); // attach the robot so it follows the card

        // ─── ANIMATION SYSTEM ─────────────────────────────────────────────────────
        // AnimationMixer is Three.js's animation engine. It sits on top of the robot
        // scene and manages all clip playback, blending, and timing for that model.
        const mixer = new THREE.AnimationMixer(robot.scene);

        // mixer.clipAction(clip) wraps an AnimationClip in an AnimationAction.
        // AnimationAction is the object you actually call .play(), .stop(), .fadeIn()
        // etc. on. Each index below refers to a specific clip inside robot.animations[]:
        //   [1]  = "Death"   animation
        //   [2]  = "Idle"    animation  ← the default standing loop
        //   [3]  = "Jump"    animation
        //   [9]  = "ThumbsUp" animation
        //   [12] = "Wave"    animation
        const idleAction     = mixer.clipAction(robot.animations[2]);
        const jumpAction     = mixer.clipAction(robot.animations[3]);
        const dieAction      = mixer.clipAction(robot.animations[1]);
        const thumbsUpAction = mixer.clipAction(robot.animations[9]);
        const waveAction     = mixer.clipAction(robot.animations[12]);

        // THREE.LoopOnce means the animation plays through exactly one time and then
        // stops on its last frame (instead of looping forever like the idle clip).
        // We set this on every action except idle, which should loop continuously.
        jumpAction.loop     = THREE.LoopOnce;
        dieAction.loop      = THREE.LoopOnce;
        thumbsUpAction.loop = THREE.LoopOnce;
        waveAction.loop     = THREE.LoopOnce;

        // ─── LOAD HANDPOSE MODEL ──────────────────────────────────────────────────
        // handpose is a TensorFlow.js model loaded via the CDN script tag in index.html.
        // It detects a single hand in a video frame and returns 21 3D landmark points
        // (knuckles, fingertips, wrist, etc.) that describe the hand's exact shape.
        const model = await handpose.load();

        // ─── DEFINE GESTURES WITH FINGERPOSE ─────────────────────────────────────
        // fingerpose (fp) interprets the 21 landmark points from handpose and matches
        // them against gesture descriptions you define.
        //
        // Every gesture is built from two types of rules per finger:
        //
        //   addCurl(finger, curlType, weight)
        //     Describes how bent the finger is:
        //       fp.FingerCurl.NoCurl   → finger is fully extended / straight
        //       fp.FingerCurl.HalfCurl → finger is halfway bent
        //       fp.FingerCurl.FullCurl → finger is completely folded into a fist
        //
        //   addDirection(finger, direction, weight)
        //     Describes which way the finger is pointing:
        //       fp.FingerDirection.VerticalUp      → straight up
        //       fp.FingerDirection.VerticalDown    → straight down
        //       fp.FingerDirection.HorizontalLeft  → pointing left
        //       fp.FingerDirection.HorizontalRight → pointing right
        //       fp.FingerDirection.DiagonalUpLeft  → up-left diagonal
        //       fp.FingerDirection.DiagonalUpRight → up-right diagonal
        //
        //   weight (0.0 – 1.0) controls how important that rule is when scoring.
        //   1.0 = must match, lower values = nice to have.

        // WAVE gesture – open flat hand, all fingers extended and pointing straight up.
        // Think of the classic "hello" wave pose.
        const waveGesture = new fp.GestureDescription('wave');
        for (let finger of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
            waveGesture.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);      // all fingers straight
            waveGesture.addDirection(finger, fp.FingerDirection.VerticalUp, 1.0); // all pointing up
        }

        // DIE gesture – open flat hand held sideways (fingers pointing left or right).
        // Similar to a "stop" or "talk to the hand" pose rotated 90°.
        const dieGesture = new fp.GestureDescription('die');
        for (let finger of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
            dieGesture.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);                      // all fingers straight
            dieGesture.addDirection(finger, fp.FingerDirection.HorizontalLeft, 1.0);   // accept left...
            dieGesture.addDirection(finger, fp.FingerDirection.HorizontalRight, 1.0);  // ...or right (mirrors)
        }

        // JUMP gesture – index finger pointing straight up, all other fingers curled.
        // This is a clean "pointing to the sky" pose, clearly distinct from:
        //   wave (all fingers up) and thumbs_up (thumb up, others curled differently).
        //
        // Previously broken: the old code first set Index to NoCurl, then a loop
        // overwrote it with FullCurl for ALL fingers — contradicting itself.
        const jumpGesture = new fp.GestureDescription('jump');
        // Index finger must be fully extended and pointing upward
        jumpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
        jumpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
        // Middle, Ring, and Pinky must be fully curled into the palm
        jumpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
        jumpGesture.addCurl(fp.Finger.Ring,   fp.FingerCurl.FullCurl, 1.0);
        jumpGesture.addCurl(fp.Finger.Pinky,  fp.FingerCurl.FullCurl, 1.0);
        // Thumb must be FULLY curled — this is the key separator from thumbs_up.
        // When pointing with just the index finger the thumb is tucked into the palm.
        // HalfCurl was too loose and let thumbs_up poses bleed into this gesture.
        jumpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);

        // THUMBS UP gesture – thumb extended upward, all other fingers fully curled.
        // We define this manually instead of using fp.Gestures.ThumbsUpGesture because
        // the built-in version also requires the curled fingers to point horizontally,
        // which is an extra rule that rarely scores above 8.5 in practice and causes
        // thumbs up to go undetected. Our version only checks what actually matters:
        // thumb up + everything else curled.
        const thumbsUpGesture = new fp.GestureDescription('thumbs_up');
        // Thumb must be extended and pointing upward (allow slight diagonals too)
        thumbsUpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
        thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalUp, 1.0);
        thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpLeft, 0.9);
        thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpRight, 0.9);
        // All other fingers must be fully curled into the palm.
        // The index finger also needs to be pointing horizontally (left or right) —
        // when your thumb is up and fingers are curled, the knuckles point sideways.
        // This direction rule is what separates thumbs_up from jump (where index
        // points straight up and the whole fist faces forward).
        thumbsUpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
        thumbsUpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalLeft, 0.9);
        thumbsUpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalRight, 0.9);
        for (let finger of [fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
            thumbsUpGesture.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
        }

        // ─── GESTURE ESTIMATOR ────────────────────────────────────────────────────
        // GestureEstimator takes the array of all gesture descriptions it should
        // recognize and scores each one against live hand landmarks every frame.
        const GE = new fp.GestureEstimator([
            thumbsUpGesture,             // custom: thumb up, others curled
            waveGesture,                 // custom: open hand vertical
            jumpGesture,                 // custom: index finger pointing up
            dieGesture,                  // custom: open hand horizontal
        ]);

        // ─── RENDER LOOP ──────────────────────────────────────────────────────────
        // THREE.Clock tracks elapsed time between frames.
        // getDelta() returns the seconds since the last call — used to advance
        // animations at the correct real-world speed regardless of frame rate.
        const clock = new THREE.Clock();

        // mindarThree.start() activates the camera and begins tracking the image target.
        await mindarThree.start();

        // setAnimationLoop runs the callback every frame (like requestAnimationFrame
        // but managed by Three.js). Here it:
        //   1. Advances all active animation clips by the elapsed time
        //   2. Renders the Three.js scene onto the canvas
        renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();
            mixer.update(delta);               // step animations forward
            renderer.render(scene, camera);    // draw the frame
        });

        // ─── ACTIVE ACTION & TRANSITIONS ─────────────────────────────────────────
        // activeAction tracks whichever animation is currently playing.
        // We start with idle so the robot stands and breathes in a loop.
        let activeAction = idleAction;
        activeAction.play();

        // fadeToAction smoothly transitions from the current animation to a new one.
        // "duration" is the crossfade time in seconds — 0.5s feels natural.
        // Steps:
        //   1. If we're already on the requested action, do nothing.
        //   2. Record the new action as active.
        //   3. Reset it to frame 0, fade it in over "duration" seconds, and play it.
        //      The old action fades out automatically as the new one fades in.
        const fadeToAction = (action, duration) => {
            if (activeAction === action) return;
            activeAction = action;
            activeAction.reset().fadeIn(duration).play();
        };

        // When a LoopOnce action finishes playing its last frame, Three.js fires a
        // "finished" event on the mixer. We listen for it and smoothly return to idle.
        mixer.addEventListener("finished", () => {
            fadeToAction(idleAction, 0.2);
        });

        // ─── HAND DETECTION LOOP ─────────────────────────────────────────────────
        const video = mindarThree.video; // the live camera feed used by handpose

        // skipCount throttles how often we run the (expensive) handpose inference.
        // We skip 10 animation frames between each detection pass. This keeps
        // the gesture detection responsive without tanking the frame rate.
        let skipCount = 0;

        const detect = async () => {
            // If any non-idle animation is still playing, skip detection entirely.
            // We don't want a new gesture to interrupt an animation mid-way.
            if (activeAction !== idleAction) {
                window.requestAnimationFrame(detect);
                return;
            }

            // Throttle: skip 10 frames before running handpose again
            if (skipCount < 10) {
                skipCount += 1;
                window.requestAnimationFrame(detect);
                return;
            }
            skipCount = 0;

            // estimateHands() runs the neural network on the current video frame.
            // Returns an array of detected hands (max 1 for this model version).
            // Each hand has a "landmarks" array: 21 [x, y, z] points for joints.
            const predictions = await model.estimateHands(video);

            if (predictions.length > 0) {
                // GE.estimate() scores every gesture description against the detected
                // hand's landmarks. The second argument (8.5) is the minimum confidence
                // score a gesture must reach to be included in the results — higher
                // values mean stricter matching and fewer false positives.
                // Returns: { poseData: [...], gestures: [{ name, score }, ...] }
                const estimatedGestures = GE.estimate(predictions[0].landmarks, 8.5);

                if (estimatedGestures.gestures.length > 0) {
                    // Sort by score descending and take the top match.
                    // "score" is fingerpose's confidence value (0–10) for that gesture.
                    const best = estimatedGestures.gestures.sort((g1, g2) => g2.score - g1.score)[0];

                    // ── GESTURE → ANIMATION MAPPING ──────────────────────────────
                    // Each "best.name" string matches the name we passed to
                    // GestureDescription() (or the built-in gesture's internal name).
                    // We call fadeToAction() with the matching AnimationAction.
                    //
                    //  Hand pose you make          → best.name      → animation played
                    //  Thumb up, others curled     → "thumbs_up"    → thumbsUpAction
                    //  Open hand pointing up       → "wave"         → waveAction
                    //  Index finger pointing up    → "jump"         → jumpAction
                    //  Open hand pointing sideways → "die"          → dieAction
                    if (best.name === "thumbs_up") {
                        fadeToAction(thumbsUpAction, 0.5);
                    }
                    if (best.name === "wave") {
                        fadeToAction(waveAction, 0.5);
                    }
                    if (best.name === "jump") {
                        fadeToAction(jumpAction, 0.5);
                    }
                    if (best.name === "die") {
                        fadeToAction(dieAction, 0.5);
                    }
                }
            }

            // Schedule the next detection pass on the next animation frame
            window.requestAnimationFrame(detect);
        };

        // Kick off the detection loop
        window.requestAnimationFrame(detect);
    };

    start();
});
