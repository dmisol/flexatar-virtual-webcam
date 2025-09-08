
import ManagerWorker from "./worker/manager.worker.js"
import { RenderWorkerWarper } from "./worker/install-render-worker.js"
import { Manager, ManagerConnection } from "./ftar-manager/ftar-connection.js"
import { FlexatarLens } from "./ftar-manager/ftar-lens.js"

function log() {
    console.log("[FTAR PACK]", ...arguments)
}


async function resample(float32Array, targetSampleRate, inputSampleRate, numChannels = 1) {
    const frameCount = float32Array.length / numChannels;
    const offlineContext = new OfflineAudioContext({
        numberOfChannels: numChannels,
        length: Math.ceil(frameCount * (targetSampleRate / inputSampleRate)),
        sampleRate: targetSampleRate,
    });
    const audioBuffer = offlineContext.createBuffer(1, frameCount, inputSampleRate);
    audioBuffer.getChannelData(0).set(float32Array);

    const anotherArray = new Float32Array(audioBuffer.length);
    audioBuffer.copyFromChannel(anotherArray, 0, 0);
    // console.log("anotherArray",anotherArray)

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    const resampledBuffer = await offlineContext.startRendering();


    return resampledBuffer
}
class MediaRecorderBasedTrackProcessor {
    constructor(track) {
        const stream = new MediaStream([track])
        let mimeType
        const supportedTypes = [
            'audio/webm',
            'audio/webm;codecs=opus',
            'audio/ogg',
            'audio/wav',
        ];

        for (const type of supportedTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
            }
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        let firstChunk
        const self = this
        recorder.ondataavailable = async (event) => {
            if (event.data.size === 0) return;
            if (!firstChunk) {
                firstChunk = event.data
                return
            }
            const blob = new Blob([firstChunk, event.data], { type: mimeType });
            const arrayBuffer = await blob.arrayBuffer();
            // console.log(arrayBuffer)

            // Use a dummy OfflineAudioContext — sample rate guessed here
            const offlineCtx = new OfflineAudioContext(1, 1, 16000);

            try {
                const decoded = await offlineCtx.decodeAudioData(arrayBuffer);
                const pcm = decoded.getChannelData(0); // Float32Array of PCM samples
                if (self.onAudio) self.onAudio(pcm.buffer)
                // console.log(pcm)
                // console.log("Decoded PCM (Float32Array):", pcm);
            } catch (err) {
                console.error("Decode error:", err);
            }
        };
        recorder.start(1);
        this.recorder = recorder
    }
    stop() {
        this.recorder.stop()
    }
    // onAudio = ()=>{}
}

class ManagerWorkerWarper {
    constructor(tokenFunc, managerName,
        defaultBackgroundsFn = async () => {
            return []
        }) {
        const managerWorker = new ManagerWorker()


        managerWorker.postMessage({ initManager: true })

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

            } else if (msg.tokenRequest) {
                tokenFunc().then(token => {
                    managerWorker.postMessage({ token })
                })


                return
            }
        }
        this.managerWorker = managerWorker
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

// (function polyfillMediaStreamTrackProcessor() {
//   if (typeof window.MediaStreamTrackProcessor !== "undefined") {
//     return; // already supported
//   }

