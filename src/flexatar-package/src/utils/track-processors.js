import {enhanceMnasal} from "./audio-proc.js"

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

export class NativeTrackProcessor {
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
                const resampledBuffer = await enhanceMnasal(await resample(buffer, 16000, audioData.sampleRate));

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

export class MediaRecorderBasedTrackProcessor {
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
                const decoded = await enhanceMnasal(await offlineCtx.decodeAudioData(arrayBuffer));
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