// Add an event listener to listen for messages from the parent

import {getFlexatarWraped,getPreviewWraped} from "./caching.js"
import {Texts} from "./texts.js"
import {MediaConnectionProvider} from "../../util/rtc-connection.js"
import {checkFileType,imageMimeTypes} from "../../util/util.js"
import { resolve } from "../webpack.config.js"


const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let iframeId;

urlParams.forEach((value, key) => {
    if (key === "id"){
        iframeId = value

    }
});

const lipsyncerPromise = FtarLipsync.newInstance()

const lipsyncerWithACtxPromise = new Promise(async resolve=>{
    // startButton.onclick = async ()=>{
        const lipsyncer = await lipsyncerPromise
        await lipsyncer.startAudioContext()
        console.log("audioContext",lipsyncer.audioContext)
        // const audioContext = lipsyncer.audioContext
        resolve(lipsyncer)
        
    // }
})

// const buttonClickPromise = new Promise(resolve => {
//     startButton.onclick = async ()=>{
//         resolve()
//     }
// })

// mediaConnection.addTransiver("sendonly")

let flexatarSDK;
let renderer;
// let  audioContext = new (window.AudioContext || window.webkitAudioContext)();

function createDropZone(element,handler){
    const input=document.createElement('input');
    input.type="file";

    input.accept="image/*"

    input.onchange = e => handler(e)

    element.onclick = () =>{
        input.click()
    }
    element.ondragover = (e)=>{
        e.preventDefault();
        element.classList.add('hover');
    }
    
    element.ondragleave = (e)=>{
        element.classList.remove('hover');
    }
    element.ondrop = e =>{
        e.preventDefault();
        element.classList.remove('hover');
        const files = e.dataTransfer.files;
        handler({ target: { files } });
    }
}

function addMakeFlexatarButton(){
    // const holder = document.createElement("span")
    // holder.className = "item-holder bkg-color"
    // // holder.style.height = "auto"
    // // holder.style.cursor = "pointer"
    // const circle = document.createElement("div")
    // circle.className = "circle"
    // const vPlus = document.createElement("div")
    // vPlus.className = "bar horizontal"
    // const hPlus = document.createElement("div")
    // hPlus.className = "bar vertical"
    // circle.appendChild(vPlus)
    // circle.appendChild(hPlus)
    // holder.appendChild(circle)

    

    // const text = document.createElement("div")
    // text.textContent = Texts.DROP_PHOTO
    // text.className = "drop-photo"
    // holder.appendChild(text)
    const holder = createFlexatarHolder
    const circle = plusCircle
    const text = makeTextHolder
    text.textContent = Texts.DROP_PHOTO

    const blockOverlay = makeOverlayElement
  
    
    const setErrorSign = (infoText)=>{
        circle.classList.add('rotated');
        text.textContent = infoText
        return ()=>{
            circle.classList.remove('rotated');
            text.textContent = Texts.DROP_PHOTO
        }
    }
    
    const setLoader = ()=>{
        // holder.classList.add('block');
        circle.style.display = "none"
        text.style.display = "none"
        blockOverlay.style.display = "block"
        // holder.classList.add('loader-border');

        return ()=>{
            circle.style.display = "block"
            text.style.display = "block"
            blockOverlay.style.display = "none"
            // holder.classList.remove('loader-border');
            // holder.classList.remove('block');
        }
    }

    // previewListHolder.appendChild(holder)
    let removeErrorSign
    createDropZone(holder,async (e)=>{
        if (removeErrorSign){
            removeErrorSign()
            removeErrorSign = null
        }
        // console.log("file chosen",file)
        const removeLoader = setLoader()

       
        const file = e.target.files[0];
        const fileType = file.type;

        if (!checkFileType(fileType,imageMimeTypes)){
            removeErrorSign = setErrorSign(Texts.NOT_PHOTO)
            removeLoader()
            return
        }
        console.log("getTokenInst",getTokenInst)
        const ftarLink = await FtarView.makeFlexatar(getTokenInst,file,"noname",{ftar:true,preview:true})
        removeLoader()
        if (!ftarLink){
            removeErrorSign = setErrorSign(Texts.UNKNOWN)
        }
        if (ftarLink.err){
            if (ftarLink.reason){
                if (ftarLink.reason === "queue_limit"){
                    // console.log("Only one process at time allowed")
                }else if (ftarLink.reason === "subscription_limit") {
                    removeErrorSign = setErrorSign(Texts.LIMIT)
                    // console.log("Out of Subscription Limit")
                }else if (ftarLink.reason === "bad_photo") {
                    removeErrorSign = setErrorSign(Texts.BAD_PHOTO)
                    // console.log("Bad Photo")
                }
            }
            return
        }
        FtarView.userInfo(getTokenInst).then(userInfo=>{
            ftarCountSign.textContent =  userInfo.FtarCount
        })
        const ftar = await getFlexatarWraped(ftarLink,getTokenInst)
        // renderer.slot1 = ftar
        // renderer.start()
        const holder = await addPreview(ftarLink,true)
        holder.click()
        emptyBlock.textContent = ""

        
        // setTimeout(()=>{
        //     removeLoader()
        //     removeErrorSign = setErrorSign(Texts.BAD_PHOTO)
        // },3000)
    })


}
addMakeFlexatarButton()

