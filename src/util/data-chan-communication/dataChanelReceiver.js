


    
export function dataChanelReceiver(peerConnection, dataChannelName, onStringReceived) {
  try {
    peerConnection.ondatachannel = event => {
      if (event.channel.label === dataChannelName) {
        event.channel.onmessage = event => {
          if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => {
              onStringReceived(reader.result);
            };
            reader.readAsText(event.data);
          } else {
            onStringReceived(event.data);
          }
        };
      }
    };
    return null;
  } catch (error) {
    return error;
  }
}
    

