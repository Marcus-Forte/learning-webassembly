const video     = document.getElementById('video');
const btnStart  = document.getElementById('btn-start');
const btnStop   = document.getElementById('btn-stop');
const selDevice = document.getElementById('select-device');
const selFacing = document.getElementById('select-facing');
const status    = document.getElementById('status');
const badge      = document.getElementById('badge');
const canvasOut  = document.getElementById('canvas-out');
const outCtx     = canvasOut.getContext('2d');
const sliderBlur  = document.getElementById('slider-blur');
const blurVal     = document.getElementById('blur-val');
const sliderScale = document.getElementById('slider-scale');
const scaleVal    = document.getElementById('scale-val');

const offscreen = document.createElement('canvas');
const offCtx    = offscreen.getContext('2d', { willReadFrequently: true });

let currentStream = null;
let cvModule      = null;
let rafId         = null;

sliderBlur.addEventListener('input', () => {
    blurVal.textContent = sliderBlur.value;
});
sliderScale.addEventListener('input', () => {
    scaleVal.textContent = sliderScale.value;
});

if (typeof BenchOpenCV !== 'undefined') {
    BenchOpenCV().then(m => { cvModule = m; });
}

function processFrame() {
    if (!currentStream || !video.videoWidth) {
        rafId = requestAnimationFrame(processFrame);
        return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;

    if (canvasOut.width  !== w) canvasOut.width  = w;
    if (canvasOut.height !== h) canvasOut.height = h;

    if (cvModule) {
        // --- C++ / WASM gaussian blur ---
        if (offscreen.width  !== w) offscreen.width  = w;
        if (offscreen.height !== h) offscreen.height = h;
        offCtx.drawImage(video, 0, 0);
        const imageData = offCtx.getImageData(0, 0, w, h);
        const numBytes  = w * h * 4;
        const ptr = cvModule._malloc(numBytes);
        cvModule.HEAPU8.set(imageData.data, ptr);
        cvModule._wasm_gaussian_blur(ptr, w, h, parseInt(sliderBlur.value, 10), parseFloat(sliderScale.value));
        imageData.data.set(cvModule.HEAPU8.subarray(ptr, ptr + numBytes));
        cvModule._free(ptr);
        outCtx.putImageData(imageData, 0, 0);
    } else {
        // Passthrough — no WASM loaded yet
        outCtx.drawImage(video, 0, 0);
    }

    rafId = requestAnimationFrame(processFrame);
}

function setStatus(msg, cls = '') {
    status.textContent = msg;
    status.className = 'status ' + cls;
}

// Populate camera device list (requires at least one permission grant first)
async function populateDevices() {
    try {
        const savedId = selDevice.value;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');
        selDevice.innerHTML = '<option value="">— any —</option>';
        cameras.forEach((cam, i) => {
            const opt = document.createElement('option');
            opt.value = cam.deviceId;
            opt.textContent = cam.label || `Camera ${i + 1}`;
            selDevice.appendChild(opt);
        });
        if (savedId) selDevice.value = savedId;
    } catch (e) {
        // Ignore — devices may not be enumerable yet
    }
}

async function startCamera() {
    stopCamera();

    const deviceId   = selDevice.value;
    const facingMode = selFacing.value;

    const videoConstraints = deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode };

    try {
        setStatus('Requesting permission…');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false,
        });
        currentStream = stream;
        video.srcObject = stream;
        await video.play();
        badge.classList.add('visible');
        btnStart.disabled = true;
        btnStop.disabled  = false;
        setStatus('Streaming', 'ok');
        await populateDevices(); // now labels are available
        if (!rafId) rafId = requestAnimationFrame(processFrame);
    } catch (err) {
        setStatus(`Error: ${err.message}`, 'err');
    }
}

function stopCamera() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
    }
    video.srcObject = null;
    outCtx.clearRect(0, 0, canvasOut.width, canvasOut.height);
    badge.classList.remove('visible');
    btnStart.disabled = false;
    btnStop.disabled  = true;
    setStatus('Stopped');
}

btnStart.addEventListener('click', startCamera);
btnStop.addEventListener('click', stopCamera);

// Re-start with new device when selection changes while live
selDevice.addEventListener('change', () => { if (currentStream) startCamera(); });
selFacing.addEventListener('change', () => { if (currentStream) startCamera(); });

// Try to pre-populate device list without triggering a permission prompt
populateDevices();
