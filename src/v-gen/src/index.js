import { VCAM } from "../../flexatar-package/src/index.js"
import { texts } from "./locale.js"
import { recordAudioUI } from "./rec-mic-ui-v4/recordAudioUI.js"
import convert from './video_conversions.js';
import { FlexatarRecorder, mediaStreamFromAudio, addAudioStream } from "./recorder.js"
function log() {
    console.log("[FTAR_VIDEO_GEN_IFRAME]", ...arguments)
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8); // Version 4 bits
        return v.toString(16);
    });
}


async function getCroppedImageDataUrlFromBuffer(imageBuffer, targetWidth, targetHeight) {
    const bitmap = await createImageBitmap(imageBuffer);

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    const imgAspect = bitmap.width / bitmap.height;
    const targetAspect = targetWidth / targetHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgAspect > targetAspect) {
        drawHeight = targetHeight;
        drawWidth = bitmap.width * (targetHeight / bitmap.height);
        offsetX = -(drawWidth - targetWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = targetWidth;
        drawHeight = bitmap.height * (targetWidth / bitmap.width);
        offsetX = 0;
        offsetY = -(drawHeight - targetHeight) / 2;
    }

    ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight);

    const blob = await canvas.convertToBlob();

    // Convert Blob to data URL
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    return dataUrl;
}
function getFtarViewSize() {
    const ftarViewSize = window.innerWidth - 60
    log("ftarViewSize", ftarViewSize)
    return ftarViewSize
}

const vCam = new VCAM(async () => {
    const msgID = generateUUID()
    return "no token"
    return await new Promise(resolve => {
        const handler = e => {
            if (!e.data) return
            log("message received", e.data)
            if (e.data.msgID !== msgID) return
            window.removeEventListener("message", handler)
            resolve(e.data.token)
            log("token response", e.data.token)
        }
        window.addEventListener("message", handler)
        window.parent.postMessage({ flexatarVideoGenIframe: { tokenRequest: true, msgID } }, "*")
        log("token request from iframe with message ID", msgID)

    })

},
    {
        size: {
            width: getFtarViewSize(),
            height: getFtarViewSize(),
        },
        url: {
            vcam: "/vcam",
            lens: "/lens",
            progress: "/progress",
            files: "/files",
            effects: "/effect",
            retarg: "/retarg",
        },
        canvas: document.getElementById("top-canvas"),
        roundOverlay: true,
        // lensClassName:"flexatar-lens",
        // progressClassName:"flexatar-progress",
        defaultBackgroundsFn: async () => {
            log("defaultBackgroundsFn called")
            const backgroundNames = ["bkg_chatgpt_1.png", "bkg_chatgpt_2.png", "bkg_chatgpt_3.png"]

            const backgrounds = await Promise.all(
                backgroundNames.map(async name => {
                    const res = await fetch(`res/${name}`);
                    const blob = await res.blob();
                    const file = new File([blob], name, { type: blob.type });
                    return await getCroppedImageDataUrlFromBuffer(file, 480, 640);
                })
            );


            // const dataUrl = await getCroppedImageDataUrlFromBuffer(file, 480, 640)

            return backgrounds;
            // log("defaultBackgroundsFn called")
            // return []
        }
    })


vCam.onReady = () => {
    const size = getFtarViewSize()
    vCam.size = { width: size, height: size }
}
const handleResize = () => {
    const size = getFtarViewSize()
    vCam.size = { width: size, height: size }
    log("vgen window resize")
}
window.addEventListener("resize", handleResize)


// document.getElementById("right-panel").appendChild(vCam.canvas)
// vCam.canvas.style.display = ""
document.getElementById("left-panel").appendChild(vCam.element)

// vCam.mount(document.getElementById("left-panel"))
vCam.element.style.height = "100%"


function checkFileTypeIsAudio(fileType) {
    return fileType.startsWith("audio/")
}



class DropZone {

