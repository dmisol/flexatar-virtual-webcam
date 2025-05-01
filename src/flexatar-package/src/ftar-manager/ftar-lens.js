function log(){
    console.log("[FTAR_LENS_UI_WARPER]",...arguments)
}

export class FlexatarLens{

    constructor(url){
        const channel = new MessageChannel()
        this.portSelf = channel.port1
        this.portOut = channel.port2
        const self = this
      
        const portMessageHandler= (e)=>{
            const msg = e.data
            if (!msg) return
            log("port message" ,msg )
            if (msg.managerPort){
                showIframeOverlay(url,500,500,()=>{
                    log("canceled")
                }).then(({iframe,closeFn})=>{
                    this.portSelf.onmessage = null
                    iframe.contentWindow.postMessage({managerPort:this.portSelf,msgID:msg.msgID},"*",[this.portSelf])
                    
                    function handlerClose(e){
                        const msg = e.data
                        if (!msg) return
                        if (msg.closeWindow){
                            self.portSelf = msg.portSelf
                            self.portSelf.onmessage  = portMessageHandler
                            // overlay.remove()
                            window.removeEventListener("message",handlerClose)

                            closeFn()
                        } 
                    }
                    window.addEventListener("message",handlerClose)
                })
            }
        }
        this.portSelf.onmessage  = portMessageHandler
    }
    

}

function showIframeOverlay(url, width, height,onClose) {
    return new Promise(resolve=>{
        const overlay = document.createElement('div');
        overlay.id = 'iframe-overlay';
        Object.assign(overlay.style, {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999999
        });
      
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.width = width;
        iframe.height = height;
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        iframe.allowFullscreen = true;
        // function closeWindow(){

        // }
        
        iframe.onload = ()=>{
            resolve({overlay,iframe,closeFn:()=>{
                // closeWindow()
                overlay.remove()
                // document.body.removeChild(overlay);
                onClose()
            }})

        }
        // Append iframe to overlay and overlay to body
        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
      
        // Optional: Close on click outside iframe
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                iframe.contentWindow.postMessage({closeThisWindow:true},"*")

            }
        });
    })
  }