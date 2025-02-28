
import VGEN from "./ftar-v-gen.js"
export function createVGen(request, holder,addLog){
    const iframeUrl = "https://flexatar-sdk.com/v-gen/index.html"
    // const iframeUrl = "http://localhost:8082"
    const vGen = VGEN.getVGenElement(iframeUrl)
    vGen.setupTokenFetch("/usertoken",
        {
            method: 'POST',
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(request)  
        }
    )
    vGen.ontokenerror = (error)=>{
        addLog("Error: "+JSON.stringify(error))
    }
    vGen.mount(holder)
    vGen.oninvalidurl = (url)=>{
        addLog("Error: iframe url is not responsive.")
        console.log("Unresponsive",url)
        // vCam.unmount()
    }
    return vGen
}