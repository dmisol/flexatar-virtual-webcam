
import {VCAM} from "../../flexatar-package/src/index.js"
// import * as CamCon from "./vcam-connection.js"
function log() {
    console.log("[VCAM_CREATOR]", ...arguments)
}

let vCam

let videoElement

async function getCroppedImageDataUrlFromBuffer(imageBuffer, targetWidth, targetHeight) {
    const bitmap = await createImageBitmap(imageBuffer);

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    const imgAspect = bitmap.width / bitmap.height;
    const targetAspect = targetWidth / targetHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgAspect > targetAspect) {
        drawHeight = targetHeight;
        drawWidth = bitmap.width * (targetHeight / bitmap.height);
        offsetX = -(drawWidth - targetWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = targetWidth;
        drawHeight = bitmap.height * (targetWidth / bitmap.width);
        offsetX = 0;
        offsetY = -(drawHeight - targetHeight) / 2;
    }

    ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight);

    const blob = await canvas.convertToBlob();

    // Convert Blob to data URL
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    return dataUrl;
}

export function createVCam(request,videoelement,holder,addLog){
    addLog("Waiting v-cam response...")
    videoElement = videoelement
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
                addLog("token not obtained from request")
            }
           return tokenJson.token
         }catch (exception){
            addLog("token request unknown error")

            console.error(exception)
            return
         }
    },
    {
        size:{
            width:240,
            height:320,
        },
        url:{
            vcam:"/vcam",
            lens:"/lens",
            progress:"/progress",
            files:"/files",
            effects: "/effect",
             retarg: "/retarg",
        },
         roundOverlay: true,
         needGallery:false,

        defaultBackgroundsFn: async () => {
            log("defaultBackgroundsFn called")
            const backgroundNames = ["1.jpg", "2.jpg", "3.jpg"]

            const backgrounds = await Promise.all(
                backgroundNames.map(async name => {
                    const res = await fetch(`/files/backgrounds/${name}`);
                    const blob = await res.blob();
                    const file = new File([blob], name, { type: blob.type });
                    return await getCroppedImageDataUrlFromBuffer(file, 480, 640);
                })
            );
            return backgrounds;
        }

    })
    vCam.onReady = ()=>{
        addLog("v-cam ready!")
    }
    vCam.mount(holder)
    // holder.appendChild(iframe)
    holder.style.display = "block"

    videoelement.srcObject = vCam.mediaStream
    return vCam

}


async function createMediaStreamFromAudioURL(audioUrl,onAudioEnded) {
    // Create an audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
    // Create an <audio> element
    const audioElement = new Audio(audioUrl);
    audioElement.crossOrigin = "anonymous"; // Ensure CORS is allowed
    // audioElement.loop = true;
    await audioElement.play();
    audioElement.onended = () => {
        onAudioEnded()
        console.log("Audio playback finished normally.");
      };
    // Create a MediaElementAudioSourceNode
    const sourceNode = audioContext.createMediaElementSource(audioElement);
  
    // Create a ChannelMergerNode to mix stereo to mono
    const merger = audioContext.createChannelMerger(1); // Mono output
  
    // Create a GainNode to average the channels
    const gainL = audioContext.createGain();
    const gainR = audioContext.createGain();
    gainL.gain.value = 0.5;
    gainR.gain.value = 0.5;
  
    // Split stereo into two channels
    const splitter = audioContext.createChannelSplitter(2);
  
    // Connect splitter to gains, then to merger
    sourceNode.connect(splitter);
    splitter.connect(gainL, 0); // Left
    splitter.connect(gainR, 1); // Right
    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 0);
  
    // Create a destination node
    const destinationNode = audioContext.createMediaStreamDestination();
  
    // Connect mono output to destination and optionally to speakers
    merger.connect(destinationNode);
    // let track
    
    return destinationNode.stream;
}

function createDelayedMediaStream(inputStream, delaySeconds = 0.45) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
    // Create a MediaStreamAudioSourceNode from the input stream
    const sourceNode = audioContext.createMediaStreamSource(inputStream);
  
    // Create a DelayNode
    const delayNode = audioContext.createDelay(1);
    delayNode.delayTime.value = delaySeconds;
  
    // Create a MediaStreamDestination to capture the delayed audio
    const destinationNode = audioContext.createMediaStreamDestination();
  
    // Connect nodes: source → delay → destination
    sourceNode.connect(delayNode);
    delayNode.connect(destinationNode);
  
    return destinationNode.stream;
}

let stopAudioFn = ()=>{
    const streams = [videoElement.srcObject,stream]
    for (const stream of streams){
        if (!stream) continue
        const tracks = stream.getAudioTracks()
    
        tracks.forEach((track)=>{
            track.stop()
            stream.removeTrack(track);
        })
    }
   
}
let stream
let streamDelayed
const constraints = {
    audio: {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true
    }
  };
micButton.onclick = async () => {
    stopAudioFn()

    console.log("mic button",vCam);
    stream =  await navigator.mediaDevices.getUserMedia(constraints);
    streamDelayed = createDelayedMediaStream(stream,vCam.delay)
    videoElement.srcObject.addTrack(streamDelayed.getAudioTracks()[0])

    vCam.src = stream;
    videoElement.muted = true
 
}

speakButton.onclick = async () => {
    stopAudioFn()

    stream = await createMediaStreamFromAudioURL("./static/Mary.mp3",()=>{
        vCam.src = null
    })
    streamDelayed = createDelayedMediaStream(stream,vCam.delay)
    vCam.src = stream
    
    
    videoElement.srcObject.addTrack(streamDelayed.getAudioTracks()[0])
    
    videoElement.muted = false

}


stopButton.onclick = async () => {
    vCam.src = null
    stopAudioFn()
}


// connectVirtualCameraButton.onclick = async ()=>{
//     const sig = new CamCon.WebSocketClient()
//     sig.onAnswer = answer =>{
//         console.log("ANSWER",answer)
//         rtcClient.acceptAnswer(answer)
//     }
//     sig.onCandidate = candidate =>{
//         console.log("candidate",candidate)
//         rtcClient.acceptCandidate(candidate)
//     }
//     const rtcClient = new CamCon.RTCClient(CamCon.createFakeStream())
//     rtcClient.onCandidate = candidate=>{
//         console.log("send candidate")
//         sig.sendMessage(candidate)

//     }
//     sig.sendMessage(await rtcClient.createOffer())
// }



