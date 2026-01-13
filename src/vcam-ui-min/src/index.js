

// import {eventProvider} from "./message-listener-impls/eventsFromParentHtml.js"
// import {sendToParent} from "./message-sender-impls/sendToParentHtml.js"
// import {getFlexatarWraped,getPreviewWraped} from "./caching.js"
import { Texts } from "./texts.js"
// import {MediaConnectionProvider} from "../../util/rtc-connection.js"
import { checkFileType, imageMimeTypes } from "../../util/util.js"
import { fileToStringConverter } from "../../util/fileToStringConverter.js"
import { Manager, ManagerConnection } from "../../flexatar-package/src/ftar-manager/ftar-connection.js"

const Ftar = {
    Manager, ManagerConnection
}


function log() {
    console.log("[FTAR_UI]", ...arguments)
}


console.log("poast getFtarPreview")
// const channel = new MessageChannel();
const connection = new Ftar.ManagerConnection()
// let activeConnection = connection

connection.onEffectMessage = msg => {
    flexatarControllerPort.postMessage(msg)

}
connection.onSlot2 = msg => {
    // log("slot2 ", msg.slot2)
    flexatarControllerPort.postMessage(msg, [msg.slot2])
}

connection.onSlot1 = msg => {
    log("slot1 from effect", msg.ftarLink1)
    flexatarControllerPort.postMessage(msg, [msg.slot1])
}

connection.onEffectStateRequest = msg => {
    log("effectStateRequest")
    flexatarControllerPortPromise.then(port => {
        port.postMessage(msg)
    })
}
connection.onAnimationPatternRequest = msg => {
    log("onAnimationPatternRequest")
    flexatarControllerPortPromise.then(port => {
        port.postMessage(msg)
    })
}

window.parent.postMessage({ ftarUIPort: connection.outPort }, "*", [connection.outPort])

// const connectionUnauthorized = new Ftar.ManagerConnection()
log("posting ftarUIPortUnauthorized port")
// window.parent.postMessage({ ftarUIPortUnauthorized: connectionUnauthorized.outPort }, "*", [connectionUnauthorized.outPort])


let flexatarControllerPort
const flexatarControllerPortPromise = new Promise(resolve => {
    window.addEventListener("message", e => {
        if (e.data && e.data.flexatarControllerPort) {
            log("ftar ui flexatarControllerPort", e.data.flexatarControllerPort)
            flexatarControllerPort = e.data.flexatarControllerPort
            flexatarControllerPort.onmessage = (e) => {
                const msg = e.data;
                if (!msg) return
                // log("flexatarControllerPort Response",msg)

                if (msg.effectStateResponse) {
                    log("effectStateResponse")
                    connection.sendEffectState(msg)
                }
                else if (msg.animationPatternResponse) {
                    log("animationPatternResponse", msg)
                    connection.sendEffectState(msg)
                }
            }
            resolve(flexatarControllerPort)
        } else if (e.data && e.data.clickFlexatarCreation) {
            flexatarPhotoInputElement.click()
        } else if (e.data && e.data.closing) {
            console.log("iframe controller port close")
            if (flexatarControllerPort) {
                flexatarControllerPort.postMessage({ closing: true })
                flexatarControllerPort.close()
                flexatarControllerPort = null
            }
            connection.close()
            // connectionUnauthorized.close()
        }
    })

})