class SafariMediaStreamTrackProcessor {
    constructor(track) {
        this.track = track;
        this.video = document.createElement('video');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.readable = new ReadableStream({
            start: (controller) => {
                this.controller = controller;
                this.isProcessing = true;
                this.video.muted = true;
                this.video.playsInline = true;
                this.video.srcObject = new MediaStream([this.track]);
                this.video.play();

                this.video.addEventListener('playing', () => {
                    const videoSettings = this.track.getSettings();
                    this.canvas.width = videoSettings.width;
                    this.canvas.height = videoSettings.height;
                    this.processFrame();
                }, { once: true });
            },
            cancel: () => {
                this.isProcessing = false;
                const stream = this.video.srcObject;
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    this.video.srcObject = null;
                }
            }
        });
    }

    processFrame() {
        if (!this.isProcessing || this.controller.desiredSize === 0) {
            requestAnimationFrame(() => this.processFrame());
            return;
        }

        try {
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            const frameData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

            // We are faking a VideoFrame object here to maintain a consistent API
            // const fakeVideoFrame = {
            //     close: () => { }, // A dummy close method
            //     displayWidth: this.canvas.width,
            //     displayHeight: this.canvas.height,
            //     data: frameData.data
            // };
            frameData.close = () => { }
            this.controller.enqueue(frameData);
            requestAnimationFrame(() => this.processFrame());
        } catch (error) {
            showMessage(`Frame processing failed: ${error.message}`);
            this.controller.close();
        }
    }
}
// Expose to global context
// window.MediaStreamTrackProcessor = SafariMediaStreamTrackProcessor;
// })();


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
        let needGallery = false
        const isAuthorized = false
        if (!isAuthorized) {
            needGallery = true
        }

        // const managerWorkerUnauthorized = new ManagerWorkerWarper(async () => {
        //     const response = await fetch(`https://api.flexatar-sdk.com/myxtoken`)
        //     // log("requesting token")
        //     if (!response.ok) {
        //         return
        //     }
        //     const tokenJson = await response.json()

        //     if (!tokenJson.token) {
        //         return
        //     }
        //     // log("myx token obtained")
        //     return tokenJson.token
        // },needGallery ? "unauthorized":"empty")
        // },"unauthorized")




        // const managerWorker = new ManagerWorkerWarper(async ()=>{
        //     return {token:null}
        // },"authorized")
        const managerWorker = new ManagerWorkerWarper(tokenFn, "authorized", opts.defaultBackgroundsFn)

        this.managerWorker = managerWorker
        const flexLens = new FlexatarLens(opts.url.lens, opts.lensClassName)
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
        // vCamUi.managerPortUnauthorized.then(port => {
        //     managerWorkerUnauthorized.addPort(port)
        // })

        const iframe = vCamUi.element
        this.element = iframe
        iframe.style.width = opts.vCamUI?.width ? opts.vCamUI?.width : "60px"
        iframe.style.height = opts.vCamUI?.height ? opts.vCamUI?.height : "300px"
        iframe.style.border = "none"
        // window.addEventListener("message",(e)=>{
        //     const msg = e.data
        //     if (!msg) return
        //     console.log(msg)
        //     if (msg.ftarUIPort){
        //         managerWorker.addPort(msg.ftarUIPort)
        //     }
        // })


        const renderer = new RenderWorkerWarper(opts.url.files, opts.size)
        let isVideoRunning = false
        let currentVideoStream
        renderer.onVideoFromCameraMesssage = async msg => {
            log("onVideoFromCameraMesssage", msg)
            if (msg.videoStreamFromCameraRequest) {

                if (isVideoRunning) return


                isVideoRunning = true
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
                videoStream.getTracks().forEach(t => t.stop())
                const devices = await navigator.mediaDevices.enumerateDevices();
                log("videoStreamFromCameraRequest in content script", msg.videoStreamFromCameraRequest, devices)

                let cameras = devices.filter(d => d.kind === "videoinput" && d.label === msg.videoStreamFromCameraRequest);
                if (cameras.length === 0) {
                    isVideoRunning = false
                    return
                }
                const constraints = {
                    video: { deviceId: { exact: cameras[0].deviceId } }
                };

                navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                    const messageChannelCameraFrames = new MessageChannel()
                    renderer.worker.postMessage({ messagePortCameraFrames: messageChannelCameraFrames.port2 }, [messageChannelCameraFrames.port2])

                    // iframe.contentWindow.postMessage({ messagePortCameraFrames: messageChannelCameraFrames.port2 }, "*", [messageChannelCameraFrames.port2])


                    if (currentVideoStream) currentVideoStream.getTracks().forEach(x => x.stop())
                    currentVideoStream = stream
                    const track = stream.getVideoTracks()[0];
                    // const ProcessorClass =
                    //     typeof MediaStreamTrackProcessor !== "undefined"
                    //         ? MediaStreamTrackProcessor
                    //         : typeof SafariMediaStreamTrackProcessor !== "undefined"
                    //             ? SafariMediaStreamTrackProcessor
                    //             : null;
                    
                    const processor = new MediaStreamTrackProcessor(track);
                    const reader = processor.readable.getReader();
                    let counter = 0
                    async function pumpFrames() {
                        while (true) {
                            const result = await reader.read();
                            if (result.done) break;
                            const frame = result.value; // VideoFrame
                            if (reader.desiredSize < 0) {
                                frame.close();
                                continue;
                            }
                            counter++
                            if (counter % 1 === 0) {
                                // log("frame",frame)
                                // bundle.js:1 Uncaught (in promise) TypeError: Failed to execute 'createImageBitmap' on 'Window': The provided value is not of type '(Blob or HTMLCanvasElement or HTMLImageElement or HTMLVideoElement or ImageBitmap or ImageData or OffscreenCanvas or SVGImageElement or VideoFrame)'.
                                createImageBitmap(frame).then(bitmap => {
                                    const currentFrameTS = performance.now()
                                    messageChannelCameraFrames.port1.postMessage({ setHeadMotionStateByFrame: bitmap, ts: currentFrameTS }, [bitmap])

                                });
                                frame.close()
                            }



                        }

                        renderer.worker.postMessage({ setHeadMotionStateByPattern: true })
                        // iframe.contentWindow.postMessage({ setHeadMotionStateByPattern: true }, "*")
                        isVideoRunning = false
                        messageChannelCameraFrames.port1.postMessage({ closing: true })
                        messageChannelCameraFrames.port1.close()

                    }

                    pumpFrames();
                    log("stream obtained")
                })
            } else if (msg.videoStreamFromCameraStopRequest) {
                if (currentVideoStream) {
                    currentVideoStream.getTracks().forEach(x => x.stop())
                    currentVideoStream = null

                }
            }

        }

        renderer.setupRetargeting(opts.url.files)

        renderer.onManagerPort = port => {
            console.log("on top manager port", port)
            managerWorker.addPort(port)
        }
        // renderer.onManagerUnauthorizedPort = port => {
        //     console.log("on top manager port", port)
        //     managerWorkerUnauthorized.addPort(port)
        // }
        renderer.getControllerPort().then(port => {
            vCamUi.controllerPort = port
        })


        renderer.onReady = () => {
            renderer.setRoundOverlay(true)

            if (this.onReady) this.onReady()
        }
        managerWorker.onMediaPort = port => {
            renderer.addMediaPort(port)

        }


        this.renderer = renderer;

        // const vCamStream = new VCamMediaStream(opts.size)
        const vCamStream = new VCamMediaStream({ canvas: opts.canvas, ...opts.size })
        this.vCamStream = vCamStream
        renderer.addMediaPort(vCamStream.portToSend)
        this.iframe = iframe

    }
    get lensElement() {

    }
    get progressElement() {

    }
    get uiElement() {

    }
    get canvas() {
        return this.vCamStream.canvas
    }

    mount(holder) {
        holder.appendChild(this.iframe)
        holder.style.display = "block"
        console.log("appending iframe to", holder)

    }
    destroy() {
        this.iframe.remove()
        this.managerWorker.destroy()
        this.vCamStream.destroy()
        this.flexLens.destroy()
        this.flexProgress.destroy()
        this.renderer.destroy()

    }
    showProgress() {
        this.managerWorker.showProgress()
    }
    currentTrackProcessor
    currentReader
    set src(mediaStream) {
        console.log("start lipysnc", mediaStream);

        const isTrackProcessorAvailable =
            'MediaStreamTrackProcessor' in window &&
            typeof window.MediaStreamTrackProcessor === 'function';

        // const TrackProcessor = isTrackProcessorAvailable ? NativeTrackProcessor : MediaRecorderBasedTrackProcessor    
        if (this.currentTrackProcessor) {
            this.currentTrackProcessor.stop()
            this.currentTrackProcessor = null
        }
        if (!mediaStream) {
            setTimeout(
                () => {
                    this.vCamStream.port.postMessage({ closeMouth: true })
                },
                700
            )
            return
        }
        getAudioTrack(mediaStream).then(trackMono => {

            this.currentTrackProcessor = isTrackProcessorAvailable ? (new NativeTrackProcessor(trackMono)) : (new MediaRecorderBasedTrackProcessor(trackMono))
            this.currentTrackProcessor.onAudio = audioBuffer => {
                // console.log("audioBuffer")
                this.vCamStream.port.postMessage({ audioBuffer }, [audioBuffer])

            }
        })

    }
    get mediaStream() {
        return this.vCamStream.stream
    }
    get delay() {
        const isTrackProcessorAvailable =
            'MediaStreamTrackProcessor' in window &&
            typeof window.MediaStreamTrackProcessor === 'function';
        return isTrackProcessorAvailable ? 0.45 : 0.95
        // return isTrackProcessorAvailable ? 0.45 : 0.87
    }

    set size(val) {
        this.renderer.size = val
        this.vCamStream.size = val
    }
}

