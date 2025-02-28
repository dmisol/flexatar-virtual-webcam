import convert from './video_conversions.js';

import {getFlexatarWraped,getPreviewWraped,updateCahceByList} from "./caching.js"
import {texts} from "./locale.js"
import {recordAudioUI} from "./rec-mic-ui-v4/recordAudioUI.js"
import {showPopup,showAlert} from "../../util/popup.js"

const audioFormats = [
    "audio/aac",
    "audio/ogg",
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/webm;codecs=pcm",
    "audio/ogg;codecs=opus",
    "audio/ogg;codecs=vorbis",
    "audio/mp4",
    "audio/mp4;codecs=aac",
    "audio/mpeg",
    "audio/wav"
];

const supportedFormats = audioFormats.filter(format => MediaRecorder.isTypeSupported(format));
// console.log(supportedFormats)

recordAudioUI(
    "startRecFromMicButton",

    "timerOutput",
    ()=>{
        
        starRecLogo.classList.add("invisible")
        stopRecLogo.classList.remove("invisible")
        timerOutput.classList.remove("invisible")
        startRecFromMicButton.classList.add("mic-record-state")
 
        audioDropZone.dropZone.classList.add("invisible")
        // audioDropDownContainer.classList.add("flex-centered")
        timerOutput.classList.add("drop-zone")
        // console.log("setStopRecordButtonState")
        
        
    },()=>{
   
        
        starRecLogo.classList.remove("invisible")
        stopRecLogo.classList.add("invisible")
        timerOutput.classList.add("invisible")
        timerOutput.classList.remove("drop-zone")
        startRecFromMicButton.classList.remove("mic-record-state")
        audioDropZone.dropZone.classList.remove("invisible")
        // audioDropDownContainer.classList.remove("flex-centered")
        // console.log("setStartRecordButtonState")

    },
  
    async (dur,url)=>{
        // console.log(dur,url)
        const response = await fetch(url); // Fetch the Blob from the URL
        const blob = await response.blob(); // Convert response to Blob
        const file =  new File([blob], "Recorded."+supportedFormats[0].split("/")[1], { type: supportedFormats[0] });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // Set the files property of the input element
        audioDropZone.input.files = dataTransfer.files;

        // Manually trigger the 'change' event
        const event = new Event("change", { bubbles: true });
        audioDropZone.input.dispatchEvent(event);
        
    },

    ()=>{
        console.log("permission error")
        showPopup1(texts.noMicPerm)
    },
   ()=>{
        showPopup1(texts.recTooShort)
        console.log("record to short")
    },
   (error)=>{
        showPopup1(texts.somethingWenWrong)
        console.log("unknown error",error)
    },
    // 10,
    5 * 60,
    supportedFormats[0]

)

let reloadTokenResolve 

window.addEventListener('message', async (event) => {
    let data = event.data;
    // console.log("message ", data)
    if (!data.flexatar){return}
    data = data.flexatar
    if (data.type === "reload_token"){
        reloadTokenResolve(data.token)
    }else  if (data.type === "heart_beat"){
        console.log("iframe heart beat")
        const heartBeatObject = {}
        heartBeatObject[iframeId] = {type:"heart_beat"}
        window.parent.postMessage({flexatar: heartBeatObject }, '*');
    }
        
})

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let token;


/*
let tokenVal
urlParams.forEach((value, key) => {
    if (key === "token"){
        tokenVal = value
        // console.log("user token updated",userToken)
    }
    // console.log(`${key}: ${value}`);
});*/
let iframeId;
urlParams.forEach((value, key) => {
    if (key === "id"){
        iframeId = value

    }
});

// let tokenPromise;
token = new FtarView.GetToken(async ()=>{
        // console.log("reload token iframe")

            const tokenPromise = new Promise((resolve)=>{reloadTokenResolve=resolve})
          
            const sendObject = {}
            sendObject[iframeId] = {type:"reload_token"}
            window.parent.postMessage({flexatar:sendObject}, '*');
            // console.log("post message reload_token from iframe")
        // }
        const tok = await tokenPromise
        // console.log("reload token iframe finished")
        token.token = tok
        // tokenPromise = null
        return tok
    }
);
// token.token = tokenVal

const buttonsGroup = [chooseMainPanelButton,settingsMainPanelButton,audioMainPanelButton,recordMainPanelButton];

const ftarCanvasReplacment = new FtarView.util.DispatchQueue();

buttonsHidden(true)
// waitMainPanelButton.disabled = true
videosMainPanelButton.disabled = true

