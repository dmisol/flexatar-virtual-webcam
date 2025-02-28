


    
export async function audioRecorder(mediaStream, errorCallback) {
  try {
    const mediaRecorder = new MediaRecorder(mediaStream);
    const chunks = [];

    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    mediaRecorder.onerror = (error) => {
      errorCallback(error);
    };

    mediaRecorder.start();

    return new Promise((resolve) => {
      resolve(() => {
        mediaRecorder.stop();
        return chunks;
      });
    });
  } catch (error) {
    errorCallback(error);
    return new Promise((resolve) => {
      resolve(() => {
        return [];
      });
    });
  }
}
    

