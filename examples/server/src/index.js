import {listItem} from "./list-item.js"
import {createContainer} from "./sub-create-container.js"
import {showPopup,showAlert,showConfirm} from "../../util/popup.js"
import VCAM from "./ftar-v-cam.js"




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

async function getSubList(body){
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
    return respJson
}

function addEntriesToDocument(respJson){
    for (const entry of respJson.list){
        const subscription = listItem(entry,{
            vcam:(request)=>{
                if (vCam){
                    vCam.destroy()
                }
                vCam = createVCam(request,videoFromIframe,iframeHolder)
            }
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
addEntriesToDocument({list:[{authtype:"paid",user:"test@user.email"}]})
async function showListElements(body){
    const respJson = await getSubList(body)
    if (!respJson) return
    addEntriesToDocument(respJson)
    
    
}


listSubscription.onclick = async() => {
    showListElements()
}

function createVCam(request,videoelement,holder){
    // const size = {width:"50px",height:"320px"}
    const vCam = VCAM.getVCamElement("http://localhost:8082")
    vCam.resolution = {width:240,height:320}
    vCam.setupTokenFetch("/usertoken",
        {
            method: 'POST',
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(request)  
        }
    )
    vCam.ontokenerror = (error)=>{
        console.log(error)
    }

    vCam.onoutputstream = (mediaStream) => {
        
        vCamTable.style.display = "block"
        videoelement.srcObject = mediaStream
        // console.log("onoutputstream",mediaStream)
    }
    vCam.background = "./static/background0.jpg"
    // vCam.style.display = "none"
    vCam.mount(holder)
    return vCam
}
let vCam


micButton.onclick = async () => {
    vCam.src = await navigator.mediaDevices.getUserMedia({ audio: true });
    videoFromIframe.muted = true
}

speakButton.onclick = async () => {
    vCam.src = "./static/Mary.mp3"
    videoFromIframe.muted = false
}

stopButton.onclick = async () => {
    vCam.src = null
}


