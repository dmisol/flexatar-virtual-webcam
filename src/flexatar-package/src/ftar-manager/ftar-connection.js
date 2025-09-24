import makeFtar from './mk_ftar.js';
import { AsyncQueue } from "../../../util/async-queue.js"
// import {startFaceParserUi} from "./overlay-with-iframe.js"
import * as QueueStorage from "./ftar-queue-storage.js"
import { patchChromeStorage } from "./patch-chrome-storage.js"
// import {makeFtarFromQueue} from "./make-ftar.js"

function log() {
    console.log("[FTAR_CONNECTION]", ...arguments)
}

const cacheName = "ftarcache";

async function storeString(key, string) {

    const cache = await caches.open(cacheName);
    await cache.put(key, new Response(string));

}
async function loadString(key) {
    const cache = await caches.open(cacheName);
    const response = await cache.match(key);
    const data = response ? await response.text() : null;
    return data
}

async function storeObjectCE(key, obj) {
    const { strings } = await chrome.storage.local.get({ strings: {} })

    strings[key] = obj
    await chrome.storage.local.set({ strings });

}
async function loadObjectCE(key) {
    const { strings } = await chrome.storage.local.get({ strings: {} })
    return strings[key]
    // if (strings[key]){
    //     return strings[key]
    // }else{
    //     return
    // }
    // const cache = await caches.open(cacheName);
    // const response = await cache.match(key);
    // const data = response ? await response.text() : null;
    // return data
}


const ftar_api_url = "https://api.flexatar-sdk.com"

async function deleteFlexatar(ftarConf, token) {
    const url = ftar_api_url + "/" + ftarConf.id
    if (!token) {
        token = ftarConf.token
    }
    const headers = {
        // 'Authorization': 'Bearer ' + token,  // Replace with your actual token or headers
    };
    try {
        const response = await fetchWithToken(url, {
            method: 'DELETE',
            headers,

        }, token);
        if (!response.ok) {
            if (response.status === 401)
                return { error: ERR_UNAUTHORIZED }
            // console.error('Flexatar list failed:', response.json());
            return { error: ERR_UNEXPECTED }
        }
        return response.ok
    } catch (error) {
        console.error('Flexatar deletion:', error);
        return false
    }
}



async function getFlexatar(token, listElement) {
    const path = "/ftar/" + listElement.id
    const cache = await caches.open(cacheName);
    let response = await cache.match(path);
    if (!response) {
        const entry = await flexatarEntry(token, listElement.id, { ftar: true })

        response = await fetch(entry.ftar, { method: 'GET' });
        if (!response.ok) {

            return
        }
        const arrayBuffer = await response.arrayBuffer();
        const response1 = new Response(new Uint8Array(arrayBuffer), {
            headers: { 'Content-Type': 'application/octet-stream' }
        });
        await cache.put(path, response1);
        return arrayBuffer
    }
    return await response.arrayBuffer();

}


async function removeLocalCE(id, userId) {
    const keyFtar = userId + "_ftar_" + id
    const keyPreview = userId + "_ftarpreview_" + id
    await chrome.storage.local.remove([keyFtar, keyPreview])

}

export async function getFlexatarCE(token, listElement, userId) {
    if (listElement.id === "default") {
        return await ((await fetch("https://flexatar-sdk.com/files/default_ftar.p")).arrayBuffer())
        // return await ((await fetch(chrome.runtime.getURL("sandbox/default_ftar.p"))).arrayBuffer())
    }

    const key = userId + "_ftar_" + listElement.id

    const storedPreview = (await chrome.storage.local.get([key]))[key]
    // console.log("listElement",listElement)
    if (storedPreview) {
        return await (await fetch(storedPreview)).arrayBuffer()
    } else {
        const unauthorizedKey = "myx@amial.com" + "_ftar_" + listElement.id
        const myxFlexatar = (await chrome.storage.local.get([unauthorizedKey]))[unauthorizedKey]
        if (myxFlexatar) {
            return await (await fetch(myxFlexatar)).arrayBuffer()
        }

    }
    // if (!listElement.preview){
    //     if (count>=5)
    //         return
    //     await new Promise(resolve => setTimeout(resolve,500))
    //     return await getPreviewCE(listElement,count+1)
    // }
    let response
    log("get ftar list element", listElement)
    if (listElement.ftar) {
        response = await fetch(listElement.ftar, { method: 'GET' });

    } else {
        const entry = await flexatarEntry(listElement.is_myx ? myxGetToken : token, listElement.id, { ftar: true })
        response = await fetch(entry.ftar, { method: 'GET' });
    }


    if (!response.ok) {
        // return
        // const entry = await flexatarEntry(token,listElement.id,{preview:true})
        // response = await fetch(entry.preview, {method: 'GET' });
        // if (!response.ok) {
        return
        // }

    }
    const arrayBuffer = await response.arrayBuffer();

    const dataUrlPreview = await arrayBufferToDataURL(arrayBuffer)
    const store = {}
    store[key] = dataUrlPreview

    await chrome.storage.local.set(store);

    return arrayBuffer



}

async function getPreview(listElement) {
    // console.log("requesting preview",listElement)
    const path = "/ftarpreview/" + listElement.id
    const cache = await caches.open(cacheName);
    let response = await cache.match(path);
    if (!response) {
        response = await fetch(listElement.preview, { method: 'GET' });
        if (!response.ok) {

            return
        }
        const arrayBuffer = await response.arrayBuffer();
        const response1 = new Response(new Uint8Array(arrayBuffer), {
            headers: { 'Content-Type': 'application/octet-stream' }
        });
        await cache.put(path, response1);
        return arrayBuffer
    }
    return await response.arrayBuffer();
}


function arrayBufferToDataURL(arrayBuffer, mimeType = 'application/octet-stream') {
    const blob = new Blob([arrayBuffer], { type: mimeType });
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function getPreviewCE(listElement, token, userId, count = 0) {

    const key = userId + "_ftarpreview_" + listElement.id

    const storedPreview = (await chrome.storage.local.get([key]))[key]
    // console.log("storedPreview",storedPreview,key)
    if (storedPreview) {
        return await (await fetch(storedPreview)).arrayBuffer()
    }
    if (listElement.preview) {
        const preview = await fetchPreview(listElement, userId)
        if (preview) {
            return preview

        }
    }
    const entry = await flexatarEntry(token, listElement.id, { preview: true })
    listElement.preview = entry.preview
    const preview = await fetchPreview(listElement, userId)
    return preview

    // else {
    //     const unauthorizedKey = "myx@amial.com" + "_ftarpreview_" + listElement.id
    //     const myxFlexatar = (await chrome.storage.local.get([unauthorizedKey]))[unauthorizedKey]
    //     if (myxFlexatar) {
    //         return await (await fetch(myxFlexatar)).arrayBuffer()
    //     }
    // }

    // if (!listElement.preview) {
    // if (count < 8) {

    //     return await getPreviewCE(listElement, token, userId, count + 1)
    // } else {
    // const entry = await flexatarEntry(token,listElement.id,{preview:true})
    // listElement.preview = entry.preview
    // }
    // await fetchPreview(listElement,userId)

    // }


}
async function fetchPreview(listElement, userId) {
    const key = userId + "_ftarpreview_" + listElement.id

    let response = await fetch(listElement.preview, { method: 'GET' });

    if (!response.ok) {
        // return
        // const entry = await flexatarEntry(token,listElement.id,{preview:true})
        // response = await fetch(entry.preview, {method: 'GET' });
        // if (!response.ok) {
        return
        // }

    }
    const arrayBuffer = await response.arrayBuffer();

    const dataUrlPreview = await arrayBufferToDataURL(arrayBuffer)
    const store = {}
    store[key] = dataUrlPreview
    log("store preview", store)
    await chrome.storage.local.set(store);

    return arrayBuffer
}

async function fetchWithToken(url, params, tokenObject, counter) {

    params.headers['Authorization'] = 'Bearer ' + await tokenObject.getToken();
    const response = await fetch(url, params);
    if (response.status != 403) return response;
    if (!counter) {
        counter = 2
    }

    if (counter <= 0) {

        return response
    }
    counter -= 1
    tokenObject.token = null


    return await fetchWithToken(url, params, tokenObject, counter)
}

const ERR_UNAUTHORIZED = "unauthorized"
const ERR_UNEXPECTED = "UNEXPECTED"
async function flexatarList(token, opts) {
    const url = ftar_api_url + "/list"


    const headers = {
        // 'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };

    const listOpts = []
    if (opts.ftar) listOpts.push("ftar");
    if (opts.preview) listOpts.push("preview");
    if (opts.meta) listOpts.push("meta");


    const response = await fetchWithToken(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ all: listOpts })
    }, token);

    if (!response.ok) {
        if (response.status === 401)
            return { error: ERR_UNAUTHORIZED }
        // console.error('Flexatar list failed:', response.json());
        return { error: ERR_UNEXPECTED }
    }


    const listJson = await response.json();

    return listJson.all

}

