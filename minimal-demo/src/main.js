import "./style.css";
// import { FtarRenderer } from "./easy-renderer.js";
import { FtarRenderer } from "flexatar-easy-renderer";

const canvas = document.getElementById("flexatarCanvas");
const statusElement = document.getElementById("status");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

const engineFilesUrl = `${window.location.origin}/files`;
const renderer = new FtarRenderer(engineFilesUrl, canvas);

let microphoneStream;
let playbackStream;
let playbackAudio;

function setStatus(message) {
  statusElement.textContent = message;
}

function stopPlayback() {
  if (playbackAudio) {
    playbackAudio.pause();
    playbackAudio.srcObject = null;
    playbackAudio.remove();
    playbackAudio = null;
  }

  if (playbackStream) {
    playbackStream.getTracks().forEach((track) => track.stop());
    playbackStream = null;
  }
}

function stopMicrophone() {
  if (microphoneStream) {
    microphoneStream.getTracks().forEach((track) => track.stop());
    microphoneStream = null;
  }
}

renderer.readyPromise.then(() => {
  renderer.size = { width: 320, height: 320 };
  renderer.slot1 = `${engineFilesUrl}/default_ftar.p`;
  renderer.background = `${engineFilesUrl}/backgrounds/1.jpg`;

  startButton.disabled = false;
  setStatus("Renderer ready. Lip sync will be visible with about 450 ms delay.");
});

startButton.addEventListener("click", async () => {
  try {
    stopPlayback();
    stopMicrophone();

    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    playbackStream = renderer.connectMediaStream(microphoneStream);

    playbackAudio = new Audio();
    playbackAudio.autoplay = true;
    playbackAudio.srcObject = playbackStream;
    playbackAudio.style.display = "none";
    document.body.append(playbackAudio);

    startButton.disabled = true;
    stopButton.disabled = false;
    setStatus("Microphone connected. Lip sync is running with about 450 ms delay.");
  } catch (error) {
    console.error(error);
    setStatus(`Microphone error: ${error.message}`);
  }
});

stopButton.addEventListener("click", () => {
  stopPlayback();
  stopMicrophone();
  startButton.disabled = false;
  stopButton.disabled = true;
  setStatus("Stopped.");
});
