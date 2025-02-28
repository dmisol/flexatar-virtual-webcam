
import {microphoneAudioProvider} from "./microphoneAudioProvider.js"
import {audioRecorder} from "./audioRecorder.js"


    

export function micRecorder(tickCallback, recordHasBeenStopped, audioReadyCallback, microphoneErrorCallback, recordErrorCallback,audioFormat) {
  let recordingInterval;
  let recorder;
  let startTime;
  let totalDuration = 0;

  const { getAudioStream, disableMicrophone } = microphoneAudioProvider();

  const { startRecord, stopRecord } = audioRecorder(
    () => {
      clearInterval(recordingInterval);
      recordHasBeenStopped();
    },
    (chunks) => {
      const blob = new Blob(chunks, { type: audioFormat });
      audioReadyCallback(blob, totalDuration);
    },
    (error) => {
      clearInterval(recordingInterval);
      recordErrorCallback(error);
      recordHasBeenStopped();
    },
    audioFormat
  );

  async function startRecording() {
    try {
      totalDuration = 0;
      const result = await getAudioStream();
      
      if (result.error) {
        microphoneErrorCallback(result.error);
        recordHasBeenStopped();
        return;
      }

      const { stream } = result;
      startRecord(stream);
      startTime = Date.now();
      recordingInterval = setInterval(() => {
        totalDuration = Math.floor((Date.now() - startTime) / 1000);
        tickCallback(totalDuration);
      }, 1000);
    } catch (error) {
      microphoneErrorCallback(error.toString());
      recordHasBeenStopped();
    }
  }

  function stopRecording() {
    clearInterval(recordingInterval);
    stopRecord();
    disableMicrophone();
  }

  return {
    startRecording,
    stopRecording
  };
}

    

