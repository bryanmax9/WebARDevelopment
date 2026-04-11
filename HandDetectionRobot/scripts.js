// ─── Imports ──────────────────────────────────────────────────────────────────
// Pull Three.js and the GLTF loader directly from the local libs folder,
// no MindAR required.
import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';

// ─── GLTF helper ──────────────────────────────────────────────────────────────
const loadGLTF = (path) => new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(path, resolve, undefined, reject);
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
// Wait for the user to dismiss the splash screen before initialising anything.
document.addEventListener('DOMContentLoaded', () => {
    const splash        = document.getElementById('splash-screen');
    const splashBtn     = document.getElementById('splash-start');
    const loadingOverlay = document.getElementById('loading-overlay');

    splashBtn.addEventListener('click', () => {
        // Fade-out splash, reveal loading overlay, then kick off the system.
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
            loadingOverlay.style.display = 'flex';   // show the loader now
            start().catch(err => console.error('[RX-7] Fatal error:', err));
        }, 600);
    }, { once: true });
});

async function start() {

    // ── HUD element references ────────────────────────────────────────────────
    const el = (id) => document.getElementById(id);

    const statusText     = el('status-text');
    const handStatusEl   = el('hand-status');
    const gestureNameEl  = el('gesture-name');
    const gestureDescEl  = el('gesture-desc');
    const barConf        = el('bar-confidence');
    const barValEl       = el('bar-val');
    const fpsDisplay     = el('fps-display');
    const dotSystem      = el('dot-system');
    const dotHand        = el('dot-hand');
    const loadingOverlay = el('loading-overlay');
    const loadingStatus  = el('loading-status');
    const loaderBar      = el('loader-bar');

    const gestureRows = {
        wave:      el('g-wave'),
        jump:      el('g-jump'),
        thumbs_up: el('g-thumbs'),
        die:       el('g-die'),
    };

    // Loading progress helper (0–100)
    const setProgress = (pct, msg) => {
        if (loaderBar)      loaderBar.style.width = `${pct}%`;
        if (loadingStatus)  loadingStatus.textContent = msg;
        if (statusText)     statusText.textContent = msg.toUpperCase();
    };

    setProgress(5, 'Initializing renderer…');

    // ── THREE.JS RENDERER ─────────────────────────────────────────────────────
    const container = document.getElementById('scene-container');

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputEncoding    = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // ── SCENE ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05080f);
    scene.fog        = new THREE.FogExp2(0x05080f, 0.055);

    // ── CAMERA ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.lookAt(0, 0.7, 0);

    // Responsive camera presets — pull back on small screens so the full
    // robot is visible without the gesture panel blocking it.
    let camBaseY = 1.15;
    const applyCameraPreset = () => {
        const w = window.innerWidth;
        if (w <= 480) {
            // Small phone — far back, slightly lower to show full robot
            camera.fov = 58; camBaseY = 1.05;
            camera.position.set(0, camBaseY, 6.5);
        } else if (w <= 680) {
            // Large phone
            camera.fov = 54; camBaseY = 1.1;
            camera.position.set(0, camBaseY, 5.5);
        } else if (w <= 900) {
            // Tablet
            camera.fov = 50; camBaseY = 1.15;
            camera.position.set(0, camBaseY, 4.5);
        } else {
            // Desktop
            camera.fov = 48; camBaseY = 1.15;
            camera.position.set(0, camBaseY, 3.6);
        }
        camera.lookAt(0, 0.7, 0);
        camera.updateProjectionMatrix();
    };

    applyCameraPreset();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        applyCameraPreset();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    setProgress(15, 'Setting up lights…');

    // ── LIGHTING ──────────────────────────────────────────────────────────────
    // Ambient fill — keeps the scene from going pitch black in shadows
    scene.add(new THREE.AmbientLight(0x111827, 2.2));

    // Hemisphere light — warm sky, cool ground
    scene.add(new THREE.HemisphereLight(0x1a3a5c, 0x050510, 0.9));

    // Main key light from upper-right
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(2.5, 5, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far  = 20;
    scene.add(keyLight);

    // Cyan accent from front-right
    const cyanLight = new THREE.PointLight(0x00f5ff, 5.0, 14);
    cyanLight.position.set(2, 2.5, 2.5);
    scene.add(cyanLight);

    // Purple rim from back-left
    const purpleLight = new THREE.PointLight(0x7700ff, 3.5, 12);
    purpleLight.position.set(-2.5, 2, -2);
    scene.add(purpleLight);

    // Soft blue fill from the front
    const fillLight = new THREE.PointLight(0x0044ff, 2.0, 8);
    fillLight.position.set(-1, 0.5, 3.5);
    scene.add(fillLight);

    setProgress(25, 'Building environment…');

    // ── ENVIRONMENT — GRID FLOOR ──────────────────────────────────────────────
    const gridMajor = new THREE.GridHelper(30, 40, 0x002244, 0x001122);
    gridMajor.position.y = -0.5;
    scene.add(gridMajor);

    // Subtle second grid layer (finer, slightly brighter lines)
    const gridMinor = new THREE.GridHelper(15, 60, 0x001a33, 0x000d1a);
    gridMinor.position.y = -0.498;
    scene.add(gridMinor);

    // ── ENVIRONMENT — GLOWING PLATFORM ────────────────────────────────────────
    const platGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.055, 72);
    const platMat = new THREE.MeshStandardMaterial({
        color:              0x001830,
        emissive:           0x003355,
        emissiveIntensity:  0.55,
        metalness:          0.9,
        roughness:          0.15,
    });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.y = -0.478;
    platform.receiveShadow = true;
    scene.add(platform);

    // Platform glow disc (very flat, just for the emissive aura)
    const glowGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.01, 72);
    const glowMat = new THREE.MeshStandardMaterial({
        color:             0x000000,
        emissive:          0x00c8e0,
        emissiveIntensity: 0.4,
        transparent:       true,
        opacity:           0.45,
    });
    const glowDisc = new THREE.Mesh(glowGeo, glowMat);
    glowDisc.position.y = -0.505;
    scene.add(glowDisc);

    // ── ENVIRONMENT — ORBITAL RINGS ───────────────────────────────────────────
    // Each ring lives inside a pivot group so rotation.y spins it correctly
    // while rotation.x = PI/2 keeps it flat (horizontal).

    // Ring 1 — cyan, inner
    const ring1Pivot = new THREE.Group();
    ring1Pivot.position.y = -0.44;
    scene.add(ring1Pivot);

    const ring1Mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.80, 0.022, 16, 128),
        new THREE.MeshStandardMaterial({
            color: 0x00f5ff, emissive: 0x00f5ff, emissiveIntensity: 3.5,
        })
    );
    ring1Mesh.rotation.x = Math.PI / 2;
    ring1Pivot.add(ring1Mesh);

    // Ring 2 — purple, outer
    const ring2Pivot = new THREE.Group();
    ring2Pivot.position.y = -0.44;
    scene.add(ring2Pivot);

    const ring2Mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.96, 0.014, 16, 128),
        new THREE.MeshStandardMaterial({
            color: 0x7700ff, emissive: 0x7700ff, emissiveIntensity: 2.5,
        })
    );
    ring2Mesh.rotation.x = Math.PI / 2;
    ring2Pivot.add(ring2Mesh);

    // Ring 3 — blue, middle (slightly tilted for depth)
    const ring3Pivot = new THREE.Group();
    ring3Pivot.position.y = -0.44;
    ring3Pivot.rotation.x = 0.3; // slight tilt
    scene.add(ring3Pivot);

    const ring3Mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.88, 0.008, 16, 128),
        new THREE.MeshStandardMaterial({
            color: 0x0066ff, emissive: 0x0066ff, emissiveIntensity: 2.0,
        })
    );
    ring3Mesh.rotation.x = Math.PI / 2;
    ring3Pivot.add(ring3Mesh);

    // ── ENVIRONMENT — FLOATING PARTICLES ─────────────────────────────────────
    const COUNT = 320;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.random() * Math.PI;
        const r     = 1.8 + Math.random() * 5;
        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55 + 0.6;
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
        color: 0x00aacc, size: 0.022, transparent: true, opacity: 0.5, sizeAttenuation: true,
    }));
    scene.add(particles);

    setProgress(40, 'Loading neural mesh…');

    // ── LOAD ROBOT ────────────────────────────────────────────────────────────
    const robot = await loadGLTF('./assets/RobotExpressive.glb');

    robot.scene.scale.set(0.55, 0.55, 0.55);
    robot.scene.position.set(0, -0.5, 0);

    // Enable shadows on every mesh inside the robot
    robot.scene.traverse(child => {
        if (child.isMesh) {
            child.castShadow    = true;
            child.receiveShadow = true;
        }
    });
    scene.add(robot.scene);

    setProgress(60, 'Wiring animation system…');

    // ── ANIMATION MIXER ───────────────────────────────────────────────────────
    // RobotExpressive.glb animation indices:
    //   [1]  = Death   [2]  = Idle   [3]  = Jump
    //   [9]  = ThumbsUp               [12] = Wave
    const mixer         = new THREE.AnimationMixer(robot.scene);
    const idleAction     = mixer.clipAction(robot.animations[2]);
    const jumpAction     = mixer.clipAction(robot.animations[3]);
    const dieAction      = mixer.clipAction(robot.animations[1]);
    const thumbsUpAction = mixer.clipAction(robot.animations[9]);
    const waveAction     = mixer.clipAction(robot.animations[12]);

    // One-shot for everything except idle
    jumpAction.loop     = THREE.LoopOnce;
    dieAction.loop      = THREE.LoopOnce;
    thumbsUpAction.loop = THREE.LoopOnce;
    waveAction.loop     = THREE.LoopOnce;

    // ── GESTURE → HUD METADATA ────────────────────────────────────────────────
    const gestureInfo = {
        idle:      { name: 'IDLE',     desc: 'Awaiting neural input…',                rowKey: null },
        wave:      { name: 'WAVE',     desc: 'Open palm — initiating wave sequence',   rowKey: 'wave' },
        jump:      { name: 'JUMP',     desc: 'Index vector — executing jump protocol', rowKey: 'jump' },
        thumbs_up: { name: 'APPROVE',  desc: 'Thumb up — signal confirmed',            rowKey: 'thumbs_up' },
        die:       { name: 'SHUTDOWN', desc: 'Lateral palm — stop sequence engaged',   rowKey: 'die' },
    };

    const updateHUD = (key, score = 0) => {
        const info = gestureInfo[key] || gestureInfo.idle;

        // Flash on change
        if (gestureNameEl.textContent !== info.name) {
            gestureNameEl.classList.remove('flash');
            void gestureNameEl.offsetWidth;              // reflow to restart anim
            gestureNameEl.classList.add('flash');
        }

        gestureNameEl.textContent = info.name;
        gestureDescEl.textContent = info.desc;

        const pct = Math.round((score / 10) * 100);
        barConf.style.width = `${pct}%`;
        if (barValEl) barValEl.textContent = score > 0 ? pct + '%' : '--';

        Object.values(gestureRows).forEach(r => r && r.classList.remove('active'));
        if (info.rowKey && gestureRows[info.rowKey]) {
            gestureRows[info.rowKey].classList.add('active');
        }
    };

    // ── ANIMATION CONTROL ─────────────────────────────────────────────────────
    let activeAction = idleAction;
    activeAction.play();

    const fadeToAction = (action, duration) => {
        if (activeAction === action) return;
        activeAction = action;
        activeAction.reset().fadeIn(duration).play();
    };

    // Return to idle when a LoopOnce action finishes
    mixer.addEventListener('finished', () => {
        fadeToAction(idleAction, 0.2);
        updateHUD('idle', 0);
    });

    setProgress(75, 'Loading handpose model…');

    // ── HANDPOSE MODEL ────────────────────────────────────────────────────────
    const hpModel = await handpose.load();

    setProgress(88, 'Starting camera…');

    // ── CAMERA STREAM (for hand detection) ───────────────────────────────────
    const video = document.getElementById('cam-video');
    let cameraReady = false;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        video.srcObject = stream;
        await new Promise(res => video.addEventListener('loadedmetadata', res, { once: true }));
        cameraReady = true;
        dotHand.classList.add('online');
        handStatusEl.textContent = 'CAMERA ACTIVE';
    } catch (err) {
        handStatusEl.textContent = 'CAMERA DENIED';
        console.warn('[RX-7] Camera access denied:', err);
    }

    // ── GESTURE DEFINITIONS ───────────────────────────────────────────────────
    // Wave: open hand, all fingers up
    const waveGesture = new fp.GestureDescription('wave');
    for (const f of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        waveGesture.addCurl(f, fp.FingerCurl.NoCurl, 1.0);
        waveGesture.addDirection(f, fp.FingerDirection.VerticalUp, 1.0);
    }

    // Die: open flat hand sideways
    const dieGesture = new fp.GestureDescription('die');
    for (const f of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        dieGesture.addCurl(f, fp.FingerCurl.NoCurl, 1.0);
        dieGesture.addDirection(f, fp.FingerDirection.HorizontalLeft, 1.0);
        dieGesture.addDirection(f, fp.FingerDirection.HorizontalRight, 1.0);
    }

    // Jump: index finger pointing up, rest fully curled
    const jumpGesture = new fp.GestureDescription('jump');
    jumpGesture.addCurl(fp.Finger.Index,  fp.FingerCurl.NoCurl,   1.0);
    jumpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
    jumpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
    jumpGesture.addCurl(fp.Finger.Ring,   fp.FingerCurl.FullCurl, 1.0);
    jumpGesture.addCurl(fp.Finger.Pinky,  fp.FingerCurl.FullCurl, 1.0);
    jumpGesture.addCurl(fp.Finger.Thumb,  fp.FingerCurl.FullCurl, 1.0);

    // Thumbs up: thumb up, all fingers curled
    const thumbsUpGesture = new fp.GestureDescription('thumbs_up');
    thumbsUpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
    thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalUp,      1.0);
    thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpLeft,  0.9);
    thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpRight, 0.9);
    thumbsUpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
    thumbsUpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalLeft,  0.9);
    thumbsUpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalRight, 0.9);
    for (const f of [fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        thumbsUpGesture.addCurl(f, fp.FingerCurl.FullCurl, 1.0);
    }

    const GE = new fp.GestureEstimator([thumbsUpGesture, waveGesture, jumpGesture, dieGesture]);

    // ── SYSTEM READY ──────────────────────────────────────────────────────────
    setProgress(100, 'System online');
    dotSystem.classList.add('online');
    statusText.textContent = 'NEURAL INTERFACE ONLINE';

    if (loadingOverlay) {
        loadingOverlay.classList.add('fade-out');
        setTimeout(() => { loadingOverlay.style.display = 'none'; }, 950);
    }

    // ── RENDER LOOP ───────────────────────────────────────────────────────────
    const clock  = new THREE.Clock();
    let frameCount  = 0;
    let lastFpsTime = performance.now();

    renderer.setAnimationLoop(() => {
        const delta   = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // Advance robot animations
        mixer.update(delta);

        // Spin the rings at different rates and directions
        ring1Pivot.rotation.y =  elapsed * 0.65;
        ring2Pivot.rotation.y = -elapsed * 0.42;
        ring3Pivot.rotation.y =  elapsed * 0.28;

        // Slowly rotate the particle cloud
        particles.rotation.y = elapsed * 0.035;

        // Pulse the accent lights
        cyanLight.intensity   = 4.5 + Math.sin(elapsed * 1.7)      * 0.9;
        purpleLight.intensity = 3.0 + Math.sin(elapsed * 1.1 + 1)  * 0.7;

        // Platform glow pulsing
        glowMat.emissiveIntensity = 0.3 + Math.sin(elapsed * 2.2) * 0.15;

        // Very subtle camera breathing
        camera.position.y = camBaseY + Math.sin(elapsed * 0.38) * 0.018;

        // FPS counter
        frameCount++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
            fpsDisplay.textContent = `FPS · ${frameCount}`;
            frameCount  = 0;
            lastFpsTime = now;
        }

        renderer.render(scene, camera);
    });

    // ── HAND DETECTION LOOP ───────────────────────────────────────────────────
    // Skips frames when an animation is playing and throttles inference
    // so the 3D rendering stays smooth.
    let skipCount  = 0;
    let handVisible = false;

    const detect = async () => {
        // Don't trigger a new gesture while one is already animating
        if (activeAction !== idleAction) {
            requestAnimationFrame(detect);
            return;
        }

        // Throttle: run inference every 9 frames (~15 Hz at 60 fps)
        if (skipCount < 9) { skipCount++; requestAnimationFrame(detect); return; }
        skipCount = 0;

        if (!cameraReady || video.readyState < 2) {
            requestAnimationFrame(detect);
            return;
        }

        const predictions = await hpModel.estimateHands(video);

        if (predictions.length > 0) {
            if (!handVisible) {
                handVisible = true;
                dotHand.classList.add('detected');
                handStatusEl.textContent = 'HAND DETECTED';
            }

            const est = GE.estimate(predictions[0].landmarks, 8.5);

            if (est.gestures.length > 0) {
                const best = est.gestures.sort((a, b) => b.score - a.score)[0];
                updateHUD(best.name, best.score);

                if (best.name === 'thumbs_up') fadeToAction(thumbsUpAction, 0.5);
                if (best.name === 'wave')      fadeToAction(waveAction,     0.5);
                if (best.name === 'jump')      fadeToAction(jumpAction,     0.5);
                if (best.name === 'die')       fadeToAction(dieAction,      0.5);
            }
        } else {
            if (handVisible) {
                handVisible = false;
                dotHand.classList.remove('detected');
                handStatusEl.textContent = 'SCANNING…';
                updateHUD('idle', 0);
            }
        }

        requestAnimationFrame(detect);
    };

    requestAnimationFrame(detect);

    // ── Mobile gesture panel toggle ───────────────────────────────────────
    const panelLeft    = document.querySelector('.panel-left');
    const toggleBtn    = document.getElementById('gesture-toggle');
    const closeBtn     = document.getElementById('panel-close');

    const openPanel  = () => panelLeft.classList.add('mobile-open');
    const closePanel = () => panelLeft.classList.remove('mobile-open');

    if (toggleBtn) toggleBtn.addEventListener('click', openPanel);
    if (closeBtn)  closeBtn.addEventListener('click', closePanel);
}
