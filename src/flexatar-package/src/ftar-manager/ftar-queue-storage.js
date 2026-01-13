

function log() {
    console.log("[FTAR_QUEUE_STORAGE]", ...arguments)
}
export async function setCurrentUserId(userId, userIdKey = "currentUserId") {
    const storageSetSetup = {}
    storageSetSetup[userIdKey] = userId

    await chrome.storage.local.set(storageSetSetup)

}
export async function getCurrentUserId(userId, userIdKey = "currentUserId") {

    if (userId) return userId;
    const keySetup = {}
    keySetup[userIdKey] = null
    const currentUserId = await chrome.storage.local.get(keySetup)
    log("currentUserId", currentUserId)
    if (!currentUserId) return { error: "not_authorized" }
    return currentUserId[userIdKey]
}
const FTAR_MAKE_QUEUE_LIST_ID = "_make_queue"
const FTAR_PROCESSING_QUEUE_LIST_ID = "_processing_queue"
const FTAR_SENDING_REQUEST_QUEUE_LIST_ID = "_sending_request_queue"
const FTAR_ERROR_LIST_ID = "_error_queue"
const FTAR_SUCCESS_LIST_ID = "_success_queue"
const FTAR_BACKGROUND_LIST_ID = "_background_list"
const FTAR_PRESET_LIST_ID = "_preset_list"
const FTAR_FAV_LIST_ID = "_favorite_list"
const AUIDIO_RECORD_LIST_ID = "_audio_record_list"

export const Lists = {
    FTAR_MAKE_QUEUE_LIST_ID,
    FTAR_PROCESSING_QUEUE_LIST_ID,
    FTAR_ERROR_LIST_ID,
    FTAR_SUCCESS_LIST_ID,
    FTAR_BACKGROUND_LIST_ID, FTAR_PRESET_LIST_ID, FTAR_SENDING_REQUEST_QUEUE_LIST_ID, FTAR_FAV_LIST_ID,
    AUIDIO_RECORD_LIST_ID
}

export async function addToList(listID, listOfImgId, userId) {
    // const {currentUserId} = userId ? {currentUserId:userId}:await chrome.storage.local.get({ currentUserId:null })
    // if (!currentUserId) return {error:"not_authorized"}
    const currentUserId = await getCurrentUserId(userId)
    if (currentUserId.error) return currentUserId

    const key = currentUserId + listID
    const objSchema = {}
    objSchema[key] = []
    const listOfImgIdSaved = (await chrome.storage.local.get(objSchema))[key]
    const listOfImgIdNew = listOfImgIdSaved.concat(listOfImgId)
    objSchema[key] = listOfImgIdNew
    await chrome.storage.local.set(objSchema)
    return { success: true }
}

export async function addToListIfNotAlreadyIn(listID, listOfImgId, userId) {
    // Get the current user ID
    const currentUserId = await getCurrentUserId(userId);
    if (currentUserId.error) return currentUserId;

    const key = currentUserId + listID;

    // Prepare storage schema with default empty array
    const objSchema = {};
    objSchema[key] = [];
    const listOfImgIdSaved = (await chrome.storage.local.get(objSchema))[key];

    // Filter out IDs that are already in the saved list
    const listOfImgIdToAdd = listOfImgId.filter(id => !listOfImgIdSaved.includes(id));

    // Only add if there are new IDs
    if (listOfImgIdToAdd.length > 0) {
        objSchema[key] = listOfImgIdSaved.concat(listOfImgIdToAdd);
        await chrome.storage.local.set(objSchema);
    }

    return { success: true, addedCount: listOfImgIdToAdd.length };
}

export async function addToListAtBeginning(listID, listOfImgId, userId) {
    // const {currentUserId} = userId ? {currentUserId:userId}:await chrome.storage.local.get({ currentUserId:null })
    // if (!currentUserId) return {error:"not_authorized"}
    const currentUserId = await getCurrentUserId(userId)
    if (currentUserId.error) return currentUserId

    const key = currentUserId + listID
    const objSchema = {}
    objSchema[key] = []
    const listOfImgIdSaved = (await chrome.storage.local.get(objSchema))[key]
    const listOfImgIdNew = listOfImgId.concat(listOfImgIdSaved)
    objSchema[key] = listOfImgIdNew
    await chrome.storage.local.set(objSchema)
    return { success: true }
}

