// face-worker.js  — module worker ({ type:'module' } in scripts.js)
//
// face-api (vladmandic) isBrowser2() checks ALL SEVEN of these at module init:
//   typeof window === "object"
//   typeof document !== "undefined"
//   typeof HTMLImageElement !== "undefined"
//   typeof HTMLCanvasElement !== "undefined"
//   typeof HTMLVideoElement !== "undefined"
//   typeof ImageData !== "undefined"            ← already in workers
//   typeof CanvasRenderingContext2D !== "undefined"  ← NOT in workers, must shim
//
// We set every missing global BEFORE the dynamic import so the module-level
// initialize() call inside face-api.esm.js sees a valid browser environment.
// Dynamic imports are NOT hoisted, so these assignments always run first.

// ── Global shims ──────────────────────────────────────────────────────────────
self.window = self;   // covers: typeof window === "object"

// Workers have OffscreenCanvas but not HTMLCanvasElement.
// Aliasing HTMLCanvasElement → OffscreenCanvas means:
//   • isBrowser2() typeof check passes
//   • createBrowserEnv() sets env.Canvas = OffscreenCanvas
//   • detectSingleFace(offscreenCanvas) instanceof check passes
if (typeof HTMLCanvasElement  === 'undefined') self.HTMLCanvasElement  = OffscreenCanvas;
if (typeof HTMLVideoElement   === 'undefined') self.HTMLVideoElement   = class HTMLVideoElement  {};
if (typeof HTMLImageElement   === 'undefined') self.HTMLImageElement   = class HTMLImageElement  {};

// CanvasRenderingContext2D — workers use OffscreenCanvasRenderingContext2D instead.
// We alias so the typeof check passes; face-api uses it only for instanceof guards.
if (typeof CanvasRenderingContext2D === 'undefined') {
    self.CanvasRenderingContext2D =
        (typeof OffscreenCanvasRenderingContext2D !== 'undefined')
            ? OffscreenCanvasRenderingContext2D
            : class CanvasRenderingContext2D {};
}

if (typeof document === 'undefined') {
    // document.createElement('canvas') → real OffscreenCanvas so face-api's
    // createCanvasElement() returns something instanceof OffscreenCanvas (= HTMLCanvasElement).
    self.document = {
        createElement(tag) {
            if (tag === 'canvas') return new OffscreenCanvas(1, 1);
            return { style: {}, setAttribute() {}, addEventListener() {}, removeEventListener() {} };
        },
        createElementNS(_ns, tag) { return self.document.createElement(tag); },
        body:          { appendChild() {}, removeChild() {} },
        head:          { appendChild() {}, removeChild() {} },
        addEventListener() {}, removeEventListener() {},
        currentScript: null,
        querySelector()  { return null; },
        getElementById() { return null; },
        title: '',
    };
}

// ── Load face-api (dynamic import runs AFTER the shims above) ─────────────────
const faceapi = await import('./libs/face-api.esm.js');

try {
    // CPU backend — no WebGL needed, no conflicts with main page's THREE.js contexts
    await faceapi.tf.setBackend('cpu');
    await faceapi.tf.ready();

    // Tell face-api to use OffscreenCanvas for all canvas operations
    // (redundant since HTMLCanvasElement = OffscreenCanvas, but explicit = safe)
    if (faceapi.env && typeof faceapi.env.monkeyPatch === 'function') {
        faceapi.env.monkeyPatch({
            Canvas: OffscreenCanvas,
            createCanvasElement: (w, h) => new OffscreenCanvas(w || 1, h || 1),
        });
    }

    const base = self.location.href.replace(/\/[^/]+$/, '');
    await faceapi.nets.tinyFaceDetector.load(base + '/assets/facemodel');
    await faceapi.nets.faceExpressionNet.load(base + '/assets/facemodel');

    // inputSize 128 — good balance of accuracy and CPU speed (~180 ms/frame)
    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.22 });

    self.postMessage({ type: 'ready' });

    let busy = false;

    self.onmessage = async ({ data }) => {
        if (data.type !== 'frame' || busy) return;
        busy = true;
        try {
            const canvas = new OffscreenCanvas(data.width, data.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) { self.postMessage({ type: 'no-face' }); busy = false; return; }
            ctx.putImageData(
                new ImageData(new Uint8ClampedArray(data.buffer), data.width, data.height),
                0, 0
            );
            const result = await faceapi
                .detectSingleFace(canvas, opts)
                .withFaceExpressions();

            self.postMessage(
                result?.expressions
                    ? { type: 'emotion', expressions: result.expressions }
                    : { type: 'no-face' }
            );
        } catch (err) {
            console.error('[face-worker] inference error:', String(err));
            self.postMessage({ type: 'no-face' });
        } finally {
            busy = false;
        }
    };

} catch (err) {
    self.postMessage({ type: 'error', message: String(err) });
}