let replacedPreview
let loadedFtars = {}
async function getFtar(ftarId){
    if (!(ftarId in loadedFtars)){
        loaderSign.classList.remove("invisible")

        // loaderSign.style.display = "flex"
        // const fEnt = await FtarView.flexatarEntry(token,ftarId,{ftar:true})
        
        loadedFtars[ftarId] = await getFlexatarWraped({id:ftarId},token)
        loaderSign.classList.add("invisible")
        // loaderSign.style.display = "none"
    }
    return loadedFtars[ftarId]
}
let selectedImgSrc
let oldPressedPreview = [null,null];
async function addPreview(ftarEntry,renderer,previewHolder,previewSrc,slot){
    const preview = document.createElement("img")
    // loaderSign.style.display = "flex"
    
    // const imSource = await FtarView.getPreview(ftarEntry)
    // loaderSign.style.display = "none"
    preview.src = previewSrc

    // await new Promise(resolve =>{
    //         preview.onload = () =>{
    //             resolve()
    //         }
    //     }
    // )
    preview.className = "ftar-preview-size"
    // preview.style.cursor = "pointer"
    // preview.style.width = '75px'; 
    // preview.style.height = 'auto';
    // preview.style.objectFit = 'contain';

    preview.ftarEntry = ftarEntry
    const currentSlotIdx = slot
    // console.log(ftarEntry)
    if (previewList[0].length == 0){
        slotFtarId[0] = ftarEntry.id
        slotFtarId[1] = ftarEntry.id
        slotIdx[0] = 0
        slotIdx[1] = 0
        if (currentSlotIdx == 0)
            selectedImgSrc = previewSrc
        buttonsHidden(false)
    }
    // preview.array = previewIdx
    
    preview.onclick = async () => {
        if (oldPressedPreview[currentSlotIdx]){

            oldPressedPreview[currentSlotIdx].classList.remove("active")
            
        }
        oldPressedPreview[currentSlotIdx] = preview
        preview.classList.add("active")

        const idx = previewList[currentSlotIdx].indexOf(preview)
        slotIdx[currentSlotIdx] = idx
        if (currentSlotIdx == 0)
            selectedImgSrc = previewSrc


            await getFtar(ftarEntry.id)

            slotFtarId[currentSlotIdx] = ftarEntry.id

            if (currentSlotIdx == 0){
                renderer.slot1 = loadedFtars[ftarEntry.id]
            }else{
                renderer.slot2 = loadedFtars[ftarEntry.id]
            }
            if (isSlot2Active){
                renderer.effect =  ()=>{ return { mode: 2, parameter: 0.35 }}
            }else{
                renderer.effect =  FtarView.effect.no()

            }

        renderer.start()

        renderer.canvas.width =  75;
        renderer.canvas.height = 100
    }
    previewHolder.appendChild(preview)
    // flexatarListContainer.appendChild(preview)
    return preview
}

let ftarList;
let renderer;
let firstLoaded = false
let flexatarSDK
const previewList = [[],[]]


async function downloadStartupFlexatars(){
    if (ftarList.length>=1){
        const ftarEntry = ftarList[0]


        await getFtar(ftarEntry.id)
        slotIdx[0] = 0
        slotIdx[1] = 0
        renderer.slot1 = loadedFtars[ftarEntry.id]
        slotFtarId[0] = ftarEntry.id
        slotFtarId[1] = ftarEntry.id
        renderer.pause()
        renderer.start()
    }


}

let isPaidSubscribtion = true
async function updateUserInfo(){
    const userInfo = await FtarView.userInfo(token)
    if (userInfo.error){
        if (userInfo.error === FtarView.ERR_UNAUTHORIZED){
            showPopup1("Authorization failed")
            return
        }

        showPopup1("Unknown error")
        return
    }
        // console.log("userInfo",userInfo)
        audioCountContainer.style.display = "none"
        // if (userInfo.AudioCount>1800){
        //     isPaidSubscribtion = true
        //     audioCountContainer.style.display = "none"
        // }else{
        //     audioAvalibleSign.innerText = " " + formatDuration(userInfo.AudioCount)
        // }
        flexatarAvalibleSign.innerText = userInfo.FtarCount
        // console.log("userInfo",userInfo)
   
}

const start = async ()=>{
    await updateUserInfo()
    // return
    flexatarSDK = new FtarView.SDK(token)
    renderer = await flexatarSDK.newRenderer()
    if (renderer.error == "session_limit"){
        showPopup1(texts.sessionLimit)
        // showPopup("Session limit reached.")
        // loaderSign.style.display = "none"
        loaderSign.classList.add("invisible")
        return
    }

    const animator = await flexatarSDK.newAnimator()
    renderer.animator = animator
    
    
    for (const patternId of ["All"].concat(animator.patternList)){
        // console.log(patternId)
        const option = document.createElement("option");
        option.text = texts["emo"+patternId]
        option.value = patternId
        animationSelect.appendChild(option);
    }
    animationSelect.disabled = false

    animationSelect.onchange = () => {
        animator.currentAnimationPattern = animationSelect.options[animationSelect.selectedIndex].value
    }

    ftarList = await FtarView.flexatarList(token,{preview:true})
    if (ftarList.error){
        loaderSign.classList.add("invisible")
        if (ftarList.error === FtarView.ERR_UNAUTHORIZED){
            showPopup1("Authorization failed")
            return
        }

        showPopup1("Unknown error")
        return
    }
    updateCahceByList(ftarList)
    // console.log("ftarList",ftarList)
    if (!ftarList){
        showPopup1(texts.noService)
        // showPopup("Service unavailable.")
        // loaderSign.style.display = "none"
        loaderSign.classList.add("invisible")
        return
    }
    // ftarList = ftarList.concat(ftarList)
    await downloadStartupFlexatars()
    // loaderSign.style.display = "none"
    loaderSign.classList.add("invisible")
    // console.log("startup flx downloaded")
    


    const loadFtarQueue = new FtarView.util.DispatchQueue()
    let previewCounter = 0
    for (const ftarEntry of ftarList){
        loadFtarQueue.addTask(async ()=>{

                const imSource = await getPreviewWraped(ftarEntry)
                const previewElement = await addPreview(ftarEntry,renderer,flexatarListContainer,imSource,0)
                const previewElement1 = await addPreview(ftarEntry,renderer,flexatarListContainer1,imSource,1)
                if (previewCounter == 0){
                    buttonsHidden(false)
                }
                previewCounter ++;

                previewList[0].push(previewElement)
                previewList[1].push(previewElement1)
            // }

        },0,false)
    }

};
start();


