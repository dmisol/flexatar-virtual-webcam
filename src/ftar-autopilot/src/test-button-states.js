const testStateIdleSign = document.getElementById("testStateIdleSign")
const testStateConnectingSign = document.getElementById("testStateConnectingSign")
const testStateConnectedSign = document.getElementById("testStateConnectedSign")
const testStateConnectionFailureSign = document.getElementById("testStateConnectionFailureSign")
const testStateMicrophoneFailureSign = document.getElementById("testStateMicrophoneFailureSign")
const testButton = document.getElementById("testButton")
function hideAll() {
    testStateIdleSign.classList.add("invisible")
    testStateConnectingSign.classList.add("invisible")
    testStateConnectedSign.classList.add("invisible")
    testStateConnectionFailureSign.classList.add("invisible")
    testStateMicrophoneFailureSign.classList.add("invisible")
    testButton.classList.remove("error-color")
}

export function setTestButtonIdle() {
    hideAll()
    testStateIdleSign.classList.remove("invisible")
    testButton.disabled = false

}

export function setTestButtonConnecting() {
    hideAll()
    testStateConnectingSign.classList.remove("invisible")
    testButton.disabled = true

}
export function setTestButtonConnected() {
    hideAll()
    testStateConnectedSign.classList.remove("invisible")
    testButton.disabled = false

}

export function setTestButtonConnectionFailure() {
    hideAll()
    testStateConnectionFailureSign.classList.remove("invisible")
    testButton.disabled = false
    testButton.classList.add("error-color")
}

export function setTestButtonMicrophoneFailure() {
    hideAll()
    testStateMicrophoneFailureSign.classList.remove("invisible")
    testButton.disabled = false
    testButton.classList.add("error-color")

}


export function setTestButtonDisconnecting() {
    testButton.disabled = true
}