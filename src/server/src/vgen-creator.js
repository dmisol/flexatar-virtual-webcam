
import VGEN from "./ftar-v-gen.js"

function log() {
    console.log("[VIDEO GEN IFRAME WRAPPER]", ...arguments)
}
export function createVGen(request, holder, addLog) {
    // const iframeUrl = "https://flexatar-sdk.com/v-gen/index.html"
    const iframeUrl = "/vgen"
    const vGenIframe = document.createElement("iframe")
    vGenIframe.src = iframeUrl

    window.addEventListener("message", async e => {
        let msg = e.data
        if (!msg) return
        msg = msg.flexatarVideoGenIframe
        if (!msg) return
        if (msg.tokenRequest) {
            try {
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
                // return tokenJson.token
            } catch (exception) {
                log("token request unknown error")

                console.error(exception)
                vGenIframe.contentWindow.postMessage({token:null,msgID:msg.msgID},"*")
                // return
            }
        }
    })
    vGenIframe.style.width="420px"
    vGenIframe.style.height="600px"
    holder.appendChild(vGenIframe)

    // const vGen = VGEN.getVGenElement(iframeUrl)
    // vGen.setupTokenFetch("/usertoken",
    //     {
    //         method: 'POST',
    //         headers:{"Content-Type":"application/json"},
    //         body: JSON.stringify(request)  
    //     }
    // )
    // vGen.ontokenerror = (error)=>{
    //     addLog("Error: "+JSON.stringify(error))
    // }
    // vGen.mount(holder)
    // vGen.oninvalidurl = (url)=>{
    //     addLog("Error: iframe url is not responsive.")
    //     console.log("Unresponsive",url)
    //     // vCam.unmount()
    // }
    return 
}