confirmButton.onclick = async () => {
    confirmButton.classList.add("invisible")
    trashIcon.classList.add("invisible")
    crossIcon.classList.add("invisible")
    waitIcon.classList.remove("invisible")
    waitIcon.classList.add("roating")
    trashButton.disabled = true

    if (isBkgBlockExpanded) {
        if (noBackgroundButton !== oldBkg) {
            await connection.deleteBackground(oldBkg.id)

            if (oldBkg)
                oldBkg.remove()
            imageBackgroundContainer.firstElementChild?.click()
        }
    } else {
        const currentElement = globalSelectedFtarElement
        const deletionResult = await deleteFtar(globalSelectedFtar)

        if (deletionResult) {
            currentElement.remove()
            if (previewListHolder.children.length > 0) {
                if (currentElement === globalSelectedFtarElement)
                    previewListHolder.children[0]?.click()
            } else {
                globalSelectedFtar = null
                emptyBlock.textContent = Texts.EMPTY

            }
        }
    }


    trashIcon.classList.remove("invisible")
    waitIcon.classList.add("invisible")
    waitIcon.classList.remove("roating")
    isTrashPressed = !isTrashPressed

}
function removeFirstMatch(arr, predicate) {
    const index = arr.findIndex(predicate);
    if (index === -1) return null;
    const ret = arr[index]
    arr.splice(index, 1);
    return ret;
}

async function loadFtarListPreviews(noCache, selectedFtar) {
    // const listUnauthorized = await connectionUnauthorized.getList({ preview: true, noCache: false })


    const favList = await connection.getFavorite()
    log("favList", favList)
    const favProcessed = []
    let list = await connection.getList({ preview: true, noCache })
    for (const favEntry of favList){
       const matchFound = removeFirstMatch(list,x=>x.id === favEntry.id )
       log("matchFound",matchFound)
       if (matchFound){
        //  Object.assign(favEntry, matchFound);
        favProcessed.push(matchFound)

       }
    }


    // list = list.filter(item => {
    //     for (const e of favList) {
    //         if (e.id === item.id) {
    //             Object.assign(e, item);
    //             return false
    //         }
    //     }
    //     return true
    // });
    list = favProcessed.reverse().concat(list)
    // log("list", list)
    // return
    if (list.error) {
        showSubscriptionError()
        return
    }



    log("selectedFtar", selectedFtar)
    for (const listElement of list) {
        log(listElement)
        const imgArrayBuffer = await connection.getPreview(listElement)
        const blob = new Blob([imgArrayBuffer], { type: "image/jpg" }); // Change type if needed
        const imgSrc = URL.createObjectURL(blob);
        const { holder } = await addPreview(listElement, imgSrc, null, selectedFtar.id, connection)
    }


}

async function reloadFtarList(noCache) {
    reloadFtarListButton.disabled = true
    reloadIcon.classList.add("roating")


    while (previewListHolder.children.length > 0) {
        previewListHolder.children[0]?.remove()
    }

    let currentFtar = await connection.getCurrentFtar()
    await loadFtarListPreviews(noCache, currentFtar)

    reloadIcon.classList.remove("roating")
    reloadFtarListButton.disabled = false
}

reloadFtarListButton.onclick = async () => {
    log("reload clicked")
    await reloadFtarList(true)
    // reloadFtarListButton.disabled = true
    // reloadIcon.classList.add("roating")


    // while (previewListHolder.children.length > 0) {
    //     previewListHolder.children[0]?.remove()
    // }

    // let currentFtar = await connection.getCurrentFtar()
    // await loadFtarListPreviews(true, currentFtar)

    // reloadIcon.classList.remove("roating")
    // reloadFtarListButton.disabled = false
}

trashButton.onclick = () => {
    if (isTrashPressed) {
        crossIcon.classList.add("invisible")
        trashIcon.classList.remove("invisible")
        confirmButton.classList.add("invisible")
    } else {
        confirmButton.classList.remove("invisible")
        trashIcon.classList.add("invisible")
        crossIcon.classList.remove("invisible")
    }
    isTrashPressed = !isTrashPressed

}


// })

reloadIcon.classList.add("roating")

function updateUserInfo(opts) {
    log("try to obtain user info")
    connection.userInfo(opts).then(inf => {
        log("user info", inf)
        // ftarCountSign.textContent =  inf.FtarCount

    })
}

