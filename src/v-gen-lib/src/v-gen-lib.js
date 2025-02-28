
async function shareVideo(videoUrl,vFileName) {

   
    try {
        // Fetch the blob from the Object URL
        const response = await fetch(videoUrl);
        const blob = await response.blob();

        // Create a File from the Blob (optional: specify a filename)
        const file = new File([blob], vFileName, { type: blob.type });

        // Check if Web Share API is available
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: "Flexatar Video",
                text: "",
            });
            console.log("Video shared successfully!");
        } else {

            // console.error("Web Share API not supported or file sharing not available.");
        }
    } catch (error) {



        console.error("Error sharing video:", error);
    }
}


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
                return
            }
            if (data.type === 'share_video') {
                const videoUrl = data.url
                const videoFNAme = data.fileName
                // console.log("share",videoFNAme,videoUrl)
                shareVideo(videoUrl,videoFNAme)
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

class VGen extends TokenController {
    #iframe;

    constructor(iframeUrl, opts = {}) {
        const iframe = document.createElement("iframe");
        iframe.allow="microphone"

        super(iframe, opts);

        // Set default options if not provided
        const { width = '400px', height = '500px', margin = '10px' } = opts;

        let healthDetector;
        iframe.onload = ()=>{
            
            healthDetector = setTimeout(()=>{ if (this.oninvalidurl) this.oninvalidurl(iframeUrl)},2000)
            const heartBeatObject = {}
            heartBeatObject[this.id] = {type:"heart_beat"}
            window.parent.postMessage({flexatar: heartBeatObject }, '*');
        }
        iframe.onerror = ()=>{
            if (this.oninvalidurl) this.oninvalidurl(iframeUrl)
        }
        
        iframe.style.margin = margin;
        iframe.style.width = width;
        iframe.style.height = height;
        iframe.src = `${iframeUrl}?id=${this.id}`;
        this.#iframe = iframe;

        const recvMessage = async (event) => {
            let data = event.data;

            if (!data.flexatar) return
            data = data.flexatar
            data = data[this.id]
            if (data && data.type === 'heart_beat') {
                clearTimeout(healthDetector)
            }
          
        }
        window.addEventListener('message', recvMessage)

    }

    mount(element) {
        element.appendChild(this.#iframe);
    }

    unmount() {

        this.#iframe.remove();
    }
    destroy() {
        this.#iframe.remove();
    }

    get element() {
        return this.#iframe;
    }
}