    constructor(text, accept) {
        this.dropZone = document.createElement("div")
        this.form = document.createElement("form")
        this.dropZone.className = "drop-zone"
        this.dropZoneText = document.createElement("p")
        this.dropZoneText.innerText = text
        this.dropZone.appendChild(this.dropZoneText)
        const input = document.createElement('input');
        this.input = input
        input.type = "file";
        if (accept) {
            input.accept = accept
        } else {
            input.accept = "image/*"
        }
        input.onchange = e => this.handleFiles(e)
        this.form.appendChild(input);
        this.dropZone.onclick = () => {
            input.value = ""; // Reset input value to allow re-selecting the same file
            this.form.reset()
            input.click()
        }
        this.dropZone.ondragover = (e) => {
            e.preventDefault();
            this.dropZone.classList.add('hover');
        }

        this.dropZone.ondragleave = (e) => {
            this.dropZone.classList.remove('hover');
        }
        this.dropZone.ondrop = e => {
            e.preventDefault();
            this.dropZone.classList.remove('hover');
            const files = e.dataTransfer.files;
            this.handleFiles({ target: { files } });
        }

    }
    hide() {
        this.dropZone.classList.add("invisible")
        // this.dropZone.style.display = "none"
    }
    show() {
        this.dropZone.classList.remove("invisible")
        // this.dropZone.style.display = ""
    }
}

function audioBufferToFloat32ArrayBuffer(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0); // mono
    const float32Array = new Float32Array(channelData.length);
    float32Array.set(channelData);
    return float32Array.buffer;
}

function splitArrayBufferToChunks(arrayBuffer, chunkSize = 800) {
    const floatArray = new Float32Array(arrayBuffer);
    const chunks = [];
    for (let i = 0; i < floatArray.length; i += chunkSize) {
        const chunk = floatArray.subarray(i, i + chunkSize);
        chunks.push(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength));
    }
    return chunks;
}

// const audioElement = new Audio()
// const audio = audioElement

/*
const playPauseBtn = document.getElementById('playPause');
const seekBar = document.getElementById('seekBar');
const volume = document.getElementById('volume');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');


playPauseBtn.addEventListener('click', () => {

    if (audio.paused) {
        audio.play();
        playPauseBtn.textContent = '⏸️';
    } else {
        audio.pause();
        playPauseBtn.textContent = '▶️';
    }
});

// Volume control
volume.addEventListener('input', () => {
    audio.volume = volume.value;
});

// Update seek bar
audio.addEventListener('timeupdate', () => {
    seekBar.value = Math.floor(audio.currentTime);
    currentTimeEl.textContent = formatTime(audio.currentTime);
});

// Seek functionality
seekBar.addEventListener('input', () => {
    audio.currentTime = seekBar.value;
});

// When audio metadata loads (e.g. duration)
audio.addEventListener('loadedmetadata', () => {
    seekBar.max = Math.floor(audio.duration);
    durationEl.textContent = formatTime(audio.duration);
});

// Utility: format seconds as mm:ss
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}
*/
// const playerControls = new CustomAudioPlayer(audioElement,audioControlsContainer,width="240px")


async function processAudioBuffer(ac, audioBuffer) {

    const audioContext = new OfflineAudioContext(1, audioBuffer.length, 16000);
    // Source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // High-pass (cut below ~100Hz)
    const highpass = audioContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 1500;

    // Low-pass (cut above ~8000Hz)
    const lowpass = audioContext.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 6000;

    // Peaking EQ at ~3000Hz for clarity
    const clarityBoost = audioContext.createBiquadFilter();
    clarityBoost.type = "peaking";
    clarityBoost.frequency.value = 6000;
    clarityBoost.gain.value = 4; // dB
    clarityBoost.Q.value = 1;

    // Compressor
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Connect chain
    source.connect(highpass)
        .connect(lowpass)
        .connect(clarityBoost)
        .connect(compressor)
        .connect(audioContext.destination);

    source.start();

    // Render processed audio
    const renderedBuffer = await audioContext.startRendering();
    return renderedBuffer;
}

