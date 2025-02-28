
import {microphoneAudioProvider} from "./microphoneAudioProvider.js"
import {audioRecorder} from "./audioRecorder.js"


    
export async function micRecorder(tickCallback, recordHasBeenStopped, maxRecordDuration) {
  try {
    const { audioStream, permissionError, disableMicrophone } = await microphoneAudioProvider((error) => {
      recordHasBeenStopped(error);
    });

    if (permissionError) {
        recordHasBeenStopped();
      return { stopRecording: () => {}, micPermissionError: true };
    }

    let recordingStopped = false;
    let recordDuration = 0;

    const stopRecordingPromise = await audioRecorder(audioStream, (error) => {
      recordHasBeenStopped(error);
    });

    const stopRecording = async () => {
      if (recordingStopped) {
        return { audioData: new Blob(), totalDuration: recordDuration };
      }

      recordingStopped = true;
      disableMicrophone();
      const audioChunks = await stopRecordingPromise();
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      return { audioData: audioBlob, totalDuration: recordDuration };
    };

    const intervalId = setInterval(() => {
      if (recordingStopped) {
        clearInterval(intervalId);
        return;
      }

      recordDuration++;
      tickCallback(recordDuration);

      if (recordDuration >= maxRecordDuration) {
        stopRecording();
        clearInterval(intervalId);
      }
    }, 1000);

    return { stopRecording, micPermissionError: false };
  } catch (error) {
    return { stopRecording: () => {}, micPermissionError: true };
  }
}
    

