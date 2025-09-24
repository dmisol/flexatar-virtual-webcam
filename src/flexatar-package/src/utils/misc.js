export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8); // Version 4 bits
        return v.toString(16);
    });
}

export function sendWithResponse(port, msg) {
    const msgID = generateUUID();

    msg.msgID = msgID

    return new Promise(resolve => {
        function handler(event) {
            if (!event.data) return
            console.log("responese", event.data)
            if (event.data.msgID === msgID) {
                resolve(event.data.payload)
                port.removeEventListener("message", handler)
            }
        }
        port.addEventListener("message", handler)
        port.postMessage(msg)
    })
}
