


    

export function audioRecorder(onRecordStopped, onRecordedAudioReady, onRecordError,audioFormat) {
  let mediaRecorder;
  const chunks = [];

  return {
    startRecord: (stream) => {
      try {
        if (!mediaRecorder) {
          mediaRecorder = new MediaRecorder(stream,{mimeType: audioFormat});

          mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            onRecordedAudioReady(chunks);
            onRecordStopped();
            mediaRecorder = null;
            chunks.length = 0; // Clear the array
          };

          mediaRecorder.onerror = (error) => {
            const errorMessage = `Recording error: ${error.name} - ${error.message}`;
            onRecordError(errorMessage);
            onRecordStopped();
            mediaRecorder = null;
            chunks.length = 0; // Clear the array
          };
        }

        if (mediaRecorder.state === 'inactive') {
          mediaRecorder.start();
        }
      } catch (error) {
        const errorMessage = `Failed to start recording: ${error.message}`;
        onRecordError(errorMessage);
        onRecordStopped();
      }
    },

    stopRecord: () => {
      try {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      } catch (error) {
        const errorMessage = `Failed to stop recording: ${error.message}`;
        onRecordError(errorMessage);
        onRecordStopped();
      }
    }
  };
}

    

