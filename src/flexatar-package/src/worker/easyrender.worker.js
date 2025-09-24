// importScripts("./ftar_view3_mod.js")

import * as FtarView1 from "./engine.mod.js"
import "../ftar-manager/ftar-connection.js"
import "./ftar_lipsync_mod.js"

let setVoiceProcessingParameters
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

function drawIcon(ctx, shape, x, y, size, rotation = 0, opacity = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = '#e9e9e9ff'; // dark green
    ctx.lineWidth = 0.4;

    if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.stroke();
    } else if (shape === 'heart') {
        ctx.beginPath();
        ctx.moveTo(0, -size / 4);
        ctx.bezierCurveTo(size / 2, -size / 2, size / 2, size / 2, 0, size / 2);
        ctx.bezierCurveTo(-size / 2, size / 2, -size / 2, -size / 2, 0, -size / 4);
        ctx.stroke();
    } else if (shape === 'star') {
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = size / 2;
        const innerRadius = size / 4;
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const sx = Math.cos(angle) * r;
            const sy = Math.sin(angle) * r;
            i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.stroke();
    }

    ctx.restore();
}


function drawMessageBubble(ctx, size) {
    const padding = 5;
    const bubbleWidth = size / 256 * 105;
    const bubbleHeight = size / 256 * 20;
    const radius = 8;
    const x = padding;
    const y = size - bubbleHeight - padding;

    ctx.save();

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // White rounded rectangle
    ctx.fillStyle = '#344d23';
    // ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + bubbleWidth - radius, y);
    ctx.quadraticCurveTo(x + bubbleWidth, y, x + bubbleWidth, y + radius);
    ctx.lineTo(x + bubbleWidth, y + bubbleHeight - radius);
    ctx.quadraticCurveTo(x + bubbleWidth, y + bubbleHeight, x + bubbleWidth - radius, y + bubbleHeight);
    ctx.lineTo(x + radius, y + bubbleHeight);
    ctx.quadraticCurveTo(x, y + bubbleHeight, x, y + bubbleHeight - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Text
    ctx.fillStyle = '#f68b1e'; // Telegram blue link
    ctx.font = `bold ${Math.round(size / 256 * 13)}px sans-serif`;
    ctx.fillText('flexatar.com', x + size / 256 * 12, y + size / 256 * 15);

    ctx.restore();
}


async function toBitmap(src) {
    if (typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap) return src;
    if (typeof HTMLImageElement !== 'undefined' && src instanceof HTMLImageElement) {
        if (!src.complete || src.naturalWidth === 0) {
            await src.decode?.();
        }
        return await createImageBitmap(src);
    }
    if (src instanceof Blob) {
        return await createImageBitmap(src);
    }
    // Canvas/OffscreenCanvas
    if (src && typeof src === 'object' && ('transferToImageBitmap' in src)) {
        return src.transferToImageBitmap();
    }
    // URL string
    if (typeof src === 'string') {
        const res = await fetch(src, { mode: 'cors' });
        const blob = await res.blob();
        return await createImageBitmap(blob);
    }
    throw new Error('Unsupported image source provided to generateTransparentCircleImage()');
}

// Draw like CSS background-size: cover
function drawImageCover(ctx, img, x, y, w, h) {
    const sw = img.width, sh = img.height;
    const scale = Math.max(w / sw, h / sh);
    const dw = sw * scale, dh = sh * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
}


async function generateTransparentCircleImage(image, size = 512, circleRadius = 190) {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');

    if (image) {
        const bmp = await toBitmap(image);

        // -- B) Draw the input image, cover-fit to the square canvas
        drawImageCover(ctx, bmp, 0, 0, size, size);
    }
    // 1. Draw background gradient (green to yellow)
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#ddddddff'); // soft green
    gradient.addColorStop(1, '#dfdfdfff'); // soft yellow
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, 0, size, size);
    ctx.globalAlpha = 1.0;
    // 2. Draw simple repeated shapes
    const grid = 10
    const cellSize = size / grid;
    const shapes = ['circle', 'heart', 'star'];

    for (let row = 0; row < grid; row++) {
        for (let col = 0; col < grid; col++) {
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const iconSize = cellSize * Math.random();

            // Random position within cell
            const x = col * cellSize + cellSize * (0.3 + Math.random() * 0.4);
            const y = row * cellSize + cellSize * (0.3 + Math.random() * 0.4);
            const rotation = Math.random() * Math.PI * 2;

            drawIcon(ctx, shape, x, y, iconSize, rotation);
        }
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    // 4. Add bottom-left bubble
    ctx.globalCompositeOperation = 'source-over';
    drawMessageBubble(ctx, size);

    // 5. Export as PNG DataURL
    const blob = await canvas.convertToBlob();
    return await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}


console.log(FtarView)
let renderer
let offscreen
let ftarManagerConnection
// let ftarManagerConnectionU
let flexatarSDK
async function initRender(url1, url2, size) {




    flexatarSDK = new FtarView.SDK(null,
        url1, url2
    )
    offscreen = new OffscreenCanvas(size.width, size.height);

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


   





    renderer.canvas.width = 320
    renderer.canvas.height = 320
    if (mediaPorts) mediaPorts.forEach(p => {
        p.postMessage({ canvasRatio: renderer.canvas.width / renderer.canvas.height })
    })

   

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
let roundOverlay = false
let portToSendFrames
let isLandmarkerFree = true
let currentRetargetingHeadMotionState
let currentCalibrationHeadMotionState

let framesToProcess = []
let isFrameProcessingActive = false

let noFrameCounter = 0


onmessage = (event) => {

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

                channel.port1.postMessage({ effectStateResponse: { effectIsAnimated, currentMode, effectParameter, currentEffectFtarId, currentEffectFtarIsMyx } })
            } else if (msg.isAnimated) {
                log("msg.isAnimated", msg.isAnimated)
                effectIsAnimated = msg.isAnimated.state
                if (effectIsAnimated) {
                    if (currentMode === 0) {
                        if (renderer) renderer.effect = FtarView.effect.no()
                    } else if (currentMode === 1) {
                        if (renderer) renderer.effect = FtarView.effect.morph()
                    } else if (currentMode === 2) {
                        if (renderer) renderer.effect = FtarView.effect.hybrid()
                    }
                } else {
                    if (currentMode !== 0) {
                        if (renderer) renderer.effect = () => { return { mode: currentMode, parameter: effectParameter } }
                    }
                }

            } else if (msg.effectParameter) {
                effectParameter = msg.effectParameter
                if (currentMode !== 0 && !effectIsAnimated) {
                    if (renderer) renderer.effect = () => { return { mode: currentMode, parameter: effectParameter } }
                }
            } else if (msg.hybridEffect) {
                currentMode = 2
                if (effectIsAnimated) {
                    if (renderer) renderer.effect = FtarView.effect.hybrid()

                } else {
                    if (renderer) renderer.effect = () => { return { mode: currentMode, parameter: effectParameter } }

                }

            } else if (msg.morphEffect) {
                currentMode = 1
                if (effectIsAnimated) {
                    if (renderer) renderer.effect = FtarView.effect.morph()

                } else {
                    if (renderer) renderer.effect = () => { return { mode: currentMode, parameter: effectParameter } }

                }
            } else if (msg.noEffect) {
                currentMode = 0
                if (renderer) renderer.effect = () => { return { mode: currentMode, parameter: 0 } }

            } else if (msg.slot2) {
                currentEffectFtarId = msg.id
                currentEffectFtarIsMyx = msg.userId
                const data = new Uint8Array(msg.slot2)
                rendererPromise.then(() => {
                    renderer.slot2 = { data, ready: Promise.resolve(true), id: msg.id, name: "noname" }
                })

                // renderer.effect = () => { return { mode: 2, parameter: effectParameter } }


            } else if (msg.background) {
                if (msg.no) {
                    rendererPromise.then(() => {
                        renderer.addOverlay(null, { x: 0, y: 0, width: 100, height: 100, mode: "back" });
                    })
                    return
                }
                rendererPromise.then(() => {
                    flexatarSDK.newOverlay(msg.background).then(overlay => {

                        renderer.addOverlay(overlay, { x: 0, y: 0, width: 100, height: 100, mode: "back" });

                    })
                    generateTransparentCircleImage(msg.background).then(roundOverlay => {
                        flexatarSDK.newOverlay(roundOverlay).then(overlay => {
                            renderer.addOverlay(overlay, { x: 0, y: 0, width: 100, height: 100, mode: "front" });
                        })
                    })
                })
                // console.log("overlay accepted")
            } else if (msg.animationNames) {
                rendererPromise.then(() => {
                    // log("msg.animationNames worker received request", renderer.animator.patternList,msg.msgId)
                    channel.port1.postMessage({ animationNames: renderer.animator.patternList,msgId:msg.msgId })
                })
            } else if (msg.animation) {
                if (renderer.error) return
                log("animation is set",msg.animation)
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
            // renderer.start()
            // if (mediaPorts) mediaPorts.forEach(p => {
            log("sending to mediaport canvas ratio")
            msg.mediaPort.postMessage({ canvasRatio: renderer.canvas.width / renderer.canvas.height })

            // })
        })
        msg.mediaPort.onmessage = e => {
            const msg1 = e.data
            if (!msg1) return
            if (msg1.audioBuffer) {
                if (!processAudio) return
                // return
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
            } else if (msg1.setHeadMotionState) {
                // log("setHeadMotionState",msg1.setHeadMotionState)
                renderer.headMotion(...msg1.setHeadMotionState)
                renderer.isAnimated = false
            } else if (msg1.setSize) {
                renderer.canvas.width = msg1.setSize.width
                renderer.canvas.height = msg1.setSize.height
                if (ftarManagerConnection) {
                    ftarManagerConnection.setViewportSize(msg1.setSize)
                }

                msg.mediaPort.postMessage({ canvasRatio: renderer.canvas.width / renderer.canvas.height })

            } else if (msg1.setLipState) {
                if (renderer) renderer.speechState = msg1.setLipState
            } else if (msg1.getLipState) {
                // log("received audio buffer",msg1.getLipState)
                processAudio(msg1.getLipState, (anim) => {
                    msg.mediaPort.postMessage({ lipState: anim })
                })

            } else if (msg1.closeMouth) {
                renderer.speechState = [0, 0, 0.1, 0, 0]
            } else if (msg1.closing) {
                if (msg.mediaPort === portToSendFrames) portToSendFrames = null

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
            } else if (msg1.setVoiceProcessingParameters) {
                if (setVoiceProcessingParameters) {
                    setVoiceProcessingParameters(msg1.setVoiceProcessingParameters)
                }


            }
        }

        // msg.mediaPort.postMessage({ready:true})

        // ports.push(msg.mediaPort)
    } else if (msg.changeSize) {
        renderer.canvas.width = msg.changeSize.width
        renderer.canvas.height = msg.changeSize.height
        if (mediaPorts) {
            mediaPorts.forEach(p => {
                p.postMessage({ canvasRatio: renderer.canvas.width / renderer.canvas.height })
            })
        }


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
        const { sendMessage, checkGLContextLost, setProcessingParameters } = FtarLipSync.init("", opts)
        processAudio = sendMessage
        setVoiceProcessingParameters = setProcessingParameters
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
                    // ftarManagerConnectionU.close()
                }
            }
            postMessage({ isContextLost: { value: isContextLost } })
        }

    } else if (msg.roundOverlay) {
        if (msg.roundOverlay.active) {
            rendererPromise.then(() => {
                generateTransparentCircleImage().then(roundOverlay => {
                    flexatarSDK.newOverlay(roundOverlay).then(overlay => {
                        renderer.addOverlay(overlay, { x: 0, y: 0, width: 100, height: 100, mode: "front" });
                    })
                })
            })


        } else {
            rendererPromise.then(() => {
                renderer.addOverlay(null, { x: 0, y: 0, width: 100, height: 100, mode: "front" });
            })
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