let oldClicked
let selecteFtar
async function addPreview(ftarLink,first){
    const previewImg = await getPreviewWraped(ftarLink);
            
    const holder = document.createElement("span")
    holder.className = "item-holder"

    const preview = document.createElement("img")

    preview.src = previewImg
    preview.style.cursor = "pointer"
    preview.style.display = 'block'; 
    preview.style.width = '100%'; 
    preview.style.height = 'auto'; 
    preview.style.margin = '0px'; 
    preview.style.padding = '0px'; 
    preview.style.boxSizing = 'border-box'; 
    preview.style.lineHeight = '0px'; 
    preview.style.verticalAlign = 'top'; 

    preview.style.objectFit = 'contain';
    holder.appendChild(preview)
    holder.id = ftarLink.id

    const loader = document.createElement("span")
    loader.className = "loader"
    if (!oldClicked){
        holder.classList.add("selected-item")
        oldClicked = holder
        selecteFtar = {element:holder,ftarId:ftarLink.id}
    }


    // if (first && previewListHolder.childNodes.length>1){
        
        previewListHolder.insertBefore(holder, previewListHolder.children[2]);
    // }else{
    //     previewListHolder.appendChild(holder)

    // }
    holder.onclick = async() =>{
        console.log("ftar icon pressed")
        // loader.style.display = "block"
        selecteFtar = {element:holder,ftarId:ftarLink.id}

        if (oldClicked){
            console.log("remove class")
            oldClicked.classList.remove("selected-item")
        }
      
        oldClicked = holder
        // oldClicked = holder
        holder.classList.add("selected-item")
        holder.appendChild(loader)
        try{
            renderer.slot1 = await getFlexatarWraped(ftarLink,getTokenInst)
            renderer.start()
        }finally{
            loader.remove()
        }
        
    }
    return holder

}


let mediaConnection
let mediaStream = new MediaStream();
let oldTrack 
let reloadTokenResolve 
let getTokenInst

