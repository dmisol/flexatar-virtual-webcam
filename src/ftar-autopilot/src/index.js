

import { ManagerClient } from "../../flexatar-package/src/ftar-manager/default-manager-client.js"
import { VCamMediaStream } from "../../flexatar-package/src/ftar-manager/vcam-media-stream.js"
import { OpenAiVirtualParticipant } from "../../flexatar-package/src/utils/virtual-ai-participant.js"
import { getAudioContext, delayAudio, enhanceMnasal, resample, processingAudioQueue } from "../../flexatar-package/src/utils/track-processor.js"
import * as TestButtonStates from "./test-button-states.js"

function log() {
    console.log("[FTAR_AUTOPILOT_UI_IFRAME]", ...arguments)
}

const vCamMediaStream = new VCamMediaStream({ width: 240, height: 240 })
// vCamMediaStream.onFirstFrame = () => {
//     vCamMediaStream.setSize({ width: 360, height: 360 })
// }
avatarContainer.appendChild(vCamMediaStream.canvas)
vCamMediaStream.canvas.style.display = "block"
let flexatarViewWidth = 500
vCamMediaStream.onCanvasRatio = ratio => {
    if (ratio < 0.95) {
        flexatarViewWidth = 500
    } else {
        flexatarViewWidth = 320
    }
    const height = flexatarViewWidth
    const width = Math.floor(height * ratio)
    log("onCanvasRatio", ratio, width, height)
    vCamMediaStream.canvas.width = width
    vCamMediaStream.canvas.height = height
}

function switchToAvatar() {
    avatarContainer.classList.remove("invisble")
    apiContainer.classList.add("invisble")
}

function switchToApi() {
    avatarContainer.classList.add("invisble")
    apiContainer.classList.remove("invisble")
}