async function flexatarEntry(token, ftarId, opts) {
    const url = ftar_api_url + "/list"

    const headers = {
        // 'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };

    const listOpts = []
    if (opts.ftar) listOpts.push("ftar");
    if (opts.preview) listOpts.push("preview");
    if (opts.meta) listOpts.push("meta");
    const send = {}
    send[ftarId] = listOpts;
    try {
        const response = await fetchWithToken(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(send)
        }, token);

        if (!response.ok) {
            if (response.status === 401)
                return { error: ERR_UNAUTHORIZED }
            // console.error('Flexatar list failed:', response.json());
            return { error: ERR_UNEXPECTED }
        }

        const listJson = await response.json();

        return listJson.requested[ftarId]
    } catch (error) {
        console.error('Flexatar list failed:', error);
    }
}

async function makeFlexatar(token, imgFile, flexatarName, opts, onFtarId) {
    if (!flexatarName) {
        flexatarName = ""
    }
    const url = ftar_api_url + "/make"

    const result = await makeFtar(url, token, imgFile, flexatarName, opts, fetchWithToken, onFtarId)
    if (!result) {
        log("make ftar unexpected")
        return { error: ERR_UNEXPECTED }
    }
    if (result.error) {
        if (result.error.status === 401)
            return { error: ERR_UNAUTHORIZED }
        // console.error('Flexatar list failed:', response.json());
        return { error: ERR_UNEXPECTED }

    }

    if (!result.success) {
        // console.log("blocker")
        let reason = result.reason
        if (!reason) {
            reason = "bad_photo"
        }
        return { err: true, reason }
    }

    let listOpts = { ftar: true, meta: true }
    if (opts) {
        listOpts = opts
    }
    return await flexatarEntry(token, result.id, listOpts)

}

async function userInfo(token) {
    log("requesting user info from cloud")
    const response = await fetchWithToken(
        ftar_api_url + "/info",
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer ' + token
            }
        },
        token
    )
    // if (!response.ok) {
    if (!response.ok) {
        if (response.status === 401)
            return { error: ERR_UNAUTHORIZED }
        // console.error('Flexatar list failed:', response.json());
        return { error: ERR_UNEXPECTED }
    }
    // }
    const info = await response.json()
    return info
}

class GetToken {
    constructor(getTokenFunc) {
        this.getTokenFunc = getTokenFunc

    }

    #getTokenPromise
    async getToken() {
        if (this.token) return this.token
        let promise = this.#getTokenPromise
        if (!this.#getTokenPromise) {
            this.#getTokenPromise = this.getTokenFunc()
            promise = this.#getTokenPromise
        }
        const token = await promise
        this.token = token
        this.#getTokenPromise = null
        log("GetToken", token)
        return token
    }

}

async function getStorageKeysWithPrefix(prefix) {
    const items = await new Promise((resolve) => {
        chrome.storage.local.get(null, resolve);
    });

    return Object.keys(items).filter((key) => key.startsWith(prefix));
}

async function removeKeysNotInList(prefix, list) {

    const keys = await getStorageKeysWithPrefix(prefix)

    const keysDict = {}
    for (const key of keys) {
        const ftarId = key.replaceAll(prefix, "")
        keysDict[ftarId] = key
    }
    for (const { id } of list) {
        delete keysDict[id]
    }
    const keysToDelete = Object.values(keysDict)
    log("deleting removed res from storage", keysToDelete)
    if (keysToDelete.length > 0)
        await chrome.storage.local.remove(keysToDelete)
}

async function getListDualUser(listId, keyName, userId,needMyx=true) {
    log("getListDualUser needMyx",needMyx)
    let someList = await QueueStorage.getList(listId, userId)

    someList = someList.map(x => {
        const ret = { userId };
        ret[keyName] = x;
        return ret
    })
    if (userId !== "myx@amial.com" && needMyx) {
        someList = someList.concat((await QueueStorage.getList(listId, "myx@amial.com"))
            .map(x => {
                const ret = { userId: "myx@amial.com" };
                ret[keyName] = x;
                return ret
            }))
    }
    return someList

}

async function getFtarListDualUser(token, msg, userId,needMyx=true) {
    let ftarList = []
    if (userId === "myx@amial.com") {
        msg.opts.noCache = false
        ftarList = await getFtarList(myxGetToken, msg, userId, false)
        ftarList = ftarList.reverse()

        log("ftarList myx", ftarList)
        // if (ftarList) ftarList.forEach(x => { x.userId = userId })
    } else {
        ftarList = await getFtarList(token, msg, userId, false)
        ftarList = ftarList.reverse()
        if (needMyx) {
            msg.opts.noCache = false
            const ftarListMyx = await getFtarList(myxGetToken, msg, "myx@amial.com", false)
            ftarList = ftarList.concat(ftarListMyx.reverse())
        }
    }
    return ftarList
}

async function removeFromList(userId, ftarId) {
    const key = userId + "_ftarlist"
    let ftarList = await loadObjectCE(key)
    // const countBefore = Object.keys(ftarList).length
    ftarList = ftarList.filter(({ id }) => ftarId !== id)
    // const countAfter = Object.keys(ftarList).length
    // if (countAfter === countBefore) {
    //     const key = "myx@amial.com" + "_ftarlist"
    //     let ftarList = await loadObjectCE(key)
    //     ftarList = ftarList.filter(({ id }) => ftarId !== id)
    //     await storeObjectCE(key, ftarList)
    //     return { isAuthorized: false }
    // } else {
    await storeObjectCE(key, ftarList)
    return { isAuthorized: true }

    // }

}

export async function addToList(userId, ftarId) {
    if (!ftarId) return
    const key = userId + "_ftarlist"
    let ftarList = await loadObjectCE(key)
    ftarList.push({ id: ftarId })
    // ftarList.unshift({ id: ftarId })
    await storeObjectCE(key, ftarList)
}

async function getUnauthorizedToken() {
    try {
        const response = await fetch(`https://api.flexatar-sdk.com/myxtoken`)
        if (!response.ok) {
            return
        }
        const tokenJson = await response.json()

        if (!tokenJson.token) {
            return
        }
        return tokenJson.token
    } catch (exception) {
        return
    }
}
const myxGetToken = new GetToken(async () => { return await getUnauthorizedToken() })