function showSubscriptionError() {
    reloadIcon.classList.remove("roating")
    // plusCircle.classList.add('rotated');
    makeTextHolder.textContent = Texts.SUBSCRIPTION_END
}
connection.onNewFlexatar = async ftarLink => {
    log("new flexatar", ftarLink)
    if (ftarLink.error) return
    const imgArrayBuffer = await connection.getPreview(ftarLink)
    const blob = new Blob([imgArrayBuffer], { type: "image/jpg" }); // Change type if needed
    const imgSrc = URL.createObjectURL(blob);
    const { holder } = await addPreview(ftarLink, imgSrc, true, ftarLink.id, connection)

    // holder.click()
}
Promise.all([connection.ready]).then(async () => {
    // updateUserInfo()

    // const currentFtar = await connection.getCurrentFtar()
    // if (currentFtar.error) {
    //     showSubscriptionError()
    //     return
    // }
    // log("page ready, current ftar is", currentFtar)
    // if (currentFtar) {
    //     selecteFtar = { ftarId: currentFtar.id }
    // activeConnection = (await connection.getManagerName()) === "empty" ? connectionUnauthorized : connection
    // loadBackgroundList()

    let currentFtar = await connection.getCurrentFtar()
    // if (!selectedFtar) {
    //     selectedFtar = (await connectionUnauthorized.getSelectedFtar()).selectedFtar
    // }
    await loadFtarListPreviews(false, currentFtar)
    /*
    const list = await connection.getList({ preview: true })
    log("ftar list:", list)
    if (list.error) {
        showSubscriptionError()

        return
    }
    // let firstFtar = true
    for (const { id, is_myx } of list) {
        const imgArrayBuffer = await connection.getPreview(id)
        const blob = new Blob([imgArrayBuffer], { type: "image/jpg" }); // Change type if needed
        const imgSrc = URL.createObjectURL(blob);
        const { holder } = await addPreview({ id, is_myx }, imgSrc)
    }
    */
    // } else {
    //     log("setting empt block")
    //         emptyBlock.textContent = Texts.EMPTY
    // }

    reloadIcon.classList.remove("roating")
})
// window.parent.postMessage({getFtarPreview:true,uiToRenderEngine:true},"*")
const previewLoadPromiseResolvers = { slot1: {}, slot2: {} }
/*
channel.port1.addEventListener("message",event=>{
    const {data} = event
    if (!data) return
    if (data.previewFtarImage){
        console.log("data.previewFtarImage",data.previewFtarImage)
        const {previewImage,id} = data.previewFtarImage
        
        addPreview({id},previewImage);
    }else if (data.flexatarDidSetToSlot){
        previewLoadPromiseResolvers[data.slot][data.id]()

        
    }
    else if (data.selectedFtar){
        selecteFtar = {ftarId:data.selectedFtar}

    }
})
*/




async function blobToDataURL(blobUrl) {
    const response = await fetch(blobUrl);
    const blob = await response.blob();

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

const restoreFileFromString = fileToStringConverter().restoreFileFromString

let effectAmount = 0.5
const effectCodeDict = {
    no: 0,
    morph: 1,
    hybrid: 2
}
let nonAnimatedEffect = { mode: 0, parameter: 0 }

window.onload = function () {
    window.scrollTo(0, 200); // Scrolls 200px down
};

allowAuidoOverlay.textContent = Texts.ALLOW_AUDIO

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let iframeId;
let externalControl = false;


function fileToArrayBuffer(file) {
    const fileType = file.type;
    const fileName = file.name;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => resolve({ buffer: reader.result, fileType, fileName });
        reader.onerror = error => reject(error);
    });
}






function createDropZone(element, handler) {
    const input = document.createElement('input');
    const inputHolder = document.createElement('form');
    inputHolder.appendChild(input)
    input.type = "file";

    input.accept = "image/*"
    input.capture = 'user';
    input.onchange = e => {
        handler(e);
        inputHolder.reset();
    }

    element.onclick = () => {
        log("clicked on drop zone")
        input.click()
    }
    element.ondragover = (e) => {
        e.preventDefault();
        element.classList.add('hover');
    }

    element.ondragleave = (e) => {
        element.classList.remove('hover');
    }
    element.ondrop = e => {
        e.preventDefault();
        log("on drop", e.dataTransfer)
        element.classList.remove('hover');
        const files = e.dataTransfer.files;
        handler({ target: { files } });
        inputHolder.reset();
    }
    return input
}

