

const self = {name:"audioRecorder"}
export const audioRecorder = async (inputs) => {
    

let { mediaStream, errorHandlingCallback, audioReadyCallback } = inputs;

if (!mediaStream || !(mediaStream instanceof MediaStream)) {
    await errorHandlingCallback({ errorMessage: "Invalid media stream provided." });
    return { error: "Invalid media stream provided.", stopRecordingFunction: null };
}

let recorder;
let chunks = [];
let error = null;

recorder = new MediaRecorder(mediaStream);

recorder.ondataavailable = async (event) => {
    if (event.data.size > 0) {
        chunks.push(event.data);
    }
};

recorder.onstop = async () => {
    const audioBlob = new Blob(chunks, { type: 'audio/wav' });
    const audioObjectUrl = URL.createObjectURL(audioBlob);
    await audioReadyCallback({ audioObjectUrl });
    chunks = [];
};

recorder.onerror = async (event) => {
    error = `Recording error: ${event.name}`;
    await errorHandlingCallback({ errorMessage: error });
};

let stopRecordingFunction = async () => {
    if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
    }
};

try {
    recorder.start();
} catch (e) {
    error = `Failed to start recording: ${e.message}`;
    await errorHandlingCallback({ errorMessage: error });
}

return { error, stopRecordingFunction };

    
}
