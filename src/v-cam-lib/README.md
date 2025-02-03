# Flexatar V-Cam

[v-cam iframe source](../v-cam-iframe)

## Quick start 


 ```js
    const iframeUrl = "https://dev.flexatar-sdk.com/v-cam/index.html"
    // Run v-cam iframe on localhost
    // cd ../v-cam
    // npm install
    // npm run dev
    // const iframeUrl = "http://localhost:8080"

    const vCam = VCAM.getVCamElement(iframeUrl,{token:"hardcoded token to test"})
    
    vCam.resolution = {width:240,height:320}

    const url = "url of your backends endpoint to obtain user token"
    const opts = {"the same as fetch opts"}
    // vCam will make fetch with provided arguments fetch(url,opts) in case 
    // it has no token or token is expired.
    // The response must be json {"token":"user token obtained with FLEXATAR_API_SECRET"}
    
    vCam.setupTokenFetch(
        url,
        opts
    )
    // if fetch token fails handle error here
    vCam.ontokenerror = (error)=>{
        console.log(error)
    }

    // Will be called when iframe is ready to provide video
    vCam.onoutputstream = (mediaStream) => {
        videoElement.srcObject = mediaStream
    }
    // provide image to set background
    vCam.background = "url/to/image.jpg"

    // makes appendCild to provided container
    // alternatively: holder.appendChild(vCam.element)
    vCam.mount(holder)

    // remove iframe from document
    vCam.unmount()

    // providing audio source iframe immideatelly starts playback
    vCam.src = "url/to/audio.mp3"
    // or
    vCam.src = await navigator.mediaDevices.getUserMedia({ audio: true });
    // to stop playback
    vCam.src = null
    // vCam.src accepts url as string, MediaStream, MediaStreamTrack, or ArrayBuffer with encoded audio.

    // When v-cam i-frame will try to init AudioContext it will need button press
    vCam.requestAudioPermition(()=>{
        // will be executed after button press
    })
    // Check if audio context initialized or not, if not call requestAudioPermition
    if (vCam.isAudioReady){}

 ```

 > **Note:** If you will use restricted user tokens, UI for flexatar creation or deletion will be hidden. 