const ftarListLoaderQueue = new AsyncQueue()
async function getFtarList(token, msg, userId, needMyxAccount = false) {
    // log("getFtarList needMyxAccount", needMyxAccount)
    return await ftarListLoaderQueue.enqueue(async () => {
        const key = userId + "_ftarlist"
        // log("list opts", msg.opts)
        // log("list key", key)
        // log("list stored", await loadObjectCE(key))
        let ftarList = msg.opts.noCache ? null : await loadObjectCE(key)
        log("ftar list from storage", ftarList)
        if (!ftarList) {
            log("fetching list", userId)
            ftarList = await flexatarList(token, msg.opts);
            if (!ftarList.error) {
                await storeObjectCE(key, ftarList)
            } else {
                log("ftarList.error", ftarList.error)
            }
            // log(" ftar list loaded  ", ftarList)
        }
        // if (userId === "myx@amial.com") {
        //     ftarList = ftarList.reverse()
        //     ftarList = [ftarList[0], ftarList[1], ftarList[2]]
        //     ftarList = ftarList.reverse()
        // log("ftar list truncated",ftarList)

        // }

        ftarList.forEach(x => { x.userId = userId })
        return ftarList
    })
}

async function setCurrentFlexatarId(id, userId) {
    const currentFlexatarId = {}
    currentFlexatarId[userId + "_currentFlexatarId"] = id
    await chrome.storage.local.set(currentFlexatarId)
}

async function setCurrentFlexatarIdSlot2(id, userId) {
    const currentFlexatarId = {}
    currentFlexatarId[userId + "_currentFlexatarIdSlot2"] = id
    await chrome.storage.local.set(currentFlexatarId)
}

async function setSelectedFlexatar(id, userId) {
    const currentFlexatarId = {}
    currentFlexatarId[userId + "_selectedFlexatarId"] = id
    await chrome.storage.local.set(currentFlexatarId)
}

async function removeCurrentFlexatarId(userId) {

    await chrome.storage.local.remove([userId + "_currentFlexatarId"])
}

async function getCurrentFlexatarIdSlot2(userId) {
    const key = userId + "_currentFlexatarIdSlot2"
    let currentFtarId = (await chrome.storage.local.get([key]))[key]

    return currentFtarId
}


async function getCurrentFlexatarId(userId) {
    const key = userId + "_currentFlexatarId"
    let currentFtarId = (await chrome.storage.local.get([key]))[key]

    return currentFtarId
}


async function decFtarCount(userId) {
    await setFtarCount(userId, (await getFtarCount(userId)) - 1)
}
async function getFtarCount(userId) {
    const ftarCountKey = userId + "_FtarCount"
    const count = (await chrome.storage.local.get([ftarCountKey]))[ftarCountKey]
    return count
}

async function setFtarCount(userId, count) {
    const key = userId + "_FtarCount"
    const ftarCountRecord = {}

    ftarCountRecord[key] = count
    log("setting ftar count at key", key, "count is", count)
    await chrome.storage.local.set(ftarCountRecord)

}


function dataURLtoFile(dataURL, filename) {
    const [header, base64] = dataURL.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    const binary = atob(base64);
    const u8arr = Uint8Array.from(binary, char => char.charCodeAt(0));

    return new File([u8arr], filename, { type: mime });
}





export async function makeFtarFromQueue(token, imgId, userIdKey) {
    log("make ftar with id", imgId)
    const currentUserId = await QueueStorage.getCurrentUserId(null, userIdKey)

    const imageDataUrl = await QueueStorage.getByKey(QueueStorage.Prefixes.FTAR_SRC_IMG, imgId.id, currentUserId)
    log({ imageDataUrl })
    log({ currentUserId })

    if (imageDataUrl) {


        const file = dataURLtoFile(imageDataUrl)
        const result = await QueueStorage.moveListEntry(
            QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID,
            QueueStorage.Lists.FTAR_SENDING_REQUEST_QUEUE_LIST_ID,
            imgId,
            currentUserId
        )
        // log("start making flexatar")
        const ftarLink = await makeFlexatar(token, file, "noname", { ftar: true, preview: true },
            async ftarId => {
                log("obtained ftar id")

                imgId.ftarId = ftarId
                const result = await QueueStorage.moveListEntry(
                    QueueStorage.Lists.FTAR_SENDING_REQUEST_QUEUE_LIST_ID,
                    QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID,
                    imgId,
                    currentUserId
                )

                log("obtained ftar id", ftarId, "move to processing", result)
                QueueStorage.printAllLists(currentUserId)
            }
        )
        // log("flexatar befor error",ftarLink)
        // err: true, reason: 'subscription_limit'

        if (ftarLink.error || ftarLink.err) {
            log("flexatar error", ftarLink)
            if (ftarLink.reason === 'queue_limit') {
                return ftarLink
            }
            // const ftarListSending = await QueueStorage.getList(QueueStorage.Lists.FTAR_SENDING_REQUEST_QUEUE_LIST_ID, currentUserId)
            const ftarListProcessing = await QueueStorage.getList(QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID, currentUserId)
            // log("lists after error ",ftarListSending,ftarListProcessing,)
            await QueueStorage.moveListEntry(
                ftarListProcessing.length>0 ? QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID:QueueStorage.Lists.FTAR_SENDING_REQUEST_QUEUE_LIST_ID,
                QueueStorage.Lists.FTAR_ERROR_LIST_ID,
                imgId,
                currentUserId
            )
            await QueueStorage.shortenList(QueueStorage.Lists.FTAR_ERROR_LIST_ID, 5, currentUserId)
            // if (ftarLink.reason !== "bad_photo" || ftarLink.reason !== 'subscription_limit') {
            //     // await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS, "", false, currentUserId)
            //     return ftarLink
            // }
        } else {
            await QueueStorage.moveListEntry(
                QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID,
                QueueStorage.Lists.FTAR_SUCCESS_LIST_ID,
                imgId,
                currentUserId
            )
            await QueueStorage.shortenList(QueueStorage.Lists.FTAR_SUCCESS_LIST_ID, 5, currentUserId)

            try {
                await addToList(currentUserId, ftarLink.id)
                await fetchPreview(ftarLink, currentUserId)
                // await getPreviewCE(ftarLink, token, currentUserId)
                await getFlexatarCE(token, ftarLink, currentUserId)
            } catch {
                log("fail download after creation")
            }

        }

        ftarLink.userId = currentUserId
        QueueStorage.printAllLists(currentUserId)
        log("flexatar ready", ftarLink)
        return ftarLink

    }
    // else {
    //     await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS, "", false, currentUserId)
    // }


}



async function startMakeFtarFromQueue(token, onNewFlexatar, userIdKey) {
    log("startMakeFtarFromQueue ")
    const userId = await QueueStorage.getCurrentUserId(null, userIdKey)
    // log("startMakeFtarFromQueue userId", userId)
    const ftarListToMake = await QueueStorage.getList(QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID, userId)
    // log("startMakeFtarFromQueue ftarListToMake", ftarListToMake)

    if (ftarListToMake.error === "not_authorized") {
        return { error: ftarListToMake.error }
    }

    const ftarListSending = await QueueStorage.getList(QueueStorage.Lists.FTAR_SENDING_REQUEST_QUEUE_LIST_ID, userId)
    const ftarListProcessing = await QueueStorage.getList(QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID, userId)

    const isQueueInProgress = await QueueStorage.getByKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS, "", userId,true)
    log("isQueueInProgress", isQueueInProgress, ftarListSending, ftarListProcessing)
    if ((ftarListSending.length !== 0 || ftarListProcessing.length !== 0) || !isQueueInProgress) {
        return {}
    }


    // log("ftarListToMake", ftarListToMake)

    // if (ftarListToMake.length > 0 && isQueueInProgress) {
    log("ftarListToMake", ftarListToMake)
    if (ftarListToMake.length > 0) {

        const ftarLink = await makeFtarFromQueue(token, ftarListToMake[0], userIdKey)
        log("flexatar ready", ftarLink)
        // if ((ftarLink.error || ftarLink.err) && ftarLink.reason === 'queue_limit') {
        // if (ftarLink.error || ftarLink.err)  {
        //     return {}
        // }

        onNewFlexatar(ftarLink)
        // await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"",false)
        return await startMakeFtarFromQueue(token, onNewFlexatar, userIdKey)
    }

    // QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS, "", false, userId)
    return {}
}

