import { Manager } from "../ftar-manager/ftar-connection.js"

let managerPromiseResolve
let managerPromise = new Promise(resolve => {
    managerPromiseResolve = resolve
})

onmessage = async (event) => {
    const msg = event.data
    if (!msg) return
    let manager
    if (!msg.initManager) {
        manager = await managerPromise
    }
    if (msg.initManager) {



        const manager = new Manager(() => {
            return new Promise(resolve => {
                function handler(e) {
                    if (e.data && e.data.token) {
                        resolve(e.data.token)
                        self.removeEventListener("message", handler)
                    }
                }
                self.addEventListener("message", handler)
                postMessage({ tokenRequest: true })
            })



        },"defaultManager",()=>{
            return new Promise(resolve => {
                function handler(e) {
                    if (e.data && e.data.defaultBackgrounds) {
                        resolve(e.data.defaultBackgrounds)
                        self.removeEventListener("message", handler)
                    }
                }
                self.addEventListener("message", handler)
                postMessage({ defaultBackgroundsRequest: true })
            })

        })
        manager.onMediaPort = port => {
            postMessage({ onMediaPort: port }, [port])
        }
        managerPromiseResolve(manager)

    } else if (msg.managerName) {
        manager.managerName = msg.managerName
    } else if (msg.tokenRequestArguments) {

    } else if (msg.ftarUIPort) {
        console.log("msg.ftarUIPort", msg.ftarUIPort)
        manager.addPort(msg.ftarUIPort)
    } else if (msg.ftarLensPort) {
        console.log("msg.ftarLensPort", msg.ftarLensPort)
        manager.addFtarLens(msg.ftarLensPort)
    }
    else if (msg.showProgress) {
        manager.showProgress()
    } else if (msg.ftarProgressPort) {
        console.log("msg.ftarProgressPort", msg.ftarProgressPort)
        manager.addProgressPort(msg.ftarProgressPort)
    }
    else if (msg.ftarEffectsPort) {
        console.log("msg.ftarEffectsPort", msg.ftarEffectsPort)
        manager.addEffectPort(msg.ftarEffectsPort)
    }
    else if (msg.ftarRetargPort) {
        console.log("msg.ftarRetargPort", msg.ftarRetargPort)
        manager.addRetargPort(msg.ftarRetargPort)
    }
}

