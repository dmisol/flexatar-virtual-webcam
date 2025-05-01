async function sendWithResponse(msg){
    const msgID = crypto.randomUUID();
  
    msg.msgId = msgID
    msg.ftarLensMessage = true
    
    return new Promise(resolve=>{
        function handler(event){
            if (!event.data)return
            console.log("responese", event.data)
            if (event.data.msgId === msgID){
                resolve(event.data)
                window.removeEventListener("message",handler)
            }
        }
        window.addEventListener("message",handler)
        window.parent.postMessage(msg,"*")
    })
}

export async function addImgIdToMakeFtarList(listOfImgId){
    return await sendWithResponse({addImgIdToMakeFtarList:listOfImgId})

}

export async function getImgIdToMakeFtarList() {
    return await sendWithResponse({getImgIdToMakeFtarList:true})

}
export async function storeImageToMakeFtar(imgDataUrl,imgId) {
    return await sendWithResponse({storeImageToMakeFtar:imgDataUrl,imgId})
}



export async function clearImgIdToMakeFtarList(){
    const {currentUserId} = await chrome.storage.local.get({ currentUserId:null })
    if (!currentUserId) return {error:"not_authorized"}
    const key = currentUserId+"_ftar_make_queue"
    await chrome.storage.local.remove([key])
}