async function makeProgressLists(managerName) {
    const lists = {
        successImages: QueueStorage.Lists.FTAR_SUCCESS_LIST_ID,
        errorImages: QueueStorage.Lists.FTAR_ERROR_LIST_ID,
        queueImages: QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID
    }
    const userIdKey = "currentUserId"
    // const userIdKey = managerName + "_currentUserId"
    const currentUserId = await QueueStorage.getCurrentUserId(null, userIdKey);
    const progressLists = {}
    for (const [key, val] of Object.entries(lists)) {
        log("user id when loading lists", currentUserId, userIdKey)
        const currentList = await QueueStorage.getList(val, currentUserId)
        log("loaded list", key, val, currentList)
        const dataUrls = currentList.map(async x => {
            const imageDataUrl = await QueueStorage.getByKey(QueueStorage.Prefixes.FTAR_SRC_IMG, x.id, currentUserId)
            return imageDataUrl
        })
        progressLists[key] = await Promise.all(dataUrls)
    }

    const additionalEntries = [QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID, QueueStorage.Lists.FTAR_SENDING_REQUEST_QUEUE_LIST_ID]
    for (const listName of additionalEntries) {
        const dataUrls = (await QueueStorage.getList(listName, currentUserId)).map(async x => {
            const imageDataUrl = await QueueStorage.getByKey(QueueStorage.Prefixes.FTAR_SRC_IMG, x.id, currentUserId)
            return imageDataUrl
        })
        const inProgressList = await Promise.all(dataUrls)
        if (inProgressList && inProgressList.length > 0)
            progressLists.queueImages.unshift(inProgressList[0])
    }



    log("progressLists", progressLists)
    // const userId = await QueueStorage.getCurrentUserId(null,userIdKey)
    log("getting ftar count to progress userId", currentUserId)
    progressLists.flexatarCount = await getFtarCount(currentUserId)
    progressLists.isQueueInProgress = await QueueStorage.getByKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS, "", currentUserId,true)

    return progressLists
}


const userInfoLoader = new AsyncQueue()
let counter = 0;

class Manager {
    static clearCurrentUserId() {
        const storageSetSetup = {}
        storageSetSetup["currentUserId"] = null

        chrome.storage.local.set(storageSetSetup)
    }
    constructor(tokenFn, managerName,
        defaultBackgroundFn = async () => {
            return []
        }
        , clearListsWhenRecreate = false, isExtension = false, needMyxAccount = true) {
        log("new instance of manager")
        let patchPromise
        this.userIdKey = () => { return "currentUserId" }
        const self = this
        if (!isExtension) {
            log("patching chrome.storage")
            patchPromise = patchChromeStorage(async ()=>{
                log("reseting userId key")
                const storageSetSetup = {}
                storageSetSetup[self.userIdKey()] = null
                await chrome.storage.local.set(storageSetSetup)
            })
            this.patchPromise = patchPromise
            
        }
        this.defaultBackgroundFn = defaultBackgroundFn
        this.managerName = managerName
       
        // this.userIdKey = () => { return this.managerName + "_currentUserId" }
        this.tokenFn = tokenFn
        this.needMyxAccount = needMyxAccount
        log("needMyxAccount",needMyxAccount)
        this.token = new GetToken(async () => {
            // const token1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOm51bGwsImV4cCI6NTM0MTAxNDU2MiwiaXNzIjoiIiwianRpIjoiIiwibmJmIjoxNzQxMDE0NTYyLCJvd25lciI6InRlc3QuY2xpZW50IiwicHJlcGFpZCI6dHJ1ZSwic3ViIjoiIiwidGFnIjoidGVzdCIsInRhcmlmZiI6InVuaXZlcnNhbCIsInVzZXIiOiJjbGllbnRfMSJ9.ULZwmHsLSqxjykbMmZH61gt7Xejns-r5Ez0_eWZTucU"
            // console.log("token recv",token1)

            // return token1
            return await tokenFn();
        });
        // patchPromise.then(async () => {
        //     await chrome.storage.local.set({test:"test"})
        //     const testGet = await chrome.storage.local.get({test:null})
        //     log("testGet",testGet)
        // })
        // patchPromise.then(() => {
        //     Manager.clearCurrentUserId()

        // })

      
        if (clearListsWhenRecreate) {
            (patchPromise || Promise.resolve()).then(async () => {
                while (!self.managerName) {
                    await new Promise(resolve => setTimeout(resolve, 200))
                }

                const userId = await QueueStorage.getCurrentUserId(null, self.userIdKey())
                const clearLists = [QueueStorage.Lists.FTAR_ERROR_LIST_ID, QueueStorage.Lists.FTAR_SUCCESS_LIST_ID, QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID]
                clearLists.forEach(listName => {
                    QueueStorage.clearList(listName, userId)
                })
                // QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS, "", false, userId)

            })

        }


    }


    showEffects() {
        this.effectPorts.forEach(port => {
            port.postMessage({ managerPort: true })
        })
    }
    effectPorts = []
    addEffectPort(port) {
        const self = this
        this.effectPorts.push(port)


        port.onmessage = async e => {
            const msg = e.data
            if (!msg) return
            if (msg.managerConnectionPort) {
                log("port from effects")
                self.addPort(msg.managerConnectionPort)
            } else if (msg.mediaPort) {
                self.onMediaPort(msg.mediaPort)
            } else if (msg.isEffectMessage) {
                self.ports.forEach(p => {
                    p.postMessage(msg)
                });
            } else if (msg.effectStateRequest) {
                log("effectStateRequest")
                self.ports.forEach(p => {
                    p.postMessage(msg)
                });
            } else if (msg.slot2) {
                const b = msg.slot2
                log("slot2")
                self.ports.forEach(p => {
                    const toSend = b.slice(0)
                    msg.slot2 = toSend
                    p.postMessage(msg, [msg.slot2])
                });
            } else if (msg.slot1) {
                const b = msg.slot1
                log("slot2")
                self.ports.forEach(p => {
                    const toSend = b.slice(0)
                    msg.slot1 = toSend
                    p.postMessage(msg, [msg.slot1])
                });
            }

        }
    }
    showRetarg() {
        this.retargPorts.forEach(port => {
            port.postMessage({ managerPort: true })
        })
    }
    retargPorts = []
    addRetargPort(port) {
        const self = this
        this.retargPorts.push(port)


        port.onmessage = async e => {
            const msg = e.data
            if (!msg) return
            if (msg.managerConnectionPort) {
                log("port from retarg")
                self.addPort(msg.managerConnectionPort)
            } else if (msg.mediaPort) {
                self.onMediaPort(msg.mediaPort)
            }

        }
    }

    showProgress() {
        this.progressPorts.forEach(port => {
            port.postMessage({ managerPort: true })
        })
    }

