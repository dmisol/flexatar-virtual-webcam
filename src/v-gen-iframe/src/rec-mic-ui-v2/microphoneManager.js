

const self = {name:"microphoneManager"}
export const microphoneManager = async (inputs) => {
    

let {} = inputs;

let mediaStream = null;
let stopMicrophone = async () => {};
let permissionError = false;
let otherError = '';

try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream = stream;

    stopMicrophone = async () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
    };
} catch (error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        permissionError = true;
    } else {
        otherError = error.message;
    }
}

return { mediaStream, stopMicrophone, permissionError, otherError };

    
}
