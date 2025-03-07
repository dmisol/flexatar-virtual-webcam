

import {eventProvider} from "./message-listener-impls/eventsFromParentHtml.js"
import {sendToParent} from "./message-sender-impls/sendToParentHtml.js"
import {getFlexatarWraped,getPreviewWraped} from "./caching.js"
import {Texts} from "./texts.js"
import {MediaConnectionProvider} from "../../util/rtc-connection.js"
import {checkFileType,imageMimeTypes} from "../../util/util.js"
import {fileToStringConverter} from "../../util/fileToStringConverter.js"
// import FtarView from "./ftar_view3.js"
import "script-loader!./ftar_view3.js";
import "script-loader!./ftar_lipsync.js";
// import FtarLipsync from "./ftar_lipsync.js"



   
    if (typeof AndroidInterface !== "undefined") {
        console.log("Page loaded inside WebView");
        document.addEventListener("DOMContentLoaded", function () {
            sendToParent({type:"onload"})
        });
    }


async function blobToDataURL(blobUrl) {
    const response = await fetch(blobUrl);
    const blob = await response.blob();

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

const restoreFileFromString = fileToStringConverter().restoreFileFromString

let effectAmount = 0.5
const effectCodeDict = {
    no:0,
    morph:1,
    hybrid:2
}
let nonAnimatedEffect = { mode: 0, parameter: 0 }

window.onload = function() {
    window.scrollTo(0, 200); // Scrolls 200px down
};

allowAuidoOverlay.textContent = Texts.ALLOW_AUDIO

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let iframeId;
let externalControl=false;

urlParams.forEach((value, key) => {
    if (key === "id"){
        iframeId = value
    }else if (key === "external_ctl"){
        externalControl = value === "true"
    }
});

const lipsyncerPromise = FtarLipsync.newInstance()

let resolveAudioContext
const audioContextClickPromise = new Promise(resolve=>{
    resolveAudioContext = resolve
})

const allowAuidoPromise = new Promise(resolve =>{allowAuidoOverlay.onclick = ()=>{
    resolve()
}})

function isAndroidWebView() {
    return typeof AndroidInterface !== "undefined";
}




const lipsyncerWithACtxPromise = new Promise(async resolve=>{
    // console.log("load lispsyncer")
    const lipsyncer = await lipsyncerPromise
    // console.log("lispsyncer ready")
    await audioContextClickPromise
    // console.log("show audio overlay")
    allowAuidoOverlay.classList.remove("invisible")
    if (!isAndroidWebView()){
        await allowAuidoPromise
    }
    allowAuidoOverlay.classList.add("invisible")
    await lipsyncer.startAudioContext()

    // console.log("audioContext",JSON.stringify(lipsyncer.audioContext))
    resolve(lipsyncer)
})

let flexatarSDK;
let renderer;

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
        circle.style.display = "none"
        text.style.display = "none"
        blockOverlay.style.display = "block"


        return ()=>{
            circle.style.display = "block"
            text.style.display = "block"
            blockOverlay.style.display = "none"
        }
    }


    let removeErrorSign
    createDropZone(holder,async (e)=>{
        if (removeErrorSign){
            removeErrorSign()
            removeErrorSign = null
        }

        const removeLoader = setLoader()

       
        const file = e.target.files[0];
        const fileType = file.type;

        if (!checkFileType(fileType,imageMimeTypes)){
            removeErrorSign = setErrorSign(Texts.NOT_PHOTO)
            removeLoader()
            return
        }
        let ftarLink
        try{
            ftarLink = await FtarView.makeFlexatar(getTokenInst,file,"noname",{ftar:true,preview:true})
        }catch{

        }
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
        await getFlexatarWraped(ftarLink,getTokenInst)
        const previewImg = await getPreviewWraped(ftarLink);
        const {holder} = await addPreview(ftarLink,previewImg,true)
        holder.click()
        emptyBlock.textContent = ""

        
        // setTimeout(()=>{
        //     removeLoader()
        //     removeErrorSign = setErrorSign(Texts.BAD_PHOTO)
        // },3000)
    })


}
addMakeFlexatarButton()