let activeSlot = 0
let slotIdx = [0,0]
let slotFtarId = [null,null]


let lipsyncer;
const startLipsyncer = async () =>{
    lipsyncer = await FtarLipsyncFile.newInstance();
}
startLipsyncer();

const imageMimeTypes = [
    "image/jpeg","image/png","image/bmp","image/webp","image/avif","image/x-portable-bitmap",
    "image/x-portable-anymap","image/x-portable-pixmap","image/tiff"
]
function checkFileType(fileType, typelist){
    for (const mimeType of typelist){
        
        if (fileType == mimeType) {
            return true
        }
    }
    return false
}

function checkFileTypeIsAudio(fileType){
    return fileType.startsWith("audio/")
}

function showPopup1(text){
    popup.classList.remove("invisible")
    // popup.style.display = "block"
    popupText.innerText = text
    
}

function hidePopup(){
    popup.classList.add("invisible")
    // popup.style.display = "none";
}

let oldTab = tabCreate;
let oldButton = createMainPanelButton;
async function showTab(tabButton,tab){
    if (oldTab === tab) return;

    

    if (isRecording){
        showPopup1(texts.cantChange)
        // showPopup("Can't change tab while recording!")
        return
    }
    await leavePage(oldTab)
    oldButton.classList.remove("active")
    // oldButton.className = oldButton.className.replace("button-on-panel-pressed","").replace(" ","")
    
    oldTab.classList.add("invisible")
    tab.classList.remove("invisible")

    // oldTab.style.display = "none"
    // tab.style.display = "flex"
    oldButton = tabButton
    oldButton.classList.add("active")
    // oldButton.className = `${oldButton.className} button-on-panel-pressed`
    oldTab = tab
    if (tab === tabChoose){
        await setupChoose()
    }else if (tab === tabRecord){
        initPlayer()
        showFlexatarWithRecorded()
        setEffect(effectId)
        
    }else if (tab === tabSettings){
        setupSettings()
        setEffect(effectId)
    }
    
}   

const chooseFtarPlaceholder1 = chooseFtarPlaceholder
async function leavePage(page){
    if (!page) return;
    if (page === tabChoose){
        headerChooseContainer.replaceChild(chooseFtarPlaceholder1,renderer.canvas)

    } else if  (page === tabRecord){
        cancelPreviewRec()
    }else{
        await ftarCanvasReplacment.addTask(async ()=>{
            try{
                
                    renderer.canvas.remove()
                
            }catch{
                // console.log("canvas can not be removed")
            }
        },0,false)
    }
    recVideoElement.pause()
}

function buttonsHidden(v){
    for (const b of buttonsGroup){
        b.disabled = v
    }
}

async function setupChoose(){
    await ftarCanvasReplacment.addTask(async ()=>{
        headerChooseContainer.replaceChild(renderer.canvas,chooseFtarPlaceholder)
    },0,false) 

    const currentPreview = previewList[0][slotIdx[0]]
    if (currentPreview)
        currentPreview.click()
    const currentPreview1 = previewList[1][slotIdx[1]]
    if (currentPreview1)
        currentPreview1.click()

    // renderer.effect = FtarView.effect.no()
}

async function setupSettings(){

    settingsCanvasContainer.appendChild(renderer.canvas)
    renderer.canvas.width=240
    renderer.canvas.height=320
    await setupFtarRender()
}

async function setupFtarRender(){
    
    if (slotFtarId[0]){
        const ftar = await getFtar(slotFtarId[0])
        renderer.slot1 = ftar
    }
    if (slotFtarId[1]){
        const ftar = await getFtar(slotFtarId[1])
        renderer.slot2 = ftar
    }
   
    renderer.start()
    if (effectId!=0){
        setEffect(effectId)
    }
}

let player
function initPlayer(){
    if (player) return
    player = new Audio()
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioStream = FtarView.util.mediaStreamFromAudio(player,audioContext)
    ftarMediastream = renderer.canvas.captureStream(30)
    FtarView.util.addAudioStream(ftarMediastream,audioStream)
}

