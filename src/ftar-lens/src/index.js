
import {
    bitmapFromArrayBuffer,
    maskUnwantedFaces,
    cropImage,
    rotateImageBitmap,
    encodeImageBitmapToJpegDataURL,
    calculateImageFileHash
} from "./face-detector/image-proc.js"
import {FaceParser} from "./face-detector/face-parser.js"
// import {addImgIdToMakeFtarList} from "./face-detector/make-ftar-manager.js"
// import { ManagerConnection } from "../../flexatar-package/src/ftar-manager/ftar-connection.js"

function log(){
    console.log("[FTAR_FACE_PARSER]",...arguments)
}
const Texts = {
    YAW_ERROR : "Photo not frontal",
    YAW_WARN : "Photo almost not frontal",
    SIZE_WARN : "Low photo resolution",
}
log("face_parser_script")
const faceParser = new FaceParser("./face-detection-asset");

let isMainImagePlaced = false
let currentSelectedImage
let portSelf


window.onmessage = async e => {
    const msg = e.data
    if (!msg) return

    if (msg.managerPort){
        portSelf = msg.managerPort
        setupPort(portSelf)
        portSelf.postMessage({msgID:msg.msgID})
        // window.parent.postMessage({getPort:portOut,msgID:msg.msgID})
    }else if (msg.closeThisWindow){
        closeThisWindow()
    }
} 

function setupPort(port){
    port.onmessage = async e=>{
        const msg = e.data
        if (!msg) return
        if (msg.imageBuffer){

            const hashSumPromise = calculateImageFileHash(msg.imageBuffer)
            
            const imageBitmap = await bitmapFromArrayBuffer(msg.imageBuffer)
            await faceParser.ready
            const {detections} = await faceParser.detect(imageBitmap)
            const boxes = detections.map(x=>x.boundingBox)
            let faceFound = false
            const promises = []
            let imgCounter = 0
            for (const detection of detections){
                
                const entryPromise = (async ()=>{
                    const imageIdx = imgCounter
                    const maskedBitmap = await maskUnwantedFaces(imageBitmap,boxes.filter(x=>x !==detection.boundingBox))
                    const croppedBitmap =  await cropImage(maskedBitmap,detection)
                    const checkResult = await faceParser.checkImage(croppedBitmap)
                    if (checkResult.isValid){
                        faceFound = true
                        const rotBitmap = await rotateImageBitmap(croppedBitmap,checkResult.angles.roll)
                        const imageSrc = await rotBitmap.toObjectUrl()
                        const img = new Image()
                        img.src = imageSrc
                        img.className = "preview-in-list"
                        img.readyToUseBitmap = rotBitmap
                        img.ftarImgId = imageIdx
                        img.hashSumPromise = hashSumPromise
                        img.onclick = ()=>{
                            currentSelectedImage = img

                            clearContainerExcept(warnContainer,"okElement")
                            mainImage.src = imageSrc
                            let isGood = true
                            okElement.classList.add("invisible")
                            if (checkResult.errorYaw || checkResult.errorPitch){
                                const warnEntry = document.createElement("li")
                                warnEntry.textContent = Texts.YAW_ERROR
                                warnEntry.style.color = "red"
                                warnContainer.appendChild(warnEntry)
                                isGood = false
                            }else if (checkResult.warnYaw){
                                const warnEntry = document.createElement("li")
                                warnEntry.textContent = Texts.YAW_WARN
                                warnContainer.appendChild(warnEntry)
                                isGood = false
                            }
                            if (checkResult.warnSize){
                                const warnEntry = document.createElement("li")
                                warnEntry.textContent = Texts.SIZE_WARN
                                warnContainer.appendChild(warnEntry)
                                isGood = false
                            }
                            if (isGood){
                                okElement.classList.remove("invisible")
                            }
                            if (img.isChosen){
                                mainImage.classList.add("selected")

                            }else{
                                mainImage.classList.remove("selected")
                            }
                        }
                        img.ondblclick = ()=>{
                            toggleChosen(img)

                            
                        }

                        if(!isMainImagePlaced){
                            log("first image installed")
                            isMainImagePlaced = true
                            img.click()
                            mainImage.classList.remove("invisible")
                            waitIcon.classList.add("invisible")
                            aproveContainer.classList.remove("invisible")
                        }
                        // img.alt = 'Generated Image'
                        // img.style.border = "solid 1px black"
                        // img.style.width = "100px"
                        // img.style.height = "auto"
                        // img.style.border = "solid 1px black"
            
                        imagePreviewList.appendChild(img)
                    }
                
                    
                })()
            

                promises.push(entryPromise)
                
                imgCounter++;
            }
            const results = await Promise.all(promises)
            if (results.length == 1){
                toggleChosen(currentSelectedImage)
                // currentSelectedImage.dblClick()
            }
            if (!faceFound){

                noFaceFound.classList.remove("invisible")
                waitIcon.classList.add("invisible")
            }
            log("detections",detections)
        }
    }
}


