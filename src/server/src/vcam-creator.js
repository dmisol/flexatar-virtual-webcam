import VCAM from "./ftar-v-cam.js"
let vCam
export function createVCam(request,videoelement,holder){

    // const iframeUrl = "https://dev.flexatar-sdk.com/v-cam/index.html"
    const iframeUrl = "http://localhost:8080"

    vCam = VCAM.getVCamElement(iframeUrl)
    vCam.element.scrollbarWidth="none"
    
    vCam.style.display = "none"
    vCam.resolution = {width:240,height:320}
    vCam.setupTokenFetch("/usertoken",
        {
            method: 'POST',
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(request)  
        }
    )
    vCam.ontokenerror = (error)=>{
        console.log(error)
    }

    vCam.onoutputstream = (mediaStream) => {
        vCamTable.style.display = "block"
        vCam.element.style.display = "block"
        videoelement.srcObject = mediaStream
        vCam.element.scrollbarColor = "transparent transparent"
    }

    vCam.background = "./static/background0.jpg"
    vCam.mount(holder)


   
    return vCam
}


micButton.onclick = async () => {
    createOverlay(async ()=>{
        vCam.src = await navigator.mediaDevices.getUserMedia({ audio: true });
        videoFromIframe.muted = true
    })
   
}
speakButton.onclick = async () => {

    createOverlay(()=>{
        vCam.src = "./static/Mary.mp3"
        videoFromIframe.muted = false
    })
}


stopButton.onclick = async () => {
    vCam.src = null
}

function createOverlay(callback){
    if (vCam.isAudioReady){
        callback()
        return
    }
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0, 0, 0, 0.8)"; // Semi-transparent black
    overlay.style.zIndex = "9999";
    overlay.style.pointerEvents = "auto"; // Blocks interaction
    function updateOverlay() {
        let rect = iframeHolder.getBoundingClientRect();
        let { left, top, width, height } = rect;
    
        // Update clip-path to match new position
        overlay.style.clipPath = `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%, 
            0% ${top}px, 
            ${left+1}px ${top+1}px, 
            ${left+1}px ${top + height}px, 
            ${left + width}px ${top + height}px, 
            ${left + width}px ${top+1}px, 
            0% ${top+1}px
        )`;
    }

    updateOverlay()

    document.body.appendChild(overlay);
    window.addEventListener("resize", updateOverlay);
    window.addEventListener("scroll", updateOverlay, { passive: true });
    vCam.requestAudioPermition(()=>{
        overlay.remove()
        window.removeEventListener("resize", updateOverlay);
        window.removeEventListener("scroll", updateOverlay);
        // console.log("granted")
        callback()
    })
}