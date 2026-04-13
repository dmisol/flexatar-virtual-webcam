import { ManagerConnection } from "./ftar-connection.js"


function log() {
    console.log("[DEFAULT_MANAGER_CLIENT]", ...arguments)
}


export class ManagerClient {
    portSelf
    instanceId
    constructor(inputs) {
        const { closeButton, incomingMessageHandler, onClose, onReady,opts } = inputs
        const _this = this;

        function portHandler(e) {
            const msg = e.data
            if (!msg) return

            incomingMessageHandler(msg)
        }

        window.onmessage = (e) => {
            const msg = e.data
            if (!msg) return
            if (msg.managerPort) {
                _this.instanceId = msg.instanceId
                _this.portSelf = msg.managerPort
                msg.managerPort.onmessage = portHandler
                if (msg.msgID) {
                    _this.portSelf.postMessage({ msgID: msg.msgID })
                }
                log("port obtained")
                let connection
                if (opts.managerConnection){
                    connection = new ManagerConnection()
                    msg.managerPort.postMessage({ managerConnectionPort: connection.outPort }, [connection.outPort])
                   
                }
                onReady(connection)
                // msg.managerPort.postMessage({ progressLists: true })
                // log("request progress list")
            } else if (msg.closeThisWindow) {
                closeThisWindow()
            }
        }

        function closeThisWindow() {
            if (onClose) onClose();
            window.parent.postMessage({ closeWindow: true, portSelf: _this.portSelf, instanceId: _this.instanceId }, "*", [_this.portSelf])
        }
        closeButton.onclick = () => {
            closeThisWindow()
        }
        this.closeThisWindow = closeThisWindow


    }

    sendMessage(msg, transfer) {
        if (this.portSelf) {
            this.portSelf.postMessage(msg, transfer)
        }
    }


}