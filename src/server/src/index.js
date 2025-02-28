

import {createVGen} from "./vgen-creator.js"
import {createVCam} from "./vcam-creator.js"

import {subscriptionListUI} from "./ui/subscriptionListUI.js"
import {buySubscriptionUI} from "./ui/buySubscriptionUI.js"
import {actionsLoggerUI} from "./ui/actionsLoggerUI.js"


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
            console.log("onVCam",authtype,user)
            if (vCam){
                vCam.destroy()
            }
            vCam = createVCam({authtype,user},videoFromIframe,iframeHolder,addLog)
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





