function log() {
    console.log("[TRACK_PROCESSOR]", ...arguments)
}

export async function resample(float32Array, targetSampleRate, inputSampleRate, numChannels = 1) {
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

export async function enhanceMnasal(audioBuffer) {
    const offlineCtx = new OfflineAudioContext(
        1,
        audioBuffer.length,
        audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    // Create notch filter for a specific frequency
    const makeNotch = (freq) => {
        const notch = offlineCtx.createBiquadFilter();
        notch.type = "notch";
        notch.frequency.value = freq;
        notch.Q.value = 30; // narrow bandwidth for precise cut
        return notch;
    };

    // Hum suppression: 50 Hz and harmonics
    const humFilters = [
        makeNotch(50),
        makeNotch(100),
        makeNotch(150),
        makeNotch(200),
        makeNotch(250),
        makeNotch(300),
        makeNotch(350),
        makeNotch(400),
        makeNotch(450),
        makeNotch(500)
    ];

    // Focused boost for M (nasal low-mid)
    const mBoost = offlineCtx.createBiquadFilter();
    mBoost.type = "peaking";
    mBoost.frequency.value = 250;
    mBoost.gain.value = 6;
    mBoost.Q.value = 4;

    // Mild cut above to avoid muddiness
    const mudCut = offlineCtx.createBiquadFilter();
    mudCut.type = "peaking";
    mudCut.frequency.value = 600;
    mudCut.gain.value = -2;
    mudCut.Q.value = 1.5;

    // Presence boost
    const presenceBoost = offlineCtx.createBiquadFilter();
    presenceBoost.type = "peaking";
    presenceBoost.frequency.value = 3000;
    presenceBoost.gain.value = 2;
    presenceBoost.Q.value = 1;

    // Connect chain: hum removal → M boost → clarity shaping
    let node = source;
    for (const f of humFilters) {
        node.connect(f);
        node = f;
    }
    node.connect(mBoost)
        .connect(mudCut)
        .connect(presenceBoost)
        .connect(offlineCtx.destination);

    source.start();

    return await offlineCtx.startRendering();
}

export function processAudioTrack1(track, onData, onStart, onStop) {

    // const media_processor = new MediaStreamTrackProcessor(track);
    // console.log(media_processor)
    let reader

    let needStop = false
    return {
        stop: () => {
            if (!reader) return
            console.log("stop aduio proc")
            if (reader) reader.cancel();
            if (reader) reader.releaseLock();
            reader = null;
            needStop = true
            onStop()
        },
        start: async () => {
            if (reader) return
            onStart()
            console.log(track)
            const media_processor = new MediaStreamTrackProcessor(track);
            reader = media_processor.readable.getReader();
            needStop = false
            while (true) {
                if (!reader) break
                const result = await reader.read();
                if (result.done || needStop) break;

                const audioData = result.value
                const frameCount = audioData.numberOfFrames;
                const buffer = new Float32Array(frameCount);
                audioData.copyTo(buffer, { planeIndex: 0 });
                let resampledBuffer = await resample(buffer, 16000, audioData.sampleRate);
                resampledBuffer = enhanceMnasal(resampledBuffer)

                const anotherArray = new Float32Array(resampledBuffer.length);
                resampledBuffer.copyFromChannel(anotherArray, 0, 0);
                onData(anotherArray)

            }
        }
    }
}

export async function processAudioTrack(track, onStop, onData) {
    try {
        const media_processor = new MediaStreamTrackProcessor(track);
        const reader = media_processor.readable.getReader();

        while (true) {

            const result = await reader.read();
            if (result.done) {
                onStop()
                break;
            }
            onData(result.value)
            // console.log("reading track",track.id)

        }
    } catch {
        onStop()
    }

}

let audioQueue = []
let isAudioProcessing = false
export function processingAudioQueue(audioTrack, onData) {
    if (isAudioProcessing) {
        audioQueue.push(audioTrack)
    } else {
        isAudioProcessing = true
        function process(track) {
            processAudioTrack(track, () => {
                if (audioQueue.length !== 0) {
                    process(audioQueue.pop())
                } else {
                    isAudioProcessing = false
                }
            }, data => {
                onData(data)
            })
        }
        process(audioTrack)

    }

}

let audioContext


export function getAudioContext() {

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    return audioContext
}


const AUIDO_DELAY = 0.45;
export function delayAudio(inAudioTRack) {
    // if (!audioContext) {
    //   audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // }
    const originalTrack = inAudioTRack

    const originalStream = new MediaStream([inAudioTRack])
    const delayNode = getAudioContext().createDelay(1);
    delayNode.delayTime.value = AUIDO_DELAY;
    const micSrc = getAudioContext().createMediaStreamSource(originalStream);
    micSrc.connect(delayNode);
    const flxAudioStreamSource = getAudioContext().createMediaStreamDestination();
    delayNode.connect(flxAudioStreamSource);
    const flxAudioStreamDelayed = flxAudioStreamSource.stream;
    // var trackId;
    const delayedTrack = flxAudioStreamDelayed.getAudioTracks()[0]
    // delayNodeDict[inAudioTRack.id] = delayNode
    // const delayedTrack = originalTrack.clone()
    function stop() {
        log("STOP DELAYED")
        originalTrack.noPatch = true
        originalTrack.stop()

        micSrc.disconnect()
        delayNode.disconnect()

    }
    delayedTrack.isFlexatarOwnership = true;
    // console.log(flxAudioStreamDelayed);
    return { track: delayedTrack, stopTrack: stop };
}