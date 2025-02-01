export class DropZone {

    constructor(text,accept){
        this.dropZone = document.createElement("div")
        this.dropZone.className = "drop-zone"
        this.dropZoneText = document.createElement("p")
        this.dropZoneText.innerText = text
        this.dropZone.appendChild(this.dropZoneText)
        
        const input=document.createElement('input');
        input.type="file";
        if (accept){
            input.accept = accept
        }else{
            input.accept="image/*"
        }
        input.onchange = e => this.handleFiles(e)

        this.dropZone.onclick = () =>{
            input.click()
        }
        this.dropZone.ondragover = (e)=>{
            e.preventDefault();
            this.dropZone.classList.add('hover');
        }
        
        this.dropZone.ondragleave = (e)=>{
            this.dropZone.classList.remove('hover');
        }
        this.dropZone.ondrop = e =>{
            e.preventDefault();
            this.dropZone.classList.remove('hover');
            const files = e.dataTransfer.files;
            this.handleFiles({ target: { files } });
        }

    }
    hide(){
        this.dropZone.style.display = "none"
    }
    show(){
        this.dropZone.style.display = ""
    }
}

export const imageMimeTypes = [
    "image/jpeg","image/png","image/bmp","image/webp","image/avif","image/x-portable-bitmap",
    "image/x-portable-anymap","image/x-portable-pixmap","image/tiff"
]
export function checkFileType(fileType, typelist){
    for (const mimeType of typelist){
        
        if (fileType == mimeType) {
            return true
        }
    }
    return false
}