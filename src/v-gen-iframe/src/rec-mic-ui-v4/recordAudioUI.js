
import {micRecorder} from "./micRecorder.js"
import {formatDuration} from "./formatDuration.js"


    
export function recordAudioUI(buttonId, durationElementId, setStartRecordButtonState, setStopRecordButtonState, audioReadyCallback, microphoneErrorCallback, tooFastClickingErrorCallback, recorderErrorCallback, maxRecordingDuration = Infinity,audioFormat) {
  let recording = false;
  let recorder;
  let duration = 0;
  let timer;
  const durationElement = document.getElementById(durationElementId)
  try {
    recorder = micRecorder(
      (seconds) => {
        duration = seconds;
        durationElement.textContent = formatDuration(duration);
      },
      () => {
        recording = false;
        setStopRecordButtonState();
        clearTimeout(timer);
      },
      (audioBlob, totalDuration) => {
        if (totalDuration < 3) {
          tooFastClickingErrorCallback(new Error("Too fast clicking"));
        } else {
          const objectURL = URL.createObjectURL(audioBlob);
          audioReadyCallback(totalDuration, objectURL);
        }
      },
      (error) => {
        microphoneErrorCallback(new Error(error));
      },
      (error) => {
        recorderErrorCallback(new Error(error));
      },
      audioFormat
    );

    document.getElementById(buttonId).addEventListener("click", () => {
      if (recording) {
        recorder.stopRecording();
      } else {
        // totalDuration = 0
        durationElement.textContent = formatDuration(0);
        setStartRecordButtonState();
        recording = true;
        
        timer = setTimeout(() => {
          recorder.stopRecording();
        }, maxRecordingDuration * 1000);
        recorder.startRecording();
      }
    });

    return null;
  } catch (error) {
    return error;
  }
}
    

