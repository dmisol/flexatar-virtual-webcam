import {listItem} from "./list-item.js"
import {createContainer} from "./sub-create-container.js"
import {showPopup,showAlert,showConfirm} from "../../util/popup.js"
import VCAM from "./ftar-v-cam.js"




buySybscription.onclick = async() => {

    const containerElements = createContainer();
    showPopup({
        customElement:containerElements.container,
        buttons:[
            {
                text:"BUY",
                onclick:async closeHandler =>{
                    closeHandler()
                    const reqBody = {
                        authtype:containerElements.authTypeInput.value,
                        user:containerElements.userInput.value,
                        testing:containerElements.checkbox.checked,
                        crt:crypto.randomUUID()
                    }
                   
                    // todo fetch with retry
                    const resp = await fetch("/buysubscription",{
                        method: 'POST',
                        headers:{"Content-Type":"application/json"},
                        body: JSON.stringify(reqBody)
                    })
                    if (!resp.ok){
                        console.log(await resp.json())
                    }else{
                        console.log("buy subscription success")
                    }

                }
               
            },{
                text:"CANCEL",
                onclick:async closeHandler =>{
                    closeHandler()
                }
            }
        ]

    })
  
}

async function getSubList(body){
    if (!body) body = {}
    const resp = await fetch("/listsubscription",{
        method: 'POST',
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
    })
    if (resp.error){
        return
    }
    const respJson = await resp.json()
    return respJson
}

function addEntriesToDocument(respJson){
    for (const entry of respJson.list){
        const subscription = listItem(entry,{
            vcam:(request)=>{
                if (vCam){
                    vCam.destroy()
                }
                vCam = createVCam(request,videoFromIframe,iframeHolder)
            }
        })

        subscriptionsContainer.appendChild(subscription)
    }

    if (respJson.continue){
        showMoreButton.style.display = "block"
        showMoreButton.onclick =  () =>{
            showListElements({continue:respJson.continue})
        }
    }else{
        showMoreButton.style.display = "none"
    }
}
addEntriesToDocument({list:[{authtype:"test",user:"test@user.email"}]})
async function showListElements(body){
    const respJson = await getSubList(body)
    if (!respJson) return
    addEntriesToDocument(respJson)
    
    
}


listSubscription.onclick = async() => {
    showListElements()
}
let vCam
function createVCam(request,videoelement,holder){
    // const size = {width:"50px",height:"320px"}
    const iframeUrl = "https://dev.flexatar-sdk.com/v-cam/index.html"
    // const iframeUrl = "http://localhost:8080"
    const vCam = VCAM.getVCamElement(iframeUrl)
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