class NativeTrackProcessor {
    constructor(audioTrack) {
        this.active = true;
        const self = this;
        (async () => {
            console.log("start lipysnc")
            const track = audioTrack
            // const track = mediaStream.getAudioTracks()[0]
            const media_processor = new MediaStreamTrackProcessor(track);
            const reader = media_processor.readable.getReader();
            self.reader = reader
            while (self.active) {

                const result = await reader.read();
                if (result.done) {
                    // onStop()
                    break;
                }
                // onData(result.value)
                const audioData = result.value
                const frameCount = audioData.numberOfFrames;
                const buffer = new Float32Array(frameCount);
                audioData.copyTo(buffer, { planeIndex: 0 });
                const resampledBuffer = await resample(buffer, 16000, audioData.sampleRate);
                const audioBuffer = resampledBuffer.getChannelData(0).buffer
                // console.log("Audio")
                self.onAudio(audioBuffer)
                // this.vCamStream.port.postMessage({audioBuffer},[audioBuffer])
                // console.log("reading track",track.id)

            }
        })()
    }
    onAudio = () => { }
    async stop() {
        await this.reader.cancel()
        this.reader.releaseLock();
        this.reader = null
        this.active = false

    }
}

async function getAudioTrack(input) {
    // Case 1: Input is already an audio track
    if (input instanceof MediaStreamTrack && input.kind === 'audio') {
        return input;
    }

    // Case 2: Input is a MediaStream
    if (input instanceof MediaStream) {
        const audioTracks = input.getAudioTracks();
        if (audioTracks.length === 0) throw new Error('No audio track found in MediaStream');
        return audioTracks[0]

    }
    throw new Error('Unsupported input type');
}



