import {initVCamControlUi} from "./v-cam-control/initVCamControlUi.js"
import {initVCamEmoCtl} from "./v-cam-control/initVCamEmoCtl.js"
import {fileLoader} from "./v-cam-control/fileLoader.js"
import {effectController} from "./v-cam-control/effectController.js"
// import VCAM from "./ftar-v-cam.js"
import {VCAM} from "../../flexatar-package/src/index.js"
// import {VCAM} from "flexatar-package"


let vCam

/*
import ManagerWorker from "../../worker/manager.worker.js"
import {RenderWorkerWarper } from "../../worker/install-render-worker.js"



async function resample(float32Array,targetSampleRate,inputSampleRate,numChannels=1){
    const frameCount = float32Array.length / numChannels;
    const offlineContext = new OfflineAudioContext({
        numberOfChannels: numChannels,
        length: Math.ceil(frameCount * (targetSampleRate / inputSampleRate)),
        sampleRate: targetSampleRate,
    });
    const audioBuffer = offlineContext.createBuffer(1, frameCount, inputSampleRate);
    audioBuffer.getChannelData(0).set(float32Array);
  
    const anotherArray = new Float32Array(audioBuffer.length);
    audioBuffer.copyFromChannel(anotherArray, 0, 0);
    // console.log("anotherArray",anotherArray)
  
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    const resampledBuffer = await offlineContext.startRendering();
  
  
    return resampledBuffer
}
class TrackProcessor{
    constructor(stream){
        let mimeType
        const supportedTypes = [
            'audio/webm',
            'audio/webm;codecs=opus',
            'audio/ogg',
            'audio/wav',
          ];
          
          for (const type of supportedTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
            }
          }
          
        const recorder = new MediaRecorder(stream, { mimeType });
        let firstChunk
        const self = this
        recorder.ondataavailable = async (event) => {
            if (event.data.size === 0) return;
            if (!firstChunk){
                firstChunk = event.data
                return
            }
            const blob = new Blob([firstChunk,event.data], { type: mimeType });
            const arrayBuffer = await blob.arrayBuffer();
            // console.log(arrayBuffer)

          // Use a dummy OfflineAudioContext — sample rate guessed here
          const offlineCtx = new OfflineAudioContext(1, 1, 16000);
      
          try {
            const decoded = await offlineCtx.decodeAudioData(arrayBuffer);
            const pcm = decoded.getChannelData(0); // Float32Array of PCM samples
            if (self.onAudio) self.onAudio(pcm)
                // console.log(pcm)
            // console.log("Decoded PCM (Float32Array):", pcm);
          } catch (err) {
            console.error("Decode error:", err);
          }
        };
        recorder.start(10);
    }
    // onAudio = ()=>{}
}

class VCAM{
    constructor(request){
        const managerWorker = new ManagerWorker()

        managerWorker.onmessage = async (event)=>{
        
         const msg = event.data
         if (!msg) return
         if (msg.error){
             console.log(msg.error)
         }else if (msg.tokenRequest){
             try{
                 const response = await fetch("/usertoken",{
                     method: 'POST',
                     headers:{"Content-Type":"application/json"},
                  
                     body: JSON.stringify(request)  
                 })
                 if (!response.ok){
                     // postMessage({error:{status:response.status,message:await response.text()}})
                     // return 
                 }
                 const tokenJson = await response.json()
                 console.log("tokenJson",tokenJson)
                 if (!tokenJson.token){
                     // postMessage({error:{status:403,message:"token_expired"}})
                 }
                 managerWorker.postMessage({token:tokenJson.token})
             }catch (exception){
                 postMessage({error:{exception}})
                 return
             }
         }
        }
     
         const iframeUrl = "/vcam"
         const iframe = document.createElement("iframe")
         iframe.src = iframeUrl
         iframe.style.width = "60px"
         iframe.style.height = "300px"
         iframe.style.border = "none"
         window.addEventListener("message",(e)=>{
             const msg = e.data
             if (!msg) return
             console.log(msg)
             if (msg.ftarUIPort){
                 managerWorker.postMessage({ftarUIPort:msg.ftarUIPort},[msg.ftarUIPort])
             }
         })
         
     
         const renderer = new RenderWorkerWarper("/files")
         renderer.onManagerPort = port=>{
             console.log("on top manager port",port)
             managerWorker.postMessage({ftarUIPort:port},[port])
         }
     
         renderer.onControllerPort = port=>{
             console.log("controller port",port)
             // flexatarControllerPort
             iframe.contentWindow.postMessage({flexatarControllerPort:port},"*",[port])
     
         }
         renderer.start()
         const canvas = document.createElement("canvas");
             // canvas.width=480
             // canvas.height=640
         canvas.width=240
         canvas.height=320
         canvas.style.display = "none"
         const ctx = canvas.getContext("bitmaprenderer");
     
     
         const channel = new MessageChannel();
         renderer.addMediaPort(channel.port2)
         let firstFrame = true
         channel.port1.onmessage = e =>{
             if (firstFrame){
                 console.log("stream ready")
                 // if (!isCameraReady){
             
                 // }
                 // isCameraReady=true
     
                
                 // mediaPort = channel.port1
                 firstFrame=false
             }
             if (e.data && e.data.frame ){
                 ctx.transferFromImageBitmap(e.data.frame);
                 
                
               
     
             }
         }
         iframe.onload = ()=>{
            renderer.getControllerPort()

         }
         this.canvas = canvas
         this.iframe = iframe
         this.mediaPort = channel.port1
    }
    mount(holder){
        holder.appendChild(this.iframe)
        holder.style.display = "block"
        console.log("appending iframe to",holder)

    }
   
    set src(mediaStream) {
        console.log("start lipysnc",mediaStream);
        const isTrackProcessorAvailable =
            'MediaStreamTrackProcessor' in window &&
            typeof window.MediaStreamTrackProcessor === 'function';
        

        if (isTrackProcessorAvailable){
            (async ()=>{
                console.log("start lipysnc")
                const track = mediaStream.getAudioTracks()[0]
                const media_processor = new MediaStreamTrackProcessor(track);
                const reader = media_processor.readable.getReader();
                
                while (true) {
                
                    const result = await reader.read();
                    if (result.done) {
                        // onStop()
                        break;
                    }
                    // onData(result.value)
                    const audioData = result.value
                    const frameCount = audioData.numberOfFrames;
                    const buffer = new Float32Array(frameCount);
                    audioData.copyTo(buffer, { planeIndex: 0 });
                    const resampledBuffer = await resample(buffer,16000,audioData.sampleRate);
                    const audioBuffer = resampledBuffer.getChannelData(0).buffer
                    this.mediaPort.postMessage({audioBuffer},[audioBuffer])
                    // console.log("reading track",track.id)
                    
                }
            })()
        }else{
            // (async ()=>{
                const trackProcessor = new TrackProcessor(mediaStream)
                trackProcessor.onAudio = async audioData=>{

                    const audioBuffer = audioData.buffer
                    this.mediaPort.postMessage({audioBuffer},[audioBuffer])


                }
            // })()
        }
    }
    get mediaStream(){
        return this.canvas.captureStream(30)
    }
    
}
    */
