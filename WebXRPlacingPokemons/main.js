import * as THREE from 'three';
import { ARButton } from './libs/three.js-r132/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// ─── Pokémon registry ────────────────────────────────────────────
const POKEMONS = [
    { id: 'bulbasaur', name: 'Bulbasaur', path: 'models/bulbasaur/scene.glb', scale: 50, color: '#4CAF50' },
    { id: 'beedrill', name: 'Beedrill', path: 'models/beedrill/scene.glb', scale: 0.01, color: '#CDDC39' },
    { id: 'amoonguss', name: 'Amoonguss', path: 'models/amoonguss/scene.glb', scale: 0.10, color: '#8BC34A' },
    { id: 'geodude', name: 'Geodude', path: 'models/geodude/scene.glb', scale: 0.5, color: '#A1887F' },
    { id: 'regirock', name: 'Regirock', path: 'models/regirock/scene.glb', scale: 1, color: '#90A4AE' },
    { id: 'mudkip', name: 'Mudkip', path: 'models/mudkip/scene.glb', scale: 0.05, color: '#42A5F5' },
    { id: 'Torchic', name: 'Torchic', path: 'models/Torchic/scene.glb', scale: 0.05, color: '#FF7043' },
    { id: 'magnemite', name: 'Magnemite', path: 'models/magnemite/scene.glb', scale: 0.05, color: '#78909C' },
    { id: 'browt', name: 'Browt', path: 'models/browt/scene.glb', scale: 0.5, color: '#AB47BC' },
];

