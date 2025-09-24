import {checkIfValueArrayBuffer} from "./utils/checkIfValueArrayBuffer.js"
import {obtainArrayBufferFromUrl} from "./utils/obtainArrayBufferFromUrl.js"

import { RenderWorkerWarper } from "./worker/install-easy-render-worker.js"
import { VCamMediaStream } from "./utils/image-proc.js"
import { AudioDelayProcessor } from "./utils/audio-delay.js"
import { NativeTrackProcessor, MediaRecorderBasedTrackProcessor } from "./utils/track-processors.js"

const isTrackProcessorAvailable =
    'MediaStreamTrackProcessor' in window &&
    typeof window.MediaStreamTrackProcessor === 'function';

export class FtarRenderer {

    constructor(path, canvas) {
        const renderer = new RenderWorkerWarper(path, { width: 320, height: 320 })
        this.readyPromise = new Promise(resolve => {
            renderer.onReady = resolve
        })

        this.controllerPortPromise = renderer.getControllerPort()
        const vCamStream = new VCamMediaStream({ canvas, width: 320, height: 320 })
        this.vCamStream = vCamStream
        renderer.addMediaPort(vCamStream.portToSend)

    }
    connectMediaStream(mediaStream) {
        const trackMono = mediaStream.getAudioTracks()[0]
        const delay = new AudioDelayProcessor(trackMono)
        delay.setDelay(isTrackProcessorAvailable ? 0.41 : 0.86)

        const self = this

        trackMono.onended = () => {
            console.log("oroginal track stopped")
            setTimeout(() => {
                delay.stop()
                self.vCamStream.port.postMessage({ setLipState: [0, 0, 0.1, 0, 0] })
            }, 500)

        }
        this.currentTrackProcessor = isTrackProcessorAvailable ? (new NativeTrackProcessor(trackMono)) : (new MediaRecorderBasedTrackProcessor(trackMono))
        this.currentTrackProcessor.onAudio = audioBuffer => {
            // console.log("audioBuffer", audioBuffer)
            this.vCamStream.port.postMessage({ audioBuffer }, [audioBuffer])

        }
        return new MediaStream([delay.getDelayTrack()])
    }



    async getAnimationList() {
        const port = await this.controllerPortPromise
        port.start()
        const msgId = Math.random().toString(36).substring(2, 9)
        const promise = new Promise((resolve, reject) => {
            const handler = (event) => {

                if (event.data.msgId === msgId) {
                    resolve(event.data.animationNames)
                    port.removeEventListener('message', handler)
                }
            }
            port.addEventListener('message', handler)
            port.postMessage({ animationNames: true, msgId: msgId })
        })
        return await promise
    }

    set animation(pattern) {
        this.controllerPortPromise.then(port=>{
            port.postMessage({ animation:{pattern} })

        })
    }


    /**
     * Sets the value for slot1. The val can be either a URL string or an ArrayBuffer.
     * If val is a URL, it will be converted to an ArrayBuffer using obtainArrayBufferFromUrl.
     * If val is already an ArrayBuffer, it will be sent directly.
     *
     * @param {string|ArrayBuffer} val - The value to set for slot1. Can be a URL string or an ArrayBuffer.
     */
    set slot1(val) {
        if (checkIfValueArrayBuffer(val)) {
            this.controllerPortPromise.then(port => {
                port.postMessage({ slot1: val, id: crypto.randomUUID() }, [val])
            })
        } else {
            const self = this
            obtainArrayBufferFromUrl(val).then(arrayBuffer => {
                self.slot1 = arrayBuffer
            })
        }
   
    }

    set background(val) {
        this.controllerPortPromise.then(port => {
            port.postMessage({ background: val })
        })
    }
    set size(val){
        this.vCamStream.setSize(val)
        this.vCamStream.size = val
    }

}