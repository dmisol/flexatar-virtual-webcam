


    
export async function recordButtonLogic(buttonElement, recordIconElement, stopIconElement, invisibilityClassName, startRecordCallback, stopRecordCallback) {
    let isRecording = false;
    
    buttonElement.addEventListener('click', async () => {
        if (!isRecording) {
            startRecordCallback();
            recordIconElement.classList.add(invisibilityClassName);
            stopIconElement.classList.remove(invisibilityClassName);
            isRecording = true;
        } else {
            stopRecordCallback();
            recordIconElement.classList.remove(invisibilityClassName);
            stopIconElement.classList.add(invisibilityClassName);
            isRecording = false;
        }
    });
}
    