document.addEventListener('DOMContentLoaded', () => {

    const loader = new GLTFLoader();
    const clock = new THREE.Clock();
    const mixers = [];          // AnimationMixers for every placed model
    let selectedPokemon = POKEMONS[0];
    const modelCache = new Map(); // id → gltf  (each model fetched at most once per session)
    let isLoading = false;        // blocks overlapping on-demand load requests

    // ─── Load a Pokémon model asynchronously ─────────────────────
    // onDone receives the gltf object (or null on error).
    function loadModel(pokemon, onDone) {
        if (modelCache.has(pokemon.id)) {
            if (onDone) onDone(modelCache.get(pokemon.id));
            return;
        }
        loader.load(
            pokemon.path,
            (gltf) => {
                modelCache.set(pokemon.id, gltf);
                if (onDone) onDone(gltf);
            },
            undefined,
            (err) => { console.error('GLTF load error:', err); if (onDone) onDone(null); }
        );
    }

    // ─── Populate picker grid ────────────────────────────────────
    const gridEl = document.getElementById('pokemon-grid');
    POKEMONS.forEach((p, i) => {
        const abbr = p.name.slice(0, 3).toUpperCase();
        const card = document.createElement('div');
        card.className = 'pokemon-card' + (i === 0 ? ' selected' : '');
        card.dataset.id = p.id;
        card.style.setProperty('--poke-color', p.color);
        card.innerHTML = `
            <div class="card-glow"></div>
            <div class="card-icon" style="background:${p.color}1a; border-color:${p.color}44;">
                <span class="poke-abbr" style="color:${p.color}">${abbr}</span>
            </div>
            <span class="card-name">${p.name}</span>
            <div class="card-check">
                <svg viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        `;
        card.addEventListener('click', () => {
            document.querySelectorAll('.pokemon-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPokemon = p;
        });
        gridEl.appendChild(card);
    });

    // ─── Populate in-AR switcher ─────────────────────────────────
    const switcherGrid = document.getElementById('switcher-grid');
    const switcherName = document.getElementById('switcher-name');

    POKEMONS.forEach((p, i) => {
        const btn = document.createElement('button');
        btn.className = 'switcher-pill' + (i === 0 ? ' active' : '');
        btn.dataset.id = p.id;
        btn.style.setProperty('--poke-color', p.color);
        btn.textContent = p.name;
        btn.addEventListener('click', () => {
            selectedPokemon = p;
            switcherName.textContent = p.name;
            document.querySelectorAll('.switcher-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Update picker grid selection to stay in sync
            document.querySelectorAll('.pokemon-card').forEach(c => {
                c.classList.toggle('selected', c.dataset.id === p.id);
            });
            // No network request here — model loads only when the user taps to place
            // Collapse the panel
            switcherGrid.classList.add('collapsed');
            document.getElementById('switcher-chevron').style.transform = '';
        });
        switcherGrid.appendChild(btn);
    });

    // Toggle switcher open/close
    document.getElementById('toggle-switcher').addEventListener('click', () => {
        const collapsed = switcherGrid.classList.toggle('collapsed');
        document.getElementById('switcher-chevron').style.transform = collapsed ? '' : 'rotate(180deg)';
    });

    // ─── Initialize Three.js & WebXR ─────────────────────────────
    const initialize = async () => {

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(1, 2, 1);
        scene.add(dirLight);

        // Reticle (placement ring)
        const reticle = new THREE.Mesh(
            new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial()
        );
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        scene.add(reticle);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.xr.enabled = true;

        const arButtonEl = ARButton.createButton(renderer, {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        });
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(arButtonEl);

        // XR controller (first touch / tap)
        const controller = renderer.xr.getController(0);
        scene.add(controller);

        // Track whether the last touch started on an overlay UI element.
        // If so, the corresponding XR `select` event should not place a model.
        // We use a timeout reset because in DOM overlay mode the browser often
        // consumes the touch entirely — no XR `select` fires, so a flag-only
        // approach gets permanently stuck.
        let suppressNextSelect = false;
        let suppressTimer = null;
        document.getElementById('ar-switcher').addEventListener(
            'pointerdown', () => {
                suppressNextSelect = true;
                clearTimeout(suppressTimer);
                suppressTimer = setTimeout(() => { suppressNextSelect = false; }, 600);
            }, { capture: true }
        );

        // ── Placement helper ─────────────────────────────────────
        function placeModel(gltf, pokemon, pos, quat) {
            const anchor = new THREE.Group();
            anchor.position.copy(pos);
            anchor.quaternion.copy(quat);
            scene.add(anchor);

            const model = SkeletonUtils.clone(gltf.scene);
            model.scale.setScalar(pokemon.scale);

            // Lift model so its base sits flush on the detected surface
            model.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(model);
            if (isFinite(box.min.y)) model.position.y -= box.min.y;

            anchor.add(model);

            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach(clip => mixer.clipAction(clip).play());
                mixers.push(mixer);
            }
        }

        // ── Place selected Pokémon on tap ────────────────────────
        const tapHint = document.getElementById('tap-hint');

        controller.addEventListener('select', () => {
            if (suppressNextSelect) {
                suppressNextSelect = false;
                clearTimeout(suppressTimer);
                return;
            }
            if (!reticle.visible || isLoading) return;

            // Snapshot the tap position and selected pokemon immediately
            const pos = new THREE.Vector3();
            const quat = new THREE.Quaternion();
            reticle.matrix.decompose(pos, quat, new THREE.Vector3());
            const pokemon = selectedPokemon;

            const cached = modelCache.get(pokemon.id);
            if (cached) {
                // Already in cache — zero network cost, place instantly
                placeModel(cached, pokemon, pos, quat);
            } else {
                // First tap for this pokemon — load then auto-place at tap position
                isLoading = true;
                tapHint.textContent = `Loading ${pokemon.name}…`;
                loadModel(pokemon, (gltf) => {
                    isLoading = false;
                    tapHint.textContent = 'Tap to place Pokémon';
                    if (gltf) placeModel(gltf, pokemon, pos, quat);
                });
            }
        });

        // ── DOM element refs ─────────────────────────────────────
        const splashOverlay = document.getElementById('splash-overlay');
        const pickerEl = document.getElementById('pokemon-picker');
        const startArBtn = document.getElementById('start-ar-btn');
        const confirmBtn = document.getElementById('confirm-pokemon-btn');
        const confirmLabel = document.getElementById('confirm-btn-label');
        const pickerBack = document.getElementById('picker-back');
        const arSwitcher = document.getElementById('ar-switcher');
        const arButton = document.getElementById('ARButton');

        // Splash → show picker
        startArBtn.addEventListener('click', () => {
            splashOverlay.classList.add('hidden');
            pickerEl.classList.remove('hidden');
        });

        // Picker back → return to splash
        pickerBack.addEventListener('click', () => {
            pickerEl.classList.add('hidden');
            splashOverlay.classList.remove('hidden');
        });

        // Picker confirm → load model → enter AR
        confirmBtn.addEventListener('click', () => {
            confirmLabel.textContent = 'Loading…';
            confirmBtn.disabled = true;
            switcherName.textContent = selectedPokemon.name;

            // Keep switcher pill in sync with picker selection
            document.querySelectorAll('.switcher-pill').forEach(b => {
                b.classList.toggle('active', b.dataset.id === selectedPokemon.id);
            });

            loadModel(selectedPokemon, (_gltf) => {
                pickerEl.classList.add('hidden');
                confirmLabel.textContent = 'Enter AR';
                confirmBtn.disabled = false;
                arButton.click();
            });
        });

        // ── Session lifecycle ────────────────────────────────────
        renderer.xr.addEventListener('sessionstart', async () => {
            arButton.classList.add('ar-active');
            tapHint.classList.add('visible');
            arSwitcher.classList.add('visible');
            clock.start();

            const session = renderer.xr.getSession();
            const viewerRef = await session.requestReferenceSpace('viewer');
            const hitTestSrc = await session.requestHitTestSource({ space: viewerRef });

            renderer.setAnimationLoop((_timestamp, frame) => {
                if (!frame) return;

                const delta = clock.getDelta();
                for (const mixer of mixers) mixer.update(delta);

                const hits = frame.getHitTestResults(hitTestSrc);
                if (hits.length > 0) {
                    const pose = hits[0].getPose(renderer.xr.getReferenceSpace());
                    reticle.visible = true;
                    reticle.matrix.fromArray(pose.transform.matrix);
                } else {
                    reticle.visible = false;
                }

                renderer.render(scene, camera);
            });
        });

        renderer.xr.addEventListener('sessionend', () => {
            splashOverlay.classList.remove('hidden');
            arButton.classList.remove('ar-active');
            tapHint.classList.remove('visible');
            arSwitcher.classList.remove('visible');
            switcherGrid.classList.add('collapsed');
            document.getElementById('switcher-chevron').style.transform = '';
        });
    };

    initialize();
});
