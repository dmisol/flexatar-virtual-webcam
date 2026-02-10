import ManagerWorker from "./worker/manager.worker.js"
import { Manager, ManagerConnection } from "./ftar-manager/ftar-connection.js"
import { FlexatarLens } from "./ftar-manager/ftar-lens.js"

function log() {
    console.log("[FTAR PACK UI NO RENDERER]", ...arguments)
}

class ManagerWorkerWarper {
    constructor(tokenFunc, managerName,
        defaultBackgroundsFn = async () => {
            log("defaultBackgroundsFn not set returning empty")
            return []
        }, needGallery) {
        const managerWorker = new ManagerWorker()

        managerWorker.postMessage({ initManager: true, needGallery })

        managerWorker.postMessage({ managerName })
        const self = this;
        managerWorker.onmessage = async (event) => {
            const msg = event.data
            if (!msg) return
            if (msg.error) {
                console.log(msg.error)
            } else if (msg.onMediaPort) {
                self.onMediaPort(msg.onMediaPort)
            } else if (msg.defaultBackgroundsRequest) {
                defaultBackgroundsFn().then(defaultBackgrounds => {
                    managerWorker.postMessage({ defaultBackgrounds })
                })

            } else if (msg.visibilityRequest) {
                managerWorker.postMessage({ documentState: { visible: !document.hidden } })

            } else if (msg.tokenRequest) {
                tokenFunc().then(token => {
                    managerWorker.postMessage({ token })
                })


                return
            } else if (msg.type === 'fetch-proxy-request') {
                try {
                    const res = await fetch(data.input, data.init);
                    const text = await res.text();
                    event.source.postMessage({
                        type: 'fetch-proxy-response',
                        id: data.id,
                        body: text,
                        options: {
                            status: res.status,
                            statusText: res.statusText,
                            headers: Array.from(res.headers.entries())
                        }
                    });
                } catch (err) {
                    event.source.postMessage({
                        type: 'fetch-proxy-response',
                        id: data.id,
                        error: err.message
                    });
                }
            }
        }
        this.managerWorker = managerWorker
        function handleVisibilityChange() {
            if (document.hidden) {
                managerWorker.postMessage({ documentState: { visible: false } })
            } else {
                managerWorker.postMessage({ documentState: { visible: true } })
            }
        }

        // Listen for visibility change event
        document.addEventListener("visibilitychange", handleVisibilityChange);

    }
    destroy() {
        this.managerWorker.onmessage = undefined
        this.managerWorker.terminate();
        this.managerWorker = undefined
    }
    addPort(port) {
        this.managerWorker.postMessage({ ftarUIPort: port }, [port])
    }
    addFtarLensPort(port) {
        this.managerWorker.postMessage({ ftarLensPort: port }, [port])
    }
    addProgressPort(port) {
        this.managerWorker.postMessage({ ftarProgressPort: port }, [port])
    }
    addEffectsPort(port) {
        this.managerWorker.postMessage({ ftarEffectsPort: port }, [port])
    }
    addRetargPort(port) {
        this.managerWorker.postMessage({ ftarRetargPort: port }, [port])
    }
    showProgress() {
        this.managerWorker.postMessage({ showProgress: true })
    }

}

class VCamControlUI {
    constructor(url) {

        const iframe = document.createElement("iframe")
        iframe.src = url
        this.element = iframe
        this.managerPort = new Promise(resolve => {
            const handler = (e) => {
                const msg = e.data
                if (!msg) return
                console.log(msg)
                if (msg.ftarUIPort) {
                    resolve(msg.ftarUIPort)
                    window.removeEventListener("message", handler)
                }
            }
            window.addEventListener("message", handler)

        })
        // log("promise for managerPortUnauthorized")
        this.managerPortUnauthorized = new Promise(resolve => {
            const handler1 = (e) => {
                const msg = e.data
                if (!msg) return
                console.log("managerPortUnauthorized msg", msg)
                if (msg.ftarUIPortUnauthorized) {
                    resolve(msg.ftarUIPortUnauthorized)
                    window.removeEventListener("message", handler1)
                }
            }
            window.addEventListener("message", handler1)

        })
    }
    /**
     * @param {Transferable} port
     */
    set controllerPort(port) {
        this.managerPort.then(() => {
            this.element.contentWindow.postMessage({ flexatarControllerPort: port }, "*", [port])
        })
    }
    destroy() {
        this.element.remove()
    }
}