async function convertToMonoTrack(stream) {
    return new Promise((resolve, reject) => {
        const context = new (window.AudioContext || window.webkitAudioContext)();

        const source = context.createMediaStreamSource(stream);
        const merger = context.createChannelMerger(1); // mono output

        // Sum channels into mono
        source.connect(merger, 0, 0);

        const dest = context.createMediaStreamDestination();
        merger.connect(dest);

        const monoTrack = dest.stream.getAudioTracks()[0];
        if (!monoTrack) return reject(new Error('Mono track creation failed'));

        resolve(monoTrack);
    });
}

async function delayAudioTrack(track, delayMs = 450) {
    if (!(track instanceof MediaStreamTrack) || track.kind !== 'audio') {
        throw new Error('Input must be an audio MediaStreamTrack');
    }

    const stream = new MediaStream([track]);
    const context = new (window.AudioContext || window.webkitAudioContext)();

    const source = context.createMediaStreamSource(stream);
    const delayNode = context.createDelay();
    delayNode.delayTime.value = delayMs / 1000; // convert ms to seconds

    const dest = context.createMediaStreamDestination();
    source.connect(delayNode).connect(dest);

    const delayedTrack = dest.stream.getAudioTracks()[0];
    if (!delayedTrack) throw new Error('Failed to create delayed audio track');

    return delayedTrack;
}
export { VCAM, Manager, ManagerConnection, VCamMediaStream, ManagerWorkerWarper, RenderWorkerWarper, FlexatarLens }