function replaceFileExtension(filename, newExtension) {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
        return `${filename}.${newExtension}`;
    }
    return `${filename.substring(0, lastDotIndex)}.${newExtension}`;
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

async function shareVideo(videoUrl,vFileName) {
    const sendObject = {}
    sendObject[iframeId] = {type:"share_video",url:await blobToDataURL(videoUrl),fileName:vFileName}
    window.parent.postMessage({flexatar:sendObject}, '*');
   
    // try {
    //     // Fetch the blob from the Object URL
    //     const response = await fetch(videoUrl);
    //     const blob = await response.blob();

    //     // Create a File from the Blob (optional: specify a filename)
    //     const file = new File([blob], vFileName, { type: blob.type });

    //     // Check if Web Share API is available
    //     if (navigator.canShare && navigator.canShare({ files: [file] })) {
    //         await navigator.share({
    //             files: [file],
    //             title: texts.shareTitleMessage,
    //             text: texts.shareTextMessage,
    //         });
    //         console.log("Video shared successfully!");
    //     } else {
    //         showPopup1(texts.noShare)
    //         // console.error("Web Share API not supported or file sharing not available.");
    //     }
    // } catch (error) {
    //     showPopup1(texts.somethingWenWrong)


    //     console.error("Error sharing video:", error);
    // }
}

let isRecording = false
async function startPreview(isRec){
    if (!ftarRecord){
        showPopup1(texts.prepAudio)
        // showPopup("Prepare audio first")
        return
    }
    previewButton.hidden = true;
    recordButton.hidden = true;
    recStop.hidden = false;
    // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // const player = new Audio()
    player.src = currentAudioFileCell.audioUrl
    // const audioStream = FtarView.util.mediaStreamFromAudio(player,audioContext)
    const animTimer = currentAudioFileCell.ftarRecord.playWithPlayer(renderer,player);

    


    await player.play()
    if (isRec){
        isRecording = true
        ftarRecorder = new FtarView.util.FlexatarRecorder(ftarMediastream)
        ftarRecorder.onready = async (url,file) => {

            // urlMp4 = await convert(file)

            let ext = "webm"
            let urlMp4Promise
            let secondButtonText
            if ( !file.type.includes("webm")){
                ext = "mp4"
            }else{
                // urlMp4Promise = convert(file)
                secondButtonText = "mp4"
            }
           
            function shareOrDownload(dUrl){
                showPopup({
                    text:texts.choose,
                    buttons:[
                        {
                            text:texts.share,
                            onclick:async closeHandler =>{
                                closeHandler()
                                shareVideo(dUrl,videoFileName)
                            }
                           
                        },{
                            text:texts.download,
                            onclick:async closeHandler =>{
                                closeHandler()
                                const link = document.createElement('a');
                                link.href = dUrl;
                                link.download = videoFileName;
                                // document.body.appendChild(link);
                                link.click();
                            }
                        }
                    ]
                })
            }
            
            let videoFileName = replaceFileExtension(selectedAudioFileName,ext)
            const cell = new StatusCell(videoFileName,selectedImgSrc,"download",secondButtonText)
            cell.status = texts.videoReady
            // cell.status = "Video ready to download"
            cell.ondownloadpressed = () => {

                
                shareOrDownload(url)

               
                // document.body.removeChild(link);
            }
            // urlMp4Promise.then(urlMp4=>{
            let urlMp4Ready
            cell.onoptiondownloadpressed = () => {
                videoFileName = replaceFileExtension(selectedAudioFileName,"mp4")
                // showConfirm("Convert form webm to mp4? May take time.",()=>{
                showConfirm(texts.convert,()=>{
                    cell.onoptiondownloadpressed = null
                    cell.optContainer.innerText = texts.wait
                    convert(file).then(urlMp4=>{
                        cell.optContainer.innerText = texts.mp4
                        urlMp4Ready = urlMp4
                        cell.onoptiondownloadpressed = () => {
                            // const link = document.createElement('a');
                            // link.href = urlMp4;
                            // link.download = videoFileName;
                            // link.click();
                            shareOrDownload(urlMp4)

                        }
                        // const link = document.createElement('a');
                        // link.href = urlMp4;
                        // link.download = videoFileName;
                        // link.click();
                        shareOrDownload(urlMp4)

                    })
                },()=>{})
                
               
            }
            // })
            

            // cell.color = "orange"

            tabVideos.appendChild(cell.container)
            videosMainPanelButton.disabled = false
            showPopup1(texts.findVideo)
            // showPopup("Find result in videos section")

        }
        ftarRecorder.start()
    }

    player.onpause = () =>{
        isRecording = false
        // console.log("player paused")
        clearInterval(animTimer)
        setTimeout(()=>{
            renderer.shutUp()
        },200)
        if (ftarRecorder)
            ftarRecorder.stop()

        previewButton.hidden = false;
        recordButton.hidden = false;
        recStop.hidden = true;
        
    }

  
}

function cancelPreviewRec(){
    player.pause()
    // recBottomPanelControl.hidden = false;
    previewButton.hidden = false;
    recordButton.hidden = false;
    recStop.hidden = true;
}

