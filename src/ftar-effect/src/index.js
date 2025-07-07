import { ManagerConnection } from "../../flexatar-package/src/ftar-manager/ftar-connection.js"
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
        // const self = this
        channel.port1.onmessage = e => {

            if (e.data && e.data.frame) {
                if (firstFrame) {
                    console.log("stream ready")
                    firstFrame = false
                    this.#onFirstFrame()
                }

                // console.log("drawing")
                if (this.isActive)
                    ctx.transferFromImageBitmap(e.data.frame);
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
const vCamStream = new VCamMediaStream({ width: 120, height: 160 });
previewHolder.appendChild(vCamStream.canvas)
vCamStream.canvas.style.display = "block"

function log() {
    console.log("[FTAR_EFFECT_UI_IFRAME]", ...arguments)
}
let portSelf
window.onmessage = (e) => {
    const msg = e.data
    if (!msg) return

    if (msg.managerPort) {
        msg.managerPort.onmessage = portHandler
        log("port obtained")
        portSelf = msg.managerPort
        portSelf.postMessage({ effectStateRequest: true })
        msg.managerPort.postMessage({ managerConnectionPort: connection.outPort }, [connection.outPort])
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
    vCamStream.destroy()
    closeThisWindow()

}



function portHandler(e) {
    const msg = e.data
    if (!msg) return
    log("from manager", msg)
    if (msg.effectStateResponse) {
        toggleEffectAnimation.checked = msg.effectStateResponse.effectIsAnimated

         if (toggleEffectAnimation.checked){
            effectSlider.classList.add("cursor-not-allowed")
        }else{
            effectSlider.classList.remove("cursor-not-allowed")
        }

        effectSlider.value = msg.effectStateResponse.effectParameter * 100
        const currentMode = msg.effectStateResponse.currentMode
        morphEffectButton.classList.remove("active")
        hybridEffectButton.classList.remove("active")
        noEffectButton.classList.remove("active")
        if (msg.effectStateResponse.effectIsAnimated){
            effectSlider.disabled = true
        }

        if (currentMode === 0) {
            noEffectButton.classList.add("active")
        } else if (currentMode === 1) {
            morphEffectButton.classList.add("active")
        } else if (currentMode === 2) {
            hybridEffectButton.classList.add("active")
        }
        connection.ready.then(async () => {
            log("connection to manager ready")
            const list = await connection.getList({ preview: true })
            let autoSelect
            let needToSelect = true
            for (const { id, is_myx } of list) {
                const imgArrayBuffer = await connection.getPreview(id)
                const blob = new Blob([imgArrayBuffer], { type: "image/jpg" }); // Change type if needed
                const imgSrc = URL.createObjectURL(blob);
                const { holder } = await addPreview({ id, is_myx }, imgSrc)
                log("compare slot 2",msg.effectStateResponse.currentEffectFtarId,id)
                if (msg.effectStateResponse.currentEffectFtarId && msg.effectStateResponse.currentEffectFtarId === id) {
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

        })

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

        if (oldClicked) {
            oldClicked.classList.remove("selected-item")
        }

        oldClicked = holder
        holder.classList.add("selected-item")
        if (selecteFtar && selecteFtar.ftarId === ftarLink.id) return
        selecteFtar = { element: holder, ftarId: ftarLink.id }

        holder.appendChild(loader)
        let ftarBuffer
        let counter = 0
        while (!ftarBuffer){
            ftarBuffer = await connection.getFlexatar(ftarLink.id, ftarLink.is_myx,false)
            await new Promise(resolve => setTimeout(resolve,1000))
            console.log("ftarBuffer", ftarBuffer)
            counter += 1
            if (counter>7){
                break
            }
        }

        if (portSelf) {
            portSelf.postMessage({ slot2: ftarBuffer, id: ftarLink.id, is_myx: ftarLink.is_myx }, [ftarBuffer])
        }
        loader.remove()
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
}
morphEffectButton.onclick = () => {
    portSelf.postMessage({ morphEffect: true, isEffectMessage })
    noEffectButton.classList.remove("active")
    morphEffectButton.classList.add("active")
    hybridEffectButton.classList.remove("active")

}
hybridEffectButton.onclick = () => {
    portSelf.postMessage({ hybridEffect: true, isEffectMessage })
    noEffectButton.classList.remove("active")
    morphEffectButton.classList.remove("active")
    hybridEffectButton.classList.add("active")

}
toggleEffectAnimation.onchange = () => {
    // setEffect(effectId)
    portSelf.postMessage({ isAnimated: { state: toggleEffectAnimation.checked }, isEffectMessage })
    effectSlider.disabled = toggleEffectAnimation.checked
    if (toggleEffectAnimation.checked){
        effectSlider.classList.add("cursor-not-allowed")
    }else{
        effectSlider.classList.remove("cursor-not-allowed")
    }

}
effectSlider.oninput = () => {
    log("effect changing")
    
    portSelf.postMessage({ effectParameter: effectSlider.value / 100, isEffectMessage })


}