    progressPorts = []
    addProgressPort(port) {
        const self = this
        this.progressPorts.push(port)
        port.onmessage = async e => {

            const msg = e.data
            if (!msg) return
            const userInfoResult = await userInfoLoader.enqueue(async () => {
                return await self.getUserInfo()
            })
            log("addProgressPort userInfoResult", userInfoResult)
            const user_id = userInfoResult.user_id

            if (msg.progressLists) {
                log("request progress list")
                // QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID
                if (msg.reloadFtarCount) {
                    await self.getUserInfo({ noCache: true })

                }
                const progressLists = await makeProgressLists(self.managerName)
                port.postMessage({ progressLists })


            } else if (msg.pauseMakeQueue) {
                await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS, "", false, user_id)
            } else if (msg.clearMakeQueue) {
                await QueueStorage.clearList(QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID, user_id)
                // await QueueStorage.clearList(QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID, user_id)
                const progressLists = await makeProgressLists(self.managerName)
                port.postMessage({ progressLists })

            } else if (msg.startMakeQueue) {

                await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS, "", true, user_id)

                self.ftarQueueDelegate(self.token, async ftarLink => {
                    if (!(ftarLink.err || ftarLink.error)) {
                        await decFtarCount(user_id)

                        self.ports.forEach(port => {
                            port.postMessage({ newFlexatar: ftarLink })
                        })
                    }



                    const progressLists = await makeProgressLists(self.managerName)
                    log("sending updated progress list")
                    port.postMessage({ progressLists })
                }, self.userIdKey())
            }
        }
    }


    async getUserInfo(opts) {
        // if (this.managerName === "empty") {
        //     return "empty"
        // }
        const noCache = (opts && opts.noCache)
        // log("getUserInfo no cache is",noCache)
        // log("chrome.storage.local", chrome.storage.local)
        if (this.patchPromise) { await this.patchPromise };
        const currentUserIdKey = "currentUserId"
        // const currentUserIdKey = this.managerName + "_currentUserId"
        // const storageGetSetup = {}
        // storageGetSetup[currentUserIdKey] = null

        log("currentUserIdKey", currentUserIdKey)
        // const currentUserIdDict = await chrome.storage.local.get(storageGetSetup)

        // const currentUserId = currentUserIdDict[currentUserIdKey]

        const currentUserId = await QueueStorage.getCurrentUserId(null, this.userIdKey())

        if (!currentUserId) {
            this.token.token = null
        }
        log("current user id", currentUserId)
        if (currentUserId && !noCache) {

            const ftarCountKey = currentUserId + "_FtarCount"
            const count = (await chrome.storage.local.get([ftarCountKey]))[ftarCountKey]

            if (!(count === undefined || count === null)) {
                return { user_id: currentUserId, FtarCount: count }
            }
        }

        let userInf = await userInfo(this.token)
        log("obtained userInf", userInf)

        if (userInf.error) {
            userInf = await userInfo(myxGetToken)
            if (userInf.error) {
                return userInf
            }
        }
        const userId = userInf.user_id
      

        const storageSetSetup = {}
        storageSetSetup[currentUserIdKey] = userId

        await chrome.storage.local.set(storageSetSetup)

        //  const  storageGetSetupTest = await chrome.storage.local.get(storageGetSetup)
        // log("storageGetSetupTest",storageGetSetupTest)
        await setFtarCount(userId, userInf.FtarCount)


        return userInf

    }


    ports = []
    portsMustBeDeleted = []
    async handShakePorts() {
        const self = this

        for (const port of this.ports) {
            const timeout = setTimeout(
                () => {
                    console.log("manager port not responding")
                    this.portsMustBeDeleted.push(port)

                    port.removeEventListener("message", handle)
                },
                5000
            )
            function handle(e) {
                if (e.data && e.data.handShake) {
                    clearTimeout(timeout)
                    console.log("manager port ok")
                    port.removeEventListener("message", handle)
                }

            }
            port.addEventListener("message", handle)
            port.postMessage({ handShake: true })
        }
    }
    makeFtar(arrayBuffer) {
        const self = this
        this.lensPorts.forEach(async port => {
            const uInfo = await userInfoLoader.enqueue(async () => {
                return await self.getUserInfo()
            })
            // log("uInfo",uInfo)

            await sendWithResponse(port, { managerPort: true })
            log("lens port connected and answered")
            if (uInfo.error) {
                port.postMessage({ needAuthorize: true }, [arrayBuffer])

            } else {
                port.postMessage({ imageBuffer: arrayBuffer }, [arrayBuffer])

            }
        })
        // startFaceParserUi(arrayBuffer)
    }
    lensPorts = []
    ftarQueueDelegate = startMakeFtarFromQueue
    addFtarLens(port) {
        const self = this
        this.lensPorts.push(port)
        port.onmessage = async e => {
            const msg = e.data;
            if (!msg) return
            const userInfo = await userInfoLoader.enqueue(async () => {
                return await self.getUserInfo()
            })

            if (msg.imagesList) {
                const imagesList = msg.imagesList
                log("imagesList", imagesList)

                const imgIdList = imagesList.map(x => { return { id: x.id } })


                const userId = await QueueStorage.getCurrentUserId(null, self.userIdKey())
                const tokenToUse = userId === "myx@amial.com" ? myxGetToken : self.token
                // log("addFtarLens", userId, self.userIdKey())
                await QueueStorage.addToList(QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID, imgIdList, userId)

                // .then(result=>{
                //     console.log("addImgIdToMakeFtarList",result)
                //     // sendResponse(result)

                // })
                // let ftarQueueExecuted = false

                for (const { dataUrl, id } of imagesList) {

                    const result = await QueueStorage.saveWithKey(QueueStorage.Prefixes.FTAR_SRC_IMG, id, dataUrl, userId)
                    // .then(result=>{
                    log("FTAR_SRC_IMG saved", result)
                    // if (!ftarQueueExecuted){



                    // ftarQueueExecuted = true
                    // }
                    // QueueStorage.printAllLists()
                    // })
                }
                // const currentProcessingState = await QueueStorage.getByKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS, "", userId)
                // if (!currentProcessingState) {
                //     await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS, "", true, userId)
                log("from ftar lens starting ftar creation")
                self.ftarQueueDelegate(tokenToUse, async ftarLink => {
                    if ((!ftarLink.err || ftarLink.error)) {

                        // await decFtarCount(userId)
                        await decFtarCount(await QueueStorage.getCurrentUserId(null, self.userIdKey()))

                        ftarLink.userId = userId
                        self.ports.forEach(port => {
                            port.postMessage({ newFlexatar: ftarLink })
                        })
                    }
                    self.progressPorts.forEach(async port => {
                        port.postMessage({ progressLists: await makeProgressLists(self.managerName) })
                    })
                }, self.userIdKey())
                // }
                self.showProgress()
            } else if (msg.needAuthorize) {

                self.onNeedAuthorize()
            } else if (msg.closing) {
                self.lensPorts = self.lensPorts.filter(fn => fn !== port);
                console.log("lens port count", self.lensPorts.length)

            }

        }
    }
    onNeedAuthorize = () => { log("need authorize") }

    addPort(port) {
        const self = this

        for (const port of this.portsMustBeDeleted) {
            self.ports = self.ports.filter(fn => fn !== port);

        }
        this.portsMustBeDeleted = []

        this.ports.push(port)

        port.onmessage = async e => {
            const msg = e.data;
            if (!msg) return
            console.log("msg on manager port:", msg)
            const uInfo = await userInfoLoader.enqueue(async () => {
                counter++
                console.log("userInfo counter", counter)
                return await self.getUserInfo()

            })
            if (uInfo.error) {
                port.postMessage({ msgID: msg.msgID, payload: uInfo })
                return
            }
            // const uInfo = await this.getUserInfo()
            const userId = uInfo.user_id
            const tokenDict = {}
            tokenDict[userId] = self.token
            tokenDict["myx@amial.com"] = myxGetToken
            log("userId", userId)
            if (msg.ftarList) {

                const ftarList = await getFtarListDualUser(self.token, msg, userId,self.needMyxAccount)
                port.postMessage({ msgID: msg.msgID, payload: ftarList })

            } else if (msg.backgroundsList) {
                if (self.managerName === "empty") {
                    port.postMessage({ msgID: msg.msgID, payload: [] })
                    return
                }
                const opts = msg.opts ?? {}

                let backgroundList
                if (opts.id) {
                    backgroundList = [{ id: opts.id, userId: opts.userId }]
                } else {
                    backgroundList = await getListDualUser(QueueStorage.Lists.FTAR_BACKGROUND_LIST_ID, "id", userId,self.needMyxAccount)
                    /*
                    backgroundList = await QueueStorage.getList(QueueStorage.Lists.FTAR_BACKGROUND_LIST_ID, userId)
                    backgroundList = backgroundList.map(x => { return { id: x, userId } })
                    if (userId !== "myx@amial.com") {
                        backgroundList = backgroundList.concat((await QueueStorage.getList(QueueStorage.Lists.FTAR_BACKGROUND_LIST_ID, "myx@amial.com")).map(x => { return { id: x, userId: "myx@amial.com" } }))
                    }
                        */
                }
                if (!backgroundList || backgroundList.length === 0) {
                    log("requestiong default backgrounds")
                    const defaultBackgrounds = await self.defaultBackgroundFn()
                    log("defaultBackgrounds",defaultBackgrounds)
                    for (const bkg of defaultBackgrounds) {
                        await QueueStorage.addBackgroundToStorage(bkg, userId)
                    }
                    backgroundList = await getListDualUser(QueueStorage.Lists.FTAR_BACKGROUND_LIST_ID, "id", userId,self.needMyxAccount)
                }

                const backgrounds = []

                for (const { id, userId } of backgroundList) {
                    const dataUrl = await QueueStorage.getByKey(QueueStorage.Prefixes.BACKGROUND_SRC_IMAGE, id, userId)
                    // backgrounds.push([bkgId, null])
                    backgrounds.push([{ id, userId }, dataUrl])
                }

                port.postMessage({ msgID: msg.msgID, payload: backgrounds })
            } else if (msg.preview) {
                log("requesting preview", msg.preview)
                let previewBuffer = await getPreviewCE({ id: msg.preview.id }, tokenDict[msg.preview.userId], msg.preview.userId)
                if (!previewBuffer) {

                    port.postMessage({ msgID: msg.msgID, payload: null })
                    return

                }

                console.log("previewBuffer", previewBuffer)
                port.postMessage({ msgID: msg.msgID, payload: previewBuffer }, [previewBuffer])
            } else if (msg.flexatar) {
                log("msg.flexatar", msg.flexatar)
                let flexatarBuffer = await getFlexatarCE(tokenDict[msg.flexatar.userId], { id: msg.flexatar.id, is_myx: false }, msg.flexatar.userId)
                log("ftar buffer ", flexatarBuffer)
                if (!flexatarBuffer) {

                    // flexatarBuffer = await getFlexatarCE(this.token, { id: msg.flexatar }, "myx@amial.com")
                    // if (!flexatarBuffer) {
                    port.postMessage({ msgID: msg.msgID, payload: null })
                    return
                    // }

                }

                if (msg.setAsCurrent) {
                    log("setting current ftar id ", msg.flexatar, userId)
                    await setCurrentFlexatarId(msg.flexatar, userId)
                    // log("confirm current ftar recorded",await getCurrentFlexatarId( userId))
                }
                if (msg.setAsCurrentSlot2) {
                    log("setting current ftar id ", msg.flexatar, userId)
                    await setCurrentFlexatarIdSlot2(msg.flexatar, userId)
                    // log("confirm current ftar recorded",await getCurrentFlexatarId( userId))
                }
                port.postMessage({ msgID: msg.msgID, payload: flexatarBuffer }, [flexatarBuffer])

            } else if (msg.closing) {
                self.ports = self.ports.filter(fn => fn !== port);
                port.close()
                console.log("closing port on ftar manager", self.ports.length)
            } else if (msg.storeNewBackground) {

                const id = await QueueStorage.addBackgroundToStorage(msg.storeNewBackground, userId)
                port.postMessage({ msgID: msg.msgID, payload: { id, userId } })
                port.postMessage({ newBackGround: { id, userId } })


            } else if (msg.getCurrentBkg) {
                // if (self.managerName === "empty") {
                //     port.postMessage({ msgID: msg.msgID, payload: "empty" })
                //     return
                // }

                let currentBkgId = await QueueStorage.getByKey(QueueStorage.Prefixes.BACKGROUND_CURRENT_ID, "", userId)
                // log("getCurrentBkgId1", userId, currentBkgId)
                if (!currentBkgId) {
                    currentBkgId = await QueueStorage.getByKey(QueueStorage.Prefixes.BACKGROUND_CURRENT_ID, "", "myx@amial.com")

                }
                // if (!currentBkgId) {
                //     currentBkgId = { id: "no" }

                // }
                // log("getCurrentBkgId2", userId, currentBkgId)

                if (currentBkgId && msg.getCurrentBkg.dataUrl) {
                    if (currentBkgId.id === "no") {
                        currentBkgId = null
                    } else {
                        currentBkgId = await QueueStorage.getByKey(QueueStorage.Prefixes.BACKGROUND_SRC_IMAGE, currentBkgId.id, currentBkgId.userId)
                        // log("getCurrentBkgI2", userId, currentBkgId)

                    }


                }
                port.postMessage({ msgID: msg.msgID, payload: currentBkgId })

            } else if (msg.deleteBackground) {
                QueueStorage.removeFromList(QueueStorage.Lists.FTAR_BACKGROUND_LIST_ID, msg.deleteBackground, userId)
                QueueStorage.removeByKey(QueueStorage.Prefixes.BACKGROUND_SRC_IMAGE, msg.deleteBackground, userId)
                port.postMessage({ msgID: msg.msgID, payload: { result: "success" } })
            } else if (msg.setCurrentBkg) {

                QueueStorage.saveWithKey(QueueStorage.Prefixes.BACKGROUND_CURRENT_ID, "", msg.setCurrentBkg, userId)
                port.postMessage({ msgID: msg.msgID, payload: { result: "success" } })

            } else if (msg.getSelectedFtar) {
                const key = userId + "_selectedFlexatarId"
                let selectedFtar = (await chrome.storage.local.get([key]))[key]
                port.postMessage({ msgID: msg.msgID, payload: { selectedFtar } })
            } else if (msg.setSelectedFtar) {
                setSelectedFlexatar(msg.setSelectedFtar.value, userId)
                port.postMessage({ msgID: msg.msgID, payload: {} })
            } else if (msg.currentFtarSlot2) {
                msg.opts = { preview: true }

                let currentFlexatar = await getCurrentFlexatarIdSlot2(userId)
                if (!currentFlexatar) {
                    const ftarList = await getFtarListDualUser(self.token, msg, userId,self.needMyxAccount)
                    await setCurrentFlexatarIdSlot2(ftarList[0], userId)
                    /*
                    const ftarList = await getFtarList(tokenDict[userId], msg, userId, self.needMyxAccount)
                    if (ftarList[0]) {

                        await setCurrentFlexatarIdSlot2(ftarList[0], userId)
                    } else if (userId !== "myx@amial.com") {
                        const ftarList = await getFtarList(tokenDict["myx@amial.com"], msg, "myx@amial.com", self.needMyxAccount)
                        await setCurrentFlexatarIdSlot2(ftarList[0], userId)
                    }*/
                }
                currentFlexatar = await getCurrentFlexatarIdSlot2(userId)
                log("get current ftar, id", currentFlexatar)

                port.postMessage({ msgID: msg.msgID, payload: currentFlexatar })
            } else if (msg.currentFtar) {
                msg.opts = { preview: true }

                let currentFlexatar = await getCurrentFlexatarId(userId)
                if (!currentFlexatar) {
                    /*
                    const ftarList = await getFtarList(tokenDict[userId], msg, userId, self.needMyxAccount)
                    if (ftarList[0]) {

                        await setCurrentFlexatarId(ftarList[0], userId)
                    } else if (userId !== "myx@amial.com") {
                        const ftarList = await getFtarList(tokenDict["myx@amial.com"], msg, "myx@amial.com", self.needMyxAccount)
                        await setCurrentFlexatarId(ftarList[0], userId)
                    }*/
                    //    log("current ftar req list",userId)
                    const ftarList = await getFtarListDualUser(self.token, msg, userId,self.needMyxAccount)
                    //    log("ftarList",ftarList)
                    await setCurrentFlexatarId(ftarList[0], userId)
                }
                currentFlexatar = await getCurrentFlexatarId(userId)
                log("get current ftar, id", currentFlexatar)

                port.postMessage({ msgID: msg.msgID, payload: currentFlexatar })
            } else if (msg.makeFlexatar) {
                // if (self.managerName === "empty") {
                //     port.postMessage({ msgID: msg.msgID, payload: { status: "empty" } })
                // } else {
                log("photo obtained")

                this.lensPorts.forEach(async port => {
                    await sendWithResponse(port, { managerPort: true })
                    log("lens port connected and answered")
                    port.postMessage({ imageBuffer: msg.buffer }, [msg.buffer])
                })
                port.postMessage({ msgID: msg.msgID, payload: { status: "ok" } })
                // }




            } else if (msg.deleteFlexatar) {
                const { isAuthorized } = await removeFromList(userId, msg.deleteFlexatar)
                // if (isAuthorized) {
                const deleteSuccess = userId === "myx@amial.com" ? (() => { log("no deletion on server"); return true })() : await deleteFlexatar({ id: msg.deleteFlexatar, token: this.token })
                // log("is unauthorized deletion",self.managerName === "unauthorized")
                // const deleteSuccess = true
                if (deleteSuccess) {
                    await removeLocalCE(msg.deleteFlexatar, userId)
                    await removeCurrentFlexatarId(userId)
                }
                port.postMessage({ msgID: msg.msgID, payload: { success: deleteSuccess } })
                // } else {
                //     await removeLocalCE(msg.deleteFlexatar, "myx@amial.com")
                //     await removeCurrentFlexatarId(userId)
                //     port.postMessage({ msgID: msg.msgID, payload: { success: true } })

                // }

            } else if (msg.userInfo) {
                if (msg.opts) {
                    port.postMessage({ msgID: msg.msgID, payload: await self.getUserInfo(msg.opts) })

                } else {
                    port.postMessage({ msgID: msg.msgID, payload: uInfo })
                }
            } else if (msg.decrementFtarCount) {
                await setFtarCount(userId, uInfo.FtarCount - 1)
                port.postMessage({ msgID: msg.msgID, payload: { success: true } })
            } else if (msg.effectStateResponse) {
                log("effectStateResponse")
                self.effectPorts.forEach(p => {
                    p.postMessage(msg)
                })
            } else if (msg.showRetarg) {
                self.showRetarg()
            } else if (msg.showEffects) {
                self.showEffects()
            } else if (msg.showProgress) {
                self.showProgress()
                // } else if (msg.getAnimationNames) {
                //     for (const p of self.ports){
                //         if (p !== port){

                //             break
                //         }
                //     }
            } else if (msg.setRetargetingStatus) {
                await QueueStorage.saveWithKey(QueueStorage.Prefixes.RETARGETING_STATUS, "", msg.setRetargetingStatus, userId)
                port.postMessage({ msgID: msg.msgID, payload: { success: true } })
            } else if (msg.getRetargetingStatus) {
                let retargetingStatus = await QueueStorage.getByKey(QueueStorage.Prefixes.RETARGETING_STATUS, "", userId)
                port.postMessage({ msgID: msg.msgID, payload: retargetingStatus ? retargetingStatus.value : null })

            } else if (msg.setRetargetingCalibration) {
                await QueueStorage.saveWithKey(QueueStorage.Prefixes.RETARGETING_CALIBRATION, "", msg.setRetargetingCalibration, userId)
                port.postMessage({ msgID: msg.msgID, payload: { success: true } })
            } else if (msg.getRetargetingCalibration) {
                let retargetingCalibration = await QueueStorage.getByKey(QueueStorage.Prefixes.RETARGETING_CALIBRATION, "", userId)
                port.postMessage({ msgID: msg.msgID, payload: retargetingCalibration })

            } else if (msg.setViewportSize) {
                await QueueStorage.saveWithKey(QueueStorage.Prefixes.CURRENT_VIEWPORT_SIZE, "", msg.setViewportSize, userId)
                port.postMessage({ msgID: msg.msgID, payload: { success: true } })

            } else if (msg.getViewportSize) {
                let viewportSize = await QueueStorage.getByKey(QueueStorage.Prefixes.CURRENT_VIEWPORT_SIZE, "", userId,{ width: 320, height: 640 })

                port.postMessage({ msgID: msg.msgID, payload: viewportSize || { width: 640, height: 480 } })


            } else if (msg.deleteEffectPreset) {
                const currentPresetList = await QueueStorage.getList(QueueStorage.Lists.FTAR_PRESET_LIST_ID, msg.deleteEffectPreset.userId)
                const filteredPresetList = currentPresetList.filter(x => x.presetId !== msg.deleteEffectPreset.presetId)
                await QueueStorage.clearList(QueueStorage.Lists.FTAR_PRESET_LIST_ID, msg.deleteEffectPreset.userId)
                await QueueStorage.addToList(QueueStorage.Lists.FTAR_PRESET_LIST_ID, filteredPresetList, msg.deleteEffectPreset.userId)

                port.postMessage({ msgID: msg.msgID, payload: { success: true } })



            } else if (msg.getEffectPresets) {
                const presetList = await getListDualUser(QueueStorage.Lists.FTAR_PRESET_LIST_ID, "presetInfo", userId,self.needMyxAccount)
                port.postMessage({ msgID: msg.msgID, payload: presetList })
                // port.postMessage({ msgID: msg.msgID, payload: await QueueStorage.getList(QueueStorage.Lists.FTAR_PRESET_LIST_ID, userId) })
            } else if (msg.saveEffectPreset) {
                // const presetList = await QueueStorage.getList(QueueStorage.Lists.FTAR_PRESET_LIST_ID,userId)
                await QueueStorage.addToList(QueueStorage.Lists.FTAR_PRESET_LIST_ID, [msg.saveEffectPreset], userId)
                port.postMessage({ msgID: msg.msgID, payload: { success: { userId } } })

            } else if (msg.getManagerName) {

                port.postMessage({ msgID: msg.msgID, payload: self.managerName })
            } else if (msg.getUserToken) {
                const token = userId === "myx@amial.com" ? await myxGetToken.getToken() : await self.tokenFn()
                port.postMessage({ msgID: msg.msgID, payload: token })
            }
        }
        port.postMessage({ ready: true })

        this.handShakePorts()
    }
    newBackgroundCreated(bkgInfo) {
        log("newBackgroundCreated", bkgInfo)
        this.ports.forEach(port => {
            port.postMessage({ newBackGround: bkgInfo })
        })
    }
}

