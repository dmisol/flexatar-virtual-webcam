
let vAssistantIframe

import {MediaConnectionProvider} from "../../util/rtc-connection.js"

// const peerConnection = new RTCPeerConnection();


// mediaStream.getTracks().forEach(track => peerConnection.addTrack(track, mediaStream));


// peerConnection.onicecandidate = event => {
//     if (event.candidate) {
//         vAssistantIframe.contentWindow.postMessage({ type: 'ice-candidate', candidate:JSON.stringify( event.candidate) }, '*');
//     }
// };
let mediaConnection
window.addEventListener('message', async event => {
    let data = event.data;
    if (!data.flexatar) return
    data = data.flexatar
       
    if (data.type === 'answer') {
        mediaConnection.recvAnswer(data)

    } else if (data.type === 'ice-candidate') {

        mediaConnection.addIceCandidate(data)
    }else if (data.type === 'renegotiate') {
        console.log("send offer")
        vAssistantIframe.contentWindow.postMessage({flexatar:await mediaConnection.offerMessage()}, '*');
    }
    
});

// 70bbe9d67237
export function initVAssistant(token){
    vAssistantIframe = document.createElement("iframe")
    // vAssistantIframe.src = "http://172.17.0.1:8083"
    vAssistantIframe.src = "http://localhost:8083"
    vAssistantIframe.style.width = "240px"
    vAssistantIframe.style.height = "320px"
    vAssistantIframe.onload = async ()=>{
        console.log("iframe ready")
        // const response = await fetch("./static/Mary.mp3");
        // const arrayBuffer = await response.arrayBuffer();

        // const data = {audio:arrayBuffer}
        // vAssistantIframe.contentWindow.postMessage(data, "*");
        vAssistantIframe.contentWindow.postMessage({flexatar:{token}}, "*");

        // const offer = await peerConnection.createOffer();
        // await peerConnection.setLocalDescription(offer);

        // Send offer to iframe
        mediaConnection = new MediaConnectionProvider(vAssistantIframe.contentWindow,"host")
        mediaConnection.onflexatarready = ftarStream =>{
            console.log("ftarStream",ftarStream)
            console.log("traks",ftarStream.getTracks())
            videoFromIframe.srcObject = ftarStream
        }
        // mediaConnection.addTransiver("recvonly")
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaConnection.addAudioTrack(mediaStream)
        vAssistantIframe.contentWindow.postMessage({flexatar:await mediaConnection.offerMessage()}, '*');


    }
    document.body.appendChild(vAssistantIframe)
}

export async function sendFileToSpeak(){
    const response = await fetch("./static/Mary.mp3");
    const arrayBuffer = await response.arrayBuffer();

    const data = {audio:arrayBuffer}
    console.log("send audio")
    vAssistantIframe.contentWindow.postMessage(data, "*");
}