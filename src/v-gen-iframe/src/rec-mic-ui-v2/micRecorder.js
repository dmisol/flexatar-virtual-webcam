
import {microphoneManager} from "./microphoneManager.js"
import {audioRecorder} from "./audioRecorder.js"
import {timer} from "./timer.js"

const self = {name:"micRecorder"}
export const micRecorder = async (inputs) => {
    
let {audioDurationCallback, permissionErrorCallback, otherErrorCallback, audioReadyCallback} = inputs;

let microphoneManagerPromise = microphoneManager({});
let {mediaStream, stopMicrophone, permissionError, otherError} = await microphoneManagerPromise;

let errorHandlingCallback = async ({errorMessage}) => {
  await otherErrorCallback({error: errorMessage});
};

let audioRecorderPromise = audioRecorder({mediaStream, errorHandlingCallback, audioReadyCallback});
let {error, stopRecordingFunction} = await audioRecorderPromise;

let timerPromise = timer(async ({duration}) => {
  await audioDurationCallback({currentDuration: duration});
});
let {stopTimer} = await timerPromise;

mediaStream.getAudioTracks()[0].onended = async () => {
  let {totalDuration} = await stopTimer();
  let audioObjectUrl = await audioReadyCallback({totalDuration});
  await audioReadyCallback({audioObjectUrl, totalDuration});
  await stopMicrophone();
  await stopRecordingFunction();
};

permissionError.then(async (error) => {
  await permissionErrorCallback({error});
});

otherError.then(async (error) => {
  await otherErrorCallback({error});
});

let stopRecord = async () => {
  await stopMicrophone();
  await stopRecordingFunction();
  await stopTimer();
};

return {stopRecord};
    
}