async function createFtar(file) {
    const fileMessage = await fileToArrayBuffer(file)
    fileMessage.makeFtar = true
    return await connection.makeFlexatar(file)


}

function addMakeFlexatarButton() {

    const holder = createFlexatarHolder
    // const circle = plusCircle
    const text = makeTextHolder
    text.textContent = Texts.DROP_PHOTO

    const blockOverlay = makeOverlayElement


    const setErrorSign = (infoText) => {
        // circle.classList.add('rotated');
        text.textContent = infoText
        return () => {
            // circle.classList.remove('rotated');
            text.textContent = Texts.DROP_PHOTO
        }
    }

    const setLoader = () => {
        // circle.style.display = "none"
        text.style.display = "none"
        blockOverlay.style.display = "block"


        return () => {
            // circle.style.display = "block"
            text.style.display = "block"
            blockOverlay.style.display = "none"
        }
    }


    let removeErrorSign
    log("setting up flexatar create button")
    return createDropZone(holder, async (e) => {
        let file = e.target.files[0];

        if (!file) return
        log("photo obtained")
        if (removeErrorSign) {
            removeErrorSign()
            removeErrorSign = null
        }

        const removeLoader = setLoader()


        const fileType = file.type;

        if (!checkFileType(fileType, imageMimeTypes)) {
            removeErrorSign = setErrorSign(Texts.NOT_PHOTO)
            removeLoader()
            return
        }

        const ftarLink = await createFtar(file)
        log("ftarLink", ftarLink)
        removeLoader()




    })


}
const flexatarPhotoInputElement = addMakeFlexatarButton()


const ftarLinkDict = {}

async function previewLoader(ftarList, previewReadyCallback) {
    for (const ftarLink of ftarList) {
        ftarLinkDict[ftarLink.id] = ftarLink
        /*
        const previewImg = await getPreviewWraped(ftarLink);
        if (previewImg){
            previewReadyCallback(ftarLink,previewImg)
        }
            */
    }
}



let oldClicked
let selecteFtar
let globalSelectedFtar
let globalSelectedFtarIsFavorite = false
let globalSelectedFtarElement
let globalCurrentConnection

async function addPreview(ftarLink, previewImage, first, selectedFtarId, connectionProvider) {
    ftarLinkDict[ftarLink.id] = ftarLink
    const previewImg = previewImage;
    // const previewImg = await getPreviewWraped(ftarLink);

    const holder = document.createElement("span")
    holder.className = "item-holder"

    const preview = document.createElement("img")

    preview.src = previewImg
    preview.draggable = false
    preview.style.cursor = "pointer"
    preview.style.display = 'block';
    preview.style.width = '100%';
    preview.style.height = 'auto';
    preview.style.margin = '0px';
    preview.style.padding = '0px';
    preview.style.boxSizing = 'border-box';
    preview.style.lineHeight = '0px';
    preview.style.verticalAlign = 'top';

    preview.style.objectFit = 'contain';
    holder.appendChild(preview)
    console.log("appending preview image")
    holder.id = ftarLink.id

    const loader = document.createElement("span")
    loader.className = "loader"

    if (first) {
        previewListHolder.insertBefore(holder, previewListHolder.firstChild);

    } else {
        previewListHolder.appendChild(holder);

    }

    holder.onclick = async () => {


        likeButton.disabled = true
        if (oldClicked) {

            oldClicked.classList.remove("selected-item")
        }

        oldClicked = holder
        holder.classList.add("selected-item")
        // if (globalSelectedFtar === ftarLink.id) return

        globalSelectedFtar = ftarLink.id
        globalSelectedFtarElement = holder
        globalCurrentConnection = connectionProvider

        // selecteFtar = { element: holder, ftarId: ftarLink.id }

        holder.appendChild(loader)

        const ftarBuffer = await connection.getFlexatar(ftarLink, true)

        console.log("ftarBuffer", ftarBuffer)

        if (flexatarControllerPort) {
            flexatarControllerPort.postMessage({ slot1: ftarBuffer, id: ftarLink.id }, [ftarBuffer])
            flexatarControllerPort.postMessage({ noEffect: true })

        }


        loader.remove()
        likeButton.disabled = false
        const favList = await connection.getFavorite()
        if ((favList.filter(item => item.id === ftarLink.id)).length === 0) {
            likeButton.classList.remove("like-selected")
            globalSelectedFtarIsFavorite = false
            trashButton.disabled = false
        } else {
            likeButton.classList.add("like-selected")
            globalSelectedFtarIsFavorite = true
            trashButton.disabled = true


        }


    }
    // console.log("selecteFtar", selecteFtar, ftarLink.id)

    if (selectedFtarId === ftarLink.id) {

        globalSelectedFtarElement = holder

        if (selectedFtarId)
            holder.click()
    }
    return { holder, previewImg }

}



