


    

export function microphoneAudioProvider() {
  let mediaStream = null;

  const getAudioStream = async () => {
    try {
      if (!mediaStream) {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      return { stream: mediaStream };
    } catch (error) {
      return { error: 'Failed to access microphone' };
    }
  };

  const disableMicrophone = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
  };

  return { getAudioStream, disableMicrophone };
}

    