export function createVCam(request,videoelement,holder,addLog){
    addLog("Waiting v-cam response...")
    // const iframeUrl = "https://flexatar-sdk.com/v-cam/index.html"
    vCam = new VCAM(async ()=>{
        try{
            const response = await fetch("/usertoken",{
                method: 'POST',
                headers:{"Content-Type":"application/json"},
            
                body: JSON.stringify(request)  
            })
            if (!response.ok){

            }
            const tokenJson = await response.json()
            console.log("tokenJson",tokenJson)
            if (!tokenJson.token){

            }
           return tokenJson.token
         }catch (exception){
             postMessage({error:{exception}})
             return
         }
    })

    vCam.mount(holder)
    // holder.appendChild(iframe)
    holder.style.display = "block"

    videoelement.srcObject = vCam.mediaStream
    return vCam

    // vCam.src = async (mediaStream) =>{
        

    // }
    // externalControl - set to `true` if you want to interact with the v-cam iframe.
    // Use externalControl if you want to implement your own UI logic.
/*

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
     */
}


micButton.onclick = async () => {
    // createOverlay(async ()=>{
        console.log("mic button",vCam);
        // vCam.src("")
        vCam.src = await navigator.mediaDevices.getUserMedia({ audio: true });
        // videoFromIframe.muted = true
        // console.log("mic button end")
    // })
   
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