let ftarRecorder
let ftarMediastream
async function showFlexatarWithRecorded(){
    
    const resolutionOption = videoResolutionSelect.options[videoResolutionSelect.selectedIndex].value
    if (resolutionOption == "option1"){
        renderer.canvas.width = 480
        renderer.canvas.height = 640
    }else{
        renderer.canvas.width = 240
        renderer.canvas.height = 320
    }
    if (!recVideoElement.srcObject)
        recVideoElement.srcObject = ftarMediastream
    recVideoContainer.appendChild(renderer.canvas)
    recVideoElement.play()

    await setupFtarRender()
}



class DropZone {

    constructor(text,accept){
        this.dropZone = document.createElement("div")
        this.dropZone.className = "drop-zone"
        this.dropZoneText = document.createElement("p")
        this.dropZoneText.innerText = text
        this.dropZone.appendChild(this.dropZoneText)
        const input=document.createElement('input');
        this.input = input
        input.type="file";
        if (accept){
            input.accept = accept
        }else{
            input.accept="image/*"
        }
        input.onchange = e => this.handleFiles(e)

        this.dropZone.onclick = () =>{
            input.click()
        }
        this.dropZone.ondragover = (e)=>{
            e.preventDefault();
            this.dropZone.classList.add('hover');
        }
        
        this.dropZone.ondragleave = (e)=>{
            this.dropZone.classList.remove('hover');
        }
        this.dropZone.ondrop = e =>{
            e.preventDefault();
            this.dropZone.classList.remove('hover');
            const files = e.dataTransfer.files;
            this.handleFiles({ target: { files } });
        }

    }
    hide(){
        this.dropZone.classList.add("invisible")
        // this.dropZone.style.display = "none"
    }
    show(){
        this.dropZone.classList.remove("invisible")
        // this.dropZone.style.display = ""
    }
}

class StatusCell{
    constructor(name,imgSrc,button,seccondButton){
        const cellContainer = document.createElement("div")
        cellContainer.className = "line-cell"

        if (imgSrc){
            // console.log("imgSrc not null")
            const photo = document.createElement("img")
            photo.className = "profile-photo"
            photo.src = imgSrc
            cellContainer.appendChild(photo)
        }

        const detailsContainer = document.createElement("div")
        detailsContainer.className = "details"

        const nameElement = document.createElement("span")
        nameElement.className = "name"
        nameElement.innerText = name
        detailsContainer.appendChild(nameElement)
        const statusElement = document.createElement("span")
        statusElement.className = "status"
        statusElement.innerText = "In Progress (~20 seconds)"
        detailsContainer.appendChild(statusElement)
        cellContainer.appendChild(detailsContainer)
        let dotContainer
        let seccondButtonContainer
        
        if (button){
            if (seccondButton){
                seccondButtonContainer = document.createElement("div")
                seccondButtonContainer.className = "conver-button"
                seccondButtonContainer.innerText = seccondButton

                cellContainer.appendChild(seccondButtonContainer)
                seccondButtonContainer.onclick = () => {
                    if (this.onoptiondownloadpressed) this.onoptiondownloadpressed()
                }
            }

            dotContainer = document.createElement("div")
            dotContainer.className = "download-button material-symbols-outlined"
            dotContainer.innerText = button
            cellContainer.appendChild(dotContainer)
            dotContainer.onclick = () => {
                if (this.ondownloadpressed) this.ondownloadpressed()
            }
        }else{
            dotContainer = document.createElement("div")
            dotContainer.className = "status-dot"
            cellContainer.appendChild(dotContainer)
        }   
        

        this.container = cellContainer
        this.statusEl = statusElement
        this.dotContainer = dotContainer
        this.optContainer = seccondButtonContainer

    }
    set status(val){
        this.statusEl.innerText = val
       
    }
    set color(val){
        
        this.dotContainer.style.backgroundColor = val
    }
    set pulse(val){
        
        if (val){
            this.dotContainer.classList.add("pulsing");
        }else{
            this.dotContainer.classList.remove("pulsing");
        }
    }
    set icon(val){
        this.dotContainer.innerText = val
    }
    ondownloadpressed
    onoptiondownloadpressed

}


const imageDropZone = new DropZone(texts.dropPhoto)
// const imageDropZone = new DropZone("Drag & drop frontal photo here or click to upload")
let imgSrc
let currentImgFile
imageDropZone.handleFiles = (e) =>{
    // console.log("file chosen",e.target.files)
    const file = e.target.files[0];
    
    currentImgFile = file
    const fileType = file.type;
    if (checkFileType(fileType,imageMimeTypes)){
        imageDropZone.hide()
        // imgForFtarPreview.style.display = "block"
        imgSrc =  URL.createObjectURL(file);
        imgForFtarPreview.src = imgSrc;
        // imgForFtarPreview.style.display = "block"
        confirmImageBlock.classList.remove("invisible")
        // confirmImageBlock.style.display = "block"
        flexatarImageDropDownContainer.classList.add("invisible")
        // flexatarImageDropDownContainer.style.display = "none"
    }else{
        showPopup1(texts.notAnImage)
        // showPopup("This is not an image file!")

    }
}

