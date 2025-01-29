import {listItem} from "./list-item.js"
import {createContainer} from "./sub-create-container.js"
// import {initVAssistant,sendFileToSpeak} from "./v-assistant.js"
import {showPopup,showAlert,showConfirm} from "../../util/popup.js"
import {DropZone,checkFileType,imageMimeTypes} from "../../util/drop-zone.js"
import VCAM from "./ftar-v-cam.js"


function getToken(){
    return userTokenPlaceHolder.innerText
}

buySybscription.onclick = async() => {

    const containerElements = createContainer();
    showPopup({
        customElement:containerElements.container,
        buttons:[
            {
                text:"BUY",
                onclick:async closeHandler =>{
                    closeHandler()
                    const reqBody = {
                        authtype:containerElements.authTypeInput.value,
                        user:containerElements.userInput.value,
                        testing:containerElements.checkbox.checked,
                        crt:crypto.randomUUID()
                    }
                   
                    // todo fetch with retry
                    const resp = await fetch("/buysubscription",{
                        method: 'POST',
                        headers:{"Content-Type":"application/json"},
                        body: JSON.stringify(reqBody)
                    })
                    if (!resp.ok){
                        console.log(await resp.json())
                    }else{
                        console.log("buy subscription success")
                    }

                }
               
            },{
                text:"CANCEL",
                onclick:async closeHandler =>{
                    closeHandler()
                }
            }
        ]

    })
  
}

const getTokenInst = new FtarView.GetToken(async ()=>{
    return getToken()
})

let flexatarSDK
async function showListElements(body){
    if (!body) body = {}
    const resp = await fetch("/listsubscription",{
        method: 'POST',
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
    })
    if (resp.error){
        return
    }
    const respJson = await resp.json()
    for (const entry of respJson.list){
        const subscription = listItem(entry,()=>{
            
            flexatarSDK = new FtarView.SDK(getTokenInst)
        })

        subscriptionsContainer.appendChild(subscription)
    }

    if (respJson.continue){
        showMoreButton.style.display = "block"
        showMoreButton.onclick =  () =>{
            showListElements({continue:respJson.continue})
        }
    }else{
        showMoreButton.style.display = "none"
    }
    
}

listSubscription.onclick = async() => {
    showListElements()
}


let renderer
async function addPreview(ftarLink){
    const previewImg = await FtarView.getPreview(ftarLink);
            
    const preview = document.createElement("img")
    preview.src = previewImg
    preview.style.cursor = "pointer"
    preview.style.width = '75px'; 
    preview.style.height = 'auto'; 
    preview.style.objectFit = 'contain';
    flexatarPreviewContainer.appendChild(preview)
    preview.onclick = async () =>{
        if (!flexatarSDK) return
        if (!renderer){
            renderer = await flexatarSDK.getRenderer()
        }
        const ftarEntry = await FtarView.flexatarEntry(getTokenInst,ftarLink.id,{ftar:true})
        const ftar = await FtarView.getFlexatar(ftarEntry);

        renderer.slot1 = ftar
        renderer.start()
        renderer.canvas.width=240
        renderer.canvas.height=320
        showPopup({
            customElement:renderer.canvas,
            buttons:[
                {
                    text:"REMOVE",
                    onclick:async closeHandler =>{
                        closeHandler()
                        if (await FtarView.deleteFlexatar(ftarLink,getTokenInst)){
                            preview.remove()
                            console.log("deletion success")
                        }else{
                            console.log("deletion error")
                        }
                    }
                },
                {
                    text:"CLOSE",
                    onclick:async closeHandler =>{
                        closeHandler()
                    }
                }
            ]
    
        })

    }
}

const imageDropZone = new DropZone("Drag & drop frontal photo here or click to upload")
imageDropZone.handleFiles = (e) =>{
    const file = e.target.files[0];
   
    const fileType = file.type;
    if (checkFileType(fileType,imageMimeTypes)){
        showConfirm("Make flexatar?",async () =>{

            const ftarLink = await FtarView.makeFlexatar(getTokenInst,file,"noname",{ftar:true,preview:true})
            if (!ftarLink){
                console.log("Unknown error")
            }
            if (ftarLink.err){
                if (ftarLink.reason){
                    if (ftarLink.reason === "queue_limit"){
                        console.log("Only one process at time allowed")
                    }else if (ftarLink.reason === "subscription_limit") {
                        console.log("Out of Subscription Limit")
                    }else if (ftarLink.reason === "bad_photo") {
                        console.log("Bad Photo")
                    }
                }
                return
            }
            console.log("ftar-sucess")
            addPreview(ftarLink)
            
            return

        })

    }
}
flexatarImageDropDownContainer.appendChild(imageDropZone.dropZone)


showFlexatarPreview .onclick = async() => {

    const ftarList = await FtarView.flexatarList(getTokenInst,{preview:true})
   
    for (const listElement of ftarList){
        await addPreview(listElement)
    }
}

function createVCam(user,videoelement,holder){
    // const size = {width:"50px",height:"320px"}
    const vCam = VCAM.getVCamElement("http://localhost:8082")
    vCam.setupTokenFetch("/usertoken",
        {
            method: 'POST',
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({authtype:"test",user:user,restricted:false})  
        }
    )
    vCam.ontokenerror = (error)=>{
        console.log(error)
    }

    vCam.onoutputstream = (mediaStream) => {
        videoelement.srcObject = mediaStream
        // console.log("onoutputstream",mediaStream)
    }
    vCam.background = "./static/background0.jpg"
    vCam.mount(holder)
    return vCam
}
let vCam
showVAssistant.onclick = () => {
    // const token = getToken()
   
    vCam = createVCam("test@user.email",videoFromIframe,iframeHolder)
    // createVCam("test@user.email",videoFromIframe1,iframeHolder1)
}



speakButton.onclick = async () => {
    vCam.src = "./static/Mary.mp3"
}

stopButton.onclick = async () => {
    vCam.src = null
}
// speakButton.onclick = async () => {
//     const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     vCam.audiostream = mediaStream
// }