async function enhanceSpeechAudioBuffer(audioBuffer) {
    // Prepare offline context with same length/sample rate/channels as input
    const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );

    // Create source from existing buffer
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    // --- EQ Chain ---
    // High-pass to remove rumble
    const highpass = offlineCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 80;

    // Low-mid boost for B/M/P body
    const plosiveBoost = offlineCtx.createBiquadFilter();
    plosiveBoost.type = "peaking";
    plosiveBoost.frequency.value = 250;
    plosiveBoost.gain.value = 4;
    plosiveBoost.Q.value = 1;

    // Presence boost (clarity)
    const presenceBoost = offlineCtx.createBiquadFilter();
    presenceBoost.type = "peaking";
    presenceBoost.frequency.value = 3000;
    presenceBoost.gain.value = 4;
    presenceBoost.Q.value = 1;

    // Gentle de-esser
    const deEsser = offlineCtx.createBiquadFilter();
    deEsser.type = "peaking";
    deEsser.frequency.value = 7500;
    deEsser.gain.value = -3;
    deEsser.Q.value = 2;

    // Low-shelf cut to reduce breathing hiss
    const lowShelfCut = offlineCtx.createBiquadFilter();
    lowShelfCut.type = "lowshelf";
    lowShelfCut.frequency.value = 10000;
    lowShelfCut.gain.value = -6;

    // --- Connect chain ---
    source.connect(highpass)
        .connect(plosiveBoost)
        .connect(presenceBoost)
        .connect(deEsser)
        .connect(lowShelfCut)
        .connect(offlineCtx.destination);

    // Start source
    source.start();

    // Render new buffer
    const processedBuffer = await offlineCtx.startRendering();
    return processedBuffer;
}