flexatarImageDropDownContainer.appendChild(imageDropZone.dropZone)


function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Pad with leading zeros if needed
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}


let ftarRecord
let audioUrl
let oldAudioFileCell
let currentAudioFileCell
let selectedAudioFileName
const audioDropZone = new DropZone(texts.dropAudio,"audio/*")
// const audioDropZone = new DropZone("Drag & drop audio here or click to upload","audio/*")
audioDropZone.handleFiles = async (e) =>{
    const file = e.target.files[0];
    const fileType = file.type;
    if (!checkFileTypeIsAudio(fileType)){
        showPopup1(texts.notAnAudio)
        // showPopup("This is not an audio file!")
        return
    }

    const currentAudioUrl = URL.createObjectURL(file);
    audioUrl = currentAudioUrl
    audioProgressBar.style.width = `${0}%`;
    fileNameHolder.innerText = file.name
    selectedAudioFileName = file.name
    audioDropZone.hide()
    completionForm.classList.remove("invisible")
    // completionForm.style.display = "block"
    // audioDropDownContainer.style.display = "none"
    audioDropDownContainer.classList.add("invisible")


    // const lipsyncer = await FtarLipsyncFile.newInstance()

    let checkResponsePromise 
    if (!isPaidSubscribtion){
        checkResponsePromise = fetch(
            "https://api.flexatar-sdk.com/checkoptional/AudioCount",
            {
                method: 'GET',
                headers:{'Authorization': 'Bearer ' + token}
            }
        )
    }
    // const response = await checkResponsePromise 
    // if (!response.ok) {
    //     showPopup("No connection to service")
    //     return false
    // }
    // const audioCheck = await response.json()
    // console.log("audioCheck",audioCheck)
    // return

    readyIndicator.innerText = texts.processinTime
    // readyIndicator.innerText = "Processing can take some time if file is big."
    let duration = ""
    let durationSeconds
    lipsyncer.makeAnimation(file,async (animationArray)=>{
            audioProgressBar.style.width = `${100}%`;
            readyIndicator.innerText = texts.processComplete
            // readyIndicator.innerText = "Process complete!"
            if (!isPaidSubscribtion){
                const chargeResponse = await fetch(
                    "https://api.flexatar-sdk.com/chargeoptional/AudioCount/"+Math.floor(durationSeconds),
                    {
                        method: 'GET',
                        headers:{'Authorization': 'Bearer ' + token}
                    }
                )
                if (!chargeResponse.ok){
                    showPopup1("Service Unavailable")
                    cancelAudio()
                    return
                }
            }
            
            ftarRecord = new FtarView.FtarRecord(animationArray)

            if (oldAudioFileCell){
                oldAudioFileCell.icon = "check_box_outline_blank"
            }

            const cell = new StatusCell(file.name,undefined,"select_check_box")
            cell.status = duration
            oldAudioFileCell = cell
            audioListContanier.insertBefore(cell.container, audioListContanier.firstChild);
            cell.ftarRecord = ftarRecord
            cell.audioUrl = currentAudioUrl
            cell.ondownloadpressed = () => {
                if (oldAudioFileCell){
                    oldAudioFileCell.icon = "check_box_outline_blank"
                    cell.icon = "select_check_box"
                    currentAudioFileCell = cell
                    selectedAudioFileName=file.name
                    
                }
                oldAudioFileCell = cell
            }
            currentAudioFileCell = cell
           
            cancelAudio()

            // setTimeout(()=> {
            //     updateUserInfo()
            // },1000)
            // const cell = new StatusCell(file.name,null,"check_box_outline_blank")
        
        },
        progress => {
            audioProgressBar.style.width = `${Math.floor(progress)}%`;
        },async (audioPar) => {
            if (isPaidSubscribtion){
                return true
            }
            durationSeconds = audioPar.duration
            duration = new Date(audioPar.duration * 1000).toISOString().substring(11, 19)

            const response = await checkResponsePromise 
            if (!response.ok) {
                showPopup1("No connection to service")
                return false
            }
            const audioCheck = await response.json()
            // console.log("audioCheck",audioCheck)
            if (audioCheck.count<audioPar.duration){
                showPopup1("Out of Subscribtion")
                cancelAudio()
                return false
            }
            return true
        }
    )
}

audioDropDownContainer.appendChild(audioDropZone.dropZone)

function cancelAudio(){
    // console.log("cancel audio")
    completionForm.classList.add("invisible")
    // completionForm.style.display = "none"
    audioDropDownContainer.classList.remove("invisible")
    // audioDropDownContainer.style.display = "flex"
    lipsyncer.cancel()
    audioDropZone.show()
    
}


function resetInputImgForFtar(){
    
    // confirmImageBlock.style.display = "none"
    confirmImageBlock.classList.add("invisible")

    // flexatarImageDropDownContainer.style.display = "flex"
    flexatarImageDropDownContainer.classList.remove("invisible")
    imageDropZone.show()
}

