
  function checkCodecs(){
    const options = [
        { mimeType: 'video/mp4;codecs=avc1,mp4a.40.2' }, // MP4 with H.264
        { mimeType: 'video/mp4'}, // MP4 with default coded
        { mimeType: 'video/webm;codecs=h264,opus' }, // WebM with H.264
        { mimeType: 'video/webm;codecs=vp8,opus' },  // WebM with VP8
        { mimeType: 'video/webm' },             // WebM with default codec
        { mimeType: 'video/x-matroska;codecs=avc1,opus' }, // MKV with H.264 (if supported)
        { mimeType: 'video/ogg' },              // Ogg as a fallback
      ];
    
      for (const option of options) {
        if (MediaRecorder.isTypeSupported(option.mimeType)) {
          return option.mimeType; // Return the first supported type
        }
      }
}



export class FlexatarRecorder{
    recordedChunks = []
    constructor(videoStream){
        this.currentRecordingType = checkCodecs() 
        // this.currentRecordingType = getAllSupportedMimeTypes() 
        // this.currentRecordingType = ["video/webm;codecs=h264"]
        // console.log(this.currentRecordingType)
        // const options = { mimeType: "video/webm;codecs=vp8" }; 
        const options = { mimeType: this.currentRecordingType,
            videoBitsPerSecond: 1048576,
         }; 
        this.mediaRecorder = new MediaRecorder(videoStream, options);
       
        // if (aud.duration === Infinity) {
        //     // Set it to bigger than the actual duration
        //     aud.currentTime = 1e101;
        //     aud.addEventListener("timeupdate", () => {
        //       console.log("after workaround:", aud.duration);
        //       aud.currentTime = 0;
        //     }, { once: true });
        // }
        
        this.mediaRecorder.ondataavailable = event =>{
            // console.log(event.data);
            // console.log("data-available");
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
               
                
            }
        }

        this.mediaRecorder.onerror = e => {
            console.log(e);
        }

        
        this.mediaRecorder.onstop = () => {
           
            // console.log("record on stop",this.onRecordStop)
            // const blob = new Blob(this.recordedChunks, { type: "video/mp4" });
            const blob = new Blob(this.recordedChunks, { type: this.currentRecordingType,bitsPerSecond:100000 });
            // this.recordedChunks = [] 
            const self = this;
            const duration = Date.now() - this.startTime;
            // fixWebmDuration(blob, duration, function(fixedBlob) {
                const url = URL.createObjectURL(blob);
                const file = new File([blob], 'recorded_video.mp4', { type: self.currentRecordingType });
                if (self.#onready)self.#onready(url,file)
                   
            // });
            // getSeekableBlob(blob,seekableBlob=>{
            //     const url = URL.createObjectURL(seekableBlob);
            //     const file = new File([seekableBlob], 'recorded_video.mp4', { type: this.currentRecordingType[0] });
            //     if (this.#onready)this.#onready(url,file)
            // })

           

            
            // setupFffmeg(url)
           
                    // if (this.#onready)this.#onready(url,file)
                        // 
                        this.mediaRecorder.onstop = null
                        this.mediaRecorder.ondataavailable = null
                        this.mediaRecorder.onerror = null
       
            
        };
       
    }

    #onready
    /**
     * @param {any} fn
     */
    set onready(fn){
        this.#onready=fn
    }
    #interval
    start(){
        this.mediaRecorder.start();
        this.startTime = Date.now();
       
        // this. #interval = setInterval(()=>{
        //     this.mediaRecorder.requestData()
        //     console.log("requestData")
        // },1000)

    }
    stop(){
        // clearInterval( this.#interval)
        this.mediaRecorder.stop()
      
        // this.mediaRecorder.requestData()
        // setTimeout(()=>{ this.mediaRecorder.stop()},2000)
       
    }
    
}
let sourceNode
export function mediaStreamFromAudio(audioElement, audioContext) {
    audioElement.crossOrigin = 'anonymous';
    try{
        sourceNode = audioContext.createMediaElementSource(audioElement);

    }catch{}
    const destination = audioContext.createMediaStreamDestination();
    sourceNode.disconnect();
    // Connect to both destination (for MediaStream) and audioContext.destination (for speakers)
    sourceNode.connect(destination);
    // sourceNode.connect(audioContext.destination);

    const mediaStream = destination.stream;

    // Save original state
    const originalVolume = audioElement.volume;
    const originalMuted = audioElement.muted;

    // Return both mediaStream and a restore function
    function restore() {
        try {
            sourceNode.disconnect();
            // Reconnect to speakers after disconnecting
            sourceNode.connect(audioContext.destination);
        } catch (e) {}
        audioElement.volume = originalVolume;
        audioElement.muted = originalMuted;
    }

    return { mediaStream, restore };
}

export function addAudioStream(videoStream,audioStream){
    const audioTrack = audioStream.getAudioTracks()[0];
    videoStream.addTrack(audioTrack);
    return videoStream
}