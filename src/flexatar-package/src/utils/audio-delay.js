
const AUIDO_DELAY = 0.45;
export class AudioDelayProcessor {
    constructor(originalTrack) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.delayNode = null;
        this.originalTrack = originalTrack;
        this.flxAudioStreamSource = null;
        this.delayedTrack = null;

        // Initialize the processing logic inside the constructor
        if (this.originalTrack) {
            const originalStream = new MediaStream([this.originalTrack]);
            const delayNode = this.audioContext.createDelay(1);
            delayNode.delayTime.value = AUIDO_DELAY;

            const micSrc = this.audioContext.createMediaStreamSource(originalStream);
            micSrc.connect(delayNode);
            const flxAudioStreamDestination = this.audioContext.createMediaStreamDestination();
            delayNode.connect(flxAudioStreamDestination);

            const flxAudioStreamDelayed = flxAudioStreamDestination.stream;
            const delayedTrack = flxAudioStreamDelayed.getAudioTracks()[0];

            // Store references for getDelay and setDelay methods
            this.delayNode = delayNode;
            this.flxAudioStreamSource = flxAudioStreamDestination;
            this.delayedTrack = delayedTrack;
        }
    }

    stop() {
        console.log("STOP DELAYED");
        if (this.originalTrack) {
            this.originalTrack.noPatch = true;
            this.originalTrack.stop();
        }

        if (this.flxAudioStreamSource && this.delayNode) {
            const micSrc = this.audioContext.createMediaStreamSource(new MediaStream([this.originalTrack]));
            micSrc.disconnect();
            this.delayNode.disconnect();
        }

        this.delayNode = null;
        this.originalTrack = null;
        this.flxAudioStreamSource = null;
        this.delayedTrack = null;
    }

    getDelayTrack() {
        if (this.delayedTrack) {
            return this.delayedTrack;
        }
        return null;
    }

    setDelay(value) {
        if (this.delayNode && !isNaN(value)) {
            this.delayNode.delayTime.value = value;
        } else {
            console.warn("Invalid delay value or no delay node available.");
        }
    }
}