async function sendImgToCreateFtar(){
    

    const cell = new StatusCell(currentImgFile.name,imgSrc)
    cell.color = "orange"
    cell.pulse = true
    imageListContanier.insertBefore(cell.container, imageListContanier.firstChild);

    resetInputImgForFtar()

    const ftarLink = await FtarView.makeFlexatar(token,currentImgFile,"noname",{ftar:true,preview:true})
    if (!ftarLink){
        cell.status = texts.unknownErr
        // cell.status = "Unknown error"
        cell.color = "red"
        cell.pulse = false
        return
    }
    if (ftarLink.err){
        if (ftarLink.reason){
            if (ftarLink.reason === "queue_limit"){
                cell.status = texts.onlyOne
                // cell.status = "Only one process at time allowed"
            }else if (ftarLink.reason === "subscription_limit") {
                cell.status = texts.outOfSubs
                // cell.status = "Out of Subscription Limit"
            }
        }else{
            cell.status = texts.badPhoto
            // cell.status = "Bad Photo"
        }
        
        cell.color = "red"
        cell.pulse = false
        return
    }
    cell.status = texts.ready
    cell.color = "green"
    cell.pulse = false
    const imSource = await getPreviewWraped(ftarLink)
    const previewElement = await addPreview(ftarLink,renderer,flexatarListContainer,imSource,0)
    const previewElement1 = await addPreview(ftarLink,renderer,flexatarListContainer1,imSource,1)
    previewList[0].push(previewElement)
    previewList[1].push(previewElement1)
    if (previewList[0].length==1){
        loadedFtars[ftarLink.id] = await FtarView.getFlexatar(ftarLink)
        slotIdx[0] = 0
        slotIdx[1] = 0
        slotFtarId[0] = ftarLink.id
        slotFtarId[1] = ftarLink.id
    }
    setTimeout(()=> {
        updateUserInfo()
    },1000)
}



const backgroundDropZone = new DropZone(texts.dropBkg)
// const backgroundDropZone = new DropZone("Drag & drop background image here or click to upload")
backgroundDropZone.handleFiles = async (e) =>{
    const file = e.target.files[0];
    const fileType = file.type;
    // console.log("fileType",fileType)
    if (!checkFileType(fileType,imageMimeTypes)){
        showPopup1(texts.notAnImage)
        // showPopup("This is not an image file!")
        return
    }
    const resizedFile = await FtarView.util.resizeImageToWidth(file,480)
    const overlayUrl = URL.createObjectURL(resizedFile);
    const overlay = await flexatarSDK.newOverlay(overlayUrl);
    // console.log("overlay accepted")
    renderer.addOverlay(overlay,{x:0,y:0,width:100,height:100,mode:"back"});
    backgroundDropZone.hide()
    removeBackgroundButton.hidden = false
    
}
backgroundZone.appendChild(backgroundDropZone.dropZone)

function cancelBackground(){
    removeBackgroundButton.hidden = true
    backgroundDropZone.show()
    renderer.addOverlay(null,{x:0,y:0,width:100,height:100,mode:"back"});
}


