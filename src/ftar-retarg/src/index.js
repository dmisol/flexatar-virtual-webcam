import { ManagerConnection } from "../../flexatar-package/src/ftar-manager/ftar-connection.js"
// import { FaceLandmarker, FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision"

function log() {
    console.log("[FTAR_EFFECT_UI_IFRAME]", ...arguments)
}
function createTextBitmap(text, width, height) {
    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext("2d");

    // Background (optional)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    // Text
    ctx.fillStyle = "white";
    ctx.font = `${Math.floor(width / 10)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width / 2, height / 2);

    // Return a promise that resolves with the ImageBitmap
    return offscreen.transferToImageBitmap();
}

class VCamMediaStream {
    constructor(opts) {
        const canvas = document.createElement("canvas");
        // canvas.width=480
        // canvas.height=640
        canvas.width = opts?.width ?? 240
        canvas.height = opts?.height ?? 320
        canvas.style.display = "none"
        this.canvas = canvas
        canvas.flexatarCanvas = true

        document.body.appendChild(canvas)

        const ctx = canvas.getContext("bitmaprenderer");
        this.ctx = ctx
        const bitmap = createTextBitmap("WARMING UP", canvas.width, canvas.height)
        ctx.transferFromImageBitmap(bitmap);


        const channel = new MessageChannel();
        this.mediaPort = channel.port2
        this.selfPort = channel.port1
        let firstFrame = true
        this.isActive = true
        const self = this
        channel.port1.onmessage = e => {

            if (e.data && e.data.frame) {
                if (firstFrame) {
                    console.log("stream ready")
                    firstFrame = false
                    this.#onFirstFrame()
                }

                // console.log("drawing")
                if (this.isActive) {
                    ctx.transferFromImageBitmap(e.data.frame);
                    e.data.frame.close()
                }
            } else if (e.data && e.data.cameraFrame) {
                // log("receiving camera frames")
                self.onCameraFrame(e.data.cameraFrame)
                e.data.cameraFrame.close()
            } else if (e.data && e.data.canvasRatio) {
                if (self.onCanvasRatio) self.onCanvasRatio(e.data.canvasRatio);
            } else if (e.data && e.data.log) {
                console.log("[VCAM MEDIA STREAM] msg from port", e.data);
            }
        }
    }

    setFrame(frame) {
        this.ctx.transferFromImageBitmap(frame);
    }

    get portToSend() {
        return this.mediaPort
    }
    get port() {
        return this.selfPort
    }
    get stream() {
        return this.canvas.captureStream(30)
    }

    #onFirstFrame = () => { }
    set onFirstFrame(fn) {
        this.#onFirstFrame = fn
    }
    destroy() {

        this.selfPort.postMessage({ closing: true })
        // this.selfPort.close()
        this.canvas.remove()
    }
    bindFrameReceiverFromLandmarker() {
        this.selfPort.postMessage({ bindFrameReceiverFromLandmarker: true })

    }
    unBindFrameReceiverFromLandmarker() {
        this.selfPort.postMessage({ unBindFrameReceiverFromLandmarker: true })

    }
    set size(val) {
        this.canvas.width = val.width
        this.canvas.height = val.height
    }
}

const connection = new ManagerConnection()
const viewportWidth = 500;
// const viewportWidth = window.innerWidth;
console.log("Viewport width in pixels:", viewportWidth);
const flexatarViewWidth = Math.floor(0.8 * viewportWidth / 2);
const vCamStream = new VCamMediaStream({ width: flexatarViewWidth, height: flexatarViewWidth });
previewHolder.appendChild(vCamStream.canvas)
vCamStream.canvas.style.display = "block"
vCamStream.canvas.classList.add("mirror-x")
vCamStream.onFirstFrame = () => {
    vCamStream.bindFrameReceiverFromLandmarker()
}


const cameraPreviewDummy = document.createElement("span")
cameraPreviewDummy.classList.add("dummy-camera-preview")
previewHolder.appendChild(cameraPreviewDummy)


const cameraEnableDisableButton = document.createElement("button")
cameraEnableDisableButton.textContent = "ENABLE"
calibrateRetarget.disabled = true
cameraEnableDisableButton.classList.add("camera-enable-button")
cameraPreviewDummy.appendChild(cameraEnableDisableButton)


const canvasCamera = document.createElement("canvas");
canvasCamera.classList.add("mirror-x")

// canvas.width=480
// canvas.height=640
canvasCamera.width = 1
canvasCamera.height = 1



cameraPreviewDummy.appendChild(canvasCamera)
const ctxCanvasCamera = canvasCamera.getContext("bitmaprenderer");
let currentCameraFrameWidth = 0
let currentCameraFrameHeight = 0

function fitFrame(cw, ch, fw, fh) {
    // Guard against invalid inputs
    if (![cw, ch, fw, fh].every(n => Number.isFinite(n) && n > 0)) {
        throw new Error("All dimensions must be positive finite numbers.");
    }

    const scale = Math.min(cw / fw, ch / fh);
    const width = Math.floor(fw * scale);
    const height = Math.floor(fh * scale);
    // const x = (cw - width) / 2;
    // const y = (ch - height) / 2;

    return { width, height };
}

let oldFrameW = 0
let oldFrameH = 0
vCamStream.onCameraFrame = frame => {
    if (oldFrameW !== frame.width || oldFrameH !== frame.height) {
        log("fitting canvas")
        oldFrameW = frame.width
        oldFrameH = frame.height
        // currentCameraFrameWidth = 
        const { width, height } = fitFrame(currentCameraFrameWidth, currentCameraFrameHeight, frame.width, frame.height)

        canvasCamera.width = width
        canvasCamera.height = height
        isRetargetingEnabled = true
        log("setting button to disable")
        cameraEnableDisableButton.textContent = "DISABLE"
        calibrateRetarget.disabled = false
    }

    ctxCanvasCamera.transferFromImageBitmap(frame);
}

vCamStream.onCanvasRatio = ratio => {
    uiHolder.classList.remove("invisible")
    log("onCanvasRatio", ratio)
    // const height = flexatarViewWidth
    // const width = Math.floor(height * ratio)
    const width = flexatarViewWidth
    const height = Math.floor(width / ratio)
    currentCameraFrameWidth = width
    currentCameraFrameHeight = height
    vCamStream.canvas.width = width
    vCamStream.canvas.height = height
    //  currentVideoSize = { width, height }

    cameraPreviewDummy.style.width = width + "px"
    cameraPreviewDummy.style.height = height + "px"

}



let instanceId
let portSelf
window.onmessage = (e) => {
    const msg = e.data
    if (!msg) return

    if (msg.managerPort) {
        instanceId = msg.instanceId
        // msg.managerPort.onmessage = portHandler
        log("port obtained")
        portSelf = msg.managerPort
        portSelf.postMessage({ effectStateRequest: true })
        msg.managerPort.postMessage({ managerConnectionPort: connection.outPort }, [connection.outPort])
        // msg.managerPortUnauthorized.postMessage({ managerConnectionPort: connection.outPort }, [connection.outPort])

        msg.managerPort.postMessage({ mediaPort: vCamStream.portToSend }, [vCamStream.portToSend])
        log("request progress list")
    } else if (msg.closeThisWindow) {
        closeThisWindow()
    }
}

function closeThisWindow() {
    window.parent.postMessage({ closeWindow: true, portSelf,instanceId }, "*", [portSelf])
}

closeButton.onclick = () => {
    vCamStream.unBindFrameReceiverFromLandmarker()
    vCamStream.destroy()
    closeThisWindow()

}



let currentSelectedConstrains
let isRetargetingEnabled = false
calibrateRetarget.disabled = true
connection.ready.then(() => {

    cameraEnableDisableButton.onclick = () => {
        if (isRetargetingEnabled) {

            vCamStream.selfPort.postMessage({ videoStreamFromCameraStopRequest: true })
            cameraEnableDisableButton.textContent = "ENABLE"
            calibrateRetarget.disabled = true

        } else {
            log("camera requested", currentSelectedConstrains)
            vCamStream.selfPort.postMessage({ videoStreamFromCameraRequest: currentSelectedConstrains })
            cameraEnableDisableButton.textContent = "DISABLE"
            calibrateRetarget.disabled = false

        }
        isRetargetingEnabled = !isRetargetingEnabled

    }

    calibrateRetarget.onclick = () => {
        vCamStream.selfPort.postMessage({ calibrateRetargeting: true })
    }



    async function installCameraSelector(container, onSelect) {
        if (!container) {
            throw new Error("Container element is required.");
        }

        const cameraLabel = await connection.getRetargetingStatus()
        // need to update following code that select will display obtained cameraLabel at start

        // Create select element
        const select = document.createElement("select");
        select.classList.add("camera-select")
        select.disabled = true; // disabled until devices are loaded
        container.appendChild(select);

        try {
            // Ensure permissions (otherwise enumerateDevices may return empty)
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoStream.getTracks().forEach(t => t.stop())

            // Get device list
            const devices = await navigator.mediaDevices.enumerateDevices();
            log("devices", devices)
            const cameras = devices.filter(d => d.kind === "videoinput");

            // Fill select options
            select.innerHTML = ""; // clear in case of re-init
            cameras.forEach((camera, index) => {
                const option = document.createElement("option");

                option.textContent = camera.label || `Camera ${index + 1}`;
                option.value = option.textContent;
                select.appendChild(option);
            });

            select.disabled = false;

            // Handle selection
            select.addEventListener("change", () => {
                // const deviceId = select.value;
                // const constraints = {
                //     video: { deviceId: { exact: deviceId } }
                // };
                if (typeof onSelect === "function") {
                    onSelect(select.value);
                }
            });

            // Trigger callback with first camera by default
            let initialCamera = cameras.find(c => c.label === cameraLabel);
            if (!initialCamera && cameras.length > 0) {
                initialCamera = cameras[0];
                await connection.setRetargetingStatus({ value: initialCamera.label })

            }
            currentSelectedConstrains = initialCamera.label

            if (initialCamera) {
                select.value = initialCamera.label;
                if (typeof onSelect === "function") {
                    onSelect(initialCamera.label);
                }
                return true;
            }
            log("no camera problem")
            return false

        } catch (err) {
            log("access problem")
            return false
            console.error("Could not access cameras:", err);
        }
    }


    installCameraSelector(cameraPreviewDummy, async (constraints) => {
        currentSelectedConstrains = constraints
        console.log("Selected constraints:", constraints);
        if (isRetargetingEnabled) {
            vCamStream.selfPort.postMessage({ videoStreamFromCameraStopRequest: true })
            setTimeout(() => {
                vCamStream.selfPort.postMessage({ videoStreamFromCameraRequest: currentSelectedConstrains })
            }, 500)

        }


    }).then(isCameraPresent => {
        const hasMediaStreamTrackProcessor = typeof MediaStreamTrackProcessor !== "undefined"
        
        if (!isCameraPresent) {

            noCameraSign.classList.remove("invisible")
            effectControlLayout.classList.add("invisible")
            log("no camera available")
        }
        if (!hasMediaStreamTrackProcessor) {
            noTrackProcessorSign.classList.remove("invisible")

            effectControlLayout.classList.add("invisible")
            log("no MediaStreamTrackProcessor available")
        }
        uiHolder.classList.remove("invisible")

    });

})