let currentApiKey
const managerClient = new ManagerClient({
    closeButton: document.getElementById("closeButton"),
    incomingMessageHandler: (msg) => {
        if (msg.aiStarted) {
            log("ai started confirmation")
            setAutopilotConnected()
            return
        } else if (msg.aiPresenceError) {
            setAutopilotConnectionError()
        } else if (msg.aiStopped) {
            log("ai stopped confirmation")
            setAutopilotIdle()
        } else if (msg.isVirtualParticipantActive) {
            const isVirtualParticipantActive = msg.isVirtualParticipantActive.value
            if (isVirtualParticipantActive) {
                setAutopilotConnected()
            }

        } else if (msg.isRtcConnectionActive) {
            const isRtcConnectionActive = msg.isRtcConnectionActive.value
            log("isRtcConnectionActive",isRtcConnectionActive)
            testButton.disabled = isRtcConnectionActive
            enableAutopilotButton.disabled = !isRtcConnectionActive

        } else if (msg.openAiInstructions) {
            instructionsTextarea.value = msg.openAiInstructions
        }

        if (msg.openAIApiKey && msg.openAIApiKey.value) {
            currentApiKey = msg.openAIApiKey.value
            apiKeyInput.placeholder = "Enter API key here (already entered)";
        }
        if (isStartTesting && msg.openAIApiKey) {


            isStartTesting = false


            virtualParticipant = new OpenAiVirtualParticipant({ apiKey: msg.openAIApiKey.value, instructions: instructionsTextarea.value }, null, null, 5000, constraints)
            virtualParticipant.onError = error => {
                if (error === OpenAiVirtualParticipant.MCIROPHONE_ERROR) {
                    TestButtonStates.setTestButtonMicrophoneFailure()
                    // testButton.textContent = "Microphone access error. Click to continue."
                } else if (error === OpenAiVirtualParticipant.CONNECTION_ERROR) {
                    TestButtonStates.setTestButtonConnectionFailure()

                    // testButton.textContent = "Invalid API key. Click to continue."
                } else if (error === OpenAiVirtualParticipant.TIMEOUT_ERROR) {
                    TestButtonStates.setTestButtonConnectionFailure()

                    // testButton.textContent = "Connection timeout. Click to continue."
                }
                testButton.disabled = false
                testButtonLiveCycle = FAILURE
                switchToApi()
            }
            virtualParticipant.onConnectionLost = () => {
                if (audioEl) {
                    audioEl.remove()
                    audioEl = null
                }
                switchToApi()
                TestButtonStates.setTestButtonConnectionFailure()
                testButtonLiveCycle = FAILURE
            }
            virtualParticipant.onStream = stream => {
                switchToAvatar()
                // testButton.disabled = false
                if (!audioEl) {
                    testButtonLiveCycle = FAILURE

                    virtualParticipant.terminate()
                    return
                }
                testButtonLiveCycle = CONNECTED


                TestButtonStates.setTestButtonConnected()
                // testButton.textContent = "Online. Click to stop."

                const audioTrack = stream.getAudioTracks()[0];
                log("delay request")
                const { track, stopTrack } = delayAudio(audioTrack.clone());
                //  audioEl.srcObject = stream;
                audioEl.srcObject = new MediaStream([track]);
                dummyAudioEl.srcObject = stream;
                dummyAudioEl.muted = true;
                //  audioEl.srcObject = stream;
                log("obtained delayed audio start processing")
                processingAudioQueue(audioTrack, async (audioData) => {
                    // if (mediaPortForAudio && cameraState) {
                    const frameCount = audioData.numberOfFrames;
                    const buffer = new Float32Array(frameCount);
                    audioData.copyTo(buffer, { planeIndex: 0 });
                    const resampledBuffer = await resample(buffer, 16000, audioData.sampleRate);
                    // const resampledBuffer = await enhanceMnasal(await resample(buffer, 16000, audioData.sampleRate));
                    const audioBuffer = resampledBuffer.getChannelData(0).buffer
                    vCamMediaStream.port.postMessage({ audioBuffer }, [audioBuffer])
                    // mediaPortForAudio?.postMessage({ audioBuffer }, [audioBuffer])

                    // }
                })
            }
            virtualParticipant.onTerminate = () => {
                if (audioEl) {
                    audioEl.remove()
                    audioEl = null
                }
                switchToApi()

            }
            // startWebrtcCallToAI(msg.openAIApiKey.value)
        }

        log("message from manager", msg)
    },
    onClose: () => {
        if (virtualParticipant) {
            virtualParticipant.terminate()
        }
    },
    onReady: () => {
        managerClient.sendMessage({ getOpenAIApiKey: true })
        managerClient.sendMessage({ mediaPort: vCamMediaStream.portToSend }, [vCamMediaStream.portToSend])
        managerClient.sendMessage({ pageCtxMsg: { checkRtcConnectionActive: true } })
        managerClient.sendMessage({ pageCtxMsg: { checkVirtualParticipantActive: true } })

        managerClient.sendMessage({ requestOpenAiInstructions: true })

    }
})

const apiKeyInput = document.getElementById('apiKey');

// Fires on every keystroke
apiKeyInput.addEventListener('input', () => {
    log('API Key changed to:', apiKeyInput.value);
    currentApiKey = apiKeyInput.value
    managerClient.sendMessage({ storeOpenAIApiKey: apiKeyInput.value })
    // You can do something whenever the key changes
    // e.g., validate it, save locally, enable a button
});

let isStartTesting = false
// let isAIWebrtcOn = false
let virtualParticipant
let audioEl
let dummyAudioEl

const READY_TO_CONNECT = 1
const CONNECTING = 2
const CONNECTED = 3
const FAILURE = 4
let testButtonLiveCycle = READY_TO_CONNECT
testButton.onclick = () => {
    const audioCtx = getAudioContext()
    log("testButtonLiveCycle", testButtonLiveCycle)
    if (testButtonLiveCycle === CONNECTING) return;

    if (testButtonLiveCycle === CONNECTED || testButtonLiveCycle === FAILURE) {

        if (virtualParticipant) {
            virtualParticipant.terminate()
        }
        testButtonLiveCycle = READY_TO_CONNECT

        // testButton.disabled = false
        // testButton.textContent = "Test"
        TestButtonStates.setTestButtonIdle()
    } else {

        audioEl = document.createElement('audio');
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
        dummyAudioEl = document.createElement('audio');
        dummyAudioEl.autoplay = true;
        document.body.appendChild(dummyAudioEl);
        isStartTesting = true
        managerClient.sendMessage({ getOpenAIApiKey: true })

        // testButton.disabled = true
        // testButton.textContent = "Connecting..."
        TestButtonStates.setTestButtonConnecting()
        // isAIWebrtcOn = true
    }

}



