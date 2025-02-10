
import VGEN from "./ftar-v-gen.js"
export function createVGen(request, holder){
    // const iframeUrl = "https://flexatar-sdk.com/v-gen/index.html"
    const iframeUrl = "http://localhost:8082"
    const vGen = VGEN.getVGenElement(iframeUrl)
    vGen.setupTokenFetch("/usertoken",
        {
            method: 'POST',
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(request)  
        }
    )
    vGen.ontokenerror = (error)=>{
        console.log(error)
    }
    vGen.mount(holder)
}