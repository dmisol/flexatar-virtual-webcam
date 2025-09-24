export function audioBufferToFloat32ArrayBuffer(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0); // mono
    const float32Array = new Float32Array(channelData.length);
    float32Array.set(channelData);
    return float32Array.buffer;
}


export function splitArrayBufferToChunks(arrayBuffer, chunkSize = 800) {
    const floatArray = new Float32Array(arrayBuffer);
    const chunks = [];
    for (let i = 0; i < floatArray.length; i += chunkSize) {
        const chunk = floatArray.subarray(i, i + chunkSize);
        chunks.push(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength));
    }
    return chunks;
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

/**
 * Takes an audio file URL and returns a Promise that resolves with a
 * MediaStream containing that audio.
 *
 * @param {string} url  The URL of the audio file (can be remote or local)
 * @returns {Promise<MediaStream>}
 */

export async function getAudioStreamFromUrl(url, {silent = true} = {}) {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.src = url;
    audio.preload = "auto";

    // Wait until metadata is loaded
    await new Promise((resolve, reject) => {
        const onLoaded = () => {
            audio.removeEventListener("loadedmetadata", onLoaded);
            resolve();
        };
        audio.addEventListener("loadedmetadata", onLoaded);
        setTimeout(() => reject(new Error(`Could not load audio from ${url}`)), 10000);
    });

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const destination = ctx.createMediaStreamDestination();

    // Connect only to destination if silent, or also to speakers if not
    source.connect(destination);
    if (!silent) {
        source.connect(ctx.destination);
    }

    await audio.play();

    const stream = destination.stream;

    // Stop all tracks when audio ends or is paused
    const stopTracks = () => {
        stream.getTracks().forEach(track => track.stop());
    };
    audio.addEventListener("ended", stopTracks);
    audio.addEventListener("pause", stopTracks);

    return stream;
}