const ftarLinkDict = {}

async function previewLoader(ftarList,previewReadyCallback){
    for (const ftarLink of ftarList){
        ftarLinkDict[ftarLink.id] = ftarLink
        const previewImg = await getPreviewWraped(ftarLink);
        if (previewImg){
            previewReadyCallback(ftarLink,previewImg)
        }
        
    }
}



let oldClicked
let selecteFtar
async function addPreview(ftarLink,previewImage,first){
    ftarLinkDict[ftarLink.id] = ftarLink
    const previewImg = previewImage;
    // const previewImg = await getPreviewWraped(ftarLink);
            
    const holder = document.createElement("span")
    holder.className = "item-holder"

    const preview = document.createElement("img")

    preview.src = previewImg
    preview.draggable = false
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
        selecteFtar = {element:holder,ftarId:ftarLink.id}

        if (oldClicked){
            
            oldClicked.classList.remove("selected-item")
        }
      
        oldClicked = holder
        holder.classList.add("selected-item")
        holder.appendChild(loader)
        try{
            renderer.slot1 = await getFlexatarWraped(ftarLink,getTokenInst)
            renderer.start()
        }finally{
            loader.remove()
        }
        
    }
    return {holder,previewImg}

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
eventProvider( async (data) => {

    // Access the message data
    // let data = event.data;
    // if (!data.flexatar){return}
    // data = data.flexatar


    if (data.type === "reload_token"){
        reloadTokenResolve(data.token)
    }else if (data.type === "request_audio"){
        // console.log("obtained request_audio")
        allowAuidoOverlay.classList.remove("invisible")
        await allowAuidoPromise
        allowAuidoOverlay.classList.add("invisible")

        sendToParent({type:"request_audio"},iframeId)

        // const sendObject = {}
        // sendObject[iframeId] = {type:"request_audio"}
        // window.parent.postMessage({flexatar: sendObject }, '*');

    }else if (data.type === "resolution"){
        await rendererPromise
        renderer.canvas.width = data.resolution.width
        renderer.canvas.height = data.resolution.height

    }else if (data.type === "background"){
        // console.log("background obtained", data.imageBuffer)
        await rendererPromise

        const overlayUrl = URL.createObjectURL( new Blob([data.imageBuffer], { type: 'image/jpg' }));
        const overlay = await flexatarSDK.newOverlay(overlayUrl);
        renderer.addOverlay(overlay,{x:0,y:0,width:100,height:100,mode:"back"});
       
    }else if (data.token){

        sendToParent({type:"heart_beat"},iframeId)

        // const heartBeatObject = {}
        // heartBeatObject[iframeId] = {type:"heart_beat"}
        // window.parent.postMessage({flexatar: heartBeatObject }, '*');

        const token = new FtarView.GetToken(async ()=>{
        
                // console.log("reload token iframe")
                const tokenPromise = new Promise((resolve)=>{reloadTokenResolve=resolve})
                // const sendObject = {}
                // sendObject[iframeId] = {type:"reload_token"}
                // window.parent.postMessage({flexatar: sendObject }, '*');

                sendToParent({type:"reload_token"},iframeId)
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
        



        
        // const previewList = []
        let dataChanelReadyResolver
        const dataChannelReadyPromise = new Promise(resolve=>{
            dataChanelReadyResolver = resolve
        })
        previewLoader(ftarList,async (ftarLink,previewImage)=>{
            addPreview(ftarLink,previewImage);
            (async ()=>{
                await dataChannelReadyPromise
                if (mediaConnection.sendMessage)
                    mediaConnection.sendMessage(mediaConnection.messageManager.makeFlexatarPreviewMessage({id:ftarLink.id,previewImage:await blobToDataURL(previewImage)}))
            })()

            // previewList.push({id:ftarLink.id,previewImage:await blobToDataURL(previewImg)})
        })
        // for (const ftarLink of ftarList){
        //     const {previewImg} = await addPreview(ftarLink)
        //     previewList.push({id:ftarLink.id,previewImage:await blobToDataURL(previewImg)})
        // }

        
        
        flexatarSDK = new FtarView.SDK(token)
        renderer = await flexatarSDK.getRenderer()
        
        // console.log("patternlist",renderer.animator.patternList)
        const emoButtons = [Joy,Anger,Sadness,Surprise,Disgust,Confusion]
        let oldPressd = AllEmo
        oldPressd.classList.add("color-emo-selected")
        for (const b of emoButtons){
            b.onclick = () =>{
                oldPressd.classList.remove("color-emo-selected")
                oldPressd = b
                oldPressd.classList.add("color-emo-selected")
                renderer.animator.currentAnimationPattern = b.id
            }
        }
        AllEmo.onclick = () =>{
            oldPressd.classList.remove("color-emo-selected")
            oldPressd = AllEmo
            oldPressd.classList.add("color-emo-selected")
            renderer.animator.currentAnimationPattern = null
        }

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

        // renderer.canvas.style.zIndex =1000
        
        const ftarVideoStream = renderer.canvas.captureStream(30)
        mediaConnection = new MediaConnectionProvider(sendToParent,"iframe",iframeId,externalControl)

        mediaConnection.onDataChanelAvailable = ()=>{
            dataChanelReadyResolver()
            mediaConnection.sendMessage(mediaConnection.messageManager.makeFlexatarEmotionListMessage(["All"].concat(emoButtons.map(x=>x.id))))
            
        }
        mediaConnection.onReloadFlexatarList = async ()=>{
            const ftarList = await FtarView.flexatarList(getTokenInst,{preview:true})
            if (ftarList.error) {
                return
            }
         

            previewLoader(ftarList,async (ftarLink,previewImage)=>{
                    mediaConnection.sendMessage(mediaConnection.messageManager.makeFlexatarPreviewMessage({id:ftarLink.id,previewImage:await blobToDataURL(previewImage)}))
            })
        }
        mediaConnection.onSetFlexatarToSlot = async (id,slot)=>{
            const ftarObject = await getFlexatarWraped(ftarLinkDict[id],getTokenInst)
            if (ftarObject){
                if (slot===1){
                    renderer.slot1 = ftarObject
                    renderer.start()
                }else{
                    renderer.slot2 = ftarObject
                    renderer.start()
                }
                mediaConnection.sendMessage(mediaConnection.messageManager.makeFlexatarActivatedMessage(id,slot,false))
            }else{
                mediaConnection.sendMessage(mediaConnection.messageManager.makeFlexatarActivatedMessage(id,slot,true))
            }
           

        }
        mediaConnection.onSetFlexatarEmotion = (emoId) =>{
            // console.log("emoId,",emoId)
            renderer.animator.currentAnimationPattern = emoId
        }
        mediaConnection.onDeleteFlexatar = async (ftarId) =>{
            // console.log("onDeleteFlexatar,",ftarId)
            const deletionResult = await FtarView.deleteFlexatar({id:ftarId,token:getTokenInst})
            let success = false
            if (deletionResult){
                success = true
                selecteFtar.element.remove()
                if (previewListHolder.children.length>2){
                    previewListHolder.children[2].click()
                }else{
                    renderer.pause()
                }
            }
            mediaConnection.sendMessage(mediaConnection.messageManager.makeFlexatarRemovedMessage(ftarId,!success))

        }
        mediaConnection.onSetEffect = async (effectCfg) =>{
            if (effectCfg.effectId !== "no"){
                if (renderer.slot2.id === "id2"){

                    return
                }

            }
            if (effectCfg.animated){
                if (effectCfg.effectId==="no")
                    renderer.effect = FtarView.effect.no()
                else if (effectCfg.effectId==="morph")
                    renderer.effect = FtarView.effect.morph()
                else if (effectCfg.effectId==="hybrid")
                    renderer.effect = FtarView.effect.hybrid()
            }else{
                if (effectCfg.effectId==="no"){
                    renderer.effect = FtarView.effect.no()
                }else{
                    const effectCode = effectCodeDict[effectCfg.effectId]
                    nonAnimatedEffect.mode = effectCode
                    nonAnimatedEffect.parameter = effectAmount
                    renderer.effect =  ()=>{return nonAnimatedEffect}
                }
                
            }
        }

        mediaConnection.onSetEffectAmount = async (amount) =>{
            
            // console.log(typeof amount,amount); 
            nonAnimatedEffect.parameter = amount
        }
        mediaConnection.onSetBackground = async (backgroundBase64) =>{
            const overlay = await flexatarSDK.newOverlay(backgroundBase64);
            renderer.addOverlay(overlay,{x:0,y:0,width:100,height:100,mode:"back"});
        }

        mediaConnection.onCreateFlexatar = async (imgBase64Encoded) =>{
            const file = restoreFileFromString(imgBase64Encoded)
            const ftarLink = await FtarView.makeFlexatar(getTokenInst,file,"noname",{ftar:true,preview:true})
            let errorString = ""
            if (!ftarLink){
                errorString = "unknown_error"
                removeErrorSign = setErrorSign(Texts.UNKNOWN)
            }else if (ftarLink.err){
                if (ftarLink.reason){
                     errorString = ftarLink.reason
                }else{
                     errorString = "unknown_error"
                }
                mediaConnection.sendMessage(mediaConnection.messageManager.makeFlexatarCreatedMessage({},errorString))

                return
            }
            const previewImg = await getPreviewWraped(ftarLink);
            await addPreview(ftarLink,previewImg,true)
            // holder.click()
            mediaConnection.sendMessage(mediaConnection.messageManager.makeFlexatarCreatedMessage({id:ftarLink.id,previewImage:await blobToDataURL(previewImg)},errorString))

                
        }

        // mediaConnection.onSetEffect = async (effectName) =>{
        //    const parts = effectName.split("_")
        //    const effectId = parts[0]
        //    const isAnimated = parts[1] === "true"
        //    console.log("onSetEffect on iframe",effectName)
        // }
        // mediaConnection.onSetEffectAmount = async (amount) =>{
        //     console.log("onSetEffectAmount on iframe",amount)
        //  }


        mediaConnection.addAllTraks(ftarVideoStream)


        
        // const sendObject = {}
        // sendObject[iframeId] = await mediaConnection.offerMessage()
        // window.parent.postMessage({flexatar:sendObject}, '*');
        sendToParent(await mediaConnection.offerMessage(),iframeId)


        
        mediaConnection.onaudioready = async audioTrack =>{
          
            // if (confirm("Audio will start now")){
               
                // if (!isAndroidWebView()){
                resolveAudioContext()
                // }
            // }
           
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
                // console.log('Track has been stopped.');
                setTimeout(()=>{
                    lipsyncer.mediaStream = null
                    mediaConnection.addAudioTrack(null)
                    mediaConnection.isNegotiating = false
                },700)
            };
            mediaConnection.isNegotiating = false
           
        }
    }

    if (data.type === 'offer') {
        mediaConnection.recvOffer(data)

    } else if (data.type === 'ice-candidate') {
        mediaConnection.addIceCandidate(data)
    }else if (data.type === 'answer') {
        mediaConnection.recvAnswer(data)

    } 
});



// let buffers = []
// async function addAudioBuffer(buffer){
//         buffers.push(buffer)
// }


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
   
    
    
    previewLoader(ftarList,async (ftarLink,previewImage)=>{
        const {holder} = await addPreview(ftarLink,previewImage);

        if (ftarLink.id === selectedFtarId){
            holder.click()
        }
    })

    // for (const ftarLink of ftarList){
      
    //     const {holder:element,previewImg} = await addPreview(ftarLink)
    //     if (ftarLink.id === selectedFtarId){
    //         element.click()
    //     }
    // }
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


expandEmoButton.onclick = () =>{
    emoContainer.classList.remove("invisible")
    closeEmoButton.classList.remove("invisible")
    expandEmoButton.classList.add("invisible")
}
closeEmoButton.onclick = () =>{
    emoContainer.classList.add("invisible")
    closeEmoButton.classList.add("invisible")
    expandEmoButton.classList.remove("invisible")
}

  


