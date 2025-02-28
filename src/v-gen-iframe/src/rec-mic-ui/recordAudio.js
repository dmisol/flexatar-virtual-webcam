import {prepareDurationString} from "./prepareDurationString.js"

export const recordAudio = async (inputs) => {
    

const {audioSource, htmlElement} = inputs;
const mediaRecorder = new MediaRecorder(audioSource);
const recordedBlobs = [];
let recordingStartTime;
let intervalId;

mediaRecorder.ondataavailable = (event) => {
    recordedBlobs.push(event.data);
};

mediaRecorder.start();

recordingStartTime = new Date().getTime();

intervalId = setInterval(async () => {
    const currentTime = new Date().getTime();
    const duration = (currentTime - recordingStartTime) / 1000;
    const {time_string} = await prepareDurationString({seconds: duration});
    htmlElement.textContent = time_string;
}, 1000);

const handlerFunction = async () => {
    clearInterval(intervalId);
    mediaRecorder.stop();
    const audioBlob = new Blob(recordedBlobs, {type: 'audio/wav'});
    const objectUrl = URL.createObjectURL(audioBlob);
    return {objectUrl, errorMessage: null};
};

return {handlerFunction};

    
}
