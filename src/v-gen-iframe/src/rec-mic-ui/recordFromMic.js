import {recordAudio} from "./recordAudio.js"
import {handleMicrophone} from "./handleMicrophone.js"

export const recordFromMic = async (inputs) => {
    

const {htmlElement} = inputs;
const {audioSource, stopFunction, permissionError} = await handleMicrophone({});
if (permissionError) {
    return {handlerFunction: async () => ({objectUrl: null, errorMessage: permissionError})};
}
const {handlerFunction} = await recordAudio({audioSource, htmlElement});
return {handlerFunction: async () => {
    const {objectUrl, errorMessage} = await handlerFunction();
    await stopFunction();
    return {objectUrl, errorMessage};
}};

    
}
