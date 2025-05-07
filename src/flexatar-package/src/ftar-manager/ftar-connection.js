import makeFtar from './mk_ftar.js';
import {AsyncQueue} from "../../../util/async-queue.js"
// import {startFaceParserUi} from "./overlay-with-iframe.js"
import * as QueueStorage from "./ftar-queue-storage.js"
import {patchChromeStorage} from "./patch-chrome-storage.js"
// import {makeFtarFromQueue} from "./make-ftar.js"

function log(){
    console.log("[FTAR_CONNECTION]",...arguments)
}

const cacheName = "ftarcache";

async function storeString( key, string) {

    const cache = await caches.open(cacheName);
    await cache.put(key, new Response(string));

}
async function loadString( key) {
  const cache = await caches.open(cacheName);
  const response = await cache.match(key);
  const data = response ? await response.text() : null;
  return data
}

async function storeObjectCE( key, obj) {
    const {strings} = await chrome.storage.local.get({ strings: {} })

    strings[key] = obj
    await chrome.storage.local.set({ strings });

  }
  async function loadObjectCE( key) {
    const {strings} = await chrome.storage.local.get({ strings: {} })
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

async function deleteFlexatar(ftarConf,token){
    const url = ftar_api_url + "/" + ftarConf.id 
    if (!token){
        token = ftarConf.token
    }
    const headers = {
        // 'Authorization': 'Bearer ' + token,  // Replace with your actual token or headers
    };
    try {
        const response = await fetchWithToken(url, {
            method: 'DELETE',
            headers,
        
        },token);
        if (!response.ok){
            if (response.status === 401)
                return {error:ERR_UNAUTHORIZED}
            // console.error('Flexatar list failed:', response.json());
            return {error:ERR_UNEXPECTED}
        }
        return response.ok
    } catch (error) {
        console.error('Flexatar deletion:', error);
        return false
    }
}



async function getFlexatar(token,listElement){
    const path = "/ftar/"+listElement.id
    const cache = await caches.open(cacheName);
    let response = await cache.match(path);
    if (!response){
        const entry = await flexatarEntry(token,listElement.id,{ftar:true})

        response = await fetch(entry.ftar, {method: 'GET' });
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


async function removeLocalCE(id,userId){
    const keyFtar = userId+"_ftar_"+id
    const keyPreview = userId+"_ftarpreview_"+id
    await chrome.storage.local.get([keyFtar,keyPreview])

}

export async function getFlexatarCE(token,listElement,userId){
    if (listElement.id === "default"){
        return await ((await fetch(chrome.runtime.getURL("sandbox/default_ftar.p"))).arrayBuffer())
    }

    const key = userId+"_ftar_"+listElement.id

    const storedPreview =  (await chrome.storage.local.get([key]))[key]
    // console.log("listElement",listElement)
    if (storedPreview){
        return await (await fetch(storedPreview)).arrayBuffer()
    }
    // if (!listElement.preview){
    //     if (count>=5)
    //         return
    //     await new Promise(resolve => setTimeout(resolve,500))
    //     return await getPreviewCE(listElement,count+1)
    // }
    let response
    if (listElement.ftar){
        response = await fetch(listElement.ftar, {method: 'GET' });
        
    }else{
        const entry = await flexatarEntry(token,listElement.id,{ftar:true})
        response = await fetch(entry.ftar, {method: 'GET' });
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
    const store= {}
    store[key] = dataUrlPreview

    await chrome.storage.local.set(store);

    return arrayBuffer

    

}

async function getPreview(listElement){
    // console.log("requesting preview",listElement)
    const path = "/ftarpreview/"+listElement.id
    const cache = await caches.open(cacheName);
    let response = await cache.match(path);
    if (!response){
        response = await fetch(listElement.preview, {method: 'GET' });
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

export async function getPreviewCE(listElement,token,userId,count =0 ){
    
    const key = userId+"_ftarpreview_"+listElement.id

    const storedPreview =  (await chrome.storage.local.get([key]))[key]
    // console.log("storedPreview",storedPreview,key)
    if (storedPreview){
        return await (await fetch(storedPreview)).arrayBuffer()
    }
    if (!listElement.preview){
        if (count<5){
            await new Promise(resolve => setTimeout(resolve,500))
            return await getPreviewCE(listElement,token,userId,count+1)
        }else{
            // const entry = await flexatarEntry(token,listElement.id,{preview:true})
            // listElement.preview = entry.preview
        }
            
        
    }
    let response = await fetch(listElement.preview, {method: 'GET' });
  
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
    const store= {}
    store[key] = dataUrlPreview

    await chrome.storage.local.set(store);

    return arrayBuffer
    
}

async function fetchWithToken(url,params,tokenObject,counter){

    params.headers['Authorization'] = 'Bearer ' + await tokenObject.getToken();
    const response = await fetch(url, params);
    if (response.status != 403) return response;
    if (!counter){
        counter=2
    }
   
    if (counter<=0){

        return response
    }
    counter -= 1
    tokenObject.token = null
    

    return await fetchWithToken(url,params,tokenObject,counter)
}

const ERR_UNAUTHORIZED = "unauthorized"
const ERR_UNEXPECTED = "UNEXPECTED"
async function flexatarList(token,opts){
    const url = ftar_api_url + "/list" 
   

    const headers = {
        // 'Authorization': 'Bearer ' + token,
        'Content-Type' : 'application/json'
    };

    const listOpts = []
    if (opts.ftar) listOpts.push("ftar");
    if (opts.preview) listOpts.push("preview");
    if (opts.meta) listOpts.push("meta");


    const response = await fetchWithToken(url, {
        method: 'POST',
        headers,
        body:JSON.stringify({all:listOpts})
    },token);
    
    if (!response.ok) {
        if (response.status === 401)
            return {error:ERR_UNAUTHORIZED}
        // console.error('Flexatar list failed:', response.json());
        return {error:ERR_UNEXPECTED}
    }

    
    const listJson = await response.json();
    
    return listJson.all

}

async function flexatarEntry(token,ftarId,opts){
    const url = ftar_api_url + "/list" 

    const headers = {
        // 'Authorization': 'Bearer ' + token,
        'Content-Type' : 'application/json'
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
            body:JSON.stringify(send)
        },token);

        if (!response.ok){
            if (response.status === 401)
                return {error:ERR_UNAUTHORIZED}
            // console.error('Flexatar list failed:', response.json());
            return {error:ERR_UNEXPECTED}
        }

        const listJson =await response.json();
       
        return listJson.requested[ftarId]
    } catch (error) {
        console.error('Flexatar list failed:', error);
    }
}

async function makeFlexatar(token,imgFile,flexatarName,opts,onFtarId){
    if (!flexatarName){
        flexatarName = ""
    }
    const url = ftar_api_url + "/make"

    const result = await makeFtar(url,token,imgFile,flexatarName,opts,fetchWithToken,onFtarId)
   
    if (result.error){
        if (result.error.status === 401)
            return {error:ERR_UNAUTHORIZED}
        // console.error('Flexatar list failed:', response.json());
        return {error:ERR_UNEXPECTED}

    }
   
    if (!result.success){
        // console.log("blocker")
        let reason = result.reason
        if (!reason){
            reason = "bad_photo"
        }
        return {err:true,reason}
    }
    
    let listOpts = {ftar:true,meta:true}
    if (opts){
        listOpts = opts
    }
    return await flexatarEntry(token,result.id,listOpts)

}

async function userInfo(token){
    log("requesting user info from cloud")
    const response = await fetchWithToken(
        ftar_api_url+"/info",
        {
            method: 'GET',
            headers:{
                'Content-Type':'application/json',
                // 'Authorization': 'Bearer ' + token
            }
        },
        token
    )
    if (!response.ok){
        if (!response.ok){
            if (response.status === 401)
                return {error:ERR_UNAUTHORIZED}
            // console.error('Flexatar list failed:', response.json());
            return {error:ERR_UNEXPECTED}
        }
    }
    const info = await response.json()
    return info
}

class GetToken {
    constructor(getTokenFunc){
        this.getTokenFunc = getTokenFunc

    }

    #getTokenPromise
    async getToken(){
        if (this.token) return this.token
        let promise = this.#getTokenPromise
        if (!this.#getTokenPromise){
            this.#getTokenPromise = this.getTokenFunc()
            promise = this.#getTokenPromise
        }
        const token = await promise
        this.token = token
        this.#getTokenPromise = null
        return token
    }

}

async function getStorageKeysWithPrefix(prefix) {
    const items = await new Promise((resolve) => {
      chrome.storage.local.get(null, resolve);
    });
  
    return Object.keys(items).filter((key) => key.startsWith(prefix));
}

async function removeKeysNotInList(prefix,list){
   
    const keys = await getStorageKeysWithPrefix(prefix)
    
    const keysDict = {}
    for(const key of keys){
        const ftarId = key.replaceAll(prefix,"")
        keysDict[ftarId] = key
    }
    for (const {id} of list){
        delete keysDict[id]
    }
    const keysToDelete = Object.values(keysDict)
    log("deleting removed res from storage",keysToDelete)
    if (keysToDelete.length>0)
        await chrome.storage.local.remove(keysToDelete)
}

async function removeFromList(userId ,ftarId){
    const key = userId+"_ftarlist"
    let ftarList = await loadObjectCE(key)
    ftarList = ftarList.filter(({id})=> ftarId !== id)
    await storeObjectCE(key,ftarList)
}

export async function addToList(userId ,ftarId){
    if (!ftarId) return
    const key = userId+"_ftarlist"
    let ftarList = await loadObjectCE(key)
    ftarList.unshift({id:ftarId})
    await storeObjectCE(key,ftarList)
}

async function getFtarList(token,msg,userId){
    const key = userId+"_ftarlist"
    // let ftarList = await loadString("list2")
    let ftarList = msg.opts.noCache ? null : await loadObjectCE(key)
    msg.opts.noCache = undefined
    // console.log("ftarList",ftarList)
    if (!ftarList){
        log("loading list from cloud",msg.opts)
        ftarList = await flexatarList(token,msg.opts)
        if (ftarList && ftarList.error){
            return ftarList
        }
        
        if (ftarList){
            ftarList = ftarList.reverse()
            log("ftarList",ftarList);
            (async ()=>{
                if (msg.opts.preview){
                    for (const el of ftarList){
                        const previewBuffer = await getPreviewCE(el,token,userId)
                        console.log("previewBuffer",previewBuffer)
                        delete el.preview
                    }
                }
            })()
            
            log("removing keys not in list")
            const previewPrefix = userId+"_ftarpreview_"
            await removeKeysNotInList(previewPrefix,ftarList)
            log("removing keys not in list")

            const ftarPrefix = userId+"_ftar_"
            await removeKeysNotInList(ftarPrefix,ftarList)
            log("removing keys end")




            // console.log("save ftar lsit ",ftarList)
            await storeObjectCE(key,ftarList)
            
        }else{
            ftarList = []
        }
        
        
    }
    return ftarList
}

async function setCurrentFlexatarId(id,userId){
    const currentFlexatarId = {}
    currentFlexatarId[userId+"_currentFlexatarId"] = id
    await chrome.storage.local.set(currentFlexatarId)
}

async function removeCurrentFlexatarId(userId){

    await chrome.storage.local.remove([userId+"_currentFlexatarId"])
}

async function getCurrentFlexatarId(userId,ftarList){
    const key = userId+"_currentFlexatarId"
    let currentFtarId = (await chrome.storage.local.get([key]))[key]
    if (ftarList.length === 0){
        return null
    }
  
    for (const {id} of ftarList){
        if (id === currentFtarId){
            log("returning founded id",id)
            return currentFtarId
        }
    }
    const currentFlexatarIdObj = {}
    const firstIdFromList = ftarList[0].id
    currentFlexatarIdObj[key] = firstIdFromList
    await chrome.storage.local.set(currentFlexatarIdObj)

    return firstIdFromList
}


async function decFtarCount(userId){
    await setFtarCount(userId,(await getFtarCount(userId)) - 1)
}
async function getFtarCount(userId){
    const ftarCountKey = userId+"_FtarCount"
    const count = (await chrome.storage.local.get([ftarCountKey]))[ftarCountKey]
    return count
}

async function setFtarCount(userId,count){
    const key = userId+"_FtarCount"
    const ftarCountRecord = {}
    
    ftarCountRecord[key] = count
    log("setting ftar count at key",key,"count is",count)
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


   


export async function makeFtarFromQueue(token,imgId){
    log("make ftar with id",imgId)
    const currentUserId = await QueueStorage.getCurrentUserId()

    const imageDataUrl = await QueueStorage.getByKey(QueueStorage.Prefixes.FTAR_SRC_IMG,imgId.id,currentUserId)
    log({imageDataUrl})
    log({currentUserId})

    if (imageDataUrl){


        const file = dataURLtoFile(imageDataUrl)
            // log("start making flexatar")
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
            // log("flexatar befor error",ftarLink)
            // err: true, reason: 'subscription_limit'

            if (ftarLink.error || ftarLink.err){
                // log("flexatar error",ftarLink)
                if (ftarLink.reason !== "bad_photo"){
                    await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"",false)
                    return ftarLink
                }else{
                    await QueueStorage.moveListEntry(
                        QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID,
                        QueueStorage.Lists.FTAR_ERROR_LIST_ID,
                        imgId,
                        currentUserId
                    )
                    await QueueStorage.shortenList(QueueStorage.Lists.FTAR_ERROR_LIST_ID,5)

                }
            }else{
                await QueueStorage.moveListEntry(
                    QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID,
                    QueueStorage.Lists.FTAR_SUCCESS_LIST_ID,
                    imgId,
                    currentUserId
                )
                await QueueStorage.shortenList(QueueStorage.Lists.FTAR_SUCCESS_LIST_ID,5)

                try{
                    await addToList(currentUserId,ftarLink.id)
                    await getPreviewCE(ftarLink,token,currentUserId)
                    await getFlexatarCE(token,ftarLink,currentUserId)
                }catch{
                    log("fail download after creation")
                }
               
            }
            

            QueueStorage.printAllLists()
            log("flexatar ready",ftarLink)
            return ftarLink
        
    }else{
        await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"",false)
    }


}



async function startMakeFtarFromQueue(token,onNewFlexatar) {


    const ftarListToMake = await QueueStorage.getList(QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID)
    if (ftarListToMake.error === "not_authorized"){
        return {error:ftarListToMake.error}
    }

    log("ftarListToMake",ftarListToMake)
    const isQueueInProgress = await QueueStorage.getByKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"")

    if (ftarListToMake.length>0 && isQueueInProgress){
        const ftarLink = await makeFtarFromQueue(token,ftarListToMake[0])
        onNewFlexatar(ftarLink)
        // await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"",false)
        return await startMakeFtarFromQueue(token,onNewFlexatar)
    }

    QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"",false)
    return {}
}

async function makeProgressLists(){
    const lists = {
        successImages:QueueStorage.Lists.FTAR_SUCCESS_LIST_ID,
        errorImages:QueueStorage.Lists.FTAR_ERROR_LIST_ID,
        queueImages:QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID
    }
    const progressLists = {}
    for(const [key,val] of Object.entries(lists)){
        const dataUrls = (await QueueStorage.getList(val)).map(async x=>{
            const imageDataUrl = await QueueStorage.getByKey(QueueStorage.Prefixes.FTAR_SRC_IMG,x.id)
            return imageDataUrl
        })
        progressLists[key] = await Promise.all(dataUrls)
    }
   
    const dataUrls = (await QueueStorage.getList(QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID)).map(async x=>{
        const imageDataUrl = await QueueStorage.getByKey(QueueStorage.Prefixes.FTAR_SRC_IMG,x.id)
        return imageDataUrl
    })
    const inProgressList = await Promise.all(dataUrls)
    if (inProgressList && inProgressList.length>0)
        progressLists.queueImages.unshift(inProgressList[0])
    log("progressLists",progressLists)
    const userId = await QueueStorage.getCurrentUserId()
    log("getting ftar count to progress userId",userId)
    progressLists.flexatarCount = await getFtarCount(userId)
    progressLists.isQueueInProgress = await QueueStorage.getByKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"")

    return progressLists
}