let rendererResolve
let rendererPromise = new Promise(resolve=>{
    rendererResolve = resolve
})
window.addEventListener('message', async (event) => {

    // Access the message data
    let data = event.data;
    if (!data.flexatar){return}
    data = data.flexatar
    

    if (data.type === "reload_token"){
        reloadTokenResolve(data.token)
    }else if (data.type === "background"){
        console.log("background obtained", data.imageBuffer)
        await rendererPromise

        const overlayUrl = URL.createObjectURL( new Blob([data.imageBuffer], { type: 'image/jpg' }));
        const overlay = await flexatarSDK.newOverlay(overlayUrl);
        renderer.addOverlay(overlay,{x:0,y:0,width:100,height:100,mode:"back"});
       
    }else if (data.token){

        const token = new FtarView.GetToken(async ()=>{
        
                console.log("reload token iframe")
                const tokenPromise = new Promise((resolve)=>{reloadTokenResolve=resolve})
                const sendObject = {}
                sendObject[iframeId] = {type:"reload_token"}
                window.parent.postMessage({flexatar: sendObject }, '*');
                const tok = await tokenPromise
                return tok
            }
        );

        getTokenInst = token

        FtarView.userInfo(getTokenInst).then(userInfo=>{
            
            if (!userInfo.restricted){
                createFlexatarHolder.classList.remove("invisible")
                reloadFtarListButton.classList.remove("invisible")
                trashButton.classList.remove("invisible")
                ftarCountSign.textContent =  userInfo.FtarCount
            }
        })


        const ftarList = await FtarView.flexatarList(token,{preview:true})
        if (ftarList.error) return
        for (const ftarLink of ftarList){
            await addPreview(ftarLink)
        }

        
        
        flexatarSDK = new FtarView.SDK(token)
        renderer = await flexatarSDK.getRenderer()
        
        if (ftarList.length>0){
            previewListHolder.children[2].click()
        }else{
            emptyBlock.textContent = Texts.EMPTY
        }
        rendererResolve()
        renderer.canvas.width=240
        renderer.canvas.height=320
        renderer.canvas.style.display = "none"
        document.body.appendChild(renderer.canvas)


        
        const ftarVideoStream = renderer.canvas.captureStream(30)
        mediaConnection = new MediaConnectionProvider(window.parent,"iframe",iframeId)
        mediaConnection.addAllTraks(ftarVideoStream)
        
        const sendObject = {}
        sendObject[iframeId] = await mediaConnection.offerMessage()
        window.parent.postMessage({flexatar:sendObject}, '*');


        
        mediaConnection.onaudioready = async audioTrack =>{

           
            if (oldTrack)
                mediaStream.removeTrack(oldTrack)

            oldTrack = audioTrack
            // if (audioTrack)
            mediaStream.addTrack(audioTrack)
            
            const audio = new Audio()
            audio.srcObject = mediaStream;
            audio.pause()
            audio.muted = true;

            

            const lipsyncer = await lipsyncerWithACtxPromise

            lipsyncer.mediaStream = mediaStream
 
            lipsyncer.connect(renderer)
            const synchronizedAudio = lipsyncer.synchronizedStream()
            
           
            mediaConnection.addAudioTrack(synchronizedAudio.getAudioTracks()[0])
            audioTrack.onended = () => {
                console.log('Track has been stopped.');
                setTimeout(()=>{
                    lipsyncer.mediaStream = null
                    mediaConnection.addAudioTrack(null)
                    mediaConnection.isNegotiating = false
                },700)
            };
            mediaConnection.isNegotiating = false
            
        }


        /*
        const audioStream = await audioPromise
        const lipsyncer = await lipsyncerWithACtxPromise

        lipsyncer.mediaStream = audioStream
        lipsyncer.connect(renderer)

        const synchronizedAudio = lipsyncer.synchronizedStream()
        FtarView.util.addAudioStream(ftarVideoStream,synchronizedAudio)

        mediaConnection.addAllTraks(ftarVideoStream)
        console.log("add ftarmediastream")
        */

    }

    if (data.type === 'offer') {
        mediaConnection.recvOffer(data)

    } else if (data.type === 'ice-candidate') {
        mediaConnection.addIceCandidate(data)
    }else if (data.type === 'answer') {
        mediaConnection.recvAnswer(data)

    } 
});

// const peerConnection = new RTCPeerConnection();

// let mediastream
// // When a track is received, attach it to an audio element
// peerConnection.ontrack = event => {
//     console.log("audio received",event.streams )
//     mediastream = event.streams[0]

// };

