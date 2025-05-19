export class WebSocketClient {
    constructor(url = 'ws://192.168.0.19:9080/websocket'){
        this.socketPromise = new Promise(resolve => {
            const socket = new WebSocket(url); // Change to your WebSocket server URL
            // socket = new WebSocket('ws://localhost:9080/websocket'); // Change to your WebSocket server URL
            socket.binaryType = 'arraybuffer';
            socket.addEventListener('open', () => {
               console.log('Connected to server');
               resolve(socket)
             });
             socket.addEventListener('message', (event) => {
                const arrayBuffer = event.data;

                // Step 2: Convert to string using TextDecoder
                const decoder = new TextDecoder("utf-8");
                const jsonString = decoder.decode(arrayBuffer);
                console.log("msg",jsonString)
                // Step 3: Parse JSON to object
                try {
                  const obj = JSON.parse(jsonString);
                  console.log("Decoded object:", obj);
                  if (obj.type === "answer"){

                    this.onAnswer(obj)

                  }else if (obj.type === "candidate"){
                    this.onCandidate(obj)
                  }
                } catch (e) {
                  console.error("Failed to parse JSON:", e);
                }
             })
      
        })
        
    }
    async sendMessage(offer){
        const jsonStr = JSON.stringify(offer);
        const encoder = new TextEncoder();
        const binaryData = encoder.encode(jsonStr);
        (await this.socketPromise).send(binaryData)
    }
    async sendOffer(offer){
        const jsonStr = JSON.stringify(offer);
        const encoder = new TextEncoder();
        const binaryData = encoder.encode(jsonStr);
        (await this.socketPromise).send(binaryData)
    }
    async sendCandidate(candidate){
        const jsonStr = JSON.stringify(candidate);
        const encoder = new TextEncoder();
        const binaryData = encoder.encode(jsonStr);
        (await this.socketPromise).send(binaryData)
    }
    onCandidate = ()=>{}
    onAnswer = ()=>{

    }
}
export function createFakeStream(){
    const canvas = document.createElement("canvas")
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(50, 50, 100, 100); // Draw red square
    document.body.append(canvas)
    // Step 2: Capture MediaStream from canvas
    const stream = canvas.captureStream(30); // 30 FPS
    (async ()=>{
        function drawLoop() {
            ctx.fillStyle = "blue";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          
            ctx.fillStyle = "red";
            ctx.font = "30px sans-serif";
            ctx.fillText("Time: " + new Date().toLocaleTimeString(), 50, 240);
          
            requestAnimationFrame(drawLoop);
          }
          drawLoop();  
    })()
    
    return stream
}
export class RTCClient{
    constructor(stream){
        this.peer = new RTCPeerConnection({ iceTransportPolicy: "all",sdpSemantics: 'unified-plan'});
        const vTrack = stream.getVideoTracks()[0]
        console.log(vTrack)
        // this.peer.addTrack(vTrack, stream)
        const transceiver = this.peer.addTransceiver(vTrack, { direction: 'sendonly' })
      
        const codecs = RTCRtpSender.getCapabilities('video').codecs;
        const h264Codecs = codecs.filter(c => c.mimeType === 'video/H264');
         transceiver.setCodecPreferences(h264Codecs);

        // stream.getTracks().forEach(track => this.peer.addTrack(track, stream));
        this.peer.onicecandidate = (event) => {
            if (event.candidate) {
              console.log("New ICE candidate:", event.candidate);
              if (event.candidate)
                this.onCandidate({type:"candidate",sdp:event.candidate.candidate,sdpMid:event.candidate.sdpMid,sdpMLineIndex:event.candidate.sdpMLineIndex})
              // Send the candidate to the remote peer using signaling
              
            } else {
              console.log("All ICE candidates have been sent.");
            }
          };

          const pc = this.peer;
          
          // Log signaling state
          pc.onsignalingstatechange = () => {
            console.log('[WebRTC] signalingState:', pc.signalingState);
          };
          
          // Log ICE connection state
          pc.oniceconnectionstatechange = () => {
            console.log('[WebRTC] iceConnectionState:', pc.iceConnectionState);
          };
          
          // Log ICE gathering state
          pc.onicegatheringstatechange = () => {
            console.log('[WebRTC] iceGatheringState:', pc.iceGatheringState);
          };
          
          // Log connection state (WebRTC 1.0+)
          pc.onconnectionstatechange = () => {
            console.log('[WebRTC] connectionState:', pc.connectionState);
          };
          pc.onnegotiationneeded = () => {
            console.log('[WebRTC] onnegotiationneeded: Renegotiation triggered');
          };
          const self = this 
          this.remoteDescriptionPromise = new Promise(resolve=>{
            self.remoteResolve = resolve
          })
    
    }
    onCandidate = ()=>{}
    async createOffer(){
        const offer  = await this.peer.createOffer()
        await this.peer.setLocalDescription(offer);
        return {type:"offer",sdp:this.peer.localDescription.sdp}

        //   .then(offer => {
        //     return this.peer.setLocalDescription(offer);
        //   })
        //   .then(() => {
              
        //        const jsonStr = JSON.stringify({offer:this.peer.localDescription.sdp});
        //        const encoder = new TextEncoder();
        //        const binaryData = encoder.encode(jsonStr);
        //       socket.send(binaryData)
              
        //     document.getElementById('offerOutput').textContent = JSON.stringify(peer.localDescription, null, 2);
        //   })
        //   .catch(console.error);
    }
    async acceptAnswer(answer){
        const remoteDesc = new RTCSessionDescription({type:"answer",sdp:answer.sdp});
        console.log(remoteDesc)
        await this.peer.setRemoteDescription(remoteDesc);
        this.remoteResolve() 
    }
    async acceptCandidate(msg){
        await this.remoteDescriptionPromise
        if (msg.sdp){
            const candidate = new RTCIceCandidate({
                candidate: msg.sdp,
                sdpMid: msg.sdpMid,
                sdpMLineIndex: msg.sdpMLineIndex
            });
        
            this.peer.addIceCandidate(candidate);
        }
    }
}
