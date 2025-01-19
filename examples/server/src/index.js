import {listItem} from "./list-item.js"
import {createContainer} from "./sub-create-container.js"
import {showPopup,showAlert} from "../../util/popup.js"
import {DropZone,checkFileType,imageMimeTypes} from "../../util/drop-zone.js"

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
                    console.log(reqBody)
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
            }
        ]

    })
  
}

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
            // const token = userTokenPlaceHolder.innerText
            // console.log(token)
            flexatarSDK = new FtarView.SDK(getToken())
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
        const ftarEntry = await FtarView.flexatarEntry(getToken(),ftarLink.id,{ftar:true})
        const ftar = await FtarView.getFlexatar(ftarEntry);

        renderer.slot1 = ftar
        renderer.start()
        renderer.canvas.width=240
        renderer.canvas.height=320
        showPopup({
            customElement:renderer.canvas,
            buttons:[
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
        showAlert("Make flexatar?",async () =>{
            // const token = userTokenPlaceHolder.innerText
            const ftarLink = await FtarView.makeFlexatar(getToken(),file,"noname",{ftar:true,preview:true})
            if (!ftarLink){
                console.log("Unknown error")
            }
            if (ftarLink.err){
                if (ftarLink.reason){
                    if (ftarLink.reason === "queue_limit"){
                        console.log("Only one process at time allowed")
                       
                    }else if (ftarLink.reason === "subscription_limit") {
                        console.log("Out of Subscription Limit")
                    }
                }else{
                    console.log("Bad Photo")
                }
                
            }
            console.log("ftar-sucess")
            addPreview(ftarLink)
            
            return

        })

    }
}
flexatarImageDropDownContainer.appendChild(imageDropZone.dropZone)


showFlexatarPreview .onclick = async() => {
    // const token = userTokenPlaceHolder.innerText
    const ftarList = await FtarView.flexatarList(getToken(),{preview:true})
    console.log(ftarList)
    for (const listElement of ftarList){
        await addPreview(listElement)
    }
}


// getUserToken.onclick = async() => {
    
//     const resp = await fetch("/usertoken")

//     console.log(await resp.json())
// }