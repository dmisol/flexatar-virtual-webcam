

import {createVGen} from "./vgen-creator.js"
import {createVCam} from "./vcam-creator.js"

import {subscriptionListUI} from "./ui/subscriptionListUI.js"
import {buySubscriptionUI} from "./ui/buySubscriptionUI.js"
import {actionsLoggerUI} from "./ui/actionsLoggerUI.js"
import {VCamConnection, AudioDelayManager} from "./vcam-plugin-system.js"


const addLog = actionsLoggerUI(5,500,150,"logsHolder")

addLog("start")
let vCam
let vGen


const {addSubscriptionToList} = subscriptionListUI(1,50,150,"refreshList","subscriptionListHolder",async ()=>{
    // console.log("refresh")
        addLog("Refresh subscription list pressed.")
        const resp = await fetch("/listsubscription",{
            method: 'POST',
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({})
        })
        if (!resp.ok){
            addLog("Refresh failed: "+await resp.text())

            return []
        }
    
        const respJson = await resp.json()
        addLog("Refresh success")
        // console.log(respJson)
        return respJson.list

    },
    {
        onVCam:(authtype,user) =>{
            vCamTable.style.display = "block"
            console.log("onVCam",authtype,user)
            if (vCam){
                vCam.destroy()
            }
            vCam = createVCam({authtype,user,
                // domain:["localhost:8081"]
            },videoFromIframe,iframeHolder,addLog)
        },
        onVGen:(authtype,user) =>{
           
            addLog("Starting v-gen...")
            if (vGen){
                vGen.destroy()
            }
            vGen = createVGen({authtype,user},vGenHolder,addLog)
          

        },
        onDelete:async (authtype,user) =>{
            // console.log("onDelete",authtype,user)
            addLog("Delete subscription pressed."+JSON.stringify({authtype,user}))
            const resp = await fetch("/delsubscription",{
                method: 'POST',
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify({authtype,user})
            })
            if (resp.ok){
                // console.log("deletion success")
                addLog("Deletion success.")
              
            }else{
                // console.log("deletion failed")
                addLog("Delete failed :"+await resp.text())
            }
            return resp.ok
        }
    }
)


buySubscriptionUI("buySybscription",subscriptionItem =>{
    if (subscriptionItem.error){
        addLog("Buy subscription error:"+subscriptionItem.error)
        return
    }
    addLog("Buy subscription success:"+JSON.stringify(subscriptionItem))
    addSubscriptionToList(subscriptionItem.authtype,subscriptionItem.user)
},addLog)


setupConnection.onclick = async ()=>{
    

    vcamPluginIframe.src = vcamPluginUrl.value
    vcamPluginIframe.allow = "camera"
    vcamPluginIframe.allowfullscreen = true
    vcamPluginIframe.allowFullscreen = true

    vCamOutput.style.display = "flex"
   
}
let existingConnection
let audioTrack
connectVcamMedia.onclick = async ()=>{
    const micStream =  await navigator.mediaDevices.getUserMedia({audio:true});
    console.log("setupConnection",existingConnection)
   
    // vcamPluginIframe.onload =  async ()=>{
        
        if (existingConnection){
            existingConnection.close()
            existingConnection = null
            connectVcamMedia.textContent="CONNECT"
            pluginVideoHolder.firstChild.remove()
            if (audioTrack)audioTrack.stop()


        }else{
            const currentConnection =  new VCamConnection(true)
            const videoTrack = await currentConnection.getVCamMedia(vcamPluginIframe)
            audioTrack = micStream.getAudioTracks()[0]
            currentConnection.addAudioTrack(micStream.getAudioTracks()[0])
            console.log("videoTrack",videoTrack)
            const videoElement = document.createElement("video")
            pluginVideoHolder.appendChild(videoElement)
            videoElement.srcObject  = new MediaStream([videoTrack]) 
            videoElement.playsInline = true
            videoElement.play()
            existingConnection = currentConnection
            connectVcamMedia.textContent="DISCONNECT"
        }
       
    // }
   
}


