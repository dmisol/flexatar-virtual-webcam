
function printMediaLineOrder(sdp) {
 // Split the SDP into lines
 const lines = sdp.split("\r\n");
    
 // Filter lines that start with "m="
 const mediaLines = lines.filter(line => line.startsWith("m="));
 
 // Print the order of m-lines with direction
 console.log("Order of m-lines (with direction):");
 
 mediaLines.forEach((line, index) => {
     const mediaType = line.split(" ")[0].substring(2); // Extract media type (audio, video, etc.)
     
     // Look for direction attributes in the SDP
     let direction = "unknown"; 
     if (lines.some(l => l.includes(`a=sendonly`))) {
         direction = "outgoing";
     } else if (lines.some(l => l.includes(`a=recvonly`))) {
         direction = "incoming";
     } else if (lines.some(l => l.includes(`a=sendrecv`))) {
         direction = "sendrecv";
     }
     
     // Print the media line and its direction
     console.log(`${index + 1}: ${line} (Direction: ${direction})`);
 });
}
function wrapPayload(payload,iframeId){
    let sendObject = {}
   
    if (iframeId)
        sendObject[iframeId] = payload
    else
        sendObject = payload
    return sendObject

}

export class MediaConnectionProvider{
    constructor(postMessageProvider,holderId,iframeId){
        this.iframeId = iframeId
        this.holderId = holderId
        this.postMessageProvider = postMessageProvider
        // const config = {
        //     sdpSemantics: "unified-plan",
        //     iceTransportPolicy: "all",
        //     bundlePolicy: "max-bundle",
        // };
        const configuration = {
            iceServers: [], // No STUN or TURN servers
            iceTransportPolicy: "all",
          };
        this.peerConnection = new RTCPeerConnection(configuration);

        
        // console.log("transiver",transiver)
        // this.peerConnection.addTransceiver('audio', { direction: 'sendrecv' });
        this.peerConnection.ontrack = event => {
            
            console.log("ontrack",holderId)
            console.log(event.track)
            // console.log(event.streams[0].getTracks())
            const track = event.track
            if (holderId == "iframe"){
                if (track.kind == "audio"){
                    if (this.onaudioready)this.onaudioready(track)
                }
            }else if (holderId == "host"){
               
                if (track.kind == "video"){
                    if (this.onflexatarready) this.onflexatarready(track)
                }else{
                    if (this.ondelayedaudio)this.ondelayedaudio(track)
                }
            }
            // console.log("audio received",event.streams )
            // for (const stream of event.streams){
            //     console.log(stream.getTracks())
            // }
            // mediastream = event.streams[0]
           
        };

        this.peerConnection.onicecandidate = event => {
            console.log("onicecandidate")
            if (event.candidate) {
   
               
                postMessageProvider.postMessage({flexatar:wrapPayload({ type: 'ice-candidate', candidate: JSON.stringify(event.candidate) },this.iframeId)}, '*');
            }
        };
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection State:', this.peerConnection.connectionState);
            if (this.peerConnection.connectionState == "connected"){
               
                // this.isNegotiating = false
            }
           
        };
        this.isNegotiating = true
        // if (holderId == "iframe"){
            this.peerConnection.onnegotiationneeded = async () => {
                console.log('Negotiation needed...',holderId);
                if (this.isNegotiating) return
                this.isNegotiating = true
                // this.offerMessage()
                // if (holderId == "host")
                    postMessageProvider.postMessage({flexatar:wrapPayload(await this.offerMessage(),this.iframeId)}, '*');
                // else{
                //     postMessageProvider.postMessage({flexatar:{type:"renegotiate"}}, '*');
                // }
               
            }
        // }
    }
    // addTransiver(direction){
    //     const transiver = this.peerConnection.addTransceiver('video', { direction: direction });

    // }
    async recvOffer(data){
        console.log("recvOffer")

        // console.log('Offer SDP:', data.sdp);
        const remoteDesc = new RTCSessionDescription({ type: 'offer', sdp: data.sdp });
        // console.log("remoteDesc",remoteDesc)
        await this.peerConnection.setRemoteDescription(remoteDesc);

        // Create an answer
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        // Send the answer back to the parent
        // const sdp = this.peerConnection.localDescription.sdp 
        // this.postMessageProvider.postMessage({flexatar:{ type: 'answer', sdp: sdp }}, '*');
        console.log("send answer")
        this.postMessageProvider.postMessage({flexatar:wrapPayload({ type: 'answer', sdp: answer.sdp },this.iframeId)}, '*');
        // window.parent.postMessage({flexatar:{ type: 'answer', sdp: this.peerConnection.localDescription.sdp }}, '*');
        // console.log('answer SDP:', this.peerConnection.localDescription.sdp);
    }
    async recvAnswer(data){
        console.log("recvAnswer")
        const remoteDesc = new RTCSessionDescription({ type: 'answer', sdp: data.sdp });
        // console.log("answer remoteDesc",remoteDesc)
        await this.peerConnection.setRemoteDescription(remoteDesc);
    }
    async addIceCandidate(data){
        await this.peerConnection.addIceCandidate(JSON.parse(data.candidate));
    }
    async offerMessage(){

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        console.log(this.holderId)
        // printMediaLineOrder(offer.sdp)

        return { type: 'offer', sdp: offer.sdp }
    }
    addAudioTrack(audiotrack){
       
        if (audiotrack){
            if (this.audioTransiver){
                this.audioTransiver.sender.replaceTrack(audiotrack).then(() => {
                    console.log('Track replaced successfully.');
                }).catch((error) => {
                    console.error('Error replacing track:', error);
                });
                // this.audioTransiver.stop()
            }else{
                console.log("setting new transiver",this.holderId)
                this.audioTransiver = this.peerConnection.addTransceiver(audiotrack, { direction: 'sendonly' });
               
            }

            // this.peerConnection.addTrack(mediaStream.getAudioTracks()[0], mediaStream)
        }else{
            if (this.audioTransiver){
                this.peerConnection.getSenders().forEach(sender => {
                    if (sender.track && sender.track.kind === 'audio') {
                        this.peerConnection.removeTrack(sender);
                    }
                });
                this.audioTransiver.stop()
                this.audioTransiver = null
            }
        }
        // mediaStream.getAudioTracks().forEach(track => this.peerConnection.addTrack(track, mediaStream));
    }
    addAllTraks(mediaStream){
        // this.peerConnection.addStream(mediaStream);
        mediaStream.getTracks().forEach(track => {
            const sender = this.peerConnection.addTransceiver(track, { direction: 'sendonly' });

        //     // console.log("track to add",track)
            // const sender = this.peerConnection.addTrack(track,mediaStream)
        //     console.log(sender)
        });
    }

}