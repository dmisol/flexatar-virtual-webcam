
function concatenateFloat32Arrays(arrays) {
    // Calculate total length
    let totalLength = 0;
    for (let i = 0; i < arrays.length; i++) {
        totalLength += arrays[i].length;
    }

    // Create a new Float32Array with the total length
    let result = new Float32Array(totalLength);

    // Copy data from input arrays to the result array
    let offset = 0;
    for (let i = 0; i < arrays.length; i++) {
        result.set(arrays[i], offset);
        offset += arrays[i].length;
    }

    return result;
}

class MyAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.windowSize = 800 * sampleRate / 16000;
//    this.audioBuffer = new Float32Array(this.windowSize);
//    this.bufferWritePosition = 0;
//    console.log("rec");
    this.isActive = false;
    this.port.onmessage = (event) => {
        this.isActive = event.data;
//        console.log("this.isActive");
   }
   const { create, ConverterType } = globalThis.LibSampleRate;
   const nChannels = 1
   const outputSampleRate = 16000;
   create(nChannels, sampleRate, outputSampleRate, {
    converterType: ConverterType.SRC_SINC_FASTEST, // or some other quality
    }).then((src) => {
      this.resampler = src;
    });
    this.collector = []
    
  }

  process(inputList, outputList, parameters) {

    const input = inputList[0];
    const inputChannel0 = input[0];
    var port = this.port;


      const self = this
      this.addBuffer(inputChannel0,function (buffer){
        if (self.resampler){
          const resampled = self.resampler.simple(buffer)
          port.postMessage(resampled);
        }
        // port.postMessage(buffer);
      },function (){port.postMessage("");});


    return true;
  }
  addBuffer(buffer,onBufferReady,onFail){
    if (buffer){
      this.collector.push(new Float32Array(buffer));
      if ((this.collector.length - 1) * buffer.length +  this.collector[0].length >this.windowSize) {
          const audioBuffer = concatenateFloat32Arrays(this.collector);
          // const message = {audioBuffer:,sampleRate:sampleRate}
          onBufferReady(audioBuffer.subarray(0,this.windowSize));
          this.collector = [];
          const tail = audioBuffer.subarray(this.windowSize,audioBuffer.length);
          this.collector.push(tail);
      }
    }else{
      onFail()
    }
  }
}


registerProcessor("my-audio-processor", MyAudioProcessor);

