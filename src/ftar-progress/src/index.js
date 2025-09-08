function log() {
    console.log("[FTAR_PROGRESS_UI_IFRAME]", ...arguments)
}
let portSelf
window.onmessage = (e) => {
    const msg = e.data
    if (!msg) return
    if (msg.managerPort) {
        msg.managerPort.onmessage = portHandler
        log("port obtained")
        portSelf = msg.managerPort
        msg.managerPort.postMessage({ progressLists: true })
        log("request progress list")
    } else if (msg.closeThisWindow) {
        closeThisWindow()
    }
}

function closeThisWindow() {
    window.parent.postMessage({ closeWindow: true, portSelf }, "*", [portSelf])
}

closeButton.onclick = () => {
    closeThisWindow()

}


function portHandler(e) {
    const msg = e.data
    if (!msg) return
    if (msg.progressLists) {
        reloadIcon.classList.remove("roating")

        log("progress list", msg.progressLists)

        const elementIds = ["successImages", "errorImages", "queueImages"]
        const holders = {
            successImages: "successHolder",
            errorImages: "errorHolder",
            queueImages: "queueHolder",
        }
        const styles = { successImages: "success", errorImages: "error", queueImages: "queue" }
        const progressLists = msg.progressLists
        const ftarCount = progressLists.flexatarCount
        log("received ftar count", ftarCount)
        flexatarCountTextElement.textContent = `${ftarCount}`
        delete progressLists.flexatarCount
        if (ftarCount <= 0) {
            canCreateFlexatarSign.classList.add("invisible")
            canNotCreateFlexatarSign.classList.remove("invisible")
        } else {
            canCreateFlexatarSign.classList.remove("invisible")
            canNotCreateFlexatarSign.classList.add("invisible")
        }


        const isQueueInProgress = progressLists.isQueueInProgress
        delete progressLists.isQueueInProgress
        if (isQueueInProgress) {
            queueHolder.classList.add("blinking-border")
            startMakeQueue.classList.add("selected-button")
            pauseMakeQueue.classList.remove("selected-button")
            pasuedNotification.classList.add("invisible")

        } else {
            pauseMakeQueue.classList.add("selected-button")
            startMakeQueue.classList.remove("selected-button")
            queueHolder.classList.remove("blinking-border")
            pasuedNotification.classList.remove("invisible")


        }

        elementIds.forEach(containerId => {
            const imgContainer = document.getElementById(containerId)
            while (imgContainer.firstChild) {
                imgContainer.removeChild(imgContainer.firstChild);
            }
            if (msg.progressLists[containerId].length > 0) {
                document.getElementById(holders[containerId]).classList.remove("invisible")
            } else {
                document.getElementById(holders[containerId]).classList.add("invisible")
            }
            msg.progressLists[containerId].forEach(imgUrl => {
                if (!imgUrl) return
                const img = document.createElement("img")
                img.src = imgUrl
                img.className = "image-item"
                img.classList.add(styles[containerId])
                imgContainer.appendChild(img)
            });
        })
    }

}


startMakeQueue.onclick = () => {
    if (portSelf) {
        portSelf.postMessage({ startMakeQueue: true })
    }
    startMakeQueue.classList.add("selected-button")
    pauseMakeQueue.classList.remove("selected-button")
    queueHolder.classList.add("blinking-border")
    queueImages.firstChild?.classList.remove("blinking-border")
    pasuedNotification.classList.add("invisible")


}

pauseMakeQueue.onclick = () => {
    portSelf.postMessage({ pauseMakeQueue: true })
    startMakeQueue.classList.remove("selected-button")
    pauseMakeQueue.classList.add("selected-button")
    pasuedNotification.classList.remove("invisible")
    queueHolder.classList.remove("blinking-border")
    queueImages.firstChild?.classList?.add("blinking-border")
}

clearMakeQueue.onclick = () => {
    portSelf.postMessage({ clearMakeQueue: true })
}
reloadIcon.onclick = () => {
    reloadIcon.classList.add("roating")

    portSelf.postMessage({ progressLists: true, reloadFtarCount: true })

}