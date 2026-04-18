import EasyrenderWorker from "./easyrender.worker.js"
import {postBuffersToWorker }  from "./install-renderer-util.js"

function log() {
    console.log("[RENDER_WORKER_WRAPPERR]", ...arguments)
}

export class RenderWorkerWarper {
    constructor(url, size = { width: 640, height: 480 }, logCallback = () => {}) {
        const worker = new EasyrenderWorker({ type: "module" });
        const self = this
        this.logCallback = logCallback
        worker.onmessage = e => {
            const msg = e.data
            if (!msg) return

            if (msg.logEvent) {
                this.logCallback(msg.logEvent)
            } else if (msg.isContextLost) {
                self.onContextLost(msg.isContextLost.value)

                console.log("isContextLost sandbox:", msg.isContextLost)
            } else if (msg.isInUse) {
                self.onIsInUse(msg)


            } else if (msg.initComplete) {
                if (this.onReady) this.onReady()

            }
        }

        this.worker = worker
        console.log("stadrting worker at url", url,worker)
        postBuffersToWorker(url,worker,size)

    }


    set size(val) {
        this.worker.postMessage({ changeSize: val })
    }
    setRoundOverlay(val) {
        this.worker.postMessage({ roundOverlay: { active: val } })
    }

    destroy() {
        this.worker.terminate()
        this.worker = undefined
    }
    getControllerPort() {
        const self = this
        return new Promise(resolve => {
            const msgId = crypto.randomUUID()
            function handler(e) {
                if (e.data && e.data.msgID) {
                    if (e.data.msgID) {
                        self.worker.removeEventListener("message", handler)
                        resolve(e.data.controllerPort)
                    }
                }

            }
            self.worker.addEventListener("message", handler)
            self.worker.postMessage({ controllerPort: true, msgID: msgId })
        })

    }
    checkGlContext() {
        this.worker.postMessage({ checkGlContext: true })
    }
    // onControllerPort = ()=>{}
    onManagerPort = () => { }
    onContextLost = () => { }
    onIsInUse = () => { }
    addMediaPort(port) {
        this.worker.postMessage({ mediaPort: port }, [port])
    }
    checkInUse() {
        this.worker.postMessage({ checkInUse: true })
    }

}