// Send ICE candidates to the parent window
// peerConnection.onicecandidate = event => {
//     if (event.candidate) {
//         window.parent.postMessage({ type: 'ice-candidate', candidate: JSON.stringify(event.candidate) }, '*');
//     }
// };

let buffers = []
async function addAudioBuffer(buffer){
        buffers.push(buffer)
}


let isTrashPressed = false
trashButton.onclick = () => {
    if (isTrashPressed){
        crossIcon.classList.add("invisible")
        trashIcon.classList.remove("invisible")
        confirmButton.classList.add("invisible")
    }else{
        confirmButton.classList.remove("invisible")
        trashIcon.classList.add("invisible")
        crossIcon.classList.remove("invisible")
    }
    isTrashPressed = !isTrashPressed
   
}
confirmButton.onclick = async () =>{
    confirmButton.classList.add("invisible")
    trashIcon.classList.add("invisible")
    crossIcon.classList.add("invisible")
    waitIcon.classList.remove("invisible")
    waitIcon.classList.add("roating")
    trashButton.disabled = true
    await new Promise(resolve=>{setTimeout(()=>{resolve()},3000)})
   
    const deletionResult = await FtarView.deleteFlexatar({id:selecteFtar.ftarId,token:getTokenInst})
    if (deletionResult){
        selecteFtar.element.remove()
        if (previewListHolder.children.length>1){
            previewListHolder.children[2].click()
        }else{
            renderer.pause()
        }
    }
   
    

    

    trashIcon.classList.remove("invisible")
    waitIcon.classList.add("invisible")
    waitIcon.classList.remove("roating")
    isTrashPressed = !isTrashPressed

}

reloadFtarListButton.onclick = async ()=>{
    reloadFtarListButton.disabled = true
    reloadIcon.classList.add("roating")
    const ftarList = await FtarView.flexatarList(getTokenInst,{preview:true})
    if (ftarList.error) {
        reloadIcon.classList.remove("roating")
        return
    }
    const selectedFtarId = selecteFtar.element.id
    while (previewListHolder.children.length>3){
        previewListHolder.children[2].remove()
    }
   
    
    
    for (const ftarLink of ftarList){
      
        const element = await addPreview(ftarLink)
        if (ftarLink.id === selectedFtarId){
            element.click()
        }
    }
    reloadIcon.classList.remove("roating")
    reloadFtarListButton.disabled = false
}

let isDragging = false;
let  startY,  scrollY;
let speedTimer

document.addEventListener('mousedown', (e) => {
    if (timer)clearInterval(timer)
    isDragging = true;
    startY = e.screenY;

    scrollY = window.scrollY;
    
});
let oldY= 0
let speed =0
let avarspeed = 0
let deltaY
let scrollStarted = false
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return; // Exit if not dragging
    e.preventDefault();
    
    deltaY = startY - e.screenY;
   
    if (!scrollStarted) if (Math.abs(deltaY) < 10  )  {
        
        return;
    }
    if (!scrollStarted){
        avarspeed = 0
        speedTimer = setInterval(()=>{
            speed = deltaY-oldY
            oldY = deltaY
            avarspeed = (avarspeed + speed)*0.5
        },100)
    }
    scrollStarted = true
    document.body.style.pointerEvents = "none"

    window.scrollTo(0, scrollY + deltaY);

});
let timer
function stopDarg(){
   
    isDragging = false;
    oldY = 0
    if (speedTimer)clearInterval(speedTimer)
   
    document.body.style.pointerEvents = "auto"
    if (!scrollStarted) return
    scrollStarted=false
    scrollY = window.scrollY;
    speed=avarspeed*0.5
    timer = setInterval(()=>{
        scrollY += speed
        window.scrollTo(0, scrollY);
        speed *= 0.9
        if (Math.abs(speed)<1){
            clearInterval(timer)
        }
    },50)
    const t = timer
    setTimeout(()=>{
        clearInterval(t)
    },2000)


}
document.addEventListener('mouseup', stopDarg);
document.addEventListener('mouseleave', stopDarg);
  