const AUTOPILOT_IDLE = 1
const AUTOPILOT_CONNECTING = 2
const AUTOPILOT_CONNECTED = 3
const AUTOPILOT_STOPPING = 4
const AUTOPILOT_ERROR = 5

let autopilotButtonState = AUTOPILOT_IDLE
function setAwaitingAutopilotConnection() {
    autopilotButtonState = AUTOPILOT_CONNECTING
    enableAutopilotButton.disabled = true
    enableAutopilotButton.textContent = "Connecting..."

}
function setAwaitingAutopilotStop() {
    autopilotButtonState = AUTOPILOT_STOPPING
    enableAutopilotButton.disabled = true
    enableAutopilotButton.textContent = "Disconnecting ..."
}
function setAutopilotConnected() {
    autopilotButtonState = AUTOPILOT_CONNECTED
    enableAutopilotButton.disabled = false
    enableAutopilotButton.textContent = "Online. Click to stop."
}
function setAutopilotIdle() {
    autopilotButtonState = AUTOPILOT_IDLE
    enableAutopilotButton.disabled = false
    enableAutopilotButton.textContent = "Enable ai autopilot."

}

function setAutopilotConnectionError() {
    autopilotButtonState = AUTOPILOT_ERROR
    enableAutopilotButton.disabled = false
    enableAutopilotButton.textContent = "Connection error. Click to continue."

}

function isAutopilotIdle() {
    return autopilotButtonState === AUTOPILOT_IDLE
}
function isAutopilotConnected() {
    return autopilotButtonState === AUTOPILOT_CONNECTED
}
function isAutopilotFailed() {
    return autopilotButtonState === AUTOPILOT_ERROR
}
enableAutopilotButton.onclick = () => {
    if (isAutopilotIdle()) {
        setAwaitingAutopilotConnection()
        managerClient.sendMessage({
            pageCtxMsg: {
                enableAiAutopilot: {
                    openAIApiKey: { value: currentApiKey },
                    instructions: { value: instructionsTextarea.value }
                }
            }
        })
        managerClient.closeThisWindow()

    } else if (isAutopilotConnected()) {
        setAwaitingAutopilotStop()
        managerClient.sendMessage({ pageCtxMsg: { disableAiAutopilot: true } })

    } else if (isAutopilotFailed()) {
        setAutopilotIdle()
    }


}

const instructionsTextarea = document.getElementById("instructions");

instructionsTextarea.addEventListener("blur", function () {
    const content = instructionsTextarea.value;
    // log("content of text area", content);
    managerClient.sendMessage({ saveOpenAiInstructions: content })
});

const micSelect = document.getElementById("micSelect");

// Ask permission & list microphones
async function getMicrophones() {
    // Permission is required before labels are visible
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach(t => t.stop())

    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter(device => device.kind === "audioinput");

    // micSelect.innerHTML = '<option value="">Select a microphone</option>';
    const deviceId = mics[0]?.deviceId
    constraints = {
        audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined
        }
    };

    mics.forEach(mic => {
        const option = document.createElement("option");
        option.value = mic.deviceId;
        option.textContent = mic.label || `Microphone ${micSelect.length + 1}`;
        micSelect.appendChild(option);
    });
}

let constraints = { audio: true }
micSelect.addEventListener("change", (e) => {
    const deviceId = e.target.value;
    if (deviceId) {
        constraints = {
            audio: {
                deviceId: deviceId ? { exact: deviceId } : undefined
            }
        };

    }
});
getMicrophones()