class VCAM {
    constructor(tokenFn, opts) {
        if (!opts) {
            opts = {
                size: {
                    width: 640,
                    height: 480,
                },
                url: {
                    vcam: "/vcam",
                    effects: "/effects",
                    lens: "/lens",
                    progress: "/progress",
                    files: "http://localhost/files",
                }
            }
        } else {
            if (!opts.size) {
                opts.size = {
                    width: 640,
                    height: 480,
                }
            }
            if (!opts.url) {
                opts.url = {
                    vcam: "/vcam",
                    effects: "/effects",
                    retarg: "/retarg",
                    lens: "/lens",
                    progress: "/progress",
                    files: "/files",
                }
            }
        }
        let needGallery = opts ? opts.needGallery : false
        // const isAuthorized = false
        // if (!isAuthorized) {
        //     needGallery = true
        // }

        log("VCAM UI opts", opts)
        const managerWorker = new ManagerWorkerWarper(tokenFn, "authorized", opts.defaultBackgroundsFn, needGallery)

        this.managerWorker = managerWorker
        const flexLens = new FlexatarLens(opts.url.lens, opts.lensClassName,null,{files:opts.url.files})
        const flexProgress = new FlexatarLens(opts.url.progress, opts.progressClassName)
        const flexEffects = new FlexatarLens(opts.url.effects, opts.effectsClassName)
        const flexRetarg = new FlexatarLens(opts.url.retarg, opts.effectsClassName)

        this.flexLens = flexLens
        this.flexProgress = flexProgress
        this.flexEffects = flexEffects
        this.flexRetarg = flexRetarg

        const iframeUrl = opts.url.vcam

        const vCamUi = new VCamControlUI(iframeUrl)
        vCamUi.managerPort.then(port => {
            managerWorker.addPort(port)
            managerWorker.addFtarLensPort(flexLens.portOut)
            managerWorker.addProgressPort(flexProgress.portOut)
            managerWorker.addEffectsPort(flexEffects.portOut)
            managerWorker.addRetargPort(flexRetarg.portOut)
        })

        managerWorker.onMediaPort = port => {
            port.onmessage = (e) => { 
                const msg = e.data
                if (!msg) return
                log("fake media port message",msg)
            }
        

        }
        // vCamUi.managerPortUnauthorized.then(port => {
        //     managerWorkerUnauthorized.addPort(port)
        // })

        const iframe = vCamUi.element
        this.element = iframe
        iframe.style.width = opts.vCamUI?.width ? opts.vCamUI?.width : "60px"
        iframe.style.height = opts.vCamUI?.height ? opts.vCamUI?.height : "500px"
        iframe.style.border = "none"

        this.iframe = iframe

        // NOTE: Renderer worker is intentionally omitted in this UI-only version.
        // Provide a controller port stub so UI can still connect.
        const controllerChannel = new MessageChannel()
        this.controllerPort = controllerChannel.port1
        this.controllerPort.onmessage = (e) => { 
            const msg = e.data
            if (!msg) return
            if (msg.effectStateRequest){
                controllerChannel.port1.postMessage(
                    {effectStateResponse:"fake"}
                )

            }else if (msg.slot1){
                const payload = [1, 2, 3, 4, 5, 255, 0, 128];
                 window.sendFile(msg.slot1);
                log("obtained slot 1")
            }
            log("fake controller port message",msg)
        }
        vCamUi.controllerPort = controllerChannel.port2
    }
    get lensElement() {
        return this.flexLens?.element
    }
    get progressElement() {
        return this.flexProgress?.element
    }
    get uiElement() {
        return this.iframe
    }

    mount(holder) {
        holder.appendChild(this.iframe)
        holder.style.display = "block"
        console.log("appending iframe to", holder)

    }
    destroy() {
        this.iframe.remove()
        this.managerWorker.destroy()
        this.flexLens.destroy()
        this.flexProgress.destroy()
        this.flexEffects.destroy()
        this.flexRetarg.destroy()
        if (this.controllerPort) {
            this.controllerPort.onmessage = null
            this.controllerPort.close()
            this.controllerPort = null
        }
    }
    showProgress() {
        this.managerWorker.showProgress()
    }
}

export { VCAM, Manager, ManagerConnection, FlexatarLens }
