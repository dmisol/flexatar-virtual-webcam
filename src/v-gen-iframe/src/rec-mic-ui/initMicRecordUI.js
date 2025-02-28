import {recordAudioUI} from "./recordAudioUI.js"

export const initMicRecordUI = async (inputs) => {
    

const {durationElementId, buttonId, playSymbolId, stopSymbolId, callback, classNameToMAkeInvisible} = inputs;

const durationElement = document.getElementById(durationElementId);
const buttonElement = document.getElementById(buttonId);
const playSymbol = document.getElementById(playSymbolId);
const stopSymbol = document.getElementById(stopSymbolId);

const enableStartState = () => {
  buttonElement.textContent = 'Start Recording';
  playSymbol.classList.remove(classNameToMAkeInvisible);
  stopSymbol.classList.add(classNameToMAkeInvisible);
};

const enableStopState = () => {
  buttonElement.textContent = 'Stop Recording';
  playSymbol.classList.add(classNameToMAkeInvisible);
  stopSymbol.classList.remove(classNameToMAkeInvisible);
};

const errorHandler = (error) => {
  console.error('Error occurred during recording:', error);
};

await recordAudioUI({
  htmlElement: durationElement,
  buttonElement: buttonElement,
  enableStartState,
  enableStopState,
  callback,
  errorHandler
});

return {};

    
}