trashButton.classList.remove("invisible")
let isTrashPressed = false

function requestUserInfo() {


}
requestUserInfo()

async function deleteFtar(ftarId) {
    return (await globalCurrentConnection.deleteFlexatar(ftarId)).success

}





reloadFtarListButton.classList.remove("invisible")


let isDragging = false;
let startY, scrollY;
let speedTimer

document.addEventListener('mousedown', (e) => {
    if (timer) clearInterval(timer)
    isDragging = true;
    startY = e.screenY;

    scrollY = window.scrollY;

});
let oldY = 0
let speed = 0
let avarspeed = 0
let deltaY
let scrollStarted = false
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return; // Exit if not dragging
    e.preventDefault();

    deltaY = startY - e.screenY;

    if (!scrollStarted) if (Math.abs(deltaY) < 10) {

        return;
    }
    if (!scrollStarted) {
        avarspeed = 0
        speedTimer = setInterval(() => {
            speed = deltaY - oldY
            oldY = deltaY
            avarspeed = (avarspeed + speed) * 0.5
        }, 100)
    }
    scrollStarted = true
    document.body.style.pointerEvents = "none"

    window.scrollTo(0, scrollY + deltaY);

});
let timer
function stopDarg() {

    isDragging = false;
    oldY = 0
    if (speedTimer) clearInterval(speedTimer)

    document.body.style.pointerEvents = "auto"
    if (!scrollStarted) return
    scrollStarted = false
    scrollY = window.scrollY;
    speed = avarspeed * 0.5
    timer = setInterval(() => {
        scrollY += speed
        window.scrollTo(0, scrollY);
        speed *= 0.9
        if (Math.abs(speed) < 1) {
            clearInterval(timer)
        }
    }, 50)
    const t = timer
    setTimeout(() => {
        clearInterval(t)
    }, 2000)


}
document.addEventListener('mouseup', stopDarg);
document.addEventListener('mouseleave', stopDarg);



emotionText.onclick = expandEmoButton.onclick = () => {
    emoContainer.classList.remove("invisible")
    closeEmoButton.classList.remove("invisible")
    expandEmoButton.classList.add("invisible")
}
closeEmoButton.onclick = () => {
    emoContainer.classList.add("invisible")
    closeEmoButton.classList.add("invisible")
    expandEmoButton.classList.remove("invisible")
}


const emoButtons = [Joy, Anger, Sadness, Surprise, Disgust, Confusion]
let oldPressd = AllEmo
oldPressd.classList.add("color-emo-selected")
for (const b of emoButtons) {
    b.onclick = () => {
        oldPressd.classList.remove("color-emo-selected")
        oldPressd = b
        oldPressd.classList.add("color-emo-selected")
        if (flexatarControllerPort) {
            flexatarControllerPort.postMessage({ animation: { pattern: b.id } })
        }
        // connection.setAnimationPattern(b.id)
        // window.parent.postMessage({uiToRenderEngine:true,setAnimation:true,pattern:b.id},"*")
        // renderer.animator.currentAnimationPattern = b.id
    }
}
AllEmo.onclick = () => {
    oldPressd.classList.remove("color-emo-selected")
    oldPressd = AllEmo
    oldPressd.classList.add("color-emo-selected")
    if (flexatarControllerPort) {
        flexatarControllerPort.postMessage({ animation: { pattern: null } })
    }
    // window.parent.postMessage({uiToRenderEngine:true,setAnimation:true,pattern:null},"*")
    // renderer.animator.currentAnimationPattern = null
}