async function writeToList(listID, listOfImgId, userId) {
    // const {currentUserId} = userId ? {currentUserId:userId}:await chrome.storage.local.get({ currentUserId:null })
    // if (!currentUserId) return {error:"not_authorized"}
    const currentUserId = await getCurrentUserId(userId)
    if (currentUserId.error) return currentUserId
    const key = currentUserId + listID
    const objSchema = {}
    objSchema[key] = []
    // const listOfImgIdSaved = (await chrome.storage.local.get(objSchema))[key]
    const listOfImgIdNew = listOfImgId
    objSchema[key] = listOfImgIdNew
    await chrome.storage.local.set(objSchema)
    return { success: true }
}


export async function getList(listID, userId) {
    // const {currentUserId} = userId ? {currentUserId:userId}: await chrome.storage.local.get({ currentUserId:null })
    // if (!currentUserId) return {error:"not_authorized"}
    const currentUserId = await getCurrentUserId(userId);
    if (currentUserId.error) return currentUserId;

    const key = currentUserId + listID;
    const objSchema = {};
    objSchema[key] = [];
    const listOfImgIdSaved = (await chrome.storage.local.get(objSchema))[key];
    return listOfImgIdSaved;
}

export async function clearList(listID, userId) {
    log("clear list", listID)
    // const {currentUserId} = await chrome.storage.local.get({ currentUserId:null })
    // if (!currentUserId) return {error:"not_authorized"}
    const currentUserId = await getCurrentUserId(userId)
    if (currentUserId.error) return currentUserId
    const key = currentUserId + listID

    await chrome.storage.local.remove([key])
    log("clear list done", key)
}
async function printList(listID, userId) {

    const currentUserId = await getCurrentUserId(userId)
    if (currentUserId.error) return currentUserId
    const key = currentUserId + listID

    log(key, (await chrome.storage.local.get([key]))[key])
}
export async function clearAllLists(userId) {
    for (const [key, val] of Object.entries(Lists)) {
        clearList(val, userId)
        log(key, "removed")
    }
}


export async function printAllLists(userId) {
    for (const [key, val] of Object.entries(Lists)) {
        printList(val, userId)

    }
}

export const Prefixes = {
    FTAR_SRC_IMG: "_src_img_",
    IS_QUEUE_IN_PROGRESS: "_is_queue_in_progress_",
    BACKGROUND_SRC_IMAGE: "_src_background_",
    BACKGROUND_CURRENT_ID: "_current_id_background_",
    CURRENT_VIEWPORT_SIZE: "_current_viewport_size_",
    CURRENT_SPEECH_PATTERN: "_current_speech_pattern_",
    CURRENT_MOOD: "_current_mood_",
    RETARGETING_CALIBRATION: "_retargeting_calibration_",
    DO_NOT_SHOW_NOTIFICATION_ID: "_do_not_show_",
    RECORDED_AUDIO_ID: "_recorded_audio_"
}
export async function saveWithKey(keyPrefix, keyModifier, val, userId) {
    const currentUserId = await getCurrentUserId(userId)
    if (currentUserId.error) return currentUserId
    const key = currentUserId + keyPrefix + keyModifier
    const objSchema = {}
    objSchema[key] = val
    try {
        await chrome.storage.local.set(objSchema)
        return { success: true }
    } catch (e) {
        log(e)
        return { error: "unknown" }
    }

}

export async function getByKey(keyPrefix, keyModifier, userId,def=null) {
    const currentUserId = await getCurrentUserId(userId)
    if (currentUserId.error) return currentUserId
    const key = currentUserId + keyPrefix + keyModifier
    const objSchema = {}
    objSchema[key] = null

    const retrieved = await chrome.storage.local.get(objSchema)
    return retrieved[key] === null ? def : retrieved[key]
}