const userInfoLoader = new AsyncQueue()
let counter = 0;

class Manager{
    constructor(tokenFn,clearListsWhenRecreate = false,isExtension = false){
        let patchPromise
        if (!isExtension)
            patchPromise = patchChromeStorage()
        this.tokenFn = tokenFn
        this.token = new GetToken(async ()=>{
            // const token1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOm51bGwsImV4cCI6NTM0MTAxNDU2MiwiaXNzIjoiIiwianRpIjoiIiwibmJmIjoxNzQxMDE0NTYyLCJvd25lciI6InRlc3QuY2xpZW50IiwicHJlcGFpZCI6dHJ1ZSwic3ViIjoiIiwidGFnIjoidGVzdCIsInRhcmlmZiI6InVuaXZlcnNhbCIsInVzZXIiOiJjbGllbnRfMSJ9.ULZwmHsLSqxjykbMmZH61gt7Xejns-r5Ez0_eWZTucU"
            // console.log("token recv",token1)
            
            // return token1
            return await tokenFn();
        });
        if (clearListsWhenRecreate){
            patchPromise.then(()=>{
                const clearLists = [QueueStorage.Lists.FTAR_ERROR_LIST_ID,QueueStorage.Lists.FTAR_SUCCESS_LIST_ID,QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID]
                clearLists.forEach(listName=>{
                    QueueStorage.clearList(listName)
                })
                 QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"",false)

            })
            
        }
        

    }
    showProgress(){
        this.progressPorts.forEach(port=>{
            port.postMessage({managerPort:true})
        })
    }

    progressPorts = []
    addProgressPort(port){
        const self = this
        this.progressPorts.push(port)
        port.onmessage = async e =>{
            const msg = e.data
            if (!msg) return
            if (msg.progressLists){
                log("request progress list")
                // QueueStorage.Lists.FTAR_PROCESSING_QUEUE_LIST_ID
                if (msg.reloadFtarCount){
                    await self.getUserInfo({noCache:true})

                }
                const progressLists = await makeProgressLists()
                port.postMessage({progressLists})


            }else if (msg.pauseMakeQueue){
                await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"",false)
            }else if (msg.clearMakeQueue){
                await QueueStorage.clearList(QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID)
                const progressLists = await makeProgressLists()
                port.postMessage({progressLists})

            }else if (msg.startMakeQueue){
                
                await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"",true)

                self.ftarQueueDelegate(self.token,async ftarLink=>{
                    if (!(ftarLink.err || ftarLink.error)){
                        await decFtarCount(await QueueStorage.getCurrentUserId())
                    }

                    self.ports.forEach(port=>{
                        port.postMessage({newFlexatar:ftarLink})
                    })

                    const progressLists = await makeProgressLists()
                    port.postMessage({progressLists})
                })
            }
        }
    }


    async getUserInfo(opts){
        const noCache = (opts && opts.noCache)
        // log("getUserInfo no cache is",noCache)
        const {currentUserId} = await chrome.storage.local.get({ currentUserId:null })
        
        if (currentUserId && !noCache){

            const ftarCountKey = currentUserId+"_FtarCount"
            const count = (await chrome.storage.local.get([ftarCountKey]))[ftarCountKey]

            if (!(count === undefined || count === null)){
                return {user_id:currentUserId,FtarCount:count}
            }
        }
       
        const userInf = await userInfo(this.token)
        if (userInf.error) return userInf
        const userId = userInf.user_id
        await chrome.storage.local.set({ currentUserId:userId })

        await setFtarCount(userId,userInf.FtarCount)


        return userInf
      
    }


    ports = []
    portsMustBeDeleted = []
    async handShakePorts(){
        const self = this

        for (const port of this.ports){
            const timeout = setTimeout(
                ()=>{
                    console.log("manager port not responding")
                    this.portsMustBeDeleted.push(port)

                    port.removeEventListener("message",handle) 
                },
                5000
            )
            function handle(e){
                if (e.data && e.data.handShake){
                    clearTimeout(timeout)
                    console.log("manager port ok")
                    port.removeEventListener("message",handle)
                }
                
            }
            port.addEventListener("message",handle)
            port.postMessage({handShake:true})
        }
    }
    makeFtar(arrayBuffer){
        this.lensPorts.forEach(async port=>{
            await sendWithResponse(port,{managerPort:true})
            log("lens port connected and answered")
            port.postMessage({imageBuffer:arrayBuffer},[arrayBuffer])
        })
        // startFaceParserUi(arrayBuffer)
    }
    lensPorts = []
    ftarQueueDelegate = startMakeFtarFromQueue
    addFtarLens(port){
        const self = this
        this.lensPorts.push(port)
        port.onmessage = async e =>{
            const msg = e.data;
            if (!msg) return
            if (msg.imagesList){
                const imagesList = msg.imagesList
                log("imagesList",imagesList)
                
                const imgIdList = imagesList.map(x=>{return {id:x.id}})
                await QueueStorage.addToList(QueueStorage.Lists.FTAR_MAKE_QUEUE_LIST_ID,imgIdList)
                
                // .then(result=>{
                //     console.log("addImgIdToMakeFtarList",result)
                //     // sendResponse(result)
    
                // })
                // let ftarQueueExecuted = false
               
                for (const {dataUrl,id} of imagesList){
                    const result = await QueueStorage.saveWithKey(QueueStorage.Prefixes.FTAR_SRC_IMG,id,dataUrl)
                    // .then(result=>{
                    log("FTAR_SRC_IMG saved",result)
                        // if (!ftarQueueExecuted){


                    
                            // ftarQueueExecuted = true
                        // }
                        // QueueStorage.printAllLists()
                    // })
                }
                const currentProcessingState = await QueueStorage.getByKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"")
                if (!currentProcessingState){
                    await QueueStorage.saveWithKey(QueueStorage.Prefixes.IS_QUEUE_IN_PROGRESS,"",true)

                    self.ftarQueueDelegate(self.token,async ftarLink=>{
                        if ((!ftarLink.err || ftarLink.error)){
                           
                            await decFtarCount(await QueueStorage.getCurrentUserId())
                        }
                        self.ports.forEach(port=>{
                            port.postMessage({newFlexatar:ftarLink})
                        })
                        self.progressPorts.forEach(async port=>{
                            port.postMessage({progressLists:await makeProgressLists()})
                        })
                    })
                }
                self.showProgress()
            }else  if (msg.closing){
                self.lensPorts = self.lensPorts.filter(fn => fn !== port);
                console.log("lens port count",self.lensPorts.length)

            }

        }
    }

    addPort(port){
        const self = this

        for(const port of this.portsMustBeDeleted){
            self.ports = self.ports.filter(fn => fn !== port);

        }
        this.portsMustBeDeleted = []
        
        this.ports.push(port)
        
        port.onmessage = async e =>{
            const msg = e.data;
            if (!msg) return
            console.log("msg on manager port:",msg)
            const uInfo = await userInfoLoader.enqueue(async ()=>{
                counter++
                console.log("userInfo counter",counter)
                return await self.getUserInfo()

            })
            if (uInfo.error) {
                port.postMessage({msgID:msg.msgID,payload:uInfo})
                return
            }
            // const uInfo = await this.getUserInfo()
            const userId = uInfo.user_id
            if (msg.ftarList){
                const ftarList = await getFtarList(this.token,msg,userId)
                
                // const currentFlexatarId = await getCurrentFlexatarId(userId,ftarList)
                // if (!currentFlexatarId && ftarList.length>0){
                //     console.log("setting default current flexatar")
                //     setCurrentFlexatarId(ftarList[0].id,userId)
                // }
                log("sending list response",ftarList)
                port.postMessage({msgID:msg.msgID,payload:ftarList})
            }else if (msg.backgroundsList){
                const opts = msg.opts ?? {}
               
                let backgroundList
                if (opts.id){
                    backgroundList = [opts.id]
                }else{
                    backgroundList = await QueueStorage.getList(QueueStorage.Lists.FTAR_BACKGROUND_LIST_ID,userId)
                }
                const backgrounds  = []
                
                for (const bkgId of backgroundList){
                    const dataUrl = await QueueStorage.getByKey(QueueStorage.Prefixes.BACKGROUND_SRC_IMAGE,bkgId,userId)
                    backgrounds.push([bkgId,dataUrl])
                }

                port.postMessage({msgID:msg.msgID,payload:backgrounds})
            }else if (msg.preview){
                const previewBuffer = await getPreviewCE({id:msg.preview},self.token,userId)
                if (!previewBuffer){
                    port.postMessage({msgID:msg.msgID,payload:null})
                    return
                }

                console.log("previewBuffer",previewBuffer)
                port.postMessage({msgID:msg.msgID,payload:previewBuffer},[previewBuffer])
            }else if (msg.flexatar){
                const flexatarBuffer = await getFlexatarCE(this.token,{id:msg.flexatar},userId)
                log("ftar buffer ",flexatarBuffer)
                if (!flexatarBuffer){
                    port.postMessage({msgID:msg.msgID,payload:null})

                    return
                }
                log("setting current ftar id ",msg.flexatar)
               
                await setCurrentFlexatarId(msg.flexatar,userId)
                port.postMessage({msgID:msg.msgID,payload:flexatarBuffer},[flexatarBuffer])

            }else if (msg.closing){
                self.ports = self.ports.filter(fn => fn !== port);
                port.close()
                console.log("closing port on ftar manager",self.ports.length)
            }else if (msg.storeNewBackground){
                const id = await QueueStorage.addBackgroundToStorage(msg.storeNewBackground,userId)
                port.postMessage({msgID:msg.msgID,payload:id})
                port.postMessage({newBackGround:id})


            }else if (msg.getCurrentBkg){
                let currentBkgId = await QueueStorage.getByKey(QueueStorage.Prefixes.BACKGROUND_CURRENT_ID,"",userId)
                if (!currentBkgId){
                    const backgroundList = await QueueStorage.getList(QueueStorage.Lists.FTAR_BACKGROUND_LIST_ID,userId)
                    currentBkgId = backgroundList[backgroundList.length-1]
                }
                if (currentBkgId && msg.getCurrentBkg.dataUrl){
                    if (currentBkgId === "no"){
                        currentBkgId = null
                    }else{
                        currentBkgId = await QueueStorage.getByKey(QueueStorage.Prefixes.BACKGROUND_SRC_IMAGE,currentBkgId,userId)
                    }
                    
                }
                port.postMessage({msgID:msg.msgID,payload:currentBkgId})

            }else if (msg.deleteBackground){
                QueueStorage.removeFromList(QueueStorage.Lists.FTAR_BACKGROUND_LIST_ID,msg.deleteBackground,userId)
                QueueStorage.removeByKey(QueueStorage.Prefixes.BACKGROUND_SRC_IMAGE,msg.deleteBackground,userId)
                port.postMessage({msgID:msg.msgID,payload:{result:"success"}})
            }else if (msg.setCurrentBkg){
                QueueStorage.saveWithKey(QueueStorage.Prefixes.BACKGROUND_CURRENT_ID,"",msg.setCurrentBkg,userId)
                port.postMessage({msgID:msg.msgID,payload:{result:"success"}})

            }else if (msg.currentFtar){
                msg.opts = {preview:true}
                const ftarList = await getFtarList(this.token,msg,userId)
                log("get current ftar, list",ftarList)
                const currentFlexatarId = await getCurrentFlexatarId(userId,ftarList)
                log("get current ftar, id",currentFlexatarId)

                port.postMessage({msgID:msg.msgID,payload:{id:currentFlexatarId}})
                /*
                if (currentFlexatarId){
                    const flexatarBuffer = await getFlexatarCE(this.token,{id:currentFlexatarId},userId)
                    if (flexatarBuffer){
                        console.log("currentFlexatarId flexatarBuffer",flexatarBuffer)

                        port.postMessage({msgID:msg.msgID,payload:{buffer:flexatarBuffer,id:currentFlexatarId}},[flexatarBuffer])
                       
                        return
                    }
                }

                port.postMessage({msgID:msg.msgID,payload:{buffer:null,id:null}},[])
                */
            }else if (msg.makeFlexatar){

                
                // showIframeOverlay(local.url("face-parser/face-parser.html"))
                log("photo obtained")
               
                this.lensPorts.forEach(async port=>{
                    await sendWithResponse(port,{managerPort:true})
                    log("lens port connected and answered")
                    port.postMessage({imageBuffer:msg.buffer},[msg.buffer])
                })
                // const uiResponse = await startFaceParserUi(msg.buffer)
                port.postMessage({msgID:msg.msgID,payload:{status:"ok"}})
               

            }else if(msg.deleteFlexatar){
                const deleteSuccess = await deleteFlexatar({id:msg.deleteFlexatar,token:this.token})
                if (deleteSuccess){
                    await removeLocalCE(msg.deleteFlexatar,userId)
                    await removeFromList(userId,msg.deleteFlexatar)
                    await removeCurrentFlexatarId(userId)
                }
                port.postMessage({msgID:msg.msgID,payload:{success:deleteSuccess}})
            }else if(msg.userInfo){
                if (msg.opts){
                    port.postMessage({msgID:msg.msgID,payload:await self.getUserInfo(msg.opts)})
                   
                }else{
                    port.postMessage({msgID:msg.msgID,payload:uInfo})
                }
            }else if (msg.decrementFtarCount){
                await setFtarCount(userId,uInfo.FtarCount-1)
                port.postMessage({msgID:msg.msgID,payload:{success:true}})
            }else if (msg.showProgress){
                self.showProgress()
            }else if (msg.getUserToken){
                const token = await self.tokenFn()
                port.postMessage({msgID:msg.msgID,payload:token})
            }
        }
        port.postMessage({ready:true})
        
        this.handShakePorts()
    }
    newBackgroundCreated(id){
        log("newBackgroundCreated",id)
        this.ports.forEach(port=>{
            port.postMessage({newBackGround:id})
        })
    }
}

function sendWithResponse(port, msg){
    const msgID = generateUniqueID();
  
    msg.msgID = msgID
  
    return new Promise(resolve=>{
        function handler(event){
            if (!event.data)return
            console.log("responese", event.data)
            if (event.data.msgID === msgID){
                resolve(event.data.payload)
                port.removeEventListener("message",handler)
            }
        }
        port.addEventListener("message",handler)
        port.postMessage(msg)
    })
}

class ManagerConnection{
    constructor(){
        const channel = new MessageChannel()
        this.port = channel.port1
        this.port.start()
        this.outPort = channel.port2
        this.onNewBackground = ()=>{}
        this.onNewFlexatar = ()=>{}
        channel.port1.onmessage = e=>{
            if(e.data&&e.data.handShake){
                channel.port1.postMessage(e.data)
            }else if(e.data&&e.data.newBackGround){
                if (this.onNewBackground)
                    this.onNewBackground(e.data.newBackGround)
            }else if(e.data&&e.data.newFlexatar){
                if (this.onNewFlexatar)
                    this.onNewFlexatar(e.data.newFlexatar)
            }
        }
        this.ready = new Promise(resolve=>{
            function handler(e){
                if (e.data && e.data.ready){
                    resolve()
                    channel.port1.removeEventListener("message",handler)
                }
            }
            channel.port1.addEventListener("message",handler)

        })
    }


