
import {micRecorder} from "./micRecorder.js"
import {timeStringProvider} from "./timeStringProvider.js"
import {recButtonProcessor} from "./recButtonProcessor.js"

const self = {name:"initRecorderUI"}
export const initRecorderUI = async (inputs) => {
    

let {buttonId, recordIconId, stopIconId, durationElementId, invisibleClassName, audioReadyCallback, microphoneErrorCallback, tooFastClickingErrorCallback, unknownErrorCallback, maxRecordingDuration} = inputs;

let buttonElement = document.getElementById(buttonId);
let recordIconElement = document.getElementById(recordIconId);
let stopIconElement = document.getElementById(stopIconId);
let durationElement = document.getElementById(durationElementId);

let currentDuration = 0;
let recordingInterval;
let stopRecord;
let initFailError = null;

try {
    let {errorOccurred} = await recButtonProcessor({
        buttonElement,
        recordIconElement,
        stopIconElement,
        maxRecordingDuration,
        recordStartPressed: async () => {
            try {
                let {stopRecord: stopRecording} = await micRecorder({
                    audioDurationCallback: async ({currentDuration}) => {
                        let {timeString} = await timeStringProvider({seconds: currentDuration});
                        durationElement.textContent = timeString;
                    },
                    permissionErrorCallback: async ({error}) => {
                        await microphoneErrorCallback({error: error.message});
                    },
                    otherErrorCallback: async ({error}) => {
                        await unknownErrorCallback({error: error.message});
                    },
                    audioReadyCallback: async ({audioObjectUrl, totalDuration}) => {
                        if (totalDuration < 3) {
                            await tooFastClickingErrorCallback({error: "Recording is too short."});
                        } else {
                            await audioReadyCallback({duration: totalDuration, objectUrl: audioObjectUrl});
                        }
                    }
                });

                stopRecord = stopRecording;
                recordingInterval = setInterval(() => {
                    currentDuration++;
                    if (currentDuration >= maxRecordingDuration) {
                        clearInterval(recordingInterval);
                        stopRecord();
                    }
                }, 1000);
            } catch (e) {
                await unknownErrorCallback({error: e.message});
            }
        },
        recordStopPressed: async () => {
            clearInterval(recordingInterval);
            await stopRecord();
        },
        invisibleClassName
    });

    if (errorOccurred) {
        initFailError = errorOccurred;
    }
} catch (e) {
    initFailError = "Initialization failed.";
}

return {initFailError};

    
}
