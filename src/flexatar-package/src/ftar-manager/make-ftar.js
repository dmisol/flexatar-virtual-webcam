import {makeFlexatar,GetToken,getPreviewCE,getFlexatarCE,addToList} from "../ftar-connection.js"
// import {getUserToken} from "./user-token.js"
import * as QueueStorage from "./ftar-queue-storage.js"

function log(){
    console.log("[FTAR_MAKE_QUEUE]",...arguments)
}

let errorMock = true
async function makeFlexatarMock(token,file,name,opts,onFtarId){
    setTimeout(()=>{
        onFtarId(crypto.randomUUID())
    },3000)
    await new Promise(resolve=>setTimeout(resolve,6000))
    // await (await fetch("https://kdfjop.sdfsd.fdsdf")).json()
    errorMock = !errorMock
    return {error:errorMock}
    // return {error:true}

}

function listAllKeys(){
    chrome.storage.local.get(null, (items) => {
       log("all keys",Object.keys(items))
    });
}

function dataURLtoFile(dataURL, filename) {
    const [header, base64] = dataURL.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  
    const binary = atob(base64);
    const u8arr = Uint8Array.from(binary, char => char.charCodeAt(0));
  
    return new File([u8arr], filename, { type: mime });
}


   


export async function makeFtarFromQueue(token,imgId){
    log("make ftar with id",imgId)

    const imageDataUrl = await QueueStorage.getByKey(QueueStorage.Prefixes.FTAR_SRC_IMG,imgId.id)
    const currentUserId = await QueueStorage.getCurrentUserId()

    if (imageDataUrl){


        const file = dataURLtoFile(imageDataUrl)

            const ftarLink = await makeFlexatar(token,file,"noname",{ftar:true,preview:true},
                async ftarId=>{
                    log("obtained ftar id")
                    imgId.ftarId = ftarId
                    const result = await QueueStorage.moveListEntry(
                        QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID,
                        QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID,
                        imgId,
                        currentUserId
                    )

                    log("obtained ftar id",ftarId, "move to processing",result)
                    QueueStorage.printAllLists()
                }
            )
            if (ftarLink.error || ftarLink.err){
                await QueueStorage.moveListEntry(
                    QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID,
                    QueueStorage.Lists.FTAR_ERROR_LIST_ID,
                    imgId,
                    currentUserId
                )
            }else{

                await QueueStorage.moveListEntry(
                    QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID,
                    QueueStorage.Lists.FTAR_SUCCESS_LIST_ID,
                    imgId,
                    currentUserId
                )
                try{
                    await addToList(currentUserId,ftarLink.id)
                    getPreviewCE(ftarLink,token,currentUserId)
                    getFlexatarCE(token,ftarLink,currentUserId)
                }catch{
                    log("fail download after creation")
                }
               
            }
            QueueStorage.printAllLists()
            log("flexatar ready",ftarLink)
        
    }


}