export class CustomAudioPlayer {
    constructor(audioElement, container) {
      this.audio = audioElement;
      this.container = container;
      this.createUI();
      this.addEventListeners();
    }

    createUI() {
      const wrapper = document.createElement("div");
      wrapper.className = "custom-audio-player";

      // === Timeline Row ===
      const timelineRow = document.createElement("div");
      timelineRow.className = "timeline-row";

      this.seekBar = document.createElement("input");
      this.seekBar.type = "range";
      this.seekBar.min = 0;
      this.seekBar.step = 0.01;
      this.seekBar.value = 0;

      timelineRow.appendChild(this.seekBar);

      // === Controls Row ===
      const controlsRow = document.createElement("div");
      controlsRow.className = "controls-row";

      this.playPauseBtn = document.createElement("button");
      this.playPauseBtn.textContent = "▶️";

      this.currentTime = document.createElement("span");
      this.currentTime.className = "time-label";
      this.currentTime.textContent = "0:00";

      this.duration = document.createElement("span");
      this.duration.className = "time-label";
      this.duration.textContent = "/ 0:00";

      this.volume = document.createElement("input");
      this.volume.type = "range";
      this.volume.min = 0;
      this.volume.max = 1;
      this.volume.step = 0.01;
      this.volume.value = this.audio.volume;

      controlsRow.append(
        this.playPauseBtn,
        this.currentTime,
        this.duration,
        this.volume
      );

      // === Final Assembly ===
      wrapper.append(timelineRow, controlsRow);
      this.container.appendChild(wrapper);
    }

    addEventListeners() {
      this.playPauseBtn.addEventListener("click", () => {
        if (this.audio.paused) {
          this.audio.play();
        } else {
          this.audio.pause();
        }
      });

      this.audio.addEventListener("play", () => {
        this.playPauseBtn.textContent = "⏸️";
      });

      this.audio.addEventListener("pause", () => {
        this.playPauseBtn.textContent = "▶️";
      });

      this.audio.addEventListener("loadedmetadata", () => {
        this.seekBar.max = this.audio.duration;
        this.duration.textContent = "/ " + this.formatTime(this.audio.duration);
      });

      this.audio.addEventListener("timeupdate", () => {
        this.seekBar.value = this.audio.currentTime;
        this.currentTime.textContent = this.formatTime(this.audio.currentTime);
      });

      this.seekBar.addEventListener("input", () => {
        this.audio.currentTime = this.seekBar.value;
      });

      this.volume.addEventListener("input", () => {
        this.audio.volume = this.volume.value;
      });
    }

    formatTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, "0")}`;
    }
  }