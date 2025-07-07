// importScripts("./ftar_view3_mod.js")

import * as FtarView1 from "./engine.mod.js"
import "../ftar-manager/ftar-connection.js"
import "./ftar_lipsync_mod.js"
// import "./intercept_session.js"
// import {getFlexatarWraped,getPreviewWraped} from "./caching.js"
// const FtarView = self.FtarView

function log() {
    console.log("[RENDER WORKER]", ...arguments)
}


function arrayBufferToFile(arrayBuffer, fileName, mimeType = "application/octet-stream") {
    const blob = new Blob([arrayBuffer], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
}


function concatenateFloat32Arrays(arrays) {
    // Calculate total length
    if (arrays.length === 1) {
        return arrays[0]
    }
    let totalLength = 0;
    for (let i = 0; i < arrays.length; i++) {
        totalLength += arrays[i].length;
    }

    // Create a new Float32Array with the total length
    let result = new Float32Array(totalLength);

    // Copy data from input arrays to the result array
    let offset = 0;
    for (let i = 0; i < arrays.length; i++) {
        result.set(arrays[i], offset);
        offset += arrays[i].length;
    }

    return result;
}
function splitFloat32Array(arr, firstLength) {
    return [
        new Float32Array(arr.slice(0, firstLength)),
        new Float32Array(arr.slice(firstLength))
    ];
}
class AudioPacker {
    constructor() {

        this.windowSize = 800;


        this.collector = []

    }

    // addBuffer(buffer,onBufferReady,onFail){
    //   if (buffer){
    //     const arr = new Float32Array(buffer)
    //     this.collector.push(arr);
    //     const totalLength = (this.collector.length - 1) * arr.length +  this.collector[0].length
    //     // console.log(arr.length,totalLength,this.windowSize)

    //     if (totalLength >this.windowSize) {
    //         const audioBuffer = concatenateFloat32Arrays(this.collector);
    //         // const message = {audioBuffer:,sampleRate:sampleRate}
    //         onBufferReady(audioBuffer.subarray(0,this.windowSize));
    //         this.collector = [];
    //         if (audioBuffer.length > this.windowSize){
    //             const tail = audioBuffer.subarray(this.windowSize,audioBuffer.length);
    //             this.collector.push(tail);
    //         }

    //     }
    //   }else{
    //     onFail()
    //   }
    // }
    addBuffer(buffer, onBufferReady, onFail) {
        if (buffer) {
            const arr = new Float32Array(buffer)
            this.collector.push(arr);
            const totalLength = (this.collector.length - 1) * arr.length + this.collector[0].length
            // console.log(arr.length,totalLength,this.windowSize)

            if (totalLength > this.windowSize) {

                const audioBuffer = concatenateFloat32Arrays(this.collector);

                // const message = {audioBuffer:,sampleRate:sampleRate}
                onBufferReady(audioBuffer.subarray(0, this.windowSize));
                this.collector = [];
                if (audioBuffer.length > this.windowSize) {
                    let tail = audioBuffer.subarray(this.windowSize, audioBuffer.length);
                    const buffersToSchedule = []


                    while (tail.length >= this.windowSize) {
                        buffersToSchedule.push(tail.subarray(0, this.windowSize))
                        // console.log("buffersToSchedule",buffersToSchedule)

                        tail = tail.subarray(this.windowSize, tail.length);
                    }
                    (async () => {
                        while (buffersToSchedule.length > 0) {
                            await new Promise(resolve => setTimeout(resolve, 50))
                            const buffer = buffersToSchedule.shift()
                            // console.log("fire audio to lipsync",buffer)
                            onBufferReady(buffer);
                        }

                    })()

                    this.collector.push(tail);
                }

            }
        } else {
            onFail()
        }
    }
}

const aPacker = new AudioPacker()



console.log(FtarView)
let renderer
let offscreen
let ftarManagerConnection
let flexatarSDK
async function initRender(url1, url2, size) {



    console.log("offscreen", FtarView)
    const connection = new Ftar.ManagerConnection()
    ftarManagerConnection = connection
    postMessage({ renderToManagerPort: connection.outPort }, [connection.outPort])
    log("manager connection awaiting")
    await connection.ready;
    log("manager connection ready")
    const token = new FtarView.GetToken(async () => {

        // const token1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOm51bGwsImV4cCI6NTM0MTAxNDU2MiwiaXNzIjoiIiwianRpIjoiIiwibmJmIjoxNzQxMDE0NTYyLCJvd25lciI6InRlc3QuY2xpZW50IiwicHJlcGFpZCI6dHJ1ZSwic3ViIjoiIiwidGFnIjoidGVzdCIsInRhcmlmZiI6InVuaXZlcnNhbCIsInVzZXIiOiJjbGllbnRfMSJ9.ULZwmHsLSqxjykbMmZH61gt7Xejns-r5Ez0_eWZTucU"
        // console.log("token recv",token1)
        log("requesting token")
        const token = await connection.getToken()
        log("token", token)
        return token
    });
    // let ftarList = await FtarView.flexatarList(token,{preview:true})
    flexatarSDK = new FtarView.SDK(token,
        url1, url2
    )
    offscreen = new OffscreenCanvas(size.width, size.height);
    // offscreen = new OffscreenCanvas(240,320);
    // offscreen.width = 640
    // offscreen.height = 480
    log("starting render")

    renderer = await flexatarSDK.getRenderer(offscreen)
    log("renderer obtained", renderer)
    if (renderer.error) {
        const ctx = offscreen.getContext('2d');

        // Set text properties
        ctx.font = '60px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';

        // Draw text
        ctx.fillText('No Subscription', Math.round(size.width / 2), Math.round(size.height / 2));

        let fistFrameNotSent = true
        renderer.start = async () => {


            while (fistFrameNotSent) {
                for (const port of mediaPorts) {

                    createImageBitmap(offscreen).then(bitmap => {
                        port.postMessage({ frame: bitmap }, [bitmap])

                    });
                    // fistFrameNotSent = false
                    log("first empty frame sent")
                }
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }
        renderer.pause = () => {
            fistFrameNotSent = false
        }
        renderResolve()
        return

    }

    let { id: ftarId, is_myx } = await connection.getCurrentFtar()

    // console.log("ftarMsg",ftarMsg)
    renderer.canvas.width = size.width
    renderer.canvas.height = size.height
    // renderer.canvas.width = 640
    // renderer.canvas.height = 480
    if (!ftarId) ftarId = "default";
    if (ftarId) {
        // const ftar = await connection.getFlexatar("default")
        const ftar = await connection.getFlexatar(ftarId, is_myx)
        // log("obtain current ftar",ftarId,ftar)
        renderer.slot1 = { data: new Uint8Array(ftar), ready: Promise.resolve(true), id: ftarId, name: "noname" }
        const background = await connection.getCurrentBackground({ dataUrl: true })
        if (background) {
            flexatarSDK.newOverlay(background).then(overlay => {

                renderer.addOverlay(overlay, { x: 0, y: 0, width: 100, height: 100, mode: "back" });

            })
        }
    }

    // const ftarObject = await getFlexatarWraped(FtarView,ftarList[0],token)

    // const ftarLink = await FtarView.flexatarEntry(token,ftarList[0].id,{ftar:true})
    // const result = await FtarView.getFlexatar(ftarLink);
    // console.log("test ftar",result.data)
    // renderer.slot1 = ftarObject

    // renderer.start()
    renderer.onDraw = () => {
        let drawCounts = 0
        for (const port of mediaPorts) {
            if (port.renderingState) {

                createImageBitmap(offscreen).then(bitmap => {
                    port.postMessage({ frame: bitmap }, [bitmap])

                });
                drawCounts += 1;
            }

        }
        if (drawCounts === 0) {
            renderer.pause()
            log("renderer paused")
        }

    }
    log("rend init fin")
    renderResolve()
    postMessage({ initComplete: true })
}
let renderResolve
const rendererPromise = new Promise(resolve => {
    renderResolve = resolve
})



let ports = []
let mediaPorts = []
let canvases = []
let processAudio
let checkLipSyncGl = () => { return true }
let effectParameter = 0.6125;
let effectIsAnimated = false;
let currentMode = 0;
let currentEffectFtarId 
let currentEffectFtarIsMyx 
onmessage = (event) => {
    // console.log("Message received from main script");
    // const workerResult = `Result: ${e.data[0] * e.data[1]}`;
    // console.log("Posting message back to main script");
    // postMessage(workerResult);
    log("render worker msg:", event.data)
    const msg = event.data
    if (msg.controllerPort) {


        const channel = new MessageChannel()
        ports.push(channel.port1)

        channel.port1.onmessage = e => {
            const msg = e.data
            if (!msg) return
            if (msg.slot1) {
                // const copiedBuffer = copyArrayBuffer(msg.slot1)
                const data = new Uint8Array(msg.slot1)
                log("msg.slot1", data)
                rendererPromise.then(() => {
                    if (renderer.error) {
                        renderer.start()
                        return
                    }

                    renderer.slot1 = { data, ready: Promise.resolve(true), id: msg.id, name: "noname" }
                    renderer.start()
                })

            } else if (msg.effectStateRequest) {
               log("effectStateRequest")

                channel.port1.postMessage({effectStateResponse:{effectIsAnimated,currentMode,effectParameter,currentEffectFtarId,currentEffectFtarIsMyx}})
            } else if (msg.isAnimated) {
                log("msg.isAnimated",msg.isAnimated)
                effectIsAnimated = msg.isAnimated.state
                if (effectIsAnimated){
                    if (currentMode === 0){
                        renderer.effect = FtarView.effect.no()
                    }else if (currentMode === 1){
                        renderer.effect = FtarView.effect.morph()
                    }else if (currentMode === 2){
                        renderer.effect = FtarView.effect.hybrid()
                    }
                }else{
                    if (currentMode !== 0){
                        renderer.effect = () => { return { mode: currentMode, parameter: effectParameter } }
                    }
                }

            } else if (msg.effectParameter) {
                effectParameter = msg.effectParameter
                if (currentMode !== 0 && !effectIsAnimated){
                        renderer.effect = () => { return { mode: currentMode, parameter: effectParameter } }
                }
            } else if (msg.hybridEffect) {
                currentMode = 2
                if (effectIsAnimated){
                    renderer.effect = FtarView.effect.hybrid()

                }else{
                    renderer.effect = () => { return { mode: currentMode, parameter: effectParameter } }
                    
                }

            } else if (msg.morphEffect) {
                currentMode = 1
                if (effectIsAnimated){
                        renderer.effect = FtarView.effect.morph()

                }else{
                    renderer.effect = () => { return { mode: currentMode, parameter: effectParameter } }
                                             
                }
            } else if (msg.noEffect) {
                currentMode = 0
                renderer.effect = () => { return { mode: currentMode, parameter: 0 } }

            } else if (msg.slot2) {
                currentEffectFtarId = msg.id
                currentEffectFtarIsMyx = msg.is_myx
                const data = new Uint8Array(msg.slot2)
                rendererPromise.then(() => {
                    renderer.slot2 = { data, ready: Promise.resolve(true), id: msg.id, name: "noname" }
                })
                
                // renderer.effect = () => { return { mode: 2, parameter: effectParameter } }


            } else if (msg.background) {
                if (msg.no) {
                    renderer.addOverlay(null, { x: 0, y: 0, width: 100, height: 100, mode: "back" });

                    return
                }
                rendererPromise.then(() => {
                    flexatarSDK.newOverlay(msg.background).then(overlay => {

                        renderer.addOverlay(overlay, { x: 0, y: 0, width: 100, height: 100, mode: "back" });

                    })
                })
                // console.log("overlay accepted")
            } else if (msg.animation) {
                if (renderer.error) return
                renderer.animator.currentAnimationPattern = msg.animation.pattern
            } else if (msg.closing) {
                ports = ports.filter(fn => fn !== channel.port1);
                channel.port1.close()
                console.log("controller, closing port ", ports.length)
            }
        }
        postMessage({ controllerPort: channel.port2, msgID: msg.msgID }, [channel.port2])


    } else if (msg.mediaPort) {
        console.log("media port received", msg.mediaPort)
        msg.mediaPort.renderingState = true
        mediaPorts.push(msg.mediaPort)
        rendererPromise.then(() => {
            renderer.start()
        })
        msg.mediaPort.onmessage = e => {
            const msg1 = e.data
            if (!msg1) return
            if (msg1.audioBuffer) {
                if (!processAudio) return
                // console.log("render worker audio buffer")
                aPacker.addBuffer(msg1.audioBuffer, (packedAudio) => {
                    // console.log("packedAudio",packedAudio)
                    processAudio(packedAudio, (anim) => {

                        if (renderer) renderer.speechState = anim
                        // console.log("anim",anim)
                    })
                }, () => {
                    console.log("fail")
                })
            }
            else if (msg1.closeMouth) {
                renderer.speechState = [0, 0, 0.1, 0, 0]
            } else if (msg1.closing) {
                mediaPorts = mediaPorts.filter(fn => fn !== msg.mediaPort);
                msg.mediaPort.close()
                console.log("media port, closing port ", mediaPorts.length)
            } else if (msg1.control) {
                console.log("controll signal")
                msg.mediaPort.postMessage({ log: "control signal received" })
                msg.mediaPort.renderingState = msg1.control.renderingState
                if (msg1.control.renderingState) {
                    rendererPromise.then(() => {
                        renderer.start()
                        console.log("rendering started")
                    })
                }
            }
        }

        // msg.mediaPort.postMessage({ready:true})

        // ports.push(msg.mediaPort)
    } else if (msg.changeSize) {
        renderer.canvas.width = msg.changeSize.width
        renderer.canvas.height = msg.changeSize.height
    } else if (msg.initBuffers) {
        initRender(
            arrayBufferToDataURL(msg.initBuffers[0]),
            arrayBufferToDataURL(msg.initBuffers[1]),
            msg.size
        )
        const nnBuffers = msg.nnBuffers;
        const opts = {
            wav2mel: {
                files: [
                    arrayBufferToFile(nnBuffers.wav2mel.model, "model.json", "application/json"),
                    arrayBufferToFile(nnBuffers.wav2mel.shards[0], "group1-shard1of3.bin"),
                    arrayBufferToFile(nnBuffers.wav2mel.shards[1], "group1-shard2of3.bin"),
                    arrayBufferToFile(nnBuffers.wav2mel.shards[2], "group1-shard3of3.bin"),
                ]
            },
            mel2phon: {
                files: [
                    arrayBufferToFile(nnBuffers.mel2phon.model, "model.json", "application/json"),
                    arrayBufferToFile(nnBuffers.mel2phon.shards[0], "group1-shard1of1.bin"),

                ]
            },
            phon2avec: {
                files: [
                    arrayBufferToFile(nnBuffers.phon2avec.model, "model.json", "application/json"),
                    arrayBufferToFile(nnBuffers.phon2avec.shards[0], "group1-shard1of1.bin"),

                ]
            }
        }
        console.log("FtarLipSync", FtarLipSync)
        const { sendMessage, checkGLContextLost } = FtarLipSync.init("", opts)
        processAudio = sendMessage
        checkLipSyncGl = checkGLContextLost

    } else if (msg.checkGlContext) {
        console.log("renderer", renderer)
        if (renderer) {
            const context = renderer.canvas.getContext("webgl2")
            console.log("isContextLost", context.isContextLost())
            console.log("checkLipSyncGl", checkLipSyncGl())
            // const isContextLost = true
            const isContextLost = context.isContextLost() || checkLipSyncGl()
            if (isContextLost) {
                if (ftarManagerConnection) {
                    ftarManagerConnection.close()
                }
            }
            postMessage({ isContextLost: { value: isContextLost } })
        }

    } else if (msg.checkInUse) {
        console.log("worker checking in use mediaPorts.length: ", mediaPorts.length)
        postMessage({ isInUse: { value: mediaPorts.length !== 0 } })
    }
};

function arrayBufferToDataURL(arrayBuffer, mimeType = 'application/octet-stream') {
    // Convert ArrayBuffer to a Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert to a binary string
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }

    // Encode binary string as Base64
    const base64String = btoa(binaryString);

    // Construct the Data URL
    return `data:${mimeType};base64,${base64String}`;
}