function sendWithResponse(port, msg) {
    const msgID = generateUniqueID();

    msg.msgID = msgID

    return new Promise(resolve => {
        function handler(event) {
            if (!event.data) return
            console.log("responese", event.data)
            if (event.data.msgID === msgID) {
                resolve(event.data.payload)
                port.removeEventListener("message", handler)
            }
        }
        port.addEventListener("message", handler)
        port.postMessage(msg)
    })
}

class ManagerConnection {
    constructor() {
        const channel = new MessageChannel()
        this.port = channel.port1
        // this.port.onmessageerror = () => { log("port closed") };

        this.port.start()
        this.outPort = channel.port2
        this.onNewBackground = () => { }
        this.onNewFlexatar = () => { }
        channel.port1.onmessage = e => {
            if (e.data && e.data.handShake) {
                channel.port1.postMessage(e.data)
            } else if (e.data && e.data.newBackGround) {
                if (this.onNewBackground)
                    this.onNewBackground(e.data.newBackGround)
            } else if (e.data && e.data.isEffectMessage) {
                if (this.onEffectMessage)
                    this.onEffectMessage(e.data)
            } else if (e.data && e.data.slot2) {
                if (this.onSlot2)
                    this.onSlot2(e.data)
            } else if (e.data && e.data.slot1) {
                if (this.onSlot1)
                    this.onSlot1(e.data)
            } else if (e.data && e.data.effectStateRequest) {
                if (this.onEffectStateRequest)
                    this.onEffectStateRequest(e.data)
            } else if (e.data && e.data.newFlexatar) {
                if (this.onNewFlexatar)
                    this.onNewFlexatar(e.data.newFlexatar)
            }
        }
        this.ready = new Promise(resolve => {
            function handler(e) {
                if (e.data && e.data.ready) {
                    resolve()
                    channel.port1.removeEventListener("message", handler)
                }
            }
            channel.port1.addEventListener("message", handler)

        })
    }


