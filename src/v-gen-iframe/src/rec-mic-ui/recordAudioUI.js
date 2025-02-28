import {recordFromMic} from "./recordFromMic.js"

export const recordAudioUI = async (inputs) => {
    

const {htmlElement, buttonElement, enableStartState, enableStopState, callback, errorHandler} = inputs;

let recording = false;
let lastButtonClickTime = 0;
let timeDifferenceThreshold = 3000; // 3 seconds
let handlerFunction = null;

buttonElement.addEventListener('click', async () => {
  const currentTime = new Date().getTime();
  if (recording && currentTime - lastButtonClickTime < timeDifferenceThreshold) {
    if (handlerFunction) {
      const {objectUrl, errorMessage} = await handlerFunction();
      if (errorMessage) {
        errorHandler(errorMessage);
      } else {
        // quick successive clicks, stop record and do not call any callback
        return;
      }
    }
  }
  lastButtonClickTime = currentTime;
  if (recording) {
    if (handlerFunction) {
      const {objectUrl, errorMessage} = await handlerFunction();
      if (errorMessage) {
        errorHandler(errorMessage);
      } else {
        callback(objectUrl);
      }
    }
    recording = false;
    enableStopState();
  } else {
    try {
      const {handlerFunction: newHandlerFunction} = await recordFromMic({htmlElement});
      handlerFunction = newHandlerFunction;
      recording = true;
      enableStartState();
    } catch (error) {
      errorHandler(error);
    }
  }
});

return {};

    
}
