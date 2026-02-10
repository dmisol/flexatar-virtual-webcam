import { ManagerConnection } from "../../flexatar-package/src/ftar-manager/ftar-connection.js"
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

        const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
        const ctx = canvas.getContext(isFirefox ? "2d" : "bitmaprenderer");
        const drawFunc = isFirefox ? (bitmap) => {
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            bitmap.close()
        } : (bitmap)=>{ctx.transferFromImageBitmap(bitmap);}


        this.ctx = ctx
        const bitmap = createTextBitmap("WARMING UP", 320, 320)
        // ctx.transferFromImageBitmap(bitmap);
        drawFunc(bitmap)


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
                if (this.isActive)
                    drawFunc(e.data.frame)
                    // ctx.transferFromImageBitmap(e.data.frame);
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
        this.selfPort.close()
        this.canvas.remove()
    }
    set size(val) {
        this.canvas.width = val.width
        this.canvas.height = val.height
    }
}

const connection = new ManagerConnection()
// const viewportWidth = 500;
let viewportWidth = window.innerWidth;
let flexatarViewWidth = Math.floor(1.1 * viewportWidth / 2);
function handleResize() {
    viewportWidth = window.innerWidth;
    flexatarViewWidth = Math.floor(1.1 * viewportWidth / 2);
    log("flexatarViewWidth:", flexatarViewWidth);
    vCamStream.onCanvasRatio(currentRatio || 1)
}

window.addEventListener("resize", handleResize);

console.log("Viewport width in pixels:", viewportWidth);

const vCamStream = new VCamMediaStream({ width: flexatarViewWidth, height: flexatarViewWidth });
previewHolder.appendChild(vCamStream.canvas)
vCamStream.canvas.style.display = "block"

let currentRatio
vCamStream.onCanvasRatio = ratio => {
    currentRatio = ratio

    const height = flexatarViewWidth
    const width = Math.floor(height * ratio)
    log("onCanvasRatio", ratio, width, height)
    vCamStream.canvas.width = width
    vCamStream.canvas.height = height

    //  currentVideoSize = { width, height }


}


let portSelf
let instanceId
window.onmessage = (e) => {
    const msg = e.data
    if (!msg) return

    if (msg.managerPort) {
        instanceId = msg.instanceId

        msg.managerPort.onmessage = portHandler
        log("port obtained")
        portSelf = msg.managerPort
        portSelf.postMessage({ effectStateRequest: true })
         portSelf.postMessage({ msgID: msg.msgID })
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
    vCamStream.destroy()
    closeThisWindow()

}


let currentEffectTypeText = "NO"
function portHandler(e) {
    const msg = e.data
    if (!msg) return
    log("from manager", msg)
    if (msg.effectStateResponse) {
        if (msg.effectStateResponse === "fake") {
            msg.effectStateResponse = {
                effectIsAnimated: false,
                currentMode: 0,
                effectParameter: 0.5,
                currentEffectFtarId: null,
                currentEffectFtarIsMyx: false
            }
        }
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
        if (selecteFtar && selecteFtar.ftarId === ftarLink.id) {
            slot1Button.disabled = slot2Button.disabled = false;
            return
        }
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