async function enhanceMnasal(audioBuffer) {
    const offlineCtx = new OfflineAudioContext(
        1,
        audioBuffer.length,
        audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    // Create notch filter for a specific frequency
    const makeNotch = (freq) => {
        const notch = offlineCtx.createBiquadFilter();
        notch.type = "notch";
        notch.frequency.value = freq;
        notch.Q.value = 30; // narrow bandwidth for precise cut
        return notch;
    };

    // Hum suppression: 50 Hz and harmonics
    const humFilters = [
        makeNotch(50),
        makeNotch(100),
        makeNotch(150),
        makeNotch(200),
        makeNotch(250),
        makeNotch(300),
        makeNotch(350),
        makeNotch(400),
        makeNotch(450),
        makeNotch(500)
    ];

    // Focused boost for M (nasal low-mid)
    const mBoost = offlineCtx.createBiquadFilter();
    mBoost.type = "peaking";
    mBoost.frequency.value = 250;
    mBoost.gain.value = 6;
    mBoost.Q.value = 4;

    // Mild cut above to avoid muddiness
    const mudCut = offlineCtx.createBiquadFilter();
    mudCut.type = "peaking";
    mudCut.frequency.value = 600;
    mudCut.gain.value = -2;
    mudCut.Q.value = 1.5;

    // Presence boost
    const presenceBoost = offlineCtx.createBiquadFilter();
    presenceBoost.type = "peaking";
    presenceBoost.frequency.value = 3000;
    presenceBoost.gain.value = 2;
    presenceBoost.Q.value = 1;

    // Connect chain: hum removal → M boost → clarity shaping
    let node = source;
    for (const f of humFilters) {
        node.connect(f);
        node = f;
    }
    node.connect(mBoost)
        .connect(mudCut)
        .connect(presenceBoost)
        .connect(offlineCtx.destination);

    source.start();

    return await offlineCtx.startRendering();
}

function playAudioBuffer(audioBuffer) {
    const audioContext = new AudioContext();
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}
// =============audio file processing==========
const audioDropZone = new DropZone(texts.dropAudio, "audio/*")
// const audioDropZone = new DropZone("Drag & drop audio here or click to upload","audio/*")
audioDropZone.handleFiles = async (e) => {
    const file = e.target.files[0];

    const fileType = file.type;
    if (!checkFileTypeIsAudio(fileType)) {
        // showPopup1(texts.notAnAudio)
        log("incorrect audio file")
        return
    }

    // const audioPlayer = document.getElementById('audioPlayer');
    audioDropDownContainer.classList.add("invisible")
    logContainer.classList.remove("invisible")
    cancelButton.classList.remove("invisible")
    let needAbortion = false;
    cancelButton.onclick = () => {
        needAbortion = true
    }
    function abortPrepareAudio() {
        if (!needAbortion) return false
        audioDropDownContainer.classList.remove("invisible")
        logContainer.classList.add("invisible")
        cancelButton.classList.add("invisible")
        recordSign.classList.add("invisible")
        stopRecordSign.classList.add("invisible")
        downloadVideoSign.classList.add("invisible")
        audioElement.classList.add("invisible")
        shareSign.classList.add("invisible")
        return true
    }

    logText.textContent = "DECODING"
    const arrayBuffer = await file.arrayBuffer();
    const tempContext = new OfflineAudioContext(1, 1, 16000); // dummy
    let decodedBuffer = await tempContext.decodeAudioData(arrayBuffer);
    decodedBuffer = await enhanceMnasal(decodedBuffer)
    // decodedBuffer = await processAudioBuffer(tempContext,decodedBuffer)
    log("processAudioBuffer", decodedBuffer)
    // playAudioBuffer(decodedBuffer)

    if (abortPrepareAudio()) return;
    // log(decodedBuffer)
    logText.textContent = "PROCESSING 0%"
    const audioChunks = splitArrayBufferToChunks(audioBufferToFloat32ArrayBuffer(decodedBuffer))
    if (audioChunks[audioChunks.length - 1].length != 3200) {
        audioChunks.pop()
    }
    for (let i = 0; i < 10; i++) {
        const zeroChunk = new Float32Array(800);
        audioChunks.push(zeroChunk.buffer);
    }
    if (abortPrepareAudio()) return;

    const timePerChunk = 800 / 16000
    function getCurrentLipAnimPosition() {
        return Math.round(audioElement.currentTime / timePerChunk)
    }

    let lipStateResolve
    vCam.vCamStream.onLipState = lipState => {
        if (lipStateResolve) lipStateResolve(lipState)
    }
    let animVectors = []
    let counter = 0
    for (const chunk of audioChunks) {
        // log("sending chunk",chunk)
        const lipStatePromise = new Promise(resolve => {
            lipStateResolve = resolve
        })
        // log("chunk", chunk)
        vCam.vCamStream.makeAnimVector(chunk)
        const lipState = await lipStatePromise
        animVectors.push(lipState)
        if (counter % 50 === 0) {
            logText.textContent = `PROCESSING ${Math.round(counter / audioChunks.length * 100)}%`
            if (abortPrepareAudio()) return;
        }
        counter++
        // log("lipState", lipState)

    }
    for (let i = 0; i < 10; i++) {
        animVectors.shift()
    }

    // Calculate Euclidean length for each animVector and find the max
    function normalizeAnimation(av) {
        let maxLength = 0;
        for (const v of av) {
            const length = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
            // log
            if (length > maxLength) maxLength = length;
        }
        const multiplier = 1.2573383634467177 / maxLength
        log("Max Euclidean length of animVectors:", maxLength);
        // 1.2573383634467177
        return av.map(v => v.map(x => x * multiplier));
    }


    // animVectors = normalizeAnimation(animVectors)

    const thr = 0.25
    const thr1 = 0.05
    // Calculate the mean vector among animVectors
    function deepenMinimaSmooth(arr, min = 0, max = 0.25) {
        // Find min and max to normalize
        // const min = 0;
        // const max = 0.25;

        return arr.map(v => {
            // Normalize to [-1, 1]
            let norm = (2 * (v - min) / (max - min)) - 1; // -1 to 1
            // Apply nonlinear scaling
            // let warped = norm<0 ? norm *3 : norm;
            let warped = norm < 0
                ? norm * 1.5  // smooth power scaling
                : norm * 1.2;

            let ret = ((warped + 1) / 2) * (max - min) + min;
            // if (min === 0) {
            if (ret < -0.1) ret = -0.1
            if (ret > 1) ret = 1
            // ret = Math.round(ret * 5)/5

            // }
            // Denormalize back
            return ret;
        });
    }

    let moVals = animVectors.map(v => {
        return -v[2]
    })
    let tlVals = animVectors.map(v => {
        return -v[3]
    })
    // let shrVals = animVectors.map(v => {
    //     return v[0]
    // })
    moVals = deepenMinimaSmooth(moVals)
    tlVals = deepenMinimaSmooth(tlVals)
    // shrVals = deepenMinimaSmooth(shrVals, -1, 1)
    // Subtract meanAnimVector from each animVector
    const animVectorsZeroMean = animVectors.map((v, idx) => {

        return [v[0], v[1], -moVals[idx], -tlVals[idx], v[4]]
    }

    );


    log("Zero-mean animVectors:", animVectorsZeroMean);
    // animVectors = animVectorsZeroMean
    // animVectors = animVectors.map(v => v.map(x => {
    //     return Math.round(x * 7)/7

    // }));

    // animVectors = animVectors.map(v => v.map(x => {
    //     // if (Math.abs(x)<thr1) return 0
    //     if (x > thr) return thr
    //     if (x < -thr) return -thr
    //     return x
    // }));
    // animVectors = animVectors.map(v => {
    //     const len = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    //     if (len < thr1) return [0, 0, 0, 0, 0]
    //     return v
    // })

    // animVectors = normalizeAnimation(animVectors)

    // Create an array where each element is the sum of corresponding vectors in animVectors and animVectors1
    // animVectors = animVectors.map((v, idx) => v.map((x, i) => x + animVectors1[idx][i]));
    // log("Summed animVectors:", summedAnimVectors);
    // animVectors = animVectors.map(v => v.map(x => x /5));




    function setCurrentLipState() {
        const v = animVectors[getCurrentLipAnimPosition()]
        vCam.vCamStream.setAnimVector(v)
    }

    if (abortPrepareAudio()) return;
    const blobURL = URL.createObjectURL(file);
    audioElement.src = blobURL;
    audioElement.load();

    logText.textContent = "READY"
    logContainer.classList.add("invisible")
    audioElement.classList.remove("invisible")
    recordSign.classList.remove("invisible")

    let lipAnimInterval
    audioElement.onplay = () => {
        log("start playback")
        lipAnimInterval = setInterval(() => {
            setCurrentLipState()
        }, 50)
        blockAudioCancelButton(true)

    }
    audioElement.onpause = () => {
        clearInterval(lipAnimInterval)
        vCam.vCamStream.setAnimVector([0, 0, 0.1, 0, 0])
        stopRecordSign.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        blockAudioCancelButton(false)
    }

    audioElement.onseeked = () => {
        setCurrentLipState()


    }
    if (abortPrepareAudio()) return;
    cancelButton.onclick = () => {
        needAbortion = true
        abortPrepareAudio()
    }

}

audioDropDownContainer.appendChild(audioDropZone.dropZone)



const topCanvas = document.getElementById("top-canvas")
let ftarRecorder
let videoUrl
let videoFile
let audioContext

function blockAudioCancelButton(isBlocked) {
    if (isBlocked) {
        cancelButton.classList.add("disabled") // Add a CSS class to visually disable SVG
        cancelButton.style.pointerEvents = "none" // Prevent interaction
    } else {
        cancelButton.classList.remove("disabled") // Add a CSS class to visually disable SVG
        cancelButton.style.pointerEvents = "" // Prevent interaction
    }
}


recordSign.onclick = () => {
    blockAudioCancelButton(true)
    audioElement.style.pointerEvents = "none"; // Prevent interaction
    recordSign.classList.add("invisible")
    stopRecordSign.classList.remove("invisible")
    logContainer.classList.remove("invisible")
    downloadVideoSign.classList.add("invisible")
    shareSign.classList.add("invisible")

    logText.textContent = "RECORDING"
    const ftarMediastream = vCam.vCamStream.stream
    videoOutput.srcObject = ftarMediastream
    videoOutput.play()
    videoOutput.classList.remove("invisible")
    topCanvas.classList.add("invisible")
    vCam.size = { width: 640, height: 640 }
    if (!audioContext)
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // if (!audioStream) {
    const { mediaStream: audioStream, restore } = mediaStreamFromAudio(audioElement, audioContext)
    addAudioStream(ftarMediastream, audioStream)
    // }
    ftarRecorder = new FlexatarRecorder(ftarMediastream)
    ftarRecorder.onready = async (url, file) => {
        const size = getFtarViewSize()
        vCam.size = { width: size, height: size }
        videoOutput.classList.add("invisible")
        topCanvas.classList.remove("invisible")
        log("rec stopped", url)
        videoUrl = url
        videoFile = file
        downloadVideoSign.classList.remove("invisible")
        shareSign.classList.remove("invisible")
        audioElement.pause()
        restore()
        const audioTracks = ftarMediastream.getAudioTracks();
        audioTracks.forEach(track => ftarMediastream.removeTrack(track));

        if (file.type.includes("webm")) {
            // ext = "mp4"
            log("start conversion to mp4")
            convert(file).then(urlMp4 => {
                log("conversion to mp4 finished")
                videoUrl = urlMp4
            })
        }



    }
    ftarRecorder.start()
    audioElement.play()

}

stopRecordSign.onclick = () => {
    ftarRecorder?.stop()
    // cancelButton.classList.remove("disabled") // Add a CSS class to visually disable SVG
    // cancelButton.style.pointerEvents = ""
    blockAudioCancelButton(false)
    audioElement.style.pointerEvents = ""
    recordSign.classList.remove("invisible")
    stopRecordSign.classList.add("invisible")
    logContainer.classList.add("invisible")

    logText.textContent = ""

}
shareSign.onclick = () => {
    log("share clicked")
}
downloadVideoSign.onclick = () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = "flexatarVideo.mp4";
    // document.body.appendChild(link);
    link.click();
}
// ==============microphone input=========

