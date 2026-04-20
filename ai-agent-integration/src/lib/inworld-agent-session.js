import {
  AGENT_GREETING,
  AGENT_INSTRUCTIONS,
  AGENT_MODEL,
  AGENT_TTS_MODEL,
  AGENT_VOICE
} from "./agent-config.js";

export class InworldAgentSession {
  constructor(options) {
    this.renderer = options.renderer;
    this.onStatus = options.onStatus;
    this.onLog = options.onLog;
    this.onStateChange = options.onStateChange;

    this.peerConnection = null;
    this.dataChannel = null;
    this.microphoneStream = null;
    this.playbackStream = null;
    this.playbackAudio = null;
    this.incomingAudio = null;
    this.transcriptBuffer = "";
  }

  async start() {
    this.stop();
    this.onStateChange({ running: false });
    this.onStatus("Loading Inworld config…");

    const config = await this.#fetchConfig();

    this.transcriptBuffer = "";
    this.onLog("Starting realtime session.");
    this.microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    this.onStatus("Connecting to Inworld WebRTC…");
    this.peerConnection = new RTCPeerConnection({ iceServers: config.ice_servers });
    this.dataChannel = this.peerConnection.createDataChannel("oai-events", { ordered: true });

    this.microphoneStream.getAudioTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.microphoneStream);
    });

    this.peerConnection.ontrack = (event) => {
      this.#attachAgentTrack(event.track);
    };

    this.peerConnection.onconnectionstatechange = () => {
      this.onLog(`Peer connection: ${this.peerConnection.connectionState}`);
      if (this.peerConnection.connectionState === "failed") {
        this.onStatus("WebRTC connection failed.");
        this.stop();
      }
    };

    this.dataChannel.onopen = () => {
      this.onStateChange({ running: true });
      this.onStatus("Connected. Talk to the agent.");
      this.onLog("Realtime data channel opened.");
      this.#configureSession();
      this.#requestGreeting();
    };

    this.dataChannel.onmessage = (event) => {
      this.#handleDataChannelMessage(event);
    };

    this.dataChannel.onerror = () => {
      this.onLog("Realtime data channel error.");
    };

    this.dataChannel.onclose = () => {
      this.onLog("Realtime data channel closed.");
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    await this.#waitForIceGatheringComplete();

    const answerResponse = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/sdp",
        Authorization: `Bearer ${config.api_key}`
      },
      body: this.peerConnection.localDescription.sdp
    });

    if (!answerResponse.ok) {
      const details = await answerResponse.text();
      throw new Error(`Failed to create realtime call: ${answerResponse.status} ${details}`);
    }

    const answerSdp = await answerResponse.text();
    await this.peerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });
  }

  stop() {
    this.#stopPlayback();
    this.#stopMicrophone();
    this.#stopConnection();
    this.onStateChange({ running: false });
  }

  #stopPlayback() {
    if (this.incomingAudio) {
      this.incomingAudio.pause();
      this.incomingAudio.srcObject = null;
      this.incomingAudio.remove();
      this.incomingAudio = null;
    }

    if (this.playbackAudio) {
      this.playbackAudio.pause();
      this.playbackAudio.srcObject = null;
      this.playbackAudio.remove();
      this.playbackAudio = null;
    }

    if (this.playbackStream) {
      this.playbackStream.getTracks().forEach((track) => track.stop());
      this.playbackStream = null;
    }
  }

  #stopMicrophone() {
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((track) => track.stop());
      this.microphoneStream = null;
    }
  }

  #stopConnection() {
    if (this.dataChannel) {
      this.dataChannel.onopen = null;
      this.dataChannel.onmessage = null;
      this.dataChannel.onerror = null;
      this.dataChannel.onclose = null;
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onicegatheringstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  async #fetchConfig() {
    const response = await fetch("/api/config");
    const config = await response.json();

    if (!response.ok) {
      throw new Error(config.error || "Failed to load Inworld config");
    }

    return config;
  }

  async #waitForIceGatheringComplete() {
    await new Promise((resolve) => {
      if (this.peerConnection.iceGatheringState === "complete") {
        resolve();
        return;
      }

      let timeoutId;
      const done = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(done, 500);
        }
      };

      this.peerConnection.onicegatheringstatechange = () => {
        if (this.peerConnection.iceGatheringState === "complete") {
          done();
        }
      };

      timeoutId = setTimeout(done, 3000);
    });
  }

  #configureSession() {
    this.dataChannel.send(
      JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          model: AGENT_MODEL,
          instructions: AGENT_INSTRUCTIONS,
          output_modalities: ["audio", "text"],
          audio: {
            input: {
              turn_detection: {
                type: "semantic_vad",
                eagerness: "high",
                create_response: true,
                interrupt_response: true
              }
            },
            output: {
              model: AGENT_TTS_MODEL,
              voice: AGENT_VOICE,
              speed: 1
            }
          }
        }
      })
    );
  }

  #requestGreeting() {
    this.dataChannel.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: AGENT_GREETING }]
        }
      })
    );
    this.dataChannel.send(JSON.stringify({ type: "response.create" }));
  }

  #attachAgentTrack(track) {
    if (track.kind !== "audio") {
      return;
    }

    this.#stopPlayback();

    const agentStream = new MediaStream([track]);

    this.incomingAudio = new Audio();
    this.incomingAudio.autoplay = true;
    this.incomingAudio.muted = true;
    this.incomingAudio.srcObject = agentStream;
    this.incomingAudio.style.display = "none";
    document.body.append(this.incomingAudio);

    this.playbackStream = this.renderer.connectMediaStream(agentStream);
    this.playbackAudio = new Audio();
    this.playbackAudio.autoplay = true;
    this.playbackAudio.srcObject = this.playbackStream;
    this.playbackAudio.style.display = "none";
    document.body.append(this.playbackAudio);

    this.onLog("Agent audio track connected to Flexatar renderer.");
  }

  #handleDataChannelMessage(event) {
    const message = JSON.parse(event.data);

    if (message.type === "response.output_text.delta" && message.delta) {
      this.transcriptBuffer += message.delta;
      return;
    }

    if (message.type === "response.output_text.done") {
      if (this.transcriptBuffer.trim()) {
        this.onLog(`Agent: ${this.transcriptBuffer.trim()}`);
        this.transcriptBuffer = "";
      }
      return;
    }

    if (message.type === "error") {
      this.onLog(`Error: ${message.error?.message || "Unknown realtime error"}`);
      return;
    }

    if (message.type === "input_audio_buffer.speech_started") {
      this.onLog("User started speaking.");
      return;
    }

    if (message.type === "input_audio_buffer.speech_stopped") {
      this.onLog("User stopped speaking.");
    }
  }
}
