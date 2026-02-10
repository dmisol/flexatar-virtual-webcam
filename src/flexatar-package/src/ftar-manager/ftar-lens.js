function log() {
    console.log("[FTAR_LENS_UI_WARPER]", ...arguments)
}

export class FlexatarLens {
    instanceId = crypto.randomUUID()
    constructor(url, className,iframeSize,queryParameters = {}) {
        const urlObj = new URL(url, window.location.href)
        for (const [key, value] of Object.entries(queryParameters || {})) {
            if (value !== undefined && value !== null) {
                urlObj.searchParams.set(key, String(value))
            }
        }
        url = urlObj.toString()
        log("url",url)
        const channel = new MessageChannel()
        this.portSelf = channel.port1
        this.portOut = channel.port2
        const self = this
        this.element = document.createElement("span")


        const portMessageHandler = (e) => {
            const msg = e.data
            if (!msg) return
            log("port message", msg)
            if (msg.managerPort) {
                if (self.iframeWillInstalled) self.iframeWillInstalled()
                
                showIframeOverlay(url, iframeSize? iframeSize.width : 500, iframeSize? iframeSize.height : 500, () => {
                    log("canceled")
                    self.iframe = null
                }, className).then(({ iframe, closeFn }) => {
                    this.portSelf.onmessage = null
                    iframe.contentWindow.postMessage({ managerPort: this.portSelf, msgID: msg.msgID, instanceId:self.instanceId,notificationText:msg.notificationText,notificationId:msg.notificationId}, "*", [this.portSelf])
                    self.iframe = iframe
                    function handlerClose(e) {
                        const msg = e.data
                        if (!msg) return
                        if (msg.closeWindow && msg.instanceId === self.instanceId) {
                            self.portSelf = msg.portSelf
                            self.portSelf.onmessage = portMessageHandler
                            // overlay.remove()
                            window.removeEventListener("message", handlerClose)

                            closeFn()
                        }
                    }
                    window.addEventListener("message", handlerClose)
                })
            }
        }
        this.portSelf.onmessage = portMessageHandler
    }
    destroy() {
        if (this.iframe) this.iframe.remove()
    }


}



function showIframeOverlay(url, width, height, onClose, className) {
    return new Promise(resolve => {
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

        const dragContainer = document.createElement('div');
        const dragButton = document.createElement('div');
        // dragButton.style.position = "absolute"
        // dragButton.style.top = "0px"
        // dragButton.style.left = "0px"
        // dragButton.textContent = "DRAG"
        dragButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 3V9M12 3L9 6M12 3L15 6M12 15V21M12 21L15 18M12 21L9 18M3 12H9M3 12L6 15M3 12L6 9M15 12H21M21 12L18 9M21 12L18 15" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`;
        dragButton.style.width = "1.5rem";
        dragButton.style.height = "1.5rem";
        dragButton.style.cursor = "grab";
        dragButton.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        dragButton.style.borderRadius = "0.5rem";
        dragButton.style.background = "rgba(0,0,0,0.4)";

        dragContainer.appendChild(dragButton);

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.width = "100%"
        iframe.style.height = "100%"
        iframe.style.border = "none"
        iframe.style.borderRadius = '8px';
         iframe.allow = "camera; microphone";

        if (className) {
            dragContainer.className = className
            // dragContainer.style.position = "absolute"
        } else {
            dragContainer.style.width = width + "px";
            dragContainer.style.height = height + "px";
            dragContainer.style.border = 'none';
            dragContainer.style.borderRadius = '8px';
            // dragContainer.style.position = "absolute"



        }

        // dragContainer.style.width = "500px";
        // dragContainer.style.height = "500px";
        dragContainer.style.border = 'none';
        dragContainer.style.borderRadius = '8px';
        //          iframe.style.width = width +"px"
        // iframe.style.height = height+"px"
        // dragContainer.style.position = "absolute"

        iframe.allowFullscreen = true;
        // function closeWindow(){

        // }

        iframe.onload = () => {
            resolve({
                overlay, iframe, closeFn: () => {
                    // closeWindow()
                    overlay.remove()
                    // document.body.removeChild(overlay);
                    onClose()
                }
            })

        }
        // Append iframe to overlay and overlay to body
        dragContainer.appendChild(iframe);
        overlay.appendChild(dragContainer);
        document.body.appendChild(overlay);

        // Optional: Close on click outside iframe
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                iframe.contentWindow.postMessage({ closeThisWindow: true }, "*")

            }
        });
        let isDragging = false;
        let offsetX, offsetY;
        let draggable = dragContainer
        let isNotAbsolute = true
        draggable.onmousedown = (e) => {
            if (isNotAbsolute) {
                dragContainer.style.position = "absolute"
                isNotAbsolute = false
            }
            isDragging = true;
            offsetX = e.clientX - draggable.offsetLeft;
            offsetY = e.clientY - draggable.offsetTop;
            log("star drag")
            // titleBar.style.cursor = "grabbing";
        };
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            log("star dragging")
            // Get window dimensions
            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;

            // Ensure popup stays within bounds
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            if (newX < 0) newX = 0; // Prevent moving off left
            if (newY < 0) newY = 0; // Prevent moving off top
            if (newX + draggable.offsetWidth > winWidth) newX = winWidth - draggable.offsetWidth; // Prevent moving off right
            if (newY + draggable.offsetHeight > winHeight) newY = winHeight - draggable.offsetHeight; // Prevent moving off bottom

            draggable.style.left = `${newX}px`;
            draggable.style.top = `${newY}px`;
            iframe.style.left = `${newX}px`;
            iframe.style.top = `${newY}px`;
        });

        draggable.onmouseup = () => {
            isDragging = false;
            // titleBar.style.cursor = "grab";
        };

    })
}
