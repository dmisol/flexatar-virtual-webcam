
import ManagerWorker from "./worker/manager.worker.js"
import {RenderWorkerWarper } from "./worker/install-render-worker.js"
import { Manager,ManagerConnection } from "./ftar-manager/ftar-connection.js"
import { FlexatarLens } from "./ftar-manager/ftar-lens.js"

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

class ManagerWorkerWarper{
    constructor(tokenFunc){
        const managerWorker = new ManagerWorker()

        managerWorker.onmessage = async (event)=>{
            const msg = event.data
            if (!msg) return
            if (msg.error){
                console.log(msg.error)
            }else if (msg.tokenRequest){
                tokenFunc().then(token=>{
                    managerWorker.postMessage({token})
                })
               

                return 
            }
        }
        this.managerWorker = managerWorker
    }
    addPort(port){
        this.managerWorker.postMessage({ftarUIPort:port},[port])
    }
    addFtarLensPort(port){
        this.managerWorker.postMessage({ftarLensPort:port},[port])
    }
    addProgressPort(port){
        this.managerWorker.postMessage({ftarProgressPort:port},[port])
    }
    showProgress(){
        this.managerWorker.postMessage({showProgress:true})
    }

}

class VCamMediaStream{
    constructor(opts){
    const canvas = document.createElement("canvas");
        // canvas.width=480
        // canvas.height=640
    canvas.width = opts?.width ?? 240
    canvas.height = opts?.height ?? 320
    canvas.style.display = "none"
    this.canvas=canvas
    canvas.flexatarCanvas = true

    document.body.appendChild(canvas)

    const ctx = canvas.getContext("bitmaprenderer");
    


    const channel = new MessageChannel();
    this.mediaPort = channel.port2
    this.selfPort = channel.port1
    let firstFrame = true
    channel.port1.onmessage = e =>{
        if (firstFrame){
            console.log("stream ready")
            firstFrame=false
            this.#onFirstFrame()
        }
        if (e.data && e.data.frame ){
            // console.log("drawing")
            ctx.transferFromImageBitmap(e.data.frame);
        }
    }
    }
    get portToSend(){
        return this.mediaPort
    }
    get port(){
        return this.selfPort
    }
    get stream(){
        return this.canvas.captureStream(30)
    }
    #onFirstFrame = ()=>{}
    set onFirstFrame(fn){
        this.#onFirstFrame = fn
    }
    destroy(){

        this.selfPort.postMessage({closing:true})
        this.selfPort.close()
        this.canvas.remove()
    }
}

class VCamControlUI{
    constructor(url){
       
        const iframe = document.createElement("iframe")
        iframe.src = url
        this.element = iframe
        this.managerPort = new Promise(resolve=>{
            const handler = (e)=>{
                const msg = e.data
                if (!msg) return
                console.log(msg)
                if (msg.ftarUIPort){
                    resolve(msg.ftarUIPort)
                    window.removeEventListener("message",handler)
                }
            }
            window.addEventListener("message",handler)

        })
    }
    /**
     * @param {Transferable} port
     */
    set controllerPort(port){
        this.managerPort.then(()=>{
            this.element.contentWindow.postMessage({flexatarControllerPort:port},"*",[port])
        })
    }
}


class VCAM{
    constructor(tokenFn){
        const managerWorker = new ManagerWorkerWarper(tokenFn)
        this.managerWorker = managerWorker
        const flexLens = new FlexatarLens("/lens")
        const flexProgress = new FlexatarLens("/progress")
        
        const iframeUrl = "/vcam"
        const vCamUi = new VCamControlUI(iframeUrl)
        vCamUi.managerPort.then(port=>{
            managerWorker.addPort(port)
            managerWorker.addFtarLensPort(flexLens.portOut)
            managerWorker.addProgressPort(flexProgress.portOut)
        })

        const iframe = vCamUi.element
     
        iframe.style.width = "60px"
        iframe.style.height = "300px"
        iframe.style.border = "none"
        // window.addEventListener("message",(e)=>{
        //     const msg = e.data
        //     if (!msg) return
        //     console.log(msg)
        //     if (msg.ftarUIPort){
        //         managerWorker.addPort(msg.ftarUIPort)
        //     }
        // })
         
     
        const renderer = new RenderWorkerWarper("/files")
        renderer.onManagerPort = port=>{
            console.log("on top manager port",port)
            managerWorker.addPort(port)
        }
        renderer.getControllerPort().then(port=>{
        vCamUi.controllerPort = port
        })

        //  renderer.onControllerPort = port=>{
        //      console.log("controller port",port)
        //      // flexatarControllerPort
        //      iframe.contentWindow.postMessage({flexatarControllerPort:port},"*",[port])
        //  }

        //  renderer.start()
         const vCamStream = new VCamMediaStream()
         this.vCamStream = vCamStream

        //  const canvas = document.createElement("canvas");
        //      // canvas.width=480
        //      // canvas.height=640
        //  canvas.width=240
        //  canvas.height=320
        //  canvas.style.display = "none"
        //  const ctx = canvas.getContext("bitmaprenderer");
     
     
        //  const channel = new MessageChannel();
         renderer.addMediaPort(vCamStream.portToSend)
        //  let firstFrame = true
        //  channel.port1.onmessage = e =>{
        //      if (firstFrame){
        //          console.log("stream ready")
        //          // if (!isCameraReady){
             
        //          // }
        //          // isCameraReady=true
     
                
        //          // mediaPort = channel.port1
        //          firstFrame=false
        //      }
        //      if (e.data && e.data.frame ){
        //          ctx.transferFromImageBitmap(e.data.frame);
                 
                
               
     
        //      }
        //  }
        //  iframe.onload = ()=>{
        //     renderer.getControllerPort()

        //  }
        //  this.canvas = canvas
         this.iframe = iframe
        //  this.mediaPort = channel.port1
    }
    mount(holder){
        holder.appendChild(this.iframe)
        holder.style.display = "block"
        console.log("appending iframe to",holder)

    }
    showProgress(){
        this.managerWorker.showProgress()
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
                    this.vCamStream.port.postMessage({audioBuffer},[audioBuffer])
                    // console.log("reading track",track.id)
                    
                }
            })()
        }else{
            // (async ()=>{
                const trackProcessor = new TrackProcessor(mediaStream)
                trackProcessor.onAudio = async audioData=>{
                    console.log("onaudio")
                    const audioBuffer = audioData.buffer
                    this.vCamStream.port.postMessage({audioBuffer},[audioBuffer])
                }
            // })()
        }
    }
    get mediaStream(){
        return this.vCamStream.stream
    }
    
}
export {VCAM,Manager,ManagerConnection,VCamMediaStream,ManagerWorkerWarper,RenderWorkerWarper,FlexatarLens}