


    

export async function recordButtonStateToggler(buttonElement, recordIconElement, stopIconElement, invisibleClassName) {
  try {
    const startRecording = () => {

      recordIconElement.classList.remove(invisibleClassName);
      stopIconElement.classList.add(invisibleClassName);
    };

    const stopRecording = () => {

      recordIconElement.classList.add(invisibleClassName);
      stopIconElement.classList.remove(invisibleClassName);
    };

    return { startRecording, stopRecording };
  } catch (error) {
    return { 
      startRecording: () => {}, 
      stopRecording: () => {} 
    };
  }
}

    