const audioFormats = [
    "audio/aac",
    "audio/ogg",
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/webm;codecs=pcm",
    "audio/ogg;codecs=opus",
    "audio/ogg;codecs=vorbis",
    "audio/mp4",
    "audio/mp4;codecs=aac",
    "audio/mpeg",
    "audio/wav"
];

const supportedFormats = audioFormats.filter(format => MediaRecorder.isTypeSupported(format));
// console.log(supportedFormats)

recordAudioUI(
    "startRecFromMicButton",

    "timerOutput",
    () => {

        starRecLogo.classList.add("invisible")
        stopRecLogo.classList.remove("invisible")
        timerOutput.classList.remove("invisible")
        startRecFromMicButton.classList.add("mic-record-state")

        audioDropZone.dropZone.classList.add("invisible")
        // audioDropDownContainer.classList.add("flex-centered")
        timerOutput.classList.add("drop-zone")
        // console.log("setStopRecordButtonState")


    }, () => {


        starRecLogo.classList.remove("invisible")
        stopRecLogo.classList.add("invisible")
        timerOutput.classList.add("invisible")
        timerOutput.classList.remove("drop-zone")
        startRecFromMicButton.classList.remove("mic-record-state")
        audioDropZone.dropZone.classList.remove("invisible")
        // audioDropDownContainer.classList.remove("flex-centered")
        // console.log("setStartRecordButtonState")

    },

    async (dur, url) => {
        // console.log(dur,url)
        const response = await fetch(url); // Fetch the Blob from the URL
        const blob = await response.blob(); // Convert response to Blob
        const file = new File([blob], "Recorded." + supportedFormats[0].split("/")[1], { type: supportedFormats[0] });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // Set the files property of the input element
        audioDropZone.input.files = dataTransfer.files;

        // Manually trigger the 'change' event
        const event = new Event("change", { bubbles: true });
        audioDropZone.input.dispatchEvent(event);

    },

    () => {
        // console.log("permission error")
        showPopup(texts.noMicPerm)
    },
    () => {
        showPopup(texts.recTooShort)
        // console.log("record to short")
    },
    (error) => {
        showPopup(texts.somethingWenWrong)
        // console.log("unknown error",error)
    },
    // 10,
    5 * 60,
    supportedFormats[0]

)

function showPopup(text) {
    logText.textContent = text
    logContainer.classList.remove("invisible")
}