


function log() {
    console.log("[VIDEO GEN IFRAME WRAPPER]", ...arguments)
}
let vGenIframe
let handler
export function createVGen(request, holder, addLog) {
   
    if (vGenIframe) vGenIframe.remove();
    if (handler)  window.removeEventListener("message", handler)
   
    const iframeUrl = "/vgen"
    vGenIframe = document.createElement("iframe")
    vGenIframe.src = iframeUrl

    handler = async e => {
        let msg = e.data
        if (!msg) return
        msg = msg.flexatarVideoGenIframe
        if (!msg) return
        if (msg.tokenRequest) {
            try {
                log("requesting token for:",request)
                const response = await fetch("/usertoken", {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },

                    body: JSON.stringify(request)
                })
                
                
                const tokenJson = await response.json()
                log("tokenJson", tokenJson)
                if (!tokenJson.token) {
                    log("token not obtained from request")
                }
                vGenIframe.contentWindow.postMessage({token:tokenJson.token,msgID:msg.msgID},"*")

            } catch (exception) {
                log("token request unknown error")

                console.error(exception)
                vGenIframe.contentWindow.postMessage({token:null,msgID:msg.msgID},"*")
            }
        }
    }
    window.addEventListener("message", handler)
    vGenIframe.style.width="420px"
    vGenIframe.style.height="600px"
    holder.appendChild(vGenIframe)

    return 
}