// window.parent.postMessage({ftarUIReady:true,port:channel.port2},"*",[channel.port2])
let oldBkg
let isBkgBlockExpanded = false

backgroundText.onclick = expandBkgButton.onclick = async () => {
    if (isBkgBlockExpanded) {
        // bkgExpander.classList.remove("full-height")
        expandBkgButton.classList.add("rot180")
        dropBackgroundContainer.classList.add("invisible")
        imageBackgroundContainer.querySelectorAll('img').forEach(img => img.remove());
        bkgExpander.classList.remove("full-height")
    } else {
        // bkgExpander.classList.add("full-height")
        expandBkgButton.classList.remove("rot180")
        dropBackgroundContainer.classList.remove("invisible")
        dropBackgroundText.textContent = Texts.DROP_BACKGROUND
        bkgExpander.classList.add("full-height")
        loadBackgroundList()


        // log("getBackgrounds",list)

        // const el = document.createElement("div")
        // el.textContent = "el"
        // el.style.color = "white"
        // bkgExpander.appendChild(el)


    }

    isBkgBlockExpanded = !isBkgBlockExpanded
}
async function loadBackgroundList() {
    const list = (await connection.getBackgrounds()).reverse()

    let currentBackground = await connection.getCurrentBackground()
    if (!currentBackground) {

        await connection.setCurrentBackground(list[0][0])
        currentBackground = await connection.getCurrentBackground()

    }

    for (const [id, url] of list) {
        log("background list element id", id)
        // if (!url) continue
        addBackgroundItem(id, url, connection)
    }

    // const listUnauthorized = (await connectionUnauthorized.getBackgrounds()).reverse()
    // for (const [id, url] of listUnauthorized) {
    //     // if (!url) continue
    //     addBackgroundItem(id, url,connectionUnauthorized)
    // }



    // if (currentBackground === "empty"){
    //     currentBackground = await connectionUnauthorized.getCurrentBackground()
    // }
    log("currentBackground", currentBackground)
    const currentSelected = document.getElementById(currentBackground.id)
    log("currentSelected", currentSelected)

    if (currentSelected) {
        currentSelected.click()
    } else {
        noBackgroundButton.click()
    }
}
noBackgroundButton.onclick = () => {
    noBackgroundButton.classList.add("selected-item")
    if (oldBkg) {

        oldBkg.classList.remove("selected-item")
    }
    oldBkg = noBackgroundButton
    if (flexatarControllerPort) {
        flexatarControllerPort.postMessage({ background: true, no: true })
    }
    connection.setCurrentBackground("no")
}

function addBackgroundItem(bkgInfo, url, con, atFront = false) {
    log("addBackgroundItem ", bkgInfo)
    const img = document.createElement("img")
    img.id = bkgInfo.id
    img.src = url
    img.draggable = false
    img.style.cursor = "pointer"
    img.style.display = 'block';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.margin = '0px';
    img.style.padding = '0px';
    img.style.boxSizing = 'border-box';
    img.style.lineHeight = '0px';
    img.style.verticalAlign = 'top';

    img.style.objectFit = 'contain';
    if (atFront) {
        insertAfter(img, noBackgroundButton)
    } else {
        imageBackgroundContainer.appendChild(img)
    }
    img.onclick = async () => {

        if (oldBkg) {

            oldBkg.classList.remove("selected-item")
        }
        oldBkg = img
        img.classList.add("selected-item")
        if (flexatarControllerPort) {
            // const dataUrl = (await con.getBackgrounds({ id }))[0][1]

            flexatarControllerPort.postMessage({ background: url })
        }
        log("setting current background", bkgInfo)
        connection.setCurrentBackground(bkgInfo)
    }
    return img
}
// function fileToDataUrl(file) {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();