    sendWithResponse(msg) {
        const msgID = generateUniqueID();

        msg.msgID = msgID
        const port = this.port;
        return new Promise(resolve => {
            function handler(event) {
                if (!event.data) return
                console.log("responese", event.data)
                if (event.data.msgID === msgID) {
                    resolve(event.data.payload)
                    port.removeEventListener("message", handler)
                }
            }
            port.addEventListener("message", handler)
            port.postMessage(msg)
        })
    }
    async getList(opts) {
        if (!opts) opts = {}
        return await this.sendWithResponse({ ftarList: true, opts })
    }

    async getBackgrounds(opts) {
        if (!opts) opts = {}
        return await this.sendWithResponse({ backgroundsList: true, opts })
    }

    async getPreview(id) {
        return await this.sendWithResponse({ preview: id })
    }

    async getFlexatar(ftarLink, setAsCurrent = true, setAsCurrentSlot2 = true) {
        return await this.sendWithResponse({ flexatar: ftarLink, setAsCurrent, setAsCurrentSlot2 })
    }

    close() {
        this.port.postMessage({ closing: true })
        this.port.close()
    }
    async getCurrentFtar() {
        return await this.sendWithResponse({ currentFtar: true })
    }
    async getCurrentFtarSlot2() {
        return await this.sendWithResponse({ currentFtarSlot2: true })
    }

