function log() {
    console.log("[FTAR_Notification_UI_IFRAME]", ...arguments)
}
let portSelf
let instanceId
let notificationId

window.onmessage = (e) => {
    const msg = e.data
    if (!msg) return
    if (msg.managerPort) {
        instanceId = msg.instanceId
        msg.managerPort.onmessage = portHandler
        log("port obtained", msg)
        portSelf = msg.managerPort



        if (msg.notificationText) {
            if (msg.notificationText === "startup") {
                startupNotification.classList.remove("invisible")
            } else if (msg.notificationText === "delay") {
                delayNotification.classList.remove("invisible")

            }
            // notificationText.textContent = msg.notificationText;
            notificationId = msg.notificationId
        }
        log("request progress list")
    } else if (msg.closeThisWindow) {
        closeThisWindow()
    }
}

function closeThisWindow() {
    portSelf.postMessage({ doNotShowOptionChanged: { value: doNotShowCheckbox.checked, notificationId } })
    window.parent.postMessage({ closeWindow: true, portSelf, instanceId }, "*", [portSelf])
}

closeButton.onclick = () => {
    closeThisWindow()

}

doNotShowCheckbox.addEventListener('change', () => {
    console.log('Checked:', doNotShowCheckbox.checked);
    portSelf.postMessage({ doNotShowOptionChanged: { value: doNotShowCheckbox.checked, notificationId } })
});

function portHandler(e) {
    const msg = e.data
    if (!msg) return
    // if (msg.notificationText) {
    //     notificationText.textContent = msg.notificationText

    // }

}


let userLang = navigator.language || "en"; // e.g., "en-US"
userLang = userLang.split('-')[0]; // get "en"
log("detected user language", userLang)

function setUserLang(ul) {
    if (ul === "en"){
        switchToEnglishButton.classList.add("invisible")

    }
    fetch(`${ul}.arb`).then(r => r.json()).then(
        localeDict => {
            for (const [key, value] of Object.entries(localeDict)) {
                // log("lang entry",e)
                document.getElementById(key).textContent = value
            }

        }
    )
}
setUserLang(userLang)
switchToEnglishButton.onclick = () => {
    setUserLang("en")
  
}