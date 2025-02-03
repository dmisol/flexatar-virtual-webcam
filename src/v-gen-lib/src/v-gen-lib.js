

function getVGenElement(iframeUrl,token){
    return new VGen(iframeUrl,token)
}
export default {
    getVGenElement
};

class TokenController{

    #iframe
    #id

    constructor(iframe,opts){
        this.#id = crypto.randomUUID()
        this.#iframe = iframe
        this.#opts = opts
        if (opts?.token){
            this.#reloadTokenFunc = ()=>{
                return opts.token
            }
        }
        const self = this
        const recvMessage = async (event) => {
            let data = event.data;

            if (!data.flexatar) return
            data = data.flexatar
            data = data[self.#id]
            if (!data) return
            if (data.type === 'reload_token') {
                    
                const token = await self.#reloadTokenFunc()
                self.#iframe.contentWindow.postMessage({flexatar:{type:"reload_token",token}}, "*")
            }
        }
        window.addEventListener('message', recvMessage)
        this.destroy = ()=>{
            window.removeEventListener('message', recvMessage)
        }
    }

    

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
                    this.#errorCalback({response})
                    return 
                }
                const tokenJson = await response.json()
                if (!tokenJson.token){
                    throw new ReferenceError("token field is undefined")
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


    get id(){
        return this.#id
    }
   
    

}

class VGen extends TokenController{
    #iframe
    
    constructor(iframeUrl,opts){
        const iframe = document.createElement("iframe")
        super(iframe,opts)
        iframe.style.margin = "10px"
        iframe.style.width = "400px"
        iframe.style.height = "500px"
        iframe.src = `${iframeUrl}?id=${this.id}`
        this.#iframe = iframe
    }
    mount(element){
        element.appendChild(this.#iframe)
    }
    unmount(){
        this.#iframe.remove()
    }
    get element(){
        return this.#iframe
    }

}