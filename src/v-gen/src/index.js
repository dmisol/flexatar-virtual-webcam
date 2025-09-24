import { generateUUID } from "../../flexatar-package/src/utils/misc.js"
import { audioBufferToFloat32ArrayBuffer, splitArrayBufferToChunks, enhanceMnasal } from "../../flexatar-package/src/utils/audio-proc.js"
import { DropZone } from "../../flexatar-package/src/utils/ui.js"
import { getCroppedImageDataUrlFromBuffer } from "../../flexatar-package/src/utils/image-proc.js"
import { VCAM } from "../../flexatar-package/src/index.js"
import { texts } from "./locale.js"
import { recordAudioUI } from "./rec-mic-ui-v4/recordAudioUI.js"
import convert from './video_conversions.js';
import { FlexatarRecorder, mediaStreamFromAudio, addAudioStream } from "./recorder.js"
function log() {
    console.log("[FTAR_VIDEO_GEN_IFRAME]", ...arguments)
}





function getFtarViewSize() {
    const ftarViewSize = window.innerWidth - 60
    log("Calculated FTAR view size:", ftarViewSize)
    return ftarViewSize
}

const vCam = new VCAM(async () => {
    const msgID = generateUUID()
    // return "no token"
    return await new Promise(resolve => {
        const handler = e => {
            if (!e.data) return
            log("Received message from parent:", e.data)
            if (e.data.msgID !== msgID) return
            window.removeEventListener("message", handler)
            resolve(e.data.token)
            log("Received token response:", e.data.token)
        }
        window.addEventListener("message", handler)
        window.parent.postMessage({ flexatarVideoGenIframe: { tokenRequest: true, msgID } }, "*")
        log("Sent token request to parent with message ID:", msgID)

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
        needGallery:false,
        defaultBackgroundsFn: async () => {
            log("defaultBackgroundsFn called - loading default backgrounds")
            const backgroundNames = ["1.jpg", "2.jpg", "3.jpg"]

            const backgrounds = await Promise.all(
                backgroundNames.map(async name => {
                    const res = await fetch(`$files/${name}`);
                    const blob = await res.blob();
                    const file = new File([blob], name, { type: blob.type });
                    return await getCroppedImageDataUrlFromBuffer(file, 480, 640);
                })
            );
            return backgrounds;
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



document.getElementById("left-panel").appendChild(vCam.element)


vCam.element.style.height = "100%"


function checkFileTypeIsAudio(fileType) {
    return fileType.startsWith("audio/")
}



// =============audio file processing==========
const audioDropZone = new DropZone(texts.dropAudio, "audio/*")

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
    blockAudioCancelButton(false)
    audioElement.style.pointerEvents = ""
    recordSign.classList.remove("invisible")
    stopRecordSign.classList.add("invisible")
    logContainer.classList.add("invisible")

    logText.textContent = ""

}

shareSign.onclick = async () => {
    log("share clicked")
    try {
        if (navigator.canShare && navigator.canShare({ files: [videoFile] })) {
            // Share the actual file if supported
            await navigator.share({
                text: "Flexatar",
                files: [videoFile],
            });
            log("Video file shared successfully!");
        } else {
            // Fallback: share the URL
            await navigator.share({

                text: "Flexatar",
                url: videoUrl,
            });
            log("Video URL shared successfully!");
        }
    } catch (err) {
        alert("Share failed:" + err)
        console.error("Share failed:", err);
    }
}


downloadVideoSign.onclick = () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = "flexatarVideo.mp4";

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


function toggleRecordingUI(isRecording) {
    if (isRecording) {
        starRecLogo.classList.add("invisible");
        stopRecLogo.classList.remove("invisible");
        timerOutput.classList.remove("invisible");
        startRecFromMicButton.classList.add("mic-record-state");

        audioDropZone.dropZone.classList.add("invisible");
        timerOutput.classList.add("drop-zone");
    } else {
        starRecLogo.classList.remove("invisible");
        stopRecLogo.classList.add("invisible");
        timerOutput.classList.add("invisible");
        timerOutput.classList.remove("drop-zone");
        startRecFromMicButton.classList.remove("mic-record-state");
        audioDropZone.dropZone.classList.remove("invisible");
    }
}

recordAudioUI(
    "startRecFromMicButton",

    "timerOutput",
    () => {
        toggleRecordingUI(true)

    }, () => {
         toggleRecordingUI(false)
    },

    async (dur, url) => {
       
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
      
        showPopup(texts.noMicPerm)
    },
    () => {
        showPopup(texts.recTooShort)

    },
    (error) => {
        showPopup(texts.somethingWenWrong)

    },
    5 * 60,
    supportedFormats[0]

)

function showPopup(text) {
    logText.textContent = text
    logContainer.classList.remove("invisible")
}