function hexToRgb(hexColor) {
    if (typeof hexColor !== 'string') {
      throw new Error("Invalid input: color must be a string.");
    }
  
    // Remove the hash symbol if present
    if (hexColor.startsWith("#")) {
      hexColor = hexColor.slice(1);
    }
  
    // Validate the hex format
    const validHex = /^([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
    if (!validHex.test(hexColor)) {
      throw new Error("Invalid hex color format.");
    }
  
    // Support shorthand hex format (e.g., #abc -> #aabbcc)
    if (hexColor.length === 3) {
      hexColor = hexColor.split("").map(char => char + char).join("");
    }
  
    // Parse the color components
    const r = parseInt(hexColor.slice(0, 2), 16) / 255;
    const g = parseInt(hexColor.slice(2, 4), 16) / 255;
    const b = parseInt(hexColor.slice(4, 6), 16) / 255;
  
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      throw new Error("Failed to parse the hex color.");
    }
  
    return [r, g, b];
}

colorInput.oninput = (event) => {
    const value = event.target.value;
    try{
        
        renderer.backgroundColor = hexToRgb(value)
        // console.log("color input",rgbCol)
    }catch{

    }
}

function setEffect(i){
    if (toggleEffectAnimation.checked){
        if (i==1)
            renderer.effect = FtarView.effect.morph()
        else if (i==2)
            renderer.effect = FtarView.effect.hybrid()
        else if (i==0)
            renderer.effect = FtarView.effect.no()
    }
    else
        effectSlider.dispatchEvent( new Event('change'));
}


effectSlider.disabled = true
let effectId = 0
const effectButtons = [noEffectButton,morphEffectButton,hybridEffectButton]
function chooseEffect(effectIdx,button){
    if (effectId == effectIdx) return
    effectId = effectIdx
    for (const b of effectButtons){
        if (b === button){
            b.classList.add('active');
        }else{
            try{
                b.classList.remove('active') 
            }catch{}
        }
    }

    effectSlider.disabled = effectId == 0
    if (effectId == 0){
        renderer.effect = FtarView.effect.no()
        effectSlider.disabled = true
    }else{
        effectSlider.disabled = false
        setEffect(effectId)
    }
    
}

/*
function effectNo(){
    renderer.effect = FtarView.effect.no()
    effectSlider.disabled = true
    effectId = 0
}

function effectMorph(){

    effectSlider.disabled = false
    effectId = 1
    setEffect(effectId)
}
function effectHybrid(){
    effectSlider.disabled = false
    effectId = 2
    setEffect(effectId)
}
*/

toggleEffectAnimation.onchange = () => {
    setEffect(effectId)

}
effectSlider.onchange = () =>{
    if (effectId != 0){
        renderer.effect =  ()=>{ return { mode: effectId, parameter: effectSlider.value / 100 }}
        toggleEffectAnimation.checked = false
    }else{
        renderer.effect = FtarView.effect.no()
    }
}

function deleteFlexatar(){
    showConfirm(
        texts.deleteQuest,
        // "Sure, delete this flexatar?",
        async () =>{
            const fEntry = previewList[0][slotIdx[0]].ftarEntry
            fEntry.token = token
            const deletionResult = await FtarView.deleteFlexatar(fEntry)
            if (!deletionResult){
                showPopup1(texts.wentWrong)
                return
            }

            previewList[0][slotIdx[0]].remove()
            previewList[0].splice(slotIdx[0],1)
            previewList[1][slotIdx[0]].remove()
            previewList[1].splice(slotIdx[0],1)

            ftarList.splice(slotIdx[0],1)
            const deletionIndex = slotIdx[0]
            if (slotIdx[0]>=previewList[0].length){
                slotIdx[0] --;
            }
            if (previewList[0].length == 0){
                // console.log("No more flexatars")
                slotIdx[0] = 0
                slotIdx[1] = 0
                createMainPanelButton.click()
                buttonsHidden(true)
                return;
            }
            if (slotIdx[1]>deletionIndex){
                slotIdx[1]--
                slotFtarId[1] = previewList[0][slotIdx[1]].ftarEntry.id
                renderer.slot2 = loadedFtars[slotFtarId[1]]
            }else if (slotIdx[1]==deletionIndex){
                slotIdx[1] = slotIdx[0]
             
                slotFtarId[1] = previewList[0][slotIdx[1]].ftarEntry.id
                renderer.slot2 = loadedFtars[slotFtarId[1]]
            }
            

            replacedPreview = null;
            const newActiveFtarEntry = previewList[0][slotIdx[0]].ftarEntry
            await getFtar(newActiveFtarEntry.id)

            slotFtarId[0] = newActiveFtarEntry.id
            renderer.slot1 = loadedFtars[newActiveFtarEntry.id]
            
        },
        () =>{

        }
    )
}

function showConfirm(text,onConfirm,onCancel){
    
    onCancelGlob = () => {

        onCancel()
        popupConfirm.classList.add("invisible")
        // popupConfirm.style.display = "none"
    }

    onConfirmGlob = () => {
        onConfirm()
        popupConfirm.classList.add("invisible")
        // popupConfirm.style.display = "none"
    }

    confirmText.innerText = text
    popupConfirm.classList.remove("invisible")
    // popupConfirm.style.display = "block"
}

let onConfirmGlob
function confirmChosen(){
    if (onConfirmGlob) onConfirmGlob();
}
let onCancelGlob
function cancelChosen(){
    if (onCancelGlob) onCancelGlob();
}

recVideoElement.muted=false
function muteAudioWhileRecording(){
    recVideoElement.muted = !recVideoElement.muted
    if (recVideoElement.muted){
        muteButton.innerText = "volume_up"
    }else{
        muteButton.innerText = "volume_off"
    }
    
}

window.showTab = showTab
window.sendImgToCreateFtar = sendImgToCreateFtar
window.resetInputImgForFtar = resetInputImgForFtar
window.cancelAudio = cancelAudio
window.muteAudioWhileRecording = muteAudioWhileRecording
window.startPreview = startPreview
window.cancelPreviewRec = cancelPreviewRec
window.cancelBackground = cancelBackground
window.chooseEffect = chooseEffect
window.deleteFlexatar = deleteFlexatar
window.hidePopup = hidePopup
window.confirmChosen = confirmChosen
window.cancelChosen = cancelChosen

let isSlot2Active = false
slot2Expand.onclick = ()=>{
    slot2Label.classList.remove("invisible")
    slot2Close.classList.remove("invisible")
    flexatarListContainer1.classList.remove("invisible")
    slot2Expand.classList.add("invisible")
    renderer.effect =  ()=>{ return { mode: 2, parameter: 0.35 }}
    isSlot2Active = true
}
slot2Close.onclick = ()=>{
    slot2Label.classList.add("invisible")
    slot2Close.classList.add("invisible")
    slot2Expand.classList.remove("invisible")
    flexatarListContainer1.classList.add("invisible")
    renderer.effect =  FtarView.effect.no()
    isSlot2Active = false

}