export async function removeByKey(keyPrefix, keyModifier, userId) {
    const currentUserId = await getCurrentUserId(userId)
    if (currentUserId.error) return currentUserId
    const key = currentUserId + keyPrefix + keyModifier
    // const objSchema = {}
    // objSchema[key] = null

    await chrome.storage.local.remove([key])

}

// export async function storeImageToMakeFtar(msg){
//     const {imgId,storeImageToMakeFtar:img} = msg
//     const {currentUserId} = await chrome.storage.local.get({ currentUserId:null })
//     if (!currentUserId) return {error:"not_authorized"}
//      const key = currentUserId+"_ftar_queue_"+imgId
//      log("saving image to make ftar with key",key)
//      const objSchema = {}
//      objSchema[key] = img
//     await chrome.storage.local.set(objSchema)
//     return {success:true}

// }



export async function removeFromList(listId, ftarImgId, userId, prop = "id") {
    const queueList = await getList(listId, userId)
    let condition = ftarImgId[prop]
    if (!condition) {
        condition = ftarImgId
    }
    log("queueList", queueList, listId)
    const newList = queueList.filter(x => (x[prop] || x) !== condition)
    log("newList", newList)

    await writeToList(listId, newList, userId)
}

export async function shortenList(listId, maxElementCount, userId) {
    let queueList = await getList(listId, userId)
    if (queueList.length > maxElementCount) {
        const toDelete = queueList.slice(maxElementCount, queueList.length)
        queueList = queueList.slice(0, maxElementCount)
        for (const entry of toDelete) {
            await removeByKey(Prefixes.FTAR_SRC_IMG, entry.id, userId)

        }
    }

    await writeToList(listId, queueList, userId)
}


// export async function putFtarImageToProcessing(ftarImgId,userId){
//     await removeFromList(FTAR_MAKE_QUEUE_LIST_ID,ftarImgId,userId)
//     await addToList(FTAR_PROCESSING_QUEUE_LIST_ID,[ftarImgId],userId)
//     return {success:true}
// }

export async function moveListEntry(fromListId, toListId, value, userId) {
    await removeFromList(fromListId, value, userId)
    await addToListAtBeginning(toListId, [value], userId)
}

export async function updateListEntry(listId, ftarImgId, value, userId,prop="id") {
    const queueList = await getList(listId, userId)
    let condition = ftarImgId[prop]
    if (!condition) {
        condition = ftarImgId
    }
    log("list content", queueList, listId)

    const newList = queueList.filter(x => (x[prop] || x) === condition)

    log("list with target element", newList)
    Object.assign(newList[0], value);
    

    await writeToList(listId, queueList, userId)
    // await removeFromList(fromListId, value, userId)
    // await addToListAtBeginning(toListId, [value], userId)
}


export function addBackgroundToStorage(dataUrl, userId) {
    return new Promise(resolve => {
        const imageId = crypto.randomUUID()
        log("background imageId", imageId)
        getList(Lists.FTAR_BACKGROUND_LIST_ID, userId).then(result => {
            log("background list", result)

            addToList(Lists.FTAR_BACKGROUND_LIST_ID, [imageId], userId).then(result => {
                log("add to list", result)
                saveWithKey(Prefixes.BACKGROUND_SRC_IMAGE, imageId, dataUrl, userId).then(result => {
                    log("BACKGROUND_SRC_IMG saved", result)
                    resolve(imageId)
                })

            })
        })

    })


}


// export function addPresetToStorage(dataUrl, userId) {
//     return new Promise(resolve => {
//         const imageId = crypto.randomUUID()
//          log("background imageId", imageId)
//         getList(Lists.FTAR_PRESET_LIST_ID, userId).then(result => {
//             log("background list", result)

//             addToList(Lists.FTAR_PRESET_LIST_ID, [imageId], userId).then(result => {
//                 log("add to list", result)
//                 saveWithKey(Prefixes.BACKGROUND_SRC_IMAGE, imageId, dataUrl, userId).then(result => {
//                     log("BACKGROUND_SRC_IMG saved", result)
//                     resolve(imageId)
//                 })

//             })
//         })

//     })


// }