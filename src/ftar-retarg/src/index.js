import { ManagerConnection } from "../../flexatar-package/src/ftar-manager/ftar-connection.js"
import { FaceLandmarker, FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision"

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




let portSelf
window.onmessage = (e) => {
    const msg = e.data
    if (!msg) return

    if (msg.managerPort) {
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
    window.parent.postMessage({ closeWindow: true, portSelf }, "*", [portSelf])
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

// #headMotionState = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

/*
let faceLandmarker
(async () => {
    const pathToAsset = "./face-detection-asset"


    const filesetResolver = await FilesetResolver.forVisionTasks(pathToAsset);
    const lmModelPath = pathToAsset + "/face_landmarker.task"
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: lmModelPath,
            delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO",
        numFaces: 1
    });


})()
*/


/*
let currentEffectTypeText = "NO"
function portHandler(e) {
    const msg = e.data
    if (!msg) return
    log("from manager", msg)
    if (msg.effectStateResponse) {
        toggleEffectAnimation.checked = msg.effectStateResponse.effectIsAnimated

        if (toggleEffectAnimation.checked) {
            effectSlider.classList.add("cursor-not-allowed")
        } else {
            effectSlider.classList.remove("cursor-not-allowed")
        }

        effectSlider.value = msg.effectStateResponse.effectParameter * 100
        const currentMode = msg.effectStateResponse.currentMode
        morphEffectButton.classList.remove("active")
        hybridEffectButton.classList.remove("active")
        noEffectButton.classList.remove("active")
        if (msg.effectStateResponse.effectIsAnimated) {
            effectSlider.disabled = true
        }

        if (currentMode === 0) {
            noEffectButton.classList.add("active")
            currentEffectTypeText = "NO"
        } else if (currentMode === 1) {
            morphEffectButton.classList.add("active")
            currentEffectTypeText = "MORPH"

        } else if (currentMode === 2) {
            currentEffectTypeText = "HYBRID"
            hybridEffectButton.classList.add("active")
        }
        connection.ready.then(async () => {
            log("connection to manager ready")
            const list = await connection.getList({ preview: true })
            let autoSelect
            let needToSelect = true
            for (const listElement of list) {
                const imgArrayBuffer = await connection.getPreview(listElement)
                const blob = new Blob([imgArrayBuffer], { type: "image/jpg" }); // Change type if needed
                const imgSrc = URL.createObjectURL(blob);
                const { holder } = await addPreview(listElement, imgSrc)

                log("compare slot 2", msg.effectStateResponse.currentEffectFtarId, listElement.id)
                if (msg.effectStateResponse.currentEffectFtarId && msg.effectStateResponse.currentEffectFtarId === listElement.id) {
                    holder.click()
                    needToSelect = false
                }
                if (!autoSelect) {
                    autoSelect = holder
                }
                // if (!isChosen){
                //     holder.click()
                // }
                // selected
            }
            if (autoSelect && needToSelect) autoSelect.click()

            const presetList = await connection.getEffectPresets()
            log("presetList", presetList)
            for (const { presetInfo, userId } of presetList) {
                const { ftarLink1, ftarLink2, effectType, effectVal, presetId } = presetInfo
                // for (const { ftarLink1, ftarLink2, effectType, effectVal,presetId } of presetList) {
                await addPresetToContainer(ftarLink1, ftarLink2, effectType, effectVal, presetId, userId)

            }
            log("presetList", presetList)

        })

    }
}
let oldSelectedPreset
let currentPresetId

async function addPresetToContainer(ftarLink1, ftarLink2, effectType, effectVal, presetId, userId) {
    const element = await createPresetLine(effectPreset, ftarLink1, ftarLink2, effectType, effectVal)
    const pId = presetId;
    element.userIdPresetBelongs = userId
    log("created element with preset id", pId)
    element.onclick = async () => {

        if (oldSelectedPreset) {
            oldSelectedPreset.classList.remove("selected")

        }
        oldSelectedPreset = element
        element.classList.add("selected")
        const ftarBuffer1P = await connection.getFlexatar(ftarLink1, true, false)
        const ftarBuffer2P = await connection.getFlexatar(ftarLink2, false, true)
        if (portSelf) {
            portSelf.postMessage({ ...ftarLink1, slot1: ftarBuffer1P }, [ftarBuffer1P])
            portSelf.postMessage({ ...ftarLink2, slot2: ftarBuffer2P }, [ftarBuffer2P])
        }

        morphEffectButton.classList.remove("active")
        hybridEffectButton.classList.remove("active")
        noEffectButton.classList.remove("active")

        if (effectType === "MORPH") {
            portSelf.postMessage({ morphEffect: true, isEffectMessage })

            morphEffectButton.classList.add("active")


        } else if (effectType === "HYBRID") {
            portSelf.postMessage({ hybridEffect: true, isEffectMessage })


            hybridEffectButton.classList.add("active")


        } else {
            portSelf.postMessage({ noEffect: true, isEffectMessage })

            noEffectButton.classList.add("active")
        }
        let effectValResult
        try {
            const sliderVal = parseInt(effectVal, 10)
            // const sliderVal = parseInt(effectVal, 10)
            if (isNaN(sliderVal)) {
                throw new Error("Parsed effectVal is NaN");
            }
            effectSlider.value = sliderVal
            toggleEffectAnimation.checked = false
            portSelf.postMessage({ isAnimated: { state: toggleEffectAnimation.checked }, isEffectMessage })

            portSelf.postMessage({ effectParameter: sliderVal / 100, isEffectMessage })
            effectSlider.classList.remove("cursor-not-allowed")
            effectValResult = sliderVal
        } catch {
            effectSlider.classList.add("cursor-not-allowed")
            toggleEffectAnimation.checked = true
            effectValResult = "A"
            portSelf.postMessage({ isAnimated: { state: toggleEffectAnimation.checked }, isEffectMessage })

        }
        currentEffectTypeText = effectType

        if (currentPresetBlock) currentPresetBlock.remove()
        currentPresetBlock = await createPresetLine(presetPlaceHolder, ftarLink1, ftarLink2, currentEffectTypeText, effectValResult)




        changeFtarSelection("preview_" + (currentSlotSelected === "slot1" ? ftarLink1.id : ftarLink2.id))
        trashIcon.disabled = false
        currentPresetId = pId
        log("setting current preset id", currentPresetId)
    }
}

let oldClicked
let selecteFtar
const ftarLinkDict = {}
async function addPreview(ftarLink, previewImage, first) {
    ftarLinkDict[ftarLink.id] = ftarLink
    const previewImg = previewImage;
    // const previewImg = await getPreviewWraped(ftarLink);

    const holder = document.createElement("span")
    holder.className = "item-holder"

    const preview = document.createElement("img")

    preview.src = previewImg
    preview.draggable = false
    preview.id = "preview_" + ftarLink.id
    preview.style.cursor = "pointer"
    preview.style.display = 'block';
    preview.style.width = '100%';
    preview.style.height = 'auto';
    preview.style.margin = '0px';
    preview.style.padding = '0px';
    preview.style.boxSizing = 'border-box';
    preview.style.lineHeight = '0px';
    preview.style.verticalAlign = 'top';

    preview.style.objectFit = 'contain';
    holder.appendChild(preview)
    console.log("appending preview image")
    holder.id = ftarLink.id

    const loader = document.createElement("span")
    loader.className = "loader"

    if (first) {
        previewListHolder.insertBefore(holder, previewListHolder.firstChild);

    } else {
        previewListHolder.appendChild(holder);

    }

    holder.onclick = async () => {
        slot1Button.disabled = slot2Button.disabled = true;
        if (oldClicked) {
            oldClicked.classList.remove("selected-item")
        }

        oldClicked = holder
        holder.classList.add("selected-item")
        if (selecteFtar && selecteFtar.ftarId === ftarLink.id) return
        selecteFtar = { element: holder, ftarId: ftarLink.id, ftarLink }

        holder.appendChild(loader)
        let ftarBuffer
        let counter = 0
        while (!ftarBuffer) {

            ftarBuffer = await connection.getFlexatar(ftarLink, currentSlotSelected === "slot1", currentSlotSelected === "slot2")
            await new Promise(resolve => setTimeout(resolve, 1000))
            console.log("ftarBuffer", ftarBuffer)
            counter += 1
            if (counter > 7) {
                break
            }
        }
        // ftarLink.slot2 = ftarBuffer
        if (portSelf) {
            const msg = { ...ftarLink, slot2: ftarBuffer }
            msg[currentSlotSelected] = ftarBuffer
            portSelf.postMessage(msg, [ftarBuffer])
        }
        loader.remove()
        slot1Button.disabled = slot2Button.disabled = false;

    }
    console.log("selecteFtar", selecteFtar, ftarLink.id)
    if (selecteFtar && selecteFtar.ftarId === ftarLink.id) {
        selecteFtar.element = holder
        holder.click()
    }
    return { holder, previewImg }

}



const isEffectMessage = true


noEffectButton.onclick = () => {
    portSelf.postMessage({ noEffect: true, isEffectMessage })
    noEffectButton.classList.add("active")
    morphEffectButton.classList.remove("active")
    hybridEffectButton.classList.remove("active")
    currentEffectTypeText = "NO"

}
morphEffectButton.onclick = () => {
    portSelf.postMessage({ morphEffect: true, isEffectMessage })
    noEffectButton.classList.remove("active")
    morphEffectButton.classList.add("active")
    hybridEffectButton.classList.remove("active")
    currentEffectTypeText = "MORPH"


}
hybridEffectButton.onclick = () => {
    portSelf.postMessage({ hybridEffect: true, isEffectMessage })
    noEffectButton.classList.remove("active")
    morphEffectButton.classList.remove("active")
    hybridEffectButton.classList.add("active")
    currentEffectTypeText = "HYBRID"


}
toggleEffectAnimation.onchange = () => {
    // setEffect(effectId)
    portSelf.postMessage({ isAnimated: { state: toggleEffectAnimation.checked }, isEffectMessage })
    effectSlider.disabled = toggleEffectAnimation.checked
    if (toggleEffectAnimation.checked) {
        effectSlider.classList.add("cursor-not-allowed")
    } else {
        effectSlider.classList.remove("cursor-not-allowed")
    }

}
effectSlider.oninput = () => {
    log("effect changing")

    portSelf.postMessage({ effectParameter: effectSlider.value / 100, isEffectMessage })


}

effectTabButton.onclick = () => {
    if (!currentPresetBlock) return
    effectControls.classList.remove("invisible")
    ftarSelectContainer.classList.remove("invisible")
    effectPreset.classList.add("invisible")

    currentPresetHolder.classList.add("invisible")
    effectTabButton.classList.add("active")
    presetTabButton.classList.remove("active")
    currentPresetBlock.remove()
    currentPresetBlock = null

}
let currentPresetBlock
presetTabButton.onclick = async () => {
    if (currentPresetBlock) return
    effectControls.classList.add("invisible")
    ftarSelectContainer.classList.add("invisible")
    effectPreset.classList.remove("invisible")
    currentPresetHolder.classList.remove("invisible")

    effectTabButton.classList.remove("active")
    presetTabButton.classList.add("active")
    const currentFtarLink = await connection.getCurrentFtar()
    const currentFtarLinkSlot2 = await connection.getCurrentFtarSlot2()

    // addPresetToContainer(presetPlaceHolder, currentFtarLink, selecteFtar.ftarLink, currentEffectTypeText, effectSlider.value)
    currentPresetBlock = await createPresetLine(presetPlaceHolder, currentFtarLink, currentFtarLinkSlot2, currentEffectTypeText, effectSlider.value)

}

async function createPresetLine(holder, ftarLink1, ftarLink2, effectType, effectVal) {
    const container = document.createElement("span")
    container.classList.add("preset-line")
    for (const fLink of [ftarLink1, ftarLink2]) {
        log("requestPreview", fLink)
        const imgArrayBuffer = await connection.getPreview(fLink)
        const blob = new Blob([imgArrayBuffer], { type: "image/jpg" }); // Change type if needed
        const imgSrc = URL.createObjectURL(blob);
        const img = document.createElement("img")
        img.src = imgSrc
        container.appendChild(img)
    }
    // const mixContainer =  document.createElement("span")
    // mixContainer.style.display = "flex";
    // mixContainer.style.flexDirection = "column";
    // const valueContainer =  document.createElement("span")
    // valueContainer.textContent = "50"
    // valueContainer.className = "bottom-overlay"
    // container.appendChild(valueContainer)
    const effectTypeContainer = document.createElement("span")
    effectTypeContainer.className = "top-overlay small-font"
    effectTypeContainer.textContent = effectType + " " + effectVal
    container.appendChild(effectTypeContainer)
    // container.appendChild(mixContainer)
    // mixContainer(effectTypeContainer)


    holder.appendChild(container)
    return container
    // connection.getCurrentFtar()

}
addPreset.onclick = async () => {
    const currentFtarLink = await connection.getCurrentFtar()
    const currentFtarLinkSlot2 = await connection.getCurrentFtarSlot2()
    const effectVal = toggleEffectAnimation.checked ? "A" : effectSlider.value
    const presetInfo = { ftarLink1: currentFtarLink, ftarLink2: currentFtarLinkSlot2, effectType: currentEffectTypeText, effectVal, presetId: crypto.randomUUID() }
    log("presetInfo", presetInfo)
    const { success } = await connection.saveEffectPreset(presetInfo)

    // await createPresetLine(effectPreset, currentFtarLink, selecteFtar.ftarLink, currentEffectTypeText, effectSlider.value)
    addPresetToContainer(currentFtarLink, currentFtarLinkSlot2, currentEffectTypeText, effectVal, success.userId)


}

function changeFtarSelection(elementId) {
    if (oldClicked) {
        oldClicked.classList.remove("selected-item")
    }

    oldClicked = document.getElementById(elementId)
    oldClicked.classList.add("selected-item")
}

let currentSlotSelected = "slot2"
slot1Button.onclick = async () => {
    currentSlotSelected = "slot1"
    slot1Button.classList.add("active")
    slot2Button.classList.remove("active")
    const currentFtar = await connection.getCurrentFtar()
    changeFtarSelection("preview_" + currentFtar.id)

}
slot2Button.onclick = async () => {
    currentSlotSelected = "slot2"
    slot1Button.classList.remove("active")
    slot2Button.classList.add("active")
    const currentFtar = await connection.getCurrentFtarSlot2()
    changeFtarSelection("preview_" + currentFtar.id)
}

trashIcon.onclick = async () => {
    if (!currentPresetId || !oldSelectedPreset) {
        log("can not delate disabling")
        trashIcon.disabled = true
        return
    }

    await connection.deleteEffectPreset({ presetId: currentPresetId, userId: oldSelectedPreset.userIdPresetBelongs })
    oldSelectedPreset.remove()
    trashIcon.disabled = true
}
    */
/*
0
: 
{index: 0, score: 9.777836567081977e-7, categoryName: '_neutral', displayName: ''}
1
: 
{index: 1, score: 0.1715744435787201, categoryName: 'browDownLeft', displayName: ''}
2
: 
{index: 2, score: 0.17190824449062347, categoryName: 'browDownRight', displayName: ''}
3
: 
{index: 3, score: 0.0016057846369221807, categoryName: 'browInnerUp', displayName: ''}
4
: 
{index: 4, score: 0.029880598187446594, categoryName: 'browOuterUpLeft', displayName: ''}
5
: 
{index: 5, score: 0.017779765650629997, categoryName: 'browOuterUpRight', displayName: ''}
6
: 
{index: 6, score: 0.000014724707398272585, categoryName: 'cheekPuff', displayName: ''}
7
: 
{index: 7, score: 8.660935435500505e-8, categoryName: 'cheekSquintLeft', displayName: ''}
8
: 
{index: 8, score: 1.48147606182647e-7, categoryName: 'cheekSquintRight', displayName: ''}
9
: 
{index: 9, score: 0.07468190789222717, categoryName: 'eyeBlinkLeft', displayName: ''}
10
: 
{index: 10, score: 0.061331335455179214, categoryName: 'eyeBlinkRight', displayName: ''}
11
: 
{index: 11, score: 0.05190473049879074, categoryName: 'eyeLookDownLeft', displayName: ''}
12
: 
{index: 12, score: 0.06506126374006271, categoryName: 'eyeLookDownRight', displayName: ''}
13
: 
{index: 13, score: 0.021163318306207657, categoryName: 'eyeLookInLeft', displayName: ''}
14
: 
{index: 14, score: 0.08540992438793182, categoryName: 'eyeLookInRight', displayName: ''}
15
: 
{index: 15, score: 0.18357940018177032, categoryName: 'eyeLookOutLeft', displayName: ''}
16
: 
{index: 16, score: 0.0571618378162384, categoryName: 'eyeLookOutRight', displayName: ''}
17
: 
{index: 17, score: 0.14712774753570557, categoryName: 'eyeLookUpLeft', displayName: ''}
18
: 
{index: 18, score: 0.15405648946762085, categoryName: 'eyeLookUpRight', displayName: ''}
19
: 
{index: 19, score: 0.5096690654754639, categoryName: 'eyeSquintLeft', displayName: ''}
20
: 
{index: 20, score: 0.4940626621246338, categoryName: 'eyeSquintRight', displayName: ''}
21
: 
{index: 21, score: 0.009361601434648037, categoryName: 'eyeWideLeft', displayName: ''}
22
: 
{index: 22, score: 0.007278582081198692, categoryName: 'eyeWideRight', displayName: ''}
23
: 
{index: 23, score: 0.0000316900186589919, categoryName: 'jawForward', displayName: ''}
24
: 
{index: 24, score: 0.016206854954361916, categoryName: 'jawLeft', displayName: ''}
25
: 
{index: 25, score: 0.02067336067557335, categoryName: 'jawOpen', displayName: ''}
26
: 
{index: 26, score: 0.0000181226587301353, categoryName: 'jawRight', displayName: ''}
27
: 
{index: 27, score: 0.008656563237309456, categoryName: 'mouthClose', displayName: ''}
28
: 
{index: 28, score: 0.0027101365849375725, categoryName: 'mouthDimpleLeft', displayName: ''}
29
: 
{index: 29, score: 0.0010380364255979657, categoryName: 'mouthDimpleRight', displayName: ''}
30
: 
{index: 30, score: 0.000037735670048277825, categoryName: 'mouthFrownLeft', displayName: ''}
31
: 
{index: 31, score: 0.0000287666407530196, categoryName: 'mouthFrownRight', displayName: ''}
32
: 
{index: 32, score: 0.001588712097145617, categoryName: 'mouthFunnel', displayName: ''}
33
: 
{index: 33, score: 0.00503112468868494, categoryName: 'mouthLeft', displayName: ''}
34
: 
{index: 34, score: 0.00016551100998185575, categoryName: 'mouthLowerDownLeft', displayName: ''}
35
: 
{index: 35, score: 0.00020604647579602897, categoryName: 'mouthLowerDownRight', displayName: ''}
36
: 
{index: 36, score: 0.028085894882678986, categoryName: 'mouthPressLeft', displayName: ''}
37
: 
{index: 37, score: 0.003918425180017948, categoryName: 'mouthPressRight', displayName: ''}
38
: 
{index: 38, score: 0.19600076973438263, categoryName: 'mouthPucker', displayName: ''}
39
: 
{index: 39, score: 0.0006653941236436367, categoryName: 'mouthRight', displayName: ''}
40
: 
{index: 40, score: 0.013852237723767757, categoryName: 'mouthRollLower', displayName: ''}
41
: 
{index: 41, score: 0.0210096538066864, categoryName: 'mouthRollUpper', displayName: ''}
42
: 
{index: 42, score: 0.013287832029163837, categoryName: 'mouthShrugLower', displayName: ''}
43
: 
{index: 43, score: 0.0037262605037540197, categoryName: 'mouthShrugUpper', displayName: ''}
44
: 
{index: 44, score: 0.00009682810195954517, categoryName: 'mouthSmileLeft', displayName: ''}
45
: 
{index: 45, score: 0.0000240829886024585, categoryName: 'mouthSmileRight', displayName: ''}
46
: 
{index: 46, score: 0.0012913119280710816, categoryName: 'mouthStretchLeft', displayName: ''}
47
: 
{index: 47, score: 0.00008269249519798905, categoryName: 'mouthStretchRight', displayName: ''}
48
: 
{index: 48, score: 0.000024579900127719156, categoryName: 'mouthUpperUpLeft', displayName: ''}
49
: 
{index: 49, score: 0.0000306916881527286, categoryName: 'mouthUpperUpRight', displayName: ''}
50
: 
{index: 50, score: 4.1503346892568516e-7, categoryName: 'noseSneerLeft', displayName: ''}
51
: 
{index: 51, score: 2.402007055479771e-7, categoryName: 'noseSneerRight', displayName: ''}
           */