//       reader.onloadend = () => resolve(reader.result);
//       reader.onerror = reject;

//       reader.readAsDataURL(file);
//     });
//   }


createDropZone(dropBkgElement, async (e) => {


    let file = e.target.files[0];
    if (!file) {
        return
    }
    const fileType = file.type;

    if (!checkFileType(fileType, imageMimeTypes)) {

        return
    }
    // new Blob([file], { type: fileType })
    const dataUrl = await getCroppedImageDataUrlFromBuffer(file, 480, 640)
    const id = await connection.storeNewBackground(dataUrl)
    // addBackgroundItem(id,dataUrl,true).click()
    log("photo bkg obtained", file)
})
connection.onNewBackground = async (bkgInfo) => {
    log("new background event", bkgInfo)

    const dataUrl = (await connection.getBackgrounds(bkgInfo))[0][1]
    // log("new background event 1",newBkg)
    // const dataUrl = (await connection.getBackgrounds({id}))[0][1]
    // log("new background event",id)

    addBackgroundItem(bkgInfo, dataUrl, connection, true).click()

}
// connectionUnauthorized.onNewBackground = async (id) => {
//     log("new background event", id)
//     const dataUrl = (await connectionUnauthorized.getBackgrounds({ id }))[0][1]
//     // log("new background event 1",newBkg)
//     // const dataUrl = (await connection.getBackgrounds({id}))[0][1]
//     // log("new background event",id)

//     addBackgroundItem(id, dataUrl,connectionUnauthorized, true).click()

// }
function insertAfter(newNode, referenceNode) {
    if (!referenceNode.nextSibling) {
        referenceNode.parentNode.appendChild(newNode)
        return
    }
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
async function getCroppedImageDataUrlFromBuffer(imageBuffer, targetWidth, targetHeight) {
    const bitmap = await createImageBitmap(imageBuffer);

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    const imgAspect = bitmap.width / bitmap.height;
    const targetAspect = targetWidth / targetHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgAspect > targetAspect) {
        drawHeight = targetHeight;
        drawWidth = bitmap.width * (targetHeight / bitmap.height);
        offsetX = -(drawWidth - targetWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = targetWidth;
        drawHeight = bitmap.height * (targetWidth / bitmap.width);
        offsetX = 0;
        offsetY = -(drawHeight - targetHeight) / 2;
    }

    ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight);

    const blob = await canvas.convertToBlob();

    // Convert Blob to data URL
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    return dataUrl;
}

ftarLogButton.onclick = (e) => {
    // e.preventDefault()
    connection.showProgress()
    log("show creation log")
}
effectsButton.onclick = () => {
    connection.showEffects()
}

// retargetingButton.style.display = "none"
retargetingButton.onclick = () => {
    connection.showRetarg()
}
animateButton.onclick = () => {
    connection.showAnimate()
}

likeButton.onclick = async () => {
    if (!globalSelectedFtarIsFavorite) {
        log("add to fav clciked")
        likeButton.classList.add("like-selected")
        await connection.addToFavorite(globalSelectedFtar)
    }else{
        log("remove from fav clciked")

        likeButton.classList.remove("like-selected")
        await connection.removeFromFavorite(globalSelectedFtar)
        globalSelectedFtarIsFavorite = false
    }

   
    await reloadFtarList(false)
    // globalSelectedFtarIsFavorite = true
    // if (globalSelectedFtarElement) {
    //     // globalSelectedFtarElement.remove()
    //     // previewListHolder.insertBefore(globalSelectedFtarElement, previewListHolder.firstChild);
    //     // globalSelectedFtarElement.scrollIntoView({
    //     //     behavior: 'smooth',
    //     //     block: 'center',   // start | center | end | nearest
    //     //     inline: 'nearest'
    //     // });
    // }
}