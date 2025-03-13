import {initVCamControlUi} from "./v-cam-control/initVCamControlUi.js"
import {initVCamEmoCtl} from "./v-cam-control/initVCamEmoCtl.js"
import {fileLoader} from "./v-cam-control/fileLoader.js"
import {effectController} from "./v-cam-control/effectController.js"
import VCAM from "./ftar-v-cam.js"
let vCam
export function createVCam(request,videoelement,holder,addLog){
    addLog("Waiting v-cam response...")
    // const iframeUrl = "https://flexatar-sdk.com/v-cam/index.html"


    const iframeUrl = "/vcam"

    // externalControl - set to `true` if you want to interact with the v-cam iframe.
    // Use externalControl if you want to implement your own UI logic.

    vCam = VCAM.getVCamElement(iframeUrl,{externalControl:true})

    // vCam = VCAM.getVCamElement(iframeUrl,{externalControl:true})
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
        addLog("Error: "+JSON.stringify(error))
    }
    vCam.oninvalidurl = (url)=>{
        addLog("Error: iframe url is not responsive.")
        console.log("Unresponsive",url)
        // vCam.unmount()
    }

    vCam.onoutputstream = (mediaStream) => {
        addLog("v-cam video obtained.")
        vCamTable.style.display = "block"
        vcamExternalControls.style.display = "block"
        vCam.element.style.display = "block"
        videoelement.srcObject = mediaStream
        vCam.element.scrollbarColor = "transparent transparent"
    }

    vCam.background = "./static/background0.jpg"
    vCam.mount(holder)

    // --==Optional section==--
    // Sending and listening iframes events.
   
    vcamExternalControls.onclick = ()=>{vCamExternalControl.style.display = "block"}


    let removeFlexatarFromList
    let addFlexatarToList
    let animated = true
    let currentEffect = "no"

    vCam.onDataChanelAvailable = () =>{
        fileLoader("vCamMakeFtarButtonHolder",
            (imgEncoded)=>{

                vCam.createFlexatar(imgEncoded)
            },(error)=>{
                console.log("error",error)
            }
        )
        fileLoader("loadBackgroundHolder",
            (imgEncoded)=>{

                vCam.setBackground(imgEncoded)
            },(error)=>{
                console.log("error",error)
            }
        )

        effectController("vCamEffectPanelHolder",
            effectState=>{
                currentEffect = effectState
                vCam.setEffect({effectId:effectState,animated})
                console.log(effectState)
            },
            effectAmount =>{
                vCam.setEffectAmount(effectAmount)
            },
            isAnimated=>{

                animated = isAnimated
                vCam.setEffect({effectId:currentEffect,animated})
                console.log("isAnimated",isAnimated)

            }
        )
    }
    
    const {initError, removeFlexatarItem,addFlexatarItem,clear} = initVCamControlUi("vCamFtarListHolder",[],(ftarId)=>{
        vCam.sendSetToSlot(ftarId,1)

   
    },(ftarId)=>{
        vCam.sendSetToSlot(ftarId,2)
       


    },(ftarId)=>{
        vCam.deleteFlexatar(ftarId)
    })
    removeFlexatarFromList = removeFlexatarItem
    addFlexatarToList = addFlexatarItem

    vCam.onFlexatarPreview = (flexatarItem)=>{

        addFlexatarToList(flexatarItem.id,flexatarItem.previewImage)
    }

    vCam.onFlexatarCreated = (flexatarItem,error) =>{

        if (flexatarItem.id){
            addFlexatarToList(flexatarItem.id,flexatarItem.previewImage)
        }else{
            // Available errors:
            // "bad_photo"
            // "subscription_limit"
            // "queue_limit"
            addLog("Flexatar creation error:"+error)
        }
      
    }


    vCam.onFlexatarActivated = (ftarId,slotIdx)=>{
        console.log("onFlexatarActivated",ftarId,slotIdx)
        if (slotIdx == 2){
            setTimeout(()=>{
                vCam.setEffect({effectId:"hybrid",animated:true})
            },100)
            setTimeout(()=>{
                vCam.setEffect({effectId:currentEffect,animated})
            },3000)
        }
        
    }
    vCam.onFlexatarRemoved = (ftarId,error)=>{
        if (!error){
            if (removeFlexatarFromList){
                removeFlexatarFromList(ftarId)
                console.log("onFlexatarRemoved",ftarId,error)
            }
        }
            
    }


    vCam.onFlexatarEmotionList = (emoList)=>{

        // emoList = JSON.parse(emoList)
        const initError = initVCamEmoCtl("vCamEmoListHolder",emoList,(emoId)=>{
            vCam.setFlexatarEmotion(emoId)

            console.log("emoId clicked",emoId)
        })
        
    }
    reloadFlexatarList.onclick = ()=>{
        clear()
        vCam.reloadFlexatarList()
    }
   
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
    vCam.requestAudioPermission(()=>{
        overlay.remove()
        window.removeEventListener("resize", updateOverlay);
        window.removeEventListener("scroll", updateOverlay);
        // console.log("granted")
        callback()
    })
}