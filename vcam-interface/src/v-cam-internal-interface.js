class WHIPClient{
    constructor(tracks,onDisconnected){
        const self = this
        this.localTracks = tracks
        this.onDisconnected = onDisconnected
        this.pc = new RTCPeerConnection({ iceTransportPolicy: "all",sdpSemantics: 'unified-plan'});
        
        this.pc.onconnectionstatechange = () => {
            console.log('[WHIPClient][WebRTC] connectionState:', self.pc.connectionState);
            if (self.pc.connectionState === "disconnected"){
                self.close()
                
             
            }
        };
        this.candidateListPromise = new Promise(resolve=>{
            const candidateList = []
            self.pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("[WHIPClient][WebRTC] New ICE candidate:", event.candidate);
                    candidateList.push({candidate:event.candidate.candidate,sdpMid:event.candidate.sdpMid,sdpMLineIndex:event.candidate.sdpMLineIndex})
                } else {
                    resolve(candidateList)
                    console.log("[WHIPClient][WebRTC] All ICE candidates have been sent.");
                }


            };
        })
        for (const t of tracks){
            self.pc.addTransceiver(t, { direction: 'sendonly' })
        }
    }
    async makeOffer(){
        const self = this
        const offerPromise = new Promise(resolve =>{
            self.pc.createOffer().then(offer =>{
                self.pc.setLocalDescription(offer).then(()=>{
                    resolve(offer.sdp)
                })
            })
        })
        const result = await Promise.all([offerPromise,this.candidateListPromise])
        return {offer:result[0],ice:result[1]}
    }

    async acceptAnswer(){
        const {answer,ice} = arguments[0]
        //  console.log("[WHIPClient][WebRTC]answer.",answer);
        const remoteDesc = new RTCSessionDescription({type:"answer",sdp:answer});
        const self = this
        this.pc.setRemoteDescription(remoteDesc).then(()=>{
                        
            for (const c of ice){
                const candidate = new RTCIceCandidate({
                    candidate: c.candidate,
                    sdpMid: c.sdpMid,
                    sdpMLineIndex: c.sdpMLineIndex
                });
            
                self.pc.addIceCandidate(candidate);
            }
        })
    }
    close(){
        this.pc.close()
        this.localTracks.forEach(track => track.stop());
        this.pc.onicecandidate = null
        this.pc.ontrack = null
        if (this.onDisconnected) this.onDisconnected()
        this.localTracks=null
        this.onDisconnected = null
    }

}

class WHIPServer{
    constructor(onTrack,onDisconnected){
        const self = this
        this.onDisconnected = onDisconnected
        this.pc = new RTCPeerConnection({ iceTransportPolicy: "all",sdpSemantics: 'unified-plan'});
        this.pc.onconnectionstatechange = () => {
            console.log('[WHIPServer][WebRTC] connectionState:', this.pc.connectionState);
            if (self.pc.connectionState === "disconnected"){
                 self.close()
            }
        
        };
        this.localTracks = []
        this.pc.ontrack = e =>{
            console.log("[VCAM][WHIPServer]track received1",e.track)
            // if (onReceiver) onReceiver()
            if (e.track){
                console.log("e.track",e.track)
                self.localTracks.push(e.track)
                if (onTrack) onTrack(e.track)
            }else{
                console.log("[VCAM][WHIPServer] no audio")
                // if (transceiver.receiver.track){
                    // const checkInterval = setInterval(() => {
                    //     const receiverTrack = transceiver.receiver.track;
                    //     console.log("transceiver.receiver.track",transceiver.receiver.track)
                    //     if (receiverTrack && receiverTrack.readyState !== 'ended') {
                    //         clearInterval(checkInterval);
                    //         console.log("[VCAM][WHIPServer] track received later")
                    //         if (onTrack) onTrack(receiverTrack)

                    //     }
                    // }, 100);
                // }
            }
        }
        
        this.candidateListPromise = new Promise(resolve=>{
            const candidateList = []
            self.pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("[WHIPServer][WebRTC] New ICE candidate:", event.candidate);
                    candidateList.push({candidate:event.candidate.candidate,sdpMid:event.candidate.sdpMid,sdpMLineIndex:event.candidate.sdpMLineIndex})
                } else {
                    resolve(candidateList)
                    console.log("[WHIPServer][WebRTC] All ICE candidates have been sent.");
                }


            };
        })
        this.answerPromise = new Promise(resolve =>{
            self.answerPromiseResolve = resolve
        })
    }

    async makeAnswer(){
        console.log("[WHIPServer][WebRTC] makeAnswer",arguments)
        const {offer,ice} = arguments[0]
        const remoteDesc = new RTCSessionDescription({type:"offer",sdp:offer});
        const self = this
        this.pc.setRemoteDescription(remoteDesc).then(()=>{
            self.pc.createAnswer().then(answer =>{
                self.pc.setLocalDescription(answer).then(()=>{
                    self.answerPromiseResolve(answer.sdp)
                })
            })
            
            for (const c of ice){
                const candidate = new RTCIceCandidate({
                    candidate: c.candidate,
                    sdpMid: c.sdpMid,
                    sdpMLineIndex: c.sdpMLineIndex
                });
            
                self.pc.addIceCandidate(candidate);
            }
        })
        const result = await Promise.all([this.answerPromise,this.candidateListPromise])
        return {answer:result[0],ice:result[1]}
    }
    close(){
        this.pc.close()
        this.localTracks.forEach(track => track.stop());
        this.pc.onicecandidate = null
        this.pc.ontrack = null
        if (this.onDisconnected) this.onDisconnected()
        this.localTracks=null
        this.onDisconnected = null
    }
}
function getMessageProvider(){
  let msgProvider = window
  if (msgProvider.parent) msgProvider = msgProvider.parent
  return msgProvider
}


export function makeWHIPServer(onMediaProvided,onDisconnected){
  const servers = {};
  const clients = {};
  window.addEventListener("message", async e=>{
    const msg = e.data
    if (!msg) return;
    const connectionId = msg.id
    console.log("vcam received message",msg)
    if (msg.offer && msg.type === "SRC_MEDIA"){

      const whipServer = new WHIPServer(async track=>{
        console.log("[VCAM] ontrack",track)

        const whipClient = new WHIPClient(await onMediaProvided(track),()=>{
          delete clients[connectionId]
        })
        clients[connectionId]=whipClient
        whipClient.makeOffer().then(offer=>{
          offer.type = "VCAM_MEDIA"
          offer.id = connectionId
          getMessageProvider().postMessage(offer,"*")
        })
      },()=>{
        
        delete servers[connectionId]
      })
      servers[connectionId] = whipServer
      whipServer.onDisconnected = ()=>{
        if (onDisconnected) onDisconnected()
      }
      whipServer.makeAnswer(msg).then(answer=>{
        answer.type = msg.type
        answer.id = connectionId
        getMessageProvider().postMessage(answer,"*")
      })
      

    } if (msg.answer && msg.type === "VCAM_MEDIA"){
       clients[connectionId].acceptAnswer(msg)
    }
  })
}