    async getSelectedFtar() {
        return await this.sendWithResponse({ getSelectedFtar: true })
    }
    async setSelectedFtar(val) {
        return await this.sendWithResponse({ setSelectedFtar: { value: val } })
    }

    async setCurrentBackground(id) {
        return await this.sendWithResponse({ setCurrentBkg: id })
    }
    async deleteBackground(id) {
        return await this.sendWithResponse({ deleteBackground: id })
    }

    async getCurrentBackground(opts = { id: true }) {
        return await this.sendWithResponse({ getCurrentBkg: opts })
    }
    async storeNewBackground(dataUrl) {
        return await this.sendWithResponse({ storeNewBackground: dataUrl })
    }
    async makeFlexatar(file) {
        const fileMessage = await fileToArrayBuffer(file)
        fileMessage.makeFlexatar = true

        return await this.sendWithResponse(fileMessage, [fileMessage.buffer])
    }
    async deleteFlexatar(id) {
        return await this.sendWithResponse({ deleteFlexatar: id })
    }
    async userInfo(opts) {
        return await this.sendWithResponse({ userInfo: true, opts })
    }
    async decrementFtarCount() {
        return await this.sendWithResponse({ decrementFtarCount: true })
        // this.port.postMessage({decrementFtarCount:true});

    }
    async showProgress() {
        return await this.sendWithResponse({ showProgress: true })

    }
    async showEffects() {
        return await this.sendWithResponse({ showEffects: true })

    }
    async showRetarg() {
        return await this.sendWithResponse({ showRetarg: true })

    }
    sendEffectState(msg) {
        this.port.postMessage(msg)
    }
    async getToken() {
        return await this.sendWithResponse({ getUserToken: true })
    }
    async getManagerName() {
        return await this.sendWithResponse({ getManagerName: true })
    }

    async saveEffectPreset(presetInfo) {
        return await this.sendWithResponse({ saveEffectPreset: presetInfo })
    }
    async getEffectPresets() {
        return await this.sendWithResponse({ getEffectPresets: true })
    }
    async deleteEffectPreset(presetId) {
        return await this.sendWithResponse({ deleteEffectPreset: presetId })
    }

    async getViewportSize() {
        return await this.sendWithResponse({ getViewportSize: true })
    }
    async setViewportSize(val) {
        return await this.sendWithResponse({ setViewportSize: val })
    }
    async getRetargetingStatus() {
        return await this.sendWithResponse({ getRetargetingStatus: true })
    }
    async setRetargetingStatus(val) {
        return await this.sendWithResponse({ setRetargetingStatus: val })
    }
    async getRetargetingCalibration() {
        return await this.sendWithResponse({ getRetargetingCalibration: true })
    }
    async setRetargetingCalibration(val) {
        return await this.sendWithResponse({ setRetargetingCalibration: val })
    }
    // async getAnimationNames() {
    //     return await this.sendWithResponse({ getAnimationNames: true })
    // }


}

function arrayBufferToFile(arrayMessage) {
    const blob = new Blob([arrayMessage.buffer], { type: arrayMessage.fileType });
    return new File([blob], arrayMessage.fileName, { type: arrayMessage.fileType });
}

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

function generateUniqueID() {
    return (
        Math.random().toString(32).slice(-10) +
        Date.now() +
        Math.random().toString(34).slice(-5) +
        Math.random().toString(36).slice(-5)
    );
}

async function resizeImage(file) {
    return new Promise(resolve => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
            img.onload = () => {
                // Create a canvas to resize the image
                const canvas = document.createElement("canvas");
                canvas.width = img.width / 2;
                canvas.height = img.height / 2;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Convert canvas back to file format
                canvas.toBlob((blob) => {
                    const resizedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });

                    // console.log("Original file size:", file.size);
                    // console.log("Resized file size:", resizedFile.size);
                    resolve(resizedFile)
                    // Proceed with resizedFile
                }, file.type);
            };
        };

        reader.readAsDataURL(file);
    })
}


const Ftar = {
    Manager, ManagerConnection, getFlexatar, getPreview,
    flexatarList, makeFlexatar, deleteFlexatar, flexatarEntry,
    userInfo, GetToken,
    ERR_UNAUTHORIZED, ERR_UNEXPECTED
}
// export {FtarView}
if (typeof window === 'undefined') {
    var window = self; // Alias self to window
}

window.Ftar = Ftar;

export {
    Manager, ManagerConnection, getFlexatar, getPreview,
    flexatarList, makeFlexatar, deleteFlexatar, flexatarEntry,
    userInfo, GetToken, startMakeFtarFromQueue, QueueStorage,

    ERR_UNAUTHORIZED, ERR_UNEXPECTED
}

