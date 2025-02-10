import {listItem} from "./list-item.js"
import {createContainer} from "./sub-create-container.js"
import {showPopup} from "../../util/popup.js"

import {createVGen} from "./vgen-creator.js"
import {createVCam} from "./vcam-creator.js"

async function handleBuySubscription(containerElements) {
    const reqBody = {
        authtype: containerElements.authTypeInput.value,
        user: containerElements.userInput.value,
        testing: containerElements.checkbox.checked,
        crt: crypto.randomUUID()
    };

    try {
        const resp = await fetch("/buysubscription", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody)
        });

        if (!resp.ok) {
            console.error(await resp.json());
        } else {
            console.log("buy subscription success");
        }
    } catch (error) {
        console.error("Error buying subscription:", error);
    }
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
                    await handleBuySubscription(containerElements);
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

let vGen
let vCam
function addEntriesToDocument(respJson){
    for (const entry of respJson.list){
        const subscription = listItem(entry,{
            vcam:(request)=>{
                if (vCam){
                    vCam.destroy()
                }
                vCam = createVCam(request,videoFromIframe,iframeHolder)
            },
            vgen:(request)=>{
                if (vGen){
                    vGen.destroy()
                }
                vGen = createVGen(request,vGenHolder)
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
addEntriesToDocument({list:[{authtype:"test",user:"test@user.email"}]})
async function showListElements(body){
    const respJson = await getSubList(body)
    if (!respJson) return
    addEntriesToDocument(respJson)
    
    
}


listSubscription.onclick = async() => {
    showListElements()
}