let oldChosen
chooseButton.onclick = () =>{
    // if (oldChosen){
    //     oldChosen.classList.remove("selected")
    // }
    toggleChosen(currentSelectedImage)
   
    oldChosen = currentSelectedImage
}

mainImage.ondblclick = ()=>{
    toggleChosen(currentSelectedImage)
}

function closeThisWindow(){
    window.parent.postMessage({closeWindow:true,portSelf},"*",[portSelf])

}
closeButton.onclick = () =>{
    closeThisWindow()

}

makeButton.onclick = ()=>{
    aproveContainer.classList.add("invisible")
    imagePreviewList.classList.add("invisible")
    completionView.classList.remove("invisible")

    encodingProgress.textContent = `( 0 / ${selectedCounter} )`
    makeButton.disabled = true
    let encodedCounter = 0
    getImagesToMakeFtar(imagePreviewList,()=>{
        encodingProgress.textContent = `( ${encodedCounter} / ${selectedCounter} )`
        encodedCounter++

    }).then(async imagesList=>{
        log("imageList ready",imagesList)
        encodingProgress.textContent = `( ${encodedCounter} / ${selectedCounter} )`
        flexatarCreationInfo.classList.remove("invisible")
        portSelf.postMessage({imagesList})

        closeThisWindow()
        // const imgIdList = imagesList.map(x=>x.id)

        // const addResult = await addImgIdToMakeFtarList(imagesList)
        // const addResult = await QueueStorage.addToList(QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID,imagesList)

        // log("addImgIdResult",addResult)

        // // const storedImageId = await  QueueStorage.getList(QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID)
        // const storedImageId = await getImgIdToMakeFtarList()
        // log("storedImageId",storedImageId)

        // for (const {dataUrl,id} of imagesList){
        //     const result = await storeImageToMakeFtar(dataUrl,id)
        //     log("image stored",result)
          
        // }

        // window.parent.postMessage({closeFlexatarLens:true},"*")
    })
}


let selectedCounter = 0
function toggleChosen(e){
    if (!e) return;
    e.isChosen = !e.isChosen
    if (e.isChosen){
        e.classList.add("selected")
        selectedCounter++;
        makeButton.disabled = false
    }else{
        e.classList.remove("selected")
        selectedCounter--;
        if (selectedCounter === 0){
            makeButton.disabled = true

        }

    }
    selectedCount.textContent = selectedCounter;
    if (selectedCounter != 0){
        photoCounter.classList.add("selected-color")
    }else{
        photoCounter.classList.remove("selected-color")

    }
    if (e.isChosen){
        mainImage.classList.add("selected")

    }else{
        mainImage.classList.remove("selected")
    }
}

function clearContainerExcept(container, keepId) {
    if (!(container instanceof Element)) {
      throw new Error("Provided container is not a valid DOM element.");
    }
  
    for (const child of Array.from(container.children)) {
      if (child.id !== keepId) {
        container.removeChild(child);
      }
    }
}

async function getImagesToMakeFtar(container,onImageProcessingStarted){
    const result = []
    for (const child of Array.from(container.children)) {
       
        console.log("encoding")
        if (child.readyToUseBitmap && child.isChosen) {
            onImageProcessingStarted()
            result.push(
                {
                    dataUrl:await encodeImageBitmapToJpegDataURL(child.readyToUseBitmap),
                    id: (await child.hashSumPromise+"___"+child.ftarImgId+"___"+ crypto.randomUUID())
                }
            )
        }
    }
    return result
}