
export const handleMicrophone = async (inputs) => {
    
const {} = inputs;

try {
    const audioSource = await navigator.mediaDevices.getUserMedia({ audio: true });
    const stopFunction = () => {
        audioSource.getTracks().forEach(track => track.stop());
        return { status: 'success' };
    };
    return { audioSource, stopFunction, permissionError: null };
} catch (error) {
    return { audioSource: null, stopFunction: null, permissionError: error.message };
}
    
}
