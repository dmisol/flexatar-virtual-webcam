
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
class MediaRecorderBasedTrackProcessor{
    constructor(track){
        const stream = new MediaStream([track])
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
            if (self.onAudio) self.onAudio(pcm.buffer)
                // console.log(pcm)
            // console.log("Decoded PCM (Float32Array):", pcm);
          } catch (err) {
            console.error("Decode error:", err);
          }
        };
        recorder.start(1);
        this.recorder = recorder
    }
    stop(){
        this.recorder.stop()
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
    destroy(){
        this.managerWorker.onmessage = undefined
        this.managerWorker.terminate();
        this.managerWorker = undefined 
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

function createTextBitmap(text, width, height) {
  const offscreen = new OffscreenCanvas(width, height);
  const ctx = offscreen.getContext("2d");

  // Background (optional)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  // Text
  ctx.fillStyle = "white";
  ctx.font = `${Math.floor(width/10)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);

  // Return a promise that resolves with the ImageBitmap
  return offscreen.transferToImageBitmap();
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
    const bitmap = createTextBitmap("WARMING UP",canvas.width,canvas.height)
    ctx.transferFromImageBitmap(bitmap);


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
    set size(val){
        this.canvas.width = val.width
        this.canvas.height = val.height
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
    destroy(){
        this.element.remove()
    }
}


class VCAM{
    constructor(tokenFn,opts){
        if (!opts){
            opts = {
                size:{
                    width:640,
                    height:480,
                },
                url:{
                    vcam:"/vcam",
                    lens:"/lens",
                    progress:"/progress",
                    files:"/files",
                }
            }
        }else{
            if (!opts.size){
                opts.size = {
                    width:640,
                    height:480,
                }
            }
            if (!opts.url){
                opts.url = {
                    vcam:"/vcam",
                    lens:"/lens",
                    progress:"/progress",
                    files:"/files",
                }
            }
        }
        const managerWorker = new ManagerWorkerWarper(tokenFn)
        this.managerWorker = managerWorker
        const flexLens = new FlexatarLens(opts.url.lens,opts.lensClassName)
        const flexProgress = new FlexatarLens(opts.url.progress,opts.progressClassName)
        this.flexLens=flexLens
        this.flexProgress=flexProgress
        
        const iframeUrl = opts.url.vcam
        const vCamUi = new VCamControlUI(iframeUrl)
        vCamUi.managerPort.then(port=>{
            managerWorker.addPort(port)
            managerWorker.addFtarLensPort(flexLens.portOut)
            managerWorker.addProgressPort(flexProgress.portOut)
        })

        const iframe = vCamUi.element
        this.element = iframe
        iframe.style.width =  opts.vCamUI?.width ? opts.vCamUI?.width :"60px"
        iframe.style.height = opts.vCamUI?.height ? opts.vCamUI?.height :"300px"
        iframe.style.border = "none"
        // window.addEventListener("message",(e)=>{
        //     const msg = e.data
        //     if (!msg) return
        //     console.log(msg)
        //     if (msg.ftarUIPort){
        //         managerWorker.addPort(msg.ftarUIPort)
        //     }
        // })
         
     
        const renderer = new RenderWorkerWarper(opts.url.files,opts.size)
        renderer.onManagerPort = port=>{
            console.log("on top manager port",port)
            managerWorker.addPort(port)
        }
        renderer.getControllerPort().then(port=>{
        vCamUi.controllerPort = port
        })
        renderer.onReady = ()=>{
            if (this.onReady)this.onReady()

          
        }

        this.renderer = renderer;

        const vCamStream = new VCamMediaStream(opts.size)
        this.vCamStream = vCamStream
        renderer.addMediaPort(vCamStream.portToSend)
        this.iframe = iframe

    }
    get lensElement(){

    }
    get progressElement(){
        
    }
    get uiElement(){
        
    }
    get canvas(){
        return this.vCamStream.canvas
    }

    mount(holder){
        holder.appendChild(this.iframe)
        holder.style.display = "block"
        console.log("appending iframe to",holder)

    }
    destroy(){
        this.iframe.remove()
        this.managerWorker.destroy()
        this.vCamStream.destroy()
        this.flexLens.destroy()
        this.flexProgress.destroy()
        this.renderer.destroy()

    }
    showProgress(){
        this.managerWorker.showProgress()
    }
    currentTrackProcessor
    currentReader
    set src(mediaStream) {
        console.log("start lipysnc",mediaStream);

        const isTrackProcessorAvailable =
                'MediaStreamTrackProcessor' in window &&
                typeof window.MediaStreamTrackProcessor === 'function';
      
        // const TrackProcessor = isTrackProcessorAvailable ? NativeTrackProcessor : MediaRecorderBasedTrackProcessor    
        if (this.currentTrackProcessor){
            this.currentTrackProcessor.stop()
            this.currentTrackProcessor = null
        }
        if (!mediaStream) {
            setTimeout(
                ()=>{
                    this.vCamStream.port.postMessage({closeMouth:true})
                },
                700
            )
            return
        }
        getAudioTrack(mediaStream).then(trackMono=>{

            this.currentTrackProcessor = isTrackProcessorAvailable ? (new NativeTrackProcessor(trackMono)) : (new MediaRecorderBasedTrackProcessor(trackMono))
            this.currentTrackProcessor.onAudio = audioBuffer=>{
                // console.log("audioBuffer")
                this.vCamStream.port.postMessage({audioBuffer},[audioBuffer])

            }
        })

    }
    get mediaStream(){
        return this.vCamStream.stream
    }
    get delay(){
        const isTrackProcessorAvailable =
            'MediaStreamTrackProcessor' in window &&
            typeof window.MediaStreamTrackProcessor === 'function';
        return isTrackProcessorAvailable ? 0.45 : 0.95
        // return isTrackProcessorAvailable ? 0.45 : 0.87
    }

    set size(val){
        this.renderer.size = val
        this.vCamStream.size = val
    }
}

class NativeTrackProcessor{
    constructor(audioTrack){
        this.active = true;
        const self = this;
        (async ()=>{
            console.log("start lipysnc")
            const track = audioTrack
            // const track = mediaStream.getAudioTracks()[0]
            const media_processor = new MediaStreamTrackProcessor(track);
            const reader = media_processor.readable.getReader();
            self.reader = reader
            while (self.active) {
            
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
                // console.log("Audio")
                self.onAudio(audioBuffer)
                // this.vCamStream.port.postMessage({audioBuffer},[audioBuffer])
                // console.log("reading track",track.id)
                
            }
        })()
    }
    onAudio = ()=>{}
    async stop(){
        await this.reader.cancel()
        this.reader.releaseLock();
        this.reader = null
        this.active = false

    }
}

async function getAudioTrack(input) {
    // Case 1: Input is already an audio track
    if (input instanceof MediaStreamTrack && input.kind === 'audio') {
      return input;
    }
  
    // Case 2: Input is a MediaStream
    if (input instanceof MediaStream) {
      const audioTracks = input.getAudioTracks();
      if (audioTracks.length === 0) throw new Error('No audio track found in MediaStream');
      return audioTracks[0]
      
    }
    throw new Error('Unsupported input type');
  }



  async function convertToMonoTrack(stream) {
    return new Promise((resolve, reject) => {
      const context = new (window.AudioContext || window.webkitAudioContext)();
  
      const source = context.createMediaStreamSource(stream);
      const merger = context.createChannelMerger(1); // mono output
  
      // Sum channels into mono
      source.connect(merger, 0, 0);
  
      const dest = context.createMediaStreamDestination();
      merger.connect(dest);
  
      const monoTrack = dest.stream.getAudioTracks()[0];
      if (!monoTrack) return reject(new Error('Mono track creation failed'));
  
      resolve(monoTrack);
    });
  }

  async function delayAudioTrack(track, delayMs = 450) {
    if (!(track instanceof MediaStreamTrack) || track.kind !== 'audio') {
      throw new Error('Input must be an audio MediaStreamTrack');
    }
  
    const stream = new MediaStream([track]);
    const context = new (window.AudioContext || window.webkitAudioContext)();
  
    const source = context.createMediaStreamSource(stream);
    const delayNode = context.createDelay();
    delayNode.delayTime.value = delayMs / 1000; // convert ms to seconds
  
    const dest = context.createMediaStreamDestination();
    source.connect(delayNode).connect(dest);
  
    const delayedTrack = dest.stream.getAudioTracks()[0];
    if (!delayedTrack) throw new Error('Failed to create delayed audio track');
  
    return delayedTrack;
  }
export {VCAM,Manager,ManagerConnection,VCamMediaStream,ManagerWorkerWarper,RenderWorkerWarper,FlexatarLens}