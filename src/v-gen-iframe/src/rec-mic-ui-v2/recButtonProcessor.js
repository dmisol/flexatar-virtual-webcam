
import {toggleRecordButtonIcon} from "./toggleRecordButtonIcon.js"

const self = {name:"recButtonProcessor"}
export const recButtonProcessor = async (inputs) => {
    
let {buttonElement, recordIconElement, stopIconElement, maxRecordingDuration, recordStartPressed, recordStopPressed, invisibleClassName} = inputs;
let recordingStarted = false;
let timeoutId = null;

if (typeof recordStartPressed !== 'function' || typeof recordStopPressed !== 'function') {
  return {errorOccurred: 'Callback functions must be valid'};
}

if (maxRecordingDuration !== null && (typeof maxRecordingDuration !== 'number' || maxRecordingDuration <= 0)) {
  return {errorOccurred: 'maxRecordingDuration must be a positive number or null'};
}

buttonElement.addEventListener('click', async () => {
  if (recordingStarted) {
    await recordStopPressed();
    recordingStarted = false;
    clearTimeout(timeoutId);
    timeoutId = null;
    let {makeRecordVisible, makeStopVisible, makeRecordInvisible, makeStopInvisible} = await toggleRecordButtonIcon({recordIconElement, stopIconElement, invisibleClassName});
    await makeStopInvisible();
    await makeRecordVisible();
  } else {
    await recordStartPressed();
    recordingStarted = true;
    let {makeRecordVisible, makeStopVisible, makeRecordInvisible, makeStopInvisible} = await toggleRecordButtonIcon({recordIconElement, stopIconElement, invisibleClassName});
    await makeRecordInvisible();
    await makeStopVisible();
    if (maxRecordingDuration !== null) {
      timeoutId = setTimeout(async () => {
        await recordStopPressed();
        recordingStarted = false;
        clearTimeout(timeoutId);
        timeoutId = null;
        let {makeRecordVisible, makeStopVisible, makeRecordInvisible, makeStopInvisible} = await toggleRecordButtonIcon({recordIconElement, stopIconElement, invisibleClassName});
        await makeStopInvisible();
        await makeRecordVisible();
      }, maxRecordingDuration * 1000);
    }
  }
});

return {errorOccurred: null};
    
}
