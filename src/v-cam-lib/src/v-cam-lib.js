import {MediaConnectionProvider} from "../../util/rtc-connection.js"
import {fetchArrayBuffer,mediaStreamFromArrayBufer} from "../../util/util.js"

// let vCamIframe
function getVCamElement(iframeUrl,opts){
    return new VCam(iframeUrl,opts)
}

function sendToIframeFunProvider(contentWindow){
 
    return (payload) =>{
        contentWindow.postMessage({flexatar: payload }, '*');

    }
}

class VCam {
    #onoutputstream
    #reloadTokenFunc = async () => {}
    #errorCalback = ()=> {}
    #opts
    setupTokenFetch(url,opts){
        let firstTry = true
        this.#reloadTokenFunc = async () => {
            if (firstTry &&  this.#opts?.token){
                firstTry = false
                return this.#opts.token
            }
            try{
                const response = await fetch(url,opts)
                if (!response.ok){
                    this.#errorCalback({status:response.status,message:await response.text()})
                    return 
                }
                const tokenJson = await response.json()
                if (!tokenJson.token){
                    this.#errorCalback({status:403,message:"token_expired"})
                    // throw new ReferenceError("token field is undefined")
                }
                return tokenJson.token
            }catch (exception){
                this.#errorCalback({exception})
                return
            }
        }
    }
    
    set ontokenerror(val){
        this.#errorCalback = val
    }
    set background(src){
        (async ()=>{
            const resp = await fetch(src);
            if (!resp.ok){
                console.error("can not fetch ",src)
                return
            }
            const imageBuffer = await resp.arrayBuffer()
            // console.log("bckg lreceaved",imageBuffer)
            await this.#iframeLoadedPromise
            // console.log("bckg loaded and sent")
            this.#iframe.contentWindow.postMessage({flexatar:{type:"background",imageBuffer}}, "*")
   
        })()
       
    }
    #iframe
    #iframeLoadedPromise
    #id
    #videoOutReadyPromise
    constructor(iframeUrl,opts){
        
        this.#id = crypto.randomUUID()
        this.#opts = opts
        if (opts?.token){
            this.#reloadTokenFunc = ()=>{
                return opts.token
            }
        }
        this.#iframe = document.createElement("iframe")

        let videoOutResolver 
        
        this.#videoOutReadyPromise = new Promise(resolve =>{
            videoOutResolver = resolve
        })
        this.#videoOutResolver = videoOutResolver
        let healthDetector

        window.addEventListener('message', async event => {
            let data = event.data;
            // console.log(data)
            if (!data.flexatar) return
            data = data.flexatar
            data = data[this.#id]
            if (!data) return
               
            if (data.type === 'answer') {
 
                this.#mediaConnection.recvAnswer(data)
        
            } else if (data.type === 'ice-candidate') {
        
                this.#mediaConnection.addIceCandidate(data)
            } if (data.type === 'offer') {

                this.#mediaConnection.recvOffer(data)
        
            } else if (data.type === 'request_audio') {
                if (this.#requestAudioResolve) {
                    this.#requestAudioResolve()
                    this.#requestAudioResolve == null
                }
           
            }else if (data.type === 'reload_token') {
                
                const token = await this.#reloadTokenFunc()
                this.#iframe.contentWindow.postMessage({flexatar:{type:"reload_token",token}}, "*")
            }else if (data.type === 'heart_beat') {
                if (healthDetector){
                    clearTimeout(healthDetector)
                    healthDetector = null
                }
        
            }
            
        });
        
        this.#iframeLoadedPromise = new Promise(resolve=>{
            this.#iframe.onload = async ()=>{
                this.#iframe.contentWindow.postMessage({flexatar:{token:true}}, "*");
                
                this.#setupMediaConnection(opts.externalControl)
                healthDetector = setTimeout(()=>{ if (this.oninvalidurl) this.oninvalidurl()},2000)

                resolve()
            }
        })
       
       
        this.#iframe.onerror = function () {
            console.log("error iframe")
            if (this.oninvalidurl) this.oninvalidurl()
        }
        // const self = this
        // this.#iframe.onload = function () {
        //     console.log(" iframe loaded",self.#iframe.contentDocument)
        //     // if (this.oninvalidurl) this.oninvalidurl()
        // }
        //  fetch(iframeQuery, { method: "GET" }).then(response=>{
        //     if (!response.ok){
        //         if (this.oninvalidurl) this.oninvalidurl()
        //     }
        //  }).catch(()=>{
        //     if (this.oninvalidurl) this.oninvalidurl()
        //  })
        let iframeQuery =  `${iframeUrl}?id=${this.#id}`

        if (opts.externalControl){
            iframeQuery+= "&external_ctl=true"
        }
        // console.log(iframeQuery)
        this.#iframe.src = iframeQuery
        this.#iframe.style.width = "100%"
        this.#iframe.style.height = "100%"
        this.#iframe.style.border = "none"
        this.#iframe.style.position = "absolute"
        this.#iframe.style.top = "0"
        this.#iframe.style.left = "0"
        this.#style = this.#iframe.style
        

        
    }
    set resolution(val){
        (async () => {
            await this.#videoOutReadyPromise
            this.#iframe.contentWindow.postMessage({flexatar:{type:"resolution",resolution:val}}, "*")

        })()
    }
    #style
    set style(val){
        this.#iframe.style = val
    }
    get style(){
        return this.#style
    }

    #playingAudioStream
    set src(src){
        if (!src){
            this.audiotrack=null
        }
        if (src instanceof MediaStream) {
            this.audiostream = src;
        } else if (typeof src === 'string') {
            this.url=src
        } else if (src instanceof ArrayBuffer ) {
            this.arraybuffer=src
        } else if (src instanceof MediaStreamTrack ) {
            if (src.kind == "audio")
                this.audiotrack=src
        }
    }
    set url(url){
        if (!url){
            this.audiotrack=null
        }
        (async () => {
            const arrayBuffer = await fetchArrayBuffer(url)
            if (arrayBuffer)
                this.arraybuffer = arrayBuffer
        })()
    }
    set audiotrack(audiotrack){
        (async () => {
            await this.#videoOutReadyPromise
            if (audiotrack){
                audiotrack.onended = ()=>{
                    this.#mediaConnection.addAudioTrack(null)
                    this.#mediaConnection.isNegotiating = false
                }
            }
           
            this.#mediaConnection.addAudioTrack(audiotrack)
            this.#mediaConnection.isNegotiating = false
           
        })()
        
    }
    set arraybuffer(arraybuffer){
        if (!arraybuffer){
            this.audiotrack=null
        }
        (async () => {
            if (this.#playingAudioStream){
                this.#playingAudioStream.stopBufferSource()
            }
            this.#playingAudioStream = await mediaStreamFromArrayBufer(arraybuffer,VCam.#getAudioContext(),()=>{
                this.#playingAudioStream = null
            })
            this.audiostream = this.#playingAudioStream
        })()
    }
    static #audioContext
    static #getAudioContext(){
        if (!VCam.#audioContext){
            VCam.#audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return VCam.#audioContext
    }
    set audiostream(mediaStream){
        if (!mediaStream){
            this.audiotrack = null
            return
        }
        const audioTrack = mediaStream.getAudioTracks()[0]
        // console.log(audioTrack)
        this.audiotrack = audioTrack
    }

    set onoutputstream(callback){
        this.#onoutputstream = callback
    }
    mediastream = new MediaStream();
    #videoOutResolver
    #mediaConnection
    #oldTarck
    #setupMediaConnection(hasExternalControl){
        // console.log("hasExternalControl",hasExternalControl)
        this.#mediaConnection = new MediaConnectionProvider(sendToIframeFunProvider(this.#iframe.contentWindow),"host",undefined,hasExternalControl)
        this.#mediaConnection.ondelayedaudio  = (audioTrack)=>{
            if (this.#oldTarck){
                this.mediastream.removeTrack(this.#oldTarck);
                
            }
            this.#oldTarck = audioTrack
            this.mediastream.addTrack(audioTrack);
            // console.log("plaing tracks",this.mediastream.getTracks())
        }
        this.#mediaConnection.onflexatarready = ftarTrack =>{
            this.#videoOutResolver()
            this.mediastream.addTrack(ftarTrack);
            if (this.#onoutputstream) this.#onoutputstream( this.mediastream)
            
        }
        this.#mediaConnection.onFlexatarPreview = (flexatarItem)=>{
            // console.log("vcam onFlexatarPreview",flexatarItem)
            if (this.onFlexatarPreview) this.onFlexatarPreview(flexatarItem)
        }
        this.#mediaConnection.onFlexatarEmotionList = (emoList)=>{
            // console.log("vcam emoList",emoList)
            if (this.onFlexatarEmotionList) this.onFlexatarEmotionList(emoList)
        }
        this.#mediaConnection.onNewFlexatarItem = (flexatarItem)=>{
            // console.log("vcam onNewFlexatarItem",flexatarItem)
            if (this.onNewFlexatarItem) this.onNewFlexatarItem(flexatarItem)
        }

        this.#mediaConnection.onFlexatarRemoved = (flexatarId,error)=>{
            // console.log("vcam onFlexatarRemoved",flexatarId)
            if (this.onFlexatarRemoved) this.onFlexatarRemoved(flexatarId,error)
        }
        this.#mediaConnection.onFlexatarActivated = (flexatarId,slotIdx)=>{
            // console.log("vcam onFlexatarActivated",flexatarId)
            if (this.onFlexatarActivated) this.onFlexatarActivated(flexatarId,slotIdx)
        }
        this.#mediaConnection.onFlexatarCreated = (flexatarItem,error)=>{
            // console.log("vcam onFlexatarCreated")
            if (this.onFlexatarCreated) this.onFlexatarCreated(flexatarItem,error)
        }
        this.#mediaConnection.onDataChanelAvailable = ()=>{
            if (this.onDataChanelAvailable) this.onDataChanelAvailable()
        }
    }

    #requestAudioResolve
    #isAudioRequested = false
    get isAudioReady(){
        return this.#isAudioRequested
    }
    sendSetToSlot(ftarId,slotNumber){
        this.#mediaConnection.sendMessage(this.#mediaConnection.messageManager.makeSetFlexatarToSlotMessage(ftarId,slotNumber))
    }
    setFlexatarEmotion(emoId){
        this.#mediaConnection.sendMessage(this.#mediaConnection.messageManager.makeSetFlexatarEmotionMessage(emoId))
    }
    deleteFlexatar(ftarId){
        this.#mediaConnection.sendMessage(this.#mediaConnection.messageManager.makeDeleteFlexatarMessage(ftarId))

    }
    setEffect(effect){
        this.#mediaConnection.sendMessage(this.#mediaConnection.messageManager.makeSetEffectMessage(effect))

    }
    setEffectAmount(amount){
        this.#mediaConnection.sendMessage(this.#mediaConnection.messageManager.makeSetEffectAmountMessage(amount))

    }
    setBackground(imgBase64){
        // blobToDataURL(imgBase64).then(url=>{
            this.#mediaConnection.sendMessage(this.#mediaConnection.messageManager.makeSetBackgroundMessage(imgBase64))
        // })
    }

    createFlexatar(imgBase64){
        this.#mediaConnection.sendMessage(this.#mediaConnection.messageManager.makeCreateFlexatarMessage(imgBase64))

    }
    setEffect(effectName){
        this.#mediaConnection.sendMessage(this.#mediaConnection.messageManager.makeSetEffectMessage(effectName))

    }
    setEffectAmount(amount){
        this.#mediaConnection.sendMessage(this.#mediaConnection.messageManager.makeSetEffectAmountMessage(amount))

    }
    reloadFlexatarList(){
        this.#mediaConnection.sendMessage(this.#mediaConnection.messageManager.makeReloadFlexatarListMessage())

    }


    async requestAudioPermission(callback){
        await this.requestAudioPermition(callback)

    }
    async requestAudioPermition(callback){
        if (this.#isAudioRequested) return
        this.#isAudioRequested = true
        // console.log("post request audio")
        this.#iframe.contentWindow.postMessage({flexatar:{type:"request_audio"}}, "*")
        await new Promise(resolve=>{
            this.#requestAudioResolve = resolve
        })
        callback()

    }

    mount(element){
        element.style.position = "relative"; 
        element.appendChild(this.#iframe)
        
    }
    get element(){
        return  this.#iframe
    }
    unmount(){
        this.#iframe.remove()
    }
    destroy(){
        if (this.#iframe.parentNode){
            this.#iframe.remove()
        }
        this.#iframe.src = null
    }

}

export default {
    getVCamElement
};