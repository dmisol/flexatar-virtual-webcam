


    
export async function microphoneAudioProvider(otherErrorCallback) {
    try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return {
            audioStream,
            permissionError: false,
            disableMicrophone: () => {
                audioStream.getTracks().forEach(track => track.stop());
            }
        };
    } catch (error) {
        if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
            return {
                audioStream: null,
                permissionError: true,
                disableMicrophone: () => {}
            };
        } else {
            otherErrorCallback(error);
            return {
                audioStream: null,
                permissionError: false,
                disableMicrophone: () => {}
            };
        }
    }
}
    

