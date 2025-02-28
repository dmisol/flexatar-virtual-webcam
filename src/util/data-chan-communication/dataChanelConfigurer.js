


    

export function dataChanelConfigurer(peerConnection, dataChannelName, onDataChannelReady) {
    try {
        const dataChannel = peerConnection.createDataChannel(dataChannelName);

        dataChannel.addEventListener('open', () => {
            if (onDataChannelReady) {
                onDataChannelReady();
            }
        });

        return {
            sendStringFunction: (message) => {
                if (dataChannel.readyState === 'open') {
                    dataChannel.send(message);
                } else {
                    throw new Error('Data channel is not open');
                }
            },
            initializationError: null
        };
    } catch (error) {
        return error;
    }
}

    

