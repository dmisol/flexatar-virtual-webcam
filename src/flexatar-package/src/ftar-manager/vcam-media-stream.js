
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


export class VCamMediaStream {
    constructor(opts) {
        const canvas = opts.canvas ? opts.canvas : document.createElement("canvas");
        // canvas.width=480
        // canvas.height=640
        canvas.width = opts?.width ?? 240
        canvas.height = opts?.height ?? 320
        if (!opts.canvas) canvas.style.display = "none"
        this.canvas = canvas
        canvas.flexatarCanvas = true

        if (!opts.canvas) document.body.appendChild(canvas)

        const ctx = canvas.getContext("bitmaprenderer");
        this.ctx = ctx
        const bitmap = createTextBitmap("WARMING UP", canvas.width, canvas.height)
        ctx.transferFromImageBitmap(bitmap);
        bitmap.close()


        const channel = new MessageChannel();
        this.mediaPort = channel.port2
        this.selfPort = channel.port1
        let firstFrame = true
        this.isActive = true
        this.onLipState = () => { }
        // this.onSpeechPattern = () => { }
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
            } else if (e.data && e.data.lipState) {
                // console.log("[VCAM MEDIA STREAM] msg from port",e.data.lipState)
                this.onLipState(e.data.lipState)
            } else if (e.data && e.data.canvasRatio) {
                if (self.onCanvasRatio) self.onCanvasRatio(e.data.canvasRatio);
            } else if (e.data && e.data.speechPattern) {
                console.log("e.data.speechPattern",e.data.speechPattern)
                if (self.onSpeechPattern) self.onSpeechPattern(e.data.speechPattern);
            } else if (e.data && e.data.mood) {
                console.log("e.data.onMood",e.data.mood)
                if (self.onMood) self.onMood(e.data.mood);
            } else if (e.data && e.data.log) {
                console.log("[VCAM MEDIA STREAM] msg from port", e.data);
            }
        }
    }

    setFrame(frame) {
        this.ctx.transferFromImageBitmap(frame);
        frame.close()
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
    makeAnimVector(audioBuffer) {
        this.selfPort.postMessage({ getLipState: audioBuffer }, [audioBuffer])
    }
    setAnimVector(v) {
        this.selfPort.postMessage({ setLipState: v })

    }
    setSize(val) {
        this.selfPort.postMessage({ setSize: val })

    }
    setVoiceProcessingParameters(val) {
        this.selfPort.postMessage({ setVoiceProcessingParameters: val })
    }
    setSpeechPattern(val){
        this.selfPort.postMessage({ setSpeechPattern: val })

    }
    setMood(val){
        this.selfPort.postMessage({ setMood: val })

    }
}