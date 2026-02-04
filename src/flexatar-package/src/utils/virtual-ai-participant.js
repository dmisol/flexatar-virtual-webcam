
function log() {
    console.log("[OpenAiVirtualParticipant]", ...arguments)
}

export class OpenAiVirtualParticipant {
    constructor(config, externalTrack, fetchOverride, timeout = 5000,constraints = {audio:true}) {
        this._init(config, externalTrack, fetchOverride, timeout,constraints)
    }
    static MCIROPHONE_ERROR = "mic_error"
    static CONNECTION_ERROR = "connection_error"
    static TIMEOUT_ERROR = "timeout_error"
    async _init(config, externalTrack, fetchOverride, timeout,constraints) {
        const _this = this;
        if (!externalTrack) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                externalTrack = stream.getAudioTracks()[0]
                // stream.getTracks().forEach(track => pc.addTrack(track, stream));
                _this.microphoneStream = stream
            } catch (err) {
              
                log(OpenAiVirtualParticipant.MCIROPHONE_ERROR)
                if (this.onError) this.onError(OpenAiVirtualParticipant.MCIROPHONE_ERROR);
                return
            }
        }

        this.pc = new RTCPeerConnection();
        this.pc.doNotPatch = true
        const pc = this.pc;
        // Optional: play remote audio


        pc.onconnectionstatechange = () => {
            log('Connection state:', pc.connectionState);
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                if (_this.onConnectionLost()) _this.onConnectionLost();
                if (_this.microphoneStream) {
                    _this.microphoneStream.getTracks().forEach(track => track.stop());
                }


            }
        };



        const connectionTimeout = setTimeout(() => {
            _this.terminate()
            if (this.onError) this.onError(OpenAiVirtualParticipant.TIMEOUT_ERROR);

        }, timeout)
        pc.ontrack = (event) => {
            clearTimeout(connectionTimeout)
            log("obtained audio track from openai")
            if (this.onStream) this.onStream(event.streams[0])
        };

        // if (!externalTrack) {
        //     // Add local microphone (optional)
        //     try {
        //         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        //         stream.getTracks().forEach(track => pc.addTrack(track, stream));
        //         _this.microphoneStream = stream
        //     } catch (err) {
        //         clearTimeout(connectionTimeout)
        //         log(OpenAiVirtualParticipant.MCIROPHONE_ERROR)
        //         if (this.onError) this.onError(OpenAiVirtualParticipant.MCIROPHONE_ERROR);
        //         return
        //     }
        // } else {
        pc.addTrack(externalTrack)
        // }


        // Create SDP offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        let data
        if (fetchOverride) {
            data = await fetchOverride(offer.sdp, config.instructions);


        } else {
            // Send the offer to OpenAI Realtime API
            const response = await fetch('https://api.openai.com/v1/realtime/calls', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    // 'Content-Type' is set automatically by FormData
                },
                body: (() => {
                    const form = new FormData();
                    form.append('sdp', offer.sdp);
                    form.append('session', JSON.stringify({
                        type: 'realtime',
                        model: 'gpt-realtime-mini',
                        instructions: config.instructions
                    }));
                    return form;
                })()
            });
            if (!response.ok) {
                log(OpenAiVirtualParticipant.CONNECTION_ERROR)
                clearTimeout(connectionTimeout)
                if (this.onError) this.onError(OpenAiVirtualParticipant.CONNECTION_ERROR);
                return
            }
            data = await response.text();
        }
        if (!data) {
            clearTimeout(connectionTimeout)
            if (this.onError) this.onError(OpenAiVirtualParticipant.CONNECTION_ERROR);
            return
        }
        // log("obtained sdp from openai", data)
        // Set remote description
        const answer = { type: 'answer', sdp: data };
        await pc.setRemoteDescription(answer);

        // console.log('Realtime connection established!');
    }
    onTerminate
    terminate() {
        if (this.onTerminate) this.onTerminate();
        if (!this.pc) return
        // this.pc.getSenders().forEach(sender => sender.track?.stop());
        this.pc.close();
        this.pc = null
    }

}