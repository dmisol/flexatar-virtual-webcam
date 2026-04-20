import "./style.css";
import { FtarRenderer } from "flexatar-easy-renderer";
import { InworldAgentSession } from "./lib/inworld-agent-session.js";

const canvas = document.getElementById("flexatarCanvas");
const statusElement = document.getElementById("status");
const eventsOutput = document.getElementById("eventsOutput");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

const engineFilesUrl = `${window.location.origin}/files`;
const renderer = new FtarRenderer(engineFilesUrl, canvas);

function setStatus(message) {
  statusElement.textContent = message;
}

function writeLog(message) {
  const time = new Date().toLocaleTimeString();
  const previous = eventsOutput.textContent === "No events yet." ? "" : `${eventsOutput.textContent}\n`;
  eventsOutput.textContent = `${previous}[${time}] ${message}`;
  eventsOutput.scrollTop = eventsOutput.scrollHeight;
}

const agentSession = new InworldAgentSession({
  renderer,
  onStatus: setStatus,
  onLog: writeLog,
  onStateChange: ({ running }) => {
    startButton.disabled = running;
    stopButton.disabled = !running;
  }
});

renderer.readyPromise.then(() => {
  renderer.size = { width: 320, height: 320 };
  renderer.slot1 = `${engineFilesUrl}/default_ftar.p`;
  renderer.background = `${engineFilesUrl}/backgrounds/1.jpg`;

  startButton.disabled = false;
  setStatus("Renderer ready. Start the conversation to animate the avatar with the agent voice.");
});

startButton.addEventListener("click", async () => {
  try {
    eventsOutput.textContent = "No events yet.";
    await agentSession.start();
  } catch (error) {
    console.error(error);
    writeLog(`Startup failed: ${error.message}`);
    setStatus(`Startup failed: ${error.message}`);
    agentSession.stop();
  }
});

stopButton.addEventListener("click", () => {
  writeLog("Conversation stopped by user.");
  setStatus("Stopped.");
  agentSession.stop();
});