    sendWithResponse(msg){
        const msgID = generateUniqueID();
      
        msg.msgID = msgID
        const port = this.port;
        return new Promise(resolve=>{
            function handler(event){
                if (!event.data)return
                console.log("responese", event.data)
                if (event.data.msgID === msgID){
                    resolve(event.data.payload)
                    port.removeEventListener("message",handler)
                }
            }
            port.addEventListener("message",handler)
            port.postMessage(msg)
        })
    }
    async getList(opts){
        if (!opts) opts = {}
        return await this.sendWithResponse({ftarList:true,opts})
    }

    async getBackgrounds(opts){
        if (!opts) opts = {}
        return await this.sendWithResponse({backgroundsList:true,opts})
    }

    async getPreview(id){
        
        return await this.sendWithResponse({preview:id})
    }
    async getFlexatar(id){
        
        return await this.sendWithResponse({flexatar:id})

       
    }
    close(){
        this.port.postMessage({closing:true})
        this.port.close()
    }
    async getCurrentFtar(){
        return await this.sendWithResponse({currentFtar:true})
    }
    async setCurrentBackground(id){
        return await this.sendWithResponse({setCurrentBkg:id})
    }
    async deleteBackground(id){
        return await this.sendWithResponse({deleteBackground:id})
    }

    async getCurrentBackground(opts = {id:true}){
        return await this.sendWithResponse({getCurrentBkg:opts})
    }
    async storeNewBackground(dataUrl){
        return await this.sendWithResponse({storeNewBackground:dataUrl})
    }
    async makeFlexatar(file){
        const fileMessage = await fileToArrayBuffer(file)
        fileMessage.makeFlexatar = true
        
        return await this.sendWithResponse(fileMessage,[fileMessage.buffer])
    }
    async deleteFlexatar(id){
        return await this.sendWithResponse({deleteFlexatar:id})
    }
    async userInfo(opts){
        return await this.sendWithResponse({userInfo:true,opts})
    }
    async decrementFtarCount(){
        return await this.sendWithResponse({decrementFtarCount:true})
        // this.port.postMessage({decrementFtarCount:true});

    }
    async showProgress(){
        return await this.sendWithResponse({showProgress:true})

    }
    async getToken(){
        return await this.sendWithResponse({getUserToken:true})
    }
   

}

function arrayBufferToFile(arrayMessage) {
    const blob = new Blob([arrayMessage.buffer], { type: arrayMessage.fileType });
    return new File([blob], arrayMessage.fileName, { type: arrayMessage.fileType  });
}

function fileToArrayBuffer(file) {
    const fileType = file.type;
    const fileName = file.name;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => resolve({buffer:reader.result,fileType,fileName});
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

async function resizeImage(file){
    return new Promise(resolve =>{
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


const Ftar = {Manager,ManagerConnection,getFlexatar,getPreview,
    flexatarList,makeFlexatar,deleteFlexatar,flexatarEntry,
    userInfo,GetToken,
    ERR_UNAUTHORIZED,ERR_UNEXPECTED
}
// export {FtarView}
if (typeof window === 'undefined') {
    var window = self; // Alias self to window
}

window.Ftar=Ftar;

export{Manager,ManagerConnection,getFlexatar,getPreview,
    flexatarList,makeFlexatar,deleteFlexatar,flexatarEntry,
    userInfo,GetToken,startMakeFtarFromQueue,QueueStorage,

    ERR_UNAUTHORIZED,ERR_UNEXPECTED
}

