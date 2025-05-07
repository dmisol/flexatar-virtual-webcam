
import {VCAM} from "../../flexatar-package/src/index.js"



let vCam

let videoElement

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
        },
        // lensClassName:"flexatar-lens",
        // progressClassName:"flexatar-progress",
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
micButton.onclick = async () => {
    stopAudioFn()

    console.log("mic button",vCam);
    stream =  await navigator.mediaDevices.getUserMedia({ audio: true });
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
