
import {micRecorder} from "./micRecorder.js"
import {formatDuration} from "./formatDuration.js"


    

export async function recordAudioUI(buttonId, durationElementId, setStartRecordButtonState, setStopRecordButtonState, audioReadyCallback, microphoneErrorCallback, tooFastClickingErrorCallback, unknownErrorCallback, maxRecordingDuration = Infinity) {
    try {
        const button = document.getElementById(buttonId);
        const durationElement = document.getElementById(durationElementId);
        let recording = false;
        let stopRecording;

        const toggleRecording = async () => {
            if (recording) {
                const result = stopRecording();
                const { audioData, totalDuration } = await result;
                const objectURL = URL.createObjectURL(audioData);
                if (totalDuration < 3) {
                    tooFastClickingErrorCallback(new Error('Recording duration too short.'));
                } else {
                    audioReadyCallback(totalDuration, objectURL);
                }
                setStartRecordButtonState();
                recording = false;
            } else {
                setStopRecordButtonState();
                const recorder = await micRecorder(tickCallback, recordHasBeenStopped, maxRecordingDuration);
                stopRecording = recorder.stopRecording;
                if (recorder.micPermissionError) {
                    microphoneErrorCallback(new Error('Microphone permission denied.'));
                    setStartRecordButtonState();
                    return;
                }
                recording = true;
            }
        };

        const tickCallback = (recordDuration) => {
            durationElement.textContent = formatDuration(recordDuration);
        };

        const recordHasBeenStopped = (error) => {
            if (error) {
                unknownErrorCallback(error);
            }
            setStartRecordButtonState();
            recording = false;
        };

        button.addEventListener('click', toggleRecording);
    } catch (error) {
        unknownErrorCallback(